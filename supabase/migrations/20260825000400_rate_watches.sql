-- Rate watch.
--
-- One row per signed-in visitor: which market average they track (30- or
-- 15-year fixed), an optional target rate they'd like to see, and whether they
-- want an email when it moves. The target is the visitor's own aspiration, never
-- a rate we quote — this table holds no application data, no credit fact, and no
-- government identifier (invariant 2). Rates are integer basis points
-- (invariant 1). RLS-scoped to its owner like every consumer-account table; the
-- owner's own writes go through the RLS-subject client, so there is no SECURITY
-- DEFINER surface here to lock down.

create table public.rate_watches (
  owner_user_id uuid primary key references public.profiles(id) on delete cascade,
  term text not null check (term in ('thirtyYearFixed', 'fifteenYearFixed')),
  -- Optional aspirational rate in basis points, bounded so a stray entry stays
  -- sane (0–50%). Null means "just tell me when it moves".
  target_rate_bp integer check (target_rate_bp is null or target_rate_bp between 0 and 5000),
  notify_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rate_watches enable row level security;

revoke all on public.rate_watches from anon;
grant select, insert, update, delete on public.rate_watches to authenticated;

create policy "owners manage rate watch"
  on public.rate_watches for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
