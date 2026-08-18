-- Consumer account persistence.
--
-- Accounts are optional: every public planning tool remains usable without
-- authentication. These tables hold only persistence the user explicitly asks
-- for. They contain no loan application, document, credit decision or media
-- upload data.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, status)
  values (new.id, 'active')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'consumer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Safe for an existing project: establish the same invariant for Auth users
-- created before this migration, without replacing profile or role data.
insert into public.profiles (id, status)
select id, 'active' from auth.users
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select id, 'consumer'::public.app_role from auth.users
on conflict (user_id, role) do nothing;

create table public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  listing_key text not null check (
    char_length(listing_key) between 1 and 64
    and listing_key ~ '^[A-Z0-9-]+$'
  ),
  source_mode text not null check (source_mode in ('fixture','live')),
  saved_at timestamptz not null default now(),
  unique (owner_user_id, listing_key)
);

create index saved_properties_owner_idx
  on public.saved_properties (owner_user_id, saved_at desc);

create table public.saved_calculator_scenarios (
  id uuid primary key,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (
    source in (
      'mortgage_planner','mortgage_payment','affordability',
      'refinance_break_even','rent_vs_buy','closing_cost'
    )
  ),
  version text not null check (char_length(version) between 1 and 64),
  calculation_version text not null check (char_length(calculation_version) between 1 and 64),
  input_snapshot jsonb not null check (
    jsonb_typeof(input_snapshot) = 'object'
    and octet_length(input_snapshot::text) <= 16384
  ),
  result_snapshot jsonb not null check (
    jsonb_typeof(result_snapshot) = 'object'
    and octet_length(result_snapshot::text) <= 16384
  ),
  summary text not null check (char_length(summary) between 1 and 500),
  saved_at timestamptz not null default now()
);

create index saved_calculator_scenarios_owner_idx
  on public.saved_calculator_scenarios (owner_user_id, saved_at desc);

create table public.notification_preferences (
  owner_user_id uuid primary key references public.profiles(id) on delete cascade,
  report_ready_email boolean not null default true,
  report_failure_email boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create table public.privacy_requests (
  id uuid primary key,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null check (request_type in ('export','delete')),
  status text not null default 'received'
    check (status in ('received','in_progress','completed','rejected')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint privacy_request_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index privacy_requests_owner_idx
  on public.privacy_requests (owner_user_id, created_at desc);

alter table public.saved_properties enable row level security;
alter table public.saved_calculator_scenarios enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.privacy_requests enable row level security;

revoke all on public.saved_properties from anon;
revoke all on public.saved_calculator_scenarios from anon;
revoke all on public.notification_preferences from anon;
revoke all on public.privacy_requests from anon;

grant select, insert, delete on public.saved_properties to authenticated;
grant select, insert, delete on public.saved_calculator_scenarios to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
grant select, insert on public.privacy_requests to authenticated;

create policy "owners manage saved properties"
  on public.saved_properties for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "owners manage saved calculator scenarios"
  on public.saved_calculator_scenarios for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "owners manage notification preferences"
  on public.notification_preferences for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "owners read privacy requests"
  on public.privacy_requests for select to authenticated
  using (owner_user_id = auth.uid());

create policy "owners create privacy requests"
  on public.privacy_requests for insert to authenticated
  with check (owner_user_id = auth.uid() and status = 'received' and completed_at is null);

create policy "authorized staff read privacy requests"
  on public.privacy_requests for select to authenticated
  using (
    public.has_role('compliance_reviewer')
    or public.has_role('operations')
    or public.has_role('admin')
  );

create function public.create_privacy_request(
  p_request_id uuid,
  p_request_type text
)
returns table (
  request_id uuid,
  request_type text,
  status text,
  created_at timestamptz
)
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_request_type not in ('export','delete') then
    raise exception 'unsupported privacy request type';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_request_id::text, 0)
  );

  insert into public.privacy_requests (id, owner_user_id, request_type)
  values (p_request_id, auth.uid(), p_request_type)
  on conflict (id) do nothing;

  return query
    select r.id, r.request_type, r.status, r.created_at
    from public.privacy_requests r
    where r.id = p_request_id and r.owner_user_id = auth.uid();
end;
$$;

revoke execute on function public.create_privacy_request(uuid, text) from public;
grant execute on function public.create_privacy_request(uuid, text) to authenticated;

revoke execute on function public.handle_new_auth_user() from public;
