-- Append-only audit log for privileged actions.
--
-- There is no update or delete path. Only a controlled server function may
-- append. Snapshots are redacted before they arrive here.

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_kind text not null check (actor_kind in ('user', 'service', 'system', 'anonymous')),
  action text not null,
  target_type text not null,
  target_id text,
  request_id uuid,
  ip_prefix_hash text,
  user_agent_family text,
  before_redacted jsonb,
  after_redacted jsonb,
  reason text,
  occurred_at timestamptz not null default now()
);

create index audit_events_time_idx on public.audit_events (occurred_at desc);
create index audit_events_target_idx on public.audit_events (target_type, target_id, occurred_at desc);

alter table public.audit_events enable row level security;

create policy "authorized audit readers"
  on public.audit_events for select to authenticated
  using (public.has_role('admin') or public.has_role('compliance_reviewer'));

revoke insert, update, delete on public.audit_events from anon, authenticated;

create or replace function public.record_audit_event(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_reason text default null,
  p_before jsonb default null,
  p_after jsonb default null,
  p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_action is null or length(p_action) = 0 then
    raise exception 'audit action is required';
  end if;

  insert into public.audit_events (
    actor_user_id, actor_kind, action, target_type, target_id,
    request_id, before_redacted, after_redacted, reason
  ) values (
    auth.uid(),
    case when auth.uid() is null then 'service' else 'user' end,
    p_action, p_target_type, p_target_id,
    p_request_id, p_before, p_after, p_reason
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Immutability guard. Even a privileged connection cannot rewrite history
-- through an ordinary statement.
create or replace function public.audit_events_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;

create trigger audit_events_no_update
  before update or delete on public.audit_events
  for each row execute function public.audit_events_immutable();

revoke execute on function public.record_audit_event(text, text, text, text, jsonb, jsonb, uuid) from public;
grant execute on function public.record_audit_event(text, text, text, text, jsonb, jsonb, uuid) to service_role;
