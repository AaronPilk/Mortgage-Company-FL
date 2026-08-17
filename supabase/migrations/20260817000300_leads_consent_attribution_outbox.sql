-- Lead receipt, consent ledger, attribution, and the transactional outbox.
--
-- The first-party write is authoritative. The CRM sync is a projection queued in
-- the same transaction, so a CRM outage delays a sync and never loses a lead.
--
-- These tables hold marketing inquiries. They are NOT an application and must
-- never be extended to hold government identifiers, credit data, income
-- documentation, or loan files.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new'
    check (status in ('new','queued','synced','contacted','qualified','application_invited','suppressed','closed','error')),
  intent text not null,
  first_name text not null,
  last_name text not null,
  email_normalized text not null,
  phone_e164 text not null,
  preferred_contact text check (preferred_contact in ('phone','sms','email')),
  state_code char(2) not null default 'FL',
  timeline text,
  estimated_credit_band text,
  message text,
  source_path text not null,
  dedupe_hash text not null,
  crm_contact_id text,
  crm_synced_at timestamptz,
  assigned_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_email_idx on public.leads (email_normalized);
create index leads_phone_idx on public.leads (phone_e164);
create index leads_dedupe_idx on public.leads (dedupe_hash, created_at desc);
create index leads_assigned_idx on public.leads (assigned_user_id) where assigned_user_id is not null;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create table public.consent_receipts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete restrict,
  privacy_accepted boolean not null,
  contact_requested boolean not null,
  sms_marketing boolean not null default false,
  email_marketing boolean not null default false,
  disclosure_version text not null,
  -- Hash of the exact disclosure text shown, so the record survives a copy change.
  disclosure_text_sha256 text not null,
  source_path text not null,
  form_version text not null,
  request_id uuid not null,
  ip_prefix_hash text,
  user_agent_family text,
  revoked_at timestamptz,
  revocation_scope text check (revocation_scope in ('sms','email','all')),
  created_at timestamptz not null default now()
);

create index consent_receipts_lead_idx on public.consent_receipts (lead_id, created_at desc);

-- Cross-system suppression. A STOP or unsubscribe lands here first and every
-- sending path checks it, so revocation is honored even if a downstream system
-- lags.
create table public.suppressions (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('sms','email','call','all')),
  email_normalized text,
  phone_e164 text,
  reason text not null,
  source text not null,
  created_at timestamptz not null default now(),
  constraint suppression_target_present
    check (email_normalized is not null or phone_e164 is not null)
);

create unique index suppressions_email_channel_idx
  on public.suppressions (email_normalized, channel) where email_normalized is not null;
create unique index suppressions_phone_channel_idx
  on public.suppressions (phone_e164, channel) where phone_e164 is not null;

create table public.attribution_touches (
  id uuid primary key default gen_random_uuid(),
  anonymous_id uuid,
  user_id uuid references public.profiles(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  touch_kind text not null check (touch_kind in ('first','last','conversion','offline')),
  occurred_at timestamptz not null,
  landing_path text not null,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  gbraid text,
  wbraid text,
  msclkid text,
  fbclid text,
  session_id text,
  -- Click identifiers are retained only for the documented attribution window.
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now()
);

create index attribution_lead_idx on public.attribution_touches (lead_id, occurred_at);
create index attribution_expiry_idx on public.attribution_touches (expires_at);

create table public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  idempotency_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending','processing','succeeded','retry','dead')),
  attempt_count integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error_code text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index integration_outbox_work_idx
  on public.integration_outbox (available_at, created_at)
  where status in ('pending', 'retry');

create table public.webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  body_sha256 text not null,
  signature_verified boolean not null,
  payload_redacted jsonb,
  processed_at timestamptz,
  received_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.leads enable row level security;
alter table public.consent_receipts enable row level security;
alter table public.suppressions enable row level security;
alter table public.attribution_touches enable row level security;
alter table public.integration_outbox enable row level security;
alter table public.webhook_receipts enable row level security;

-- Anonymous clients get no direct table access at all. Lead creation happens
-- through a server route holding a narrowly scoped credential, after validation,
-- bot verification, and rate limiting.
revoke all on public.leads from anon;
revoke all on public.consent_receipts from anon;
revoke all on public.attribution_touches from anon;
revoke all on public.integration_outbox from anon;
revoke all on public.webhook_receipts from anon;
revoke all on public.suppressions from anon;

create policy "staff read leads"
  on public.leads for select to authenticated
  using (
    public.has_role('loan_officer')
    or public.has_role('operations')
    or public.has_role('admin')
    or assigned_user_id = auth.uid()
  );

create policy "staff update leads"
  on public.leads for update to authenticated
  using (
    public.has_role('operations') or public.has_role('admin') or assigned_user_id = auth.uid()
  )
  with check (
    public.has_role('operations') or public.has_role('admin') or assigned_user_id = auth.uid()
  );

create policy "reviewers read consent"
  on public.consent_receipts for select to authenticated
  using (
    public.has_role('compliance_reviewer')
    or public.has_role('operations')
    or public.has_role('admin')
  );

create policy "reviewers read suppressions"
  on public.suppressions for select to authenticated
  using (public.is_staff());

create policy "staff read attribution"
  on public.attribution_touches for select to authenticated
  using (public.has_role('operations') or public.has_role('admin'));

create policy "admins read outbox"
  on public.integration_outbox for select to authenticated
  using (public.has_role('admin') or public.has_role('operations'));

create policy "admins read webhook receipts"
  on public.webhook_receipts for select to authenticated
  using (public.has_role('admin'));

-- Single transaction: lead + consent + attribution + outbox. Either the consumer
-- has a receipt and a queued sync, or nothing happened.
create or replace function public.create_lead_with_receipt(
  p_lead jsonb,
  p_consent jsonb,
  p_attribution jsonb,
  p_outbox jsonb,
  p_request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead_id uuid;
begin
  insert into public.leads (
    intent, first_name, last_name, email_normalized, phone_e164,
    preferred_contact, state_code, timeline, estimated_credit_band,
    message, source_path, dedupe_hash, status
  ) values (
    p_lead->>'intent',
    p_lead->>'first_name',
    p_lead->>'last_name',
    p_lead->>'email_normalized',
    p_lead->>'phone_e164',
    p_lead->>'preferred_contact',
    coalesce(p_lead->>'state_code', 'FL'),
    p_lead->>'timeline',
    p_lead->>'estimated_credit_band',
    p_lead->>'message',
    p_lead->>'source_path',
    p_lead->>'dedupe_hash',
    'queued'
  )
  returning id into v_lead_id;

  insert into public.consent_receipts (
    lead_id, privacy_accepted, contact_requested, sms_marketing, email_marketing,
    disclosure_version, disclosure_text_sha256, source_path, form_version,
    request_id, ip_prefix_hash, user_agent_family
  ) values (
    v_lead_id,
    (p_consent->>'privacy_accepted')::boolean,
    (p_consent->>'contact_requested')::boolean,
    coalesce((p_consent->>'sms_marketing')::boolean, false),
    coalesce((p_consent->>'email_marketing')::boolean, false),
    p_consent->>'disclosure_version',
    p_consent->>'disclosure_text_sha256',
    p_consent->>'source_path',
    p_consent->>'form_version',
    p_request_id,
    p_consent->>'ip_prefix_hash',
    p_consent->>'user_agent_family'
  );

  insert into public.attribution_touches (
    lead_id, touch_kind, occurred_at, landing_path, referrer_host,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    gclid, gbraid, wbraid, msclkid, fbclid
  ) values (
    v_lead_id,
    'conversion',
    coalesce((p_attribution->>'occurred_at')::timestamptz, now()),
    p_attribution->>'landing_path',
    p_attribution->>'referrer_host',
    p_attribution->>'utm_source',
    p_attribution->>'utm_medium',
    p_attribution->>'utm_campaign',
    p_attribution->>'utm_content',
    p_attribution->>'utm_term',
    p_attribution->>'gclid',
    p_attribution->>'gbraid',
    p_attribution->>'wbraid',
    p_attribution->>'msclkid',
    p_attribution->>'fbclid'
  );

  insert into public.integration_outbox (
    aggregate_type, aggregate_id, event_type, idempotency_key, payload
  ) values (
    'lead', v_lead_id, p_outbox->>'event_type', p_outbox->>'idempotency_key', p_outbox->'payload'
  )
  on conflict (idempotency_key) do nothing;

  return v_lead_id;
end;
$$;

-- EXECUTE is granted to PUBLIC by default on a new function, so revoking from
-- anon and authenticated alone would leave this reachable. Revoke from PUBLIC.
revoke execute on function public.create_lead_with_receipt(jsonb, jsonb, jsonb, jsonb, uuid) from public;
grant execute on function public.create_lead_with_receipt(jsonb, jsonb, jsonb, jsonb, uuid) to service_role;
