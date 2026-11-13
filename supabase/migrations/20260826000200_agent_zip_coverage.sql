-- Agent marketplace v1 — ZIP coverage registration + routing-lookup foundation.
--
-- A claimed partner agent registers the ZIP codes they cover. This is the data
-- foundation for later routing a seller/buyer lead to a covering agent. v1 has
-- NO payments, NO billing, NO auction, and NO exclusivity: overlap is allowed —
-- (agent_id, zip5) is unique but zip5 alone is not, so many agents may cover the
-- same ZIP, and choosing between them is a later decision, not this migration's.
--
-- Ownership rides the existing agents.owner_user_id link (20260819000100). RLS
-- scopes every owner read/write to the agent rows that user owns; the routing
-- lookup is a SECURITY DEFINER function, server-only, returning only APPROVED
-- covering agents. This table holds no consumer data and no contact data — it is
-- a set of ZIP strings keyed to a directory row.

create table public.agent_zip_coverage (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid not null references public.agents(id) on delete cascade,
  -- Five digits. Bounded and charset-checked, an identifier the postal service
  -- issued rather than free text. The column stays generic five-digit for
  -- forward-compatibility; routing is Florida-scoped by the agents it joins to,
  -- not by this constraint.
  zip5       text not null check (zip5 ~ '^[0-9]{5}$'),
  created_at timestamptz not null default now(),
  -- One row per (agent, ZIP). Overlap ACROSS agents is intentional in v1, so
  -- zip5 is deliberately not unique on its own.
  unique (agent_id, zip5)
);

-- The routing lookup keys on zip5; the owner's coverage read and the FK cascade
-- key on agent_id.
create index agent_zip_coverage_zip_idx   on public.agent_zip_coverage (zip5);
create index agent_zip_coverage_agent_idx on public.agent_zip_coverage (agent_id);

alter table public.agent_zip_coverage enable row level security;

-- Supabase's default privileges hand every new table to anon and authenticated
-- in full, so the revoke here is load-bearing, not ceremony. An owner needs only
-- to read, add, and remove their own rows — there is no mutable column, so no
-- UPDATE grant, and the manage flow is delete + insert. Anonymous gets nothing.
revoke all on public.agent_zip_coverage from anon, authenticated;
grant select, insert, delete on public.agent_zip_coverage to authenticated;

-- Owner scoping via the existing agents ownership link. The agents table's
-- "owners read own agent row" policy already exposes the owner's own agent row
-- to this same authenticated user, so the EXISTS subquery resolves under RLS
-- without a SECURITY DEFINER helper — the exact pattern lead_plans uses against
-- leads (20260817001100). A row whose agent the caller does not own is either
-- unreadable (RLS on agents) or fails the owner_user_id test, so it is denied
-- both ways. A pending agent's owner may pre-register coverage; routing gates on
-- approval, not on this policy.
create policy "agent owner reads own coverage"
  on public.agent_zip_coverage for select to authenticated
  using (
    exists (
      select 1 from public.agents a
      where a.id = agent_zip_coverage.agent_id
        and a.owner_user_id = auth.uid()
    )
  );

create policy "agent owner inserts own coverage"
  on public.agent_zip_coverage for insert to authenticated
  with check (
    exists (
      select 1 from public.agents a
      where a.id = agent_zip_coverage.agent_id
        and a.owner_user_id = auth.uid()
    )
  );

create policy "agent owner deletes own coverage"
  on public.agent_zip_coverage for delete to authenticated
  using (
    exists (
      select 1 from public.agents a
      where a.id = agent_zip_coverage.agent_id
        and a.owner_user_id = auth.uid()
    )
  );

-- Staff read for /admin visibility, same audience as directory review. Routing
-- itself does not need this (it runs through the definer function below); this
-- is only so an operator can inspect coverage.
create policy "staff read coverage"
  on public.agent_zip_coverage for select to authenticated
  using (public.has_role('operations') or public.has_role('admin'));

-- ROUTING FOUNDATION. Given a ZIP, the APPROVED agents that cover it. SECURITY
-- DEFINER so it can read across all coverage rows — it is a routing utility the
-- lead pipeline calls server-side under the service role, never an end user.
-- Only approved agents are returned, so a pending or unclaimed row never
-- receives a routed lead. display_consent is NOT a routing condition: an
-- approved agent who withheld a public directory listing still receives leads
-- for the ZIPs they cover. Ordered oldest-first so a future tie-break has a
-- stable, documented starting order.
create or replace function public.agent_coverage_for_zip(p_zip5 text)
returns table (agent_id uuid, agent_slug text)
language sql
security definer
set search_path = ''
as $$
  select c.agent_id, a.slug
  from public.agent_zip_coverage c
  join public.agents a on a.id = c.agent_id
  where c.zip5 = p_zip5
    and a.status = 'approved'
  order by c.created_at asc;
$$;

-- Invariant 5: EXECUTE is granted to PUBLIC by default on a new function, so
-- revoking from anon and authenticated alone would leave it reachable. Revoke
-- from PUBLIC, then grant only to the server role that routes leads.
revoke execute on function public.agent_coverage_for_zip(text) from public;
grant  execute on function public.agent_coverage_for_zip(text) to service_role;
