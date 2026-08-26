-- Home profile: optional current mortgage rate.
--
-- A self-entered planning figure — the rate the owner believes they're paying —
-- so the dashboard can compare it to the live market average and surface whether
-- a refinance conversation is worth having. Like the balance, it is never an
-- application, a credit fact, or a quote (invariant 2), and it is a rate, so it
-- is stored as integer basis points (invariant 1). Nullable: the signal simply
-- does not show until the owner supplies it. The table's owner-scoped RLS already
-- covers this column.

alter table public.home_profiles
  add column current_rate_bp integer
    check (current_rate_bp is null or current_rate_bp between 0 and 5000);
