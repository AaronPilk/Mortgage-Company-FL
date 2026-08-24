-- TRACT loan-origination compartment.
--
-- Everything application-grade lives in its own schema, `loan`, which is
-- deliberately NOT listed in supabase/config.toml `api.schemas`. That keeps it
-- off the public PostgREST surface entirely: the browser cannot reach these
-- tables at all. The only door is the SECURITY DEFINER functions defined at the
-- bottom, each of which checks the caller's identity/role before touching a row.
--
-- This is the isolated "approved POS/LOS" boundary that data-classification.md
-- and invariant #2 always assumed. The public marketing schema is unchanged and
-- still holds no application PII.
--
-- Phase 0 stores no raw financial identifiers (SSN, DOB, exact income): the
-- pre-application is banded, and document CONTENTS live in encrypted object
-- storage — only metadata is here. Raw 1003 detail arrives later, column-
-- encrypted, coupled to the credit/AUS integration that needs it.

create schema if not exists loan;
revoke all on schema loan from public;
grant usage on schema loan to service_role;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

create type loan.loan_purpose as enum (
  'purchase', 'refinance', 'cash_out_refinance', 'heloc', 'construction'
);

-- The borrower-visible checkpoints, in order. `withdrawn`/`denied` are terminal.
create type loan.loan_stage as enum (
  'intake', 'pre_approval', 'processing', 'underwriting',
  'conditions', 'final_approval', 'withdrawn', 'denied'
);

create type loan.condition_status as enum ('open', 'submitted', 'cleared', 'waived');

create type loan.document_type as enum (
  'w2', 'paystub', 'bank_statement', 'tax_return', 'id', 'other'
);

create type loan.document_status as enum ('pending', 'uploaded', 'verified', 'rejected');

-- ---------------------------------------------------------------------------
-- loan.loan_files — one row per loan. High-level, banded summary only.
-- ---------------------------------------------------------------------------

create table loan.loan_files (
  id uuid primary key default gen_random_uuid(),
  borrower_user_id uuid not null references public.profiles(id) on delete restrict,
  loan_officer_user_id uuid references public.profiles(id) on delete set null,
  purpose loan.loan_purpose not null,
  stage loan.loan_stage not null default 'intake',
  -- Bands mirror the marketing planner: a range, never an exact figure.
  price_band text check (price_band is null or char_length(price_band) between 1 and 40),
  loan_amount_band text check (loan_amount_band is null or char_length(loan_amount_band) between 1 and 40),
  -- Free-text, staff-authored, borrower-visible only through the portal RPCs.
  reference_code text not null unique
    check (reference_code ~ '^WML-[0-9A-Z]{8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index loan_files_borrower_idx on loan.loan_files (borrower_user_id, updated_at desc);
create index loan_files_officer_idx on loan.loan_files (loan_officer_user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- loan.loan_stage_events — append-only stage history.
-- ---------------------------------------------------------------------------

create table loan.loan_stage_events (
  id uuid primary key default gen_random_uuid(),
  loan_file_id uuid not null references loan.loan_files(id) on delete cascade,
  from_stage loan.loan_stage,
  to_stage loan.loan_stage not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index loan_stage_events_file_idx on loan.loan_stage_events (loan_file_id, created_at desc);

-- ---------------------------------------------------------------------------
-- loan.loan_conditions — underwriting / pre-approval conditions.
-- ---------------------------------------------------------------------------

create table loan.loan_conditions (
  id uuid primary key default gen_random_uuid(),
  loan_file_id uuid not null references loan.loan_files(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  status loan.condition_status not null default 'open',
  borrower_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index loan_conditions_file_idx on loan.loan_conditions (loan_file_id, status);

-- ---------------------------------------------------------------------------
-- loan.loan_documents — METADATA ONLY. Contents live in encrypted storage.
-- ---------------------------------------------------------------------------

create table loan.loan_documents (
  id uuid primary key default gen_random_uuid(),
  loan_file_id uuid not null references loan.loan_files(id) on delete cascade,
  doc_type loan.document_type not null,
  -- Derived only from server-generated ids; never a client filename.
  storage_key text not null unique check (char_length(storage_key) between 1 and 300),
  content_type text check (content_type is null or char_length(content_type) <= 120),
  byte_size bigint check (byte_size is null or (byte_size >= 0 and byte_size <= 52428800)),
  upload_status loan.document_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index loan_documents_file_idx on loan.loan_documents (loan_file_id, doc_type);

-- ---------------------------------------------------------------------------
-- loan.access_log — append-only audit of every access to a file.
-- ---------------------------------------------------------------------------

create table loan.access_log (
  id uuid primary key default gen_random_uuid(),
  loan_file_id uuid not null references loan.loan_files(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 1 and 60),
  created_at timestamptz not null default now()
);

create index access_log_file_idx on loan.access_log (loan_file_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: defense in depth. The schema is already off the REST surface, so anon
-- and authenticated have no direct path here; we still enable RLS and revoke
-- every default grant so that the only way in is the vetted functions below.
-- ---------------------------------------------------------------------------

alter table loan.loan_files enable row level security;
alter table loan.loan_stage_events enable row level security;
alter table loan.loan_conditions enable row level security;
alter table loan.loan_documents enable row level security;
alter table loan.access_log enable row level security;

revoke all on loan.loan_files from anon, authenticated;
revoke all on loan.loan_stage_events from anon, authenticated;
revoke all on loan.loan_conditions from anon, authenticated;
revoke all on loan.loan_documents from anon, authenticated;
revoke all on loan.access_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Access functions — the only door. All SECURITY DEFINER, search_path pinned.
-- ---------------------------------------------------------------------------

-- Create a file. Called by the TRACT server (service_role) after intake.
create or replace function public.loan_create_file(
  p_borrower_user_id uuid,
  p_purpose loan.loan_purpose,
  p_price_band text default null,
  p_loan_amount_band text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_ref text;
begin
  if p_borrower_user_id is null then
    raise exception 'borrower is required';
  end if;
  -- WML-XXXXXXXX from a uuid; unique constraint retries are astronomically rare.
  v_ref := 'WML-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into loan.loan_files (borrower_user_id, purpose, price_band, loan_amount_band, reference_code)
    values (p_borrower_user_id, p_purpose, p_price_band, p_loan_amount_band, v_ref)
    returning id into v_id;
  insert into loan.loan_stage_events (loan_file_id, from_stage, to_stage, changed_by, note)
    values (v_id, null, 'intake', p_borrower_user_id, 'file opened');
  return v_id;
end;
$$;

-- A borrower reads their own files. Self-scoped by auth.uid(); safe for the
-- `authenticated` role to call directly from the portal.
create or replace function public.loan_list_my_files()
returns table (
  id uuid,
  purpose loan.loan_purpose,
  stage loan.loan_stage,
  reference_code text,
  price_band text,
  loan_amount_band text,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select f.id, f.purpose, f.stage, f.reference_code, f.price_band, f.loan_amount_band, f.updated_at
    from loan.loan_files f
   where f.borrower_user_id = auth.uid()
   order by f.updated_at desc;
$$;

-- Advance a file's stage. Staff/server only; records history + audit.
create or replace function public.loan_advance_stage(
  p_loan_file_id uuid,
  p_to_stage loan.loan_stage,
  p_actor_user_id uuid,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from loan.loan_stage;
begin
  select stage into v_from from loan.loan_files where id = p_loan_file_id for update;
  if not found then
    raise exception 'loan file not found';
  end if;
  update loan.loan_files set stage = p_to_stage, updated_at = now() where id = p_loan_file_id;
  insert into loan.loan_stage_events (loan_file_id, from_stage, to_stage, changed_by, note)
    values (p_loan_file_id, v_from, p_to_stage, p_actor_user_id, p_note);
  insert into loan.access_log (loan_file_id, actor_user_id, action)
    values (p_loan_file_id, p_actor_user_id, 'advance_stage:' || p_to_stage::text);
end;
$$;

-- ---------------------------------------------------------------------------
-- Function grants (invariant #5): Supabase grants EXECUTE to anon/authenticated
-- by default; revoke it, then grant only where intended.
-- ---------------------------------------------------------------------------

revoke execute on function public.loan_create_file(uuid, loan.loan_purpose, text, text) from public, anon, authenticated;
grant execute on function public.loan_create_file(uuid, loan.loan_purpose, text, text) to service_role;

revoke execute on function public.loan_list_my_files() from public, anon;
grant execute on function public.loan_list_my_files() to authenticated, service_role;

revoke execute on function public.loan_advance_stage(uuid, loan.loan_stage, uuid, text) from public, anon, authenticated;
grant execute on function public.loan_advance_stage(uuid, loan.loan_stage, uuid, text) to service_role;
