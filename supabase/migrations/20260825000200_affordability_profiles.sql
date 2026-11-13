-- Saved affordability profile.
--
-- One row per signed-in visitor: the estimate inputs they chose to keep, so the
-- site can answer "what can I afford" without asking again, seed the
-- calculators, and later power rate-watch alerts. These are self-entered
-- planning figures the visitor typed into an estimate — never an application, a
-- credit pull, a government identifier, or documentation (invariant 2). Like
-- every consumer-account table it is RLS-scoped to its owner and holds only the
-- persistence the user asked for.

create table public.affordability_profiles (
  owner_user_id uuid primary key references public.profiles(id) on delete cascade,
  -- Whole-dollar figures the visitor entered, stored as integer cents like the
  -- rest of the system's money. Bounded so a fat-fingered entry stays sane.
  annual_income_cents bigint not null check (annual_income_cents between 0 and 100000000000),
  down_payment_cents bigint not null check (down_payment_cents between 0 and 100000000000),
  monthly_debts_cents bigint not null default 0 check (monthly_debts_cents between 0 and 100000000000),
  -- Self-selected, never a pulled score. A planning bucket, not a credit fact.
  credit_band text not null check (credit_band in ('excellent', 'good', 'fair', 'building')),
  updated_at timestamptz not null default now()
);

alter table public.affordability_profiles enable row level security;

revoke all on public.affordability_profiles from anon;
grant select, insert, update, delete on public.affordability_profiles to authenticated;

create policy "owners manage affordability profile"
  on public.affordability_profiles for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
