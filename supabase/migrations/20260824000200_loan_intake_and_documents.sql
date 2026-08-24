-- TRACT borrower portal: intake payload + the borrower-facing access doors.
--
-- Migration 1 built the `loan` compartment and the staff/server doors. This
-- migration adds what the borrower portal needs:
--
--   * an `intake` column on loan.loan_files — the structured, BANDED
--     pre-application answers (loan purpose, employment type, income/asset
--     kinds, credit events). Every value is an enum or a boolean; there is no
--     raw figure, SSN, DOB, or account number here. It exists so the portal and
--     the loan officer can regenerate the borrower's exact document checklist
--     deterministically (see @tract/domain requiredDocuments), and so the
--     borrower never re-answers a question they have already answered.
--
--   * `loan.loan_documents.requirement_id` — ties an uploaded document back to
--     the checklist item it satisfies, so the portal can show a per-item
--     "received" state. Contents still live in encrypted storage; this is
--     metadata only.
--
--   * public.loan_open_file — the create-file door the TRACT server calls
--     (service_role) after a borrower completes intake. Like loan_create_file
--     but also persists the intake payload and writes the access log.
--
--   * public.loan_get_file — the borrower's own detail read. Self-scoped by
--     auth.uid(), safe for the `authenticated` role, returns the file with its
--     stage history, borrower-visible conditions, and document metadata as a
--     single json document. Records the read in the access log.
--
-- Compliance boundary is unchanged (ECOA/Reg B): none of this decides or
-- implies approval. The intake payload drives which DOCUMENTS to ask for, never
-- who qualifies.

-- ---------------------------------------------------------------------------
-- Schema additions
-- ---------------------------------------------------------------------------

alter table loan.loan_files
  add column if not exists intake jsonb
    check (intake is null or jsonb_typeof(intake) = 'object');

alter table loan.loan_documents
  add column if not exists requirement_id text
    check (requirement_id is null or char_length(requirement_id) between 1 and 80);

-- ---------------------------------------------------------------------------
-- public.loan_open_file — create a file WITH its intake payload. service_role.
-- ---------------------------------------------------------------------------

create or replace function public.loan_open_file(
  p_borrower_user_id uuid,
  p_purpose loan.loan_purpose,
  p_intake jsonb default null,
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
  if p_intake is not null and jsonb_typeof(p_intake) <> 'object' then
    raise exception 'intake must be a json object';
  end if;

  -- WML-XXXXXXXX from a uuid; unique-constraint retries are astronomically rare.
  v_ref := 'WML-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into loan.loan_files
      (borrower_user_id, purpose, price_band, loan_amount_band, reference_code, intake)
    values
      (p_borrower_user_id, p_purpose, p_price_band, p_loan_amount_band, v_ref, p_intake)
    returning id into v_id;

  insert into loan.loan_stage_events (loan_file_id, from_stage, to_stage, changed_by, note)
    values (v_id, null, 'intake', p_borrower_user_id, 'file opened');

  insert into loan.access_log (loan_file_id, actor_user_id, action)
    values (v_id, p_borrower_user_id, 'open_file');

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- public.loan_get_file — a borrower reads ONE of their own files, in full.
-- Self-scoped: returns null (never an error, never another borrower's data) if
-- the caller is not the file's borrower. The `authenticated` role may call it.
-- ---------------------------------------------------------------------------

create or replace function public.loan_get_file(p_loan_file_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_borrower uuid;
  v_result jsonb;
begin
  select borrower_user_id into v_borrower
    from loan.loan_files where id = p_loan_file_id;

  -- Not found, or not the caller's file: reveal nothing either way.
  if v_borrower is null or v_borrower is distinct from auth.uid() then
    return null;
  end if;

  insert into loan.access_log (loan_file_id, actor_user_id, action)
    values (p_loan_file_id, auth.uid(), 'view_file');

  select jsonb_build_object(
    'id', f.id,
    'reference_code', f.reference_code,
    'purpose', f.purpose,
    'stage', f.stage,
    'price_band', f.price_band,
    'loan_amount_band', f.loan_amount_band,
    'intake', f.intake,
    'created_at', f.created_at,
    'updated_at', f.updated_at,
    'stage_events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'from_stage', e.from_stage,
        'to_stage', e.to_stage,
        'note', e.note,
        'created_at', e.created_at
      ) order by e.created_at)
      from loan.loan_stage_events e where e.loan_file_id = f.id
    ), '[]'::jsonb),
    'conditions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'label', c.label,
        'description', c.description,
        'status', c.status,
        'updated_at', c.updated_at
      ) order by c.created_at)
      from loan.loan_conditions c
      where c.loan_file_id = f.id and c.borrower_visible
    ), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'doc_type', d.doc_type,
        'requirement_id', d.requirement_id,
        'upload_status', d.upload_status,
        'created_at', d.created_at
      ) order by d.created_at)
      from loan.loan_documents d where d.loan_file_id = f.id
    ), '[]'::jsonb)
  ) into v_result
  from loan.loan_files f
  where f.id = p_loan_file_id;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Function grants (invariant #5). EXECUTE defaults to PUBLIC — revoke, then
-- grant narrowly. loan_open_file is a server door (service_role only);
-- loan_get_file is a borrower's own read (authenticated + service_role).
-- ---------------------------------------------------------------------------

revoke execute on function public.loan_open_file(uuid, loan.loan_purpose, jsonb, text, text)
  from public, anon, authenticated;
grant execute on function public.loan_open_file(uuid, loan.loan_purpose, jsonb, text, text)
  to service_role;

revoke execute on function public.loan_get_file(uuid) from public, anon;
grant execute on function public.loan_get_file(uuid) to authenticated, service_role;
