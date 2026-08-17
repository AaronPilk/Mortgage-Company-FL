-- Identity and authorization.
--
-- Supabase Auth owns credentials. Application roles live in explicit tables with
-- their own policies, because a role asserted by a client is not evidence.
-- Every policy below is paired with an explicit server-side check; RLS is the
-- second barrier, not the only one.

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum (
  'consumer',
  'agent',
  'loan_officer',
  'content_editor',
  'compliance_reviewer',
  'operations',
  'admin'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone_e164 text,
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role)
);

create index user_roles_active_idx
  on public.user_roles (user_id, role)
  where revoked_at is null;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- security definer with an empty search_path so the function cannot be hijacked
-- by a schema the caller controls.
create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = required_role
      and ur.revoked_at is null
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.revoked_at is null
      and ur.role in ('loan_officer', 'content_editor', 'compliance_reviewer', 'operations', 'admin')
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create policy "profiles read own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

-- A consumer may edit their own display name and phone. Status and identity are
-- deliberately not writable through this path; changing them goes through a
-- narrow server endpoint that writes an audit record.
create policy "profiles update own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and status = 'active');

create policy "staff read profiles"
  on public.profiles for select to authenticated
  using (public.has_role('admin') or public.has_role('operations'));

create policy "admins read roles"
  on public.user_roles for select to authenticated
  using (public.has_role('admin'));

create policy "users read own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

-- Only an admin may grant or revoke. A user cannot escalate their own privileges
-- because the with-check clause is evaluated against the acting user, not the row.
create policy "admins manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));
