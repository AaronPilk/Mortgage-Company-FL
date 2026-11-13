-- Homeowner value dashboard.
--
-- Two owner-scoped tables. `home_profiles` is the one home a signed-in owner
-- tracks: the address the valuation provider matched, and the mortgage balance
-- they estimate they still owe. `home_value_snapshots` is that home's automated
-- value over time — one row per day, so a trend builds as the owner (and, later,
-- a scheduled re-snapshot) asks for estimates.
--
-- These are self-entered planning figures and a licensed automated valuation
-- (AVM) — never an application, a credit pull, a government identifier, or an
-- appraisal (invariant 2). Like every consumer-account table both are RLS-scoped
-- to their owner; the owner's own writes go through the RLS-subject client, so
-- there is no SECURITY DEFINER surface here to lock down. Every monetary column
-- is integer cents (invariant 1).

create table public.home_profiles (
  owner_user_id uuid primary key references public.profiles(id) on delete cascade,
  -- The address the AVM provider standardized. Structured so a refresh can re-run
  -- the lookup without re-parsing a display string.
  address_line1 text not null check (char_length(address_line1) between 1 and 200),
  address_city text not null check (char_length(address_city) between 1 and 120),
  address_state text not null check (char_length(address_state) between 2 and 8),
  address_postal_code text not null check (char_length(address_postal_code) between 3 and 12),
  -- Provider coordinates, kept so the later scheduled re-snapshot can resolve the
  -- home without another geocoding round-trip. Nullable: a match can lack them.
  latitude double precision,
  longitude double precision,
  -- Whole-dollar balance the owner entered, stored as integer cents and bounded
  -- so a fat-fingered entry stays sane. A planning figure, not a loan record.
  estimated_balance_cents bigint not null default 0
    check (estimated_balance_cents between 0 and 100000000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.home_value_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  -- One snapshot per home per UTC day; a same-day refresh overwrites via upsert.
  captured_on date not null default (now() at time zone 'utc')::date,
  estimated_value_cents bigint not null
    check (estimated_value_cents between 0 and 100000000000),
  value_low_cents bigint check (value_low_cents between 0 and 100000000000),
  value_high_cents bigint check (value_high_cents between 0 and 100000000000),
  -- Which provider produced this value. 'fixture' can only ever be written
  -- outside production (invariant 6); the dashboard labels it as sample data.
  source text not null default 'attom' check (source in ('attom', 'fixture')),
  created_at timestamptz not null default now(),
  unique (owner_user_id, captured_on)
);

-- The owner reads their whole history at once; index the scan.
create index home_value_snapshots_owner_captured_idx
  on public.home_value_snapshots (owner_user_id, captured_on);

alter table public.home_profiles enable row level security;
alter table public.home_value_snapshots enable row level security;

revoke all on public.home_profiles from anon;
revoke all on public.home_value_snapshots from anon;
grant select, insert, update, delete on public.home_profiles to authenticated;
grant select, insert, update, delete on public.home_value_snapshots to authenticated;

create policy "owners manage home profile"
  on public.home_profiles for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "owners manage home snapshots"
  on public.home_value_snapshots for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
