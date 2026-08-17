-- AI jobs, usage ledger, and quota policies.
--
-- Spend is reserved before the provider is called, inside a transaction that
-- locks the quota bucket. Without that lock, two concurrent requests both read
-- "budget available" and both spend it.

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete set null,
  anonymous_id uuid,
  lead_id uuid references public.leads(id) on delete set null,
  project_id uuid references public.vision_projects(id) on delete set null,
  job_type text not null,
  feature text not null,
  provider text,
  model_key text,
  prompt_key text,
  prompt_version text,
  status text not null default 'created'
    check (status in ('created','budget_reserved','queued','submitted','processing','succeeded','failed','cancelled','expired')),
  input_manifest jsonb not null,
  output_manifest jsonb,
  idempotency_key text not null unique,
  estimated_cost_cents integer not null default 0,
  reserved_cost_cents integer not null default 0,
  actual_cost_cents integer,
  requires_reconciliation boolean not null default false,
  provider_request_id text,
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  available_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  -- Redacted only. A raw provider error can contain the prompt.
  error_detail_redacted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_jobs_status_idx on public.ai_jobs (status, available_at);
create index ai_jobs_owner_idx on public.ai_jobs (owner_user_id, created_at desc);
create index ai_jobs_reconcile_idx on public.ai_jobs (requires_reconciliation) where requires_reconciliation;

create table public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete set null,
  anonymous_id uuid,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  feature text not null,
  provider text,
  model_key text,
  entry_kind text not null check (entry_kind in ('reserve','release','charge','credit','adjustment')),
  amount_cents integer not null,
  input_units bigint,
  output_units bigint,
  occurred_at timestamptz not null default now(),
  -- An admin adjustment must say why.
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  constraint adjustment_requires_reason
    check (entry_kind not in ('adjustment','credit') or reason is not null)
);

create index usage_owner_time_idx on public.usage_ledger (owner_user_id, occurred_at desc);
create index usage_feature_time_idx on public.usage_ledger (feature, occurred_at desc);

create table public.quota_policies (
  id uuid primary key default gen_random_uuid(),
  subject_kind text not null check (subject_kind in ('anonymous','consumer','agent','staff','platform')),
  feature text not null,
  period text not null check (period in ('minute','hour','day','month')),
  request_limit integer,
  cost_limit_cents integer,
  concurrency_limit integer,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_kind, feature, period)
);

-- Per-feature and per-provider emergency stop.
create table public.kill_switches (
  key text primary key,
  scope text not null check (scope in ('feature','provider','global')),
  engaged boolean not null default false,
  engaged_by uuid references public.profiles(id),
  engaged_at timestamptz,
  reason text,
  updated_at timestamptz not null default now()
);

insert into public.kill_switches (key, scope, engaged, reason) values
  ('global', 'global', false, 'Master stop for all paid provider work'),
  ('feature:vision_report', 'feature', false, 'Vision report generation'),
  ('feature:rendprop_media', 'feature', false, 'RendProp media processing'),
  ('provider:openai', 'provider', false, 'OpenAI adapter'),
  ('provider:anthropic', 'provider', false, 'Anthropic adapter'),
  ('provider:higgsfield', 'provider', false, 'Higgsfield adapter'),
  ('provider:byteplus', 'provider', false, 'BytePlus adapter');

alter table public.ai_jobs enable row level security;
alter table public.usage_ledger enable row level security;
alter table public.quota_policies enable row level security;
alter table public.kill_switches enable row level security;

create policy "owners read own jobs"
  on public.ai_jobs for select to authenticated
  using (owner_user_id = auth.uid() or public.has_role('operations') or public.has_role('admin'));

create policy "staff read usage"
  on public.usage_ledger for select to authenticated
  using (public.has_role('operations') or public.has_role('admin'));

create policy "staff read quotas"
  on public.quota_policies for select to authenticated
  using (public.has_role('operations') or public.has_role('admin'));

create policy "admins write quotas"
  on public.quota_policies for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "staff read kill switches"
  on public.kill_switches for select to authenticated
  using (public.has_role('operations') or public.has_role('admin'));

create policy "admins write kill switches"
  on public.kill_switches for update to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- Reserve spend under a lock. Returns null when the request is denied, so the
-- caller never sees how much budget remains.
create or replace function public.reserve_ai_budget(
  p_feature text,
  p_subject_kind text,
  p_owner_user_id uuid,
  p_anonymous_id uuid,
  p_estimated_cost_cents integer,
  p_job_type text,
  p_input_manifest jsonb,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_policy public.quota_policies%rowtype;
  v_platform public.quota_policies%rowtype;
  v_requests integer;
  v_committed integer;
  v_in_flight integer;
  v_platform_committed integer;
  v_job_id uuid;
  v_since timestamptz;
begin
  if exists (select 1 from public.kill_switches where key = 'global' and engaged) then
    return null;
  end if;
  if exists (
    select 1 from public.kill_switches
    where key = 'feature:' || p_feature and engaged
  ) then
    return null;
  end if;

  select * into v_policy
  from public.quota_policies
  where subject_kind = p_subject_kind and feature = p_feature and enabled
  order by case period when 'minute' then 1 when 'hour' then 2 when 'day' then 3 else 4 end
  limit 1
  for update;

  if not found then
    return null;
  end if;

  v_since := now() - (case v_policy.period
    when 'minute' then interval '1 minute'
    when 'hour' then interval '1 hour'
    when 'day' then interval '1 day'
    else interval '30 days' end);

  select count(*), coalesce(sum(
    case when entry_kind in ('reserve','charge','adjustment') then amount_cents
         when entry_kind in ('release','credit') then -amount_cents
         else 0 end), 0)
  into v_requests, v_committed
  from public.usage_ledger
  where feature = p_feature
    and occurred_at >= v_since
    and ((p_owner_user_id is not null and owner_user_id = p_owner_user_id)
      or (p_owner_user_id is null and anonymous_id = p_anonymous_id));

  select count(*) into v_in_flight
  from public.ai_jobs
  where feature = p_feature
    and status in ('budget_reserved','queued','submitted','processing')
    and ((p_owner_user_id is not null and owner_user_id = p_owner_user_id)
      or (p_owner_user_id is null and anonymous_id = p_anonymous_id));

  if v_policy.concurrency_limit is not null and v_in_flight >= v_policy.concurrency_limit then
    return null;
  end if;
  if v_policy.request_limit is not null and v_requests >= v_policy.request_limit then
    return null;
  end if;
  if v_policy.cost_limit_cents is not null
     and v_committed + p_estimated_cost_cents > v_policy.cost_limit_cents then
    return null;
  end if;

  select * into v_platform
  from public.quota_policies
  where subject_kind = 'platform' and feature = p_feature and enabled
  limit 1
  for update;

  if found and v_platform.cost_limit_cents is not null then
    select coalesce(sum(
      case when entry_kind in ('reserve','charge','adjustment') then amount_cents
           when entry_kind in ('release','credit') then -amount_cents
           else 0 end), 0)
    into v_platform_committed
    from public.usage_ledger
    where feature = p_feature and occurred_at >= now() - interval '1 day';

    if v_platform_committed + p_estimated_cost_cents > v_platform.cost_limit_cents then
      return null;
    end if;
  end if;

  insert into public.ai_jobs (
    owner_user_id, anonymous_id, job_type, feature, status,
    input_manifest, idempotency_key, estimated_cost_cents, reserved_cost_cents
  ) values (
    p_owner_user_id, p_anonymous_id, p_job_type, p_feature, 'budget_reserved',
    p_input_manifest, p_idempotency_key, p_estimated_cost_cents, p_estimated_cost_cents
  )
  on conflict (idempotency_key) do nothing
  returning id into v_job_id;

  if v_job_id is null then
    select id into v_job_id from public.ai_jobs where idempotency_key = p_idempotency_key;
    return v_job_id;
  end if;

  insert into public.usage_ledger (
    owner_user_id, anonymous_id, ai_job_id, feature, entry_kind, amount_cents
  ) values (
    p_owner_user_id, p_anonymous_id, v_job_id, p_feature, 'reserve', p_estimated_cost_cents
  );

  return v_job_id;
end;
$$;

revoke execute on function public.reserve_ai_budget(text, text, uuid, uuid, integer, text, jsonb, text) from public;
grant execute on function public.reserve_ai_budget(text, text, uuid, uuid, integer, text, jsonb, text) to service_role;
