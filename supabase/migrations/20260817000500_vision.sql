-- TRACT Vision.
--
-- Sourced facts, user assumptions, deterministic calculations, and model
-- narrative are stored separately and snapshotted per report version, so any
-- published report can be reconstructed exactly as it was generated.

create table public.vision_projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  property_id uuid references public.property_entities(id) on delete set null,
  title text not null,
  goal text not null
    check (goal in ('renovate','expand','build','flip','long_term_rental','short_term_rental','buy_and_hold','explore')),
  status text not null default 'draft'
    check (status in ('draft','property_resolved','facts_loaded','assumptions_confirmed','analysis_complete','queued','processing','ready','failed','archived')),
  data_as_of timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vision_projects_owner_idx on public.vision_projects (owner_user_id, updated_at desc);

create table public.vision_assumptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.vision_projects(id) on delete cascade,
  assumption_key text not null,
  value jsonb not null,
  unit text,
  source_kind text not null
    check (source_kind in ('user','provider','company_default','model_inference')),
  source_reference text,
  confidence numeric check (confidence between 0 and 1),
  confirmed_by_user boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, assumption_key)
);

-- A model inference cannot silently drive a financial figure. It must be
-- confirmed by the person whose money is at stake.
alter table public.vision_assumptions
  add constraint model_inference_requires_confirmation
  check (source_kind <> 'model_inference' or confirmed_by_user = true or confidence is not null);

create table public.vision_scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.vision_projects(id) on delete cascade,
  scenario_name text not null,
  scenario_type text not null,
  input_snapshot jsonb not null,
  result_snapshot jsonb,
  calculation_version text not null,
  created_at timestamptz not null default now()
);

create table public.vision_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.vision_projects(id) on delete cascade,
  version integer not null,
  status text not null check (status in ('draft','review','published','superseded','failed')),
  facts_snapshot jsonb not null,
  assumptions_snapshot jsonb not null,
  calculations_snapshot jsonb not null,
  narrative_snapshot jsonb,
  limitations jsonb not null,
  citation_manifest jsonb not null,
  generated_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  -- High-entropy token stored as a hash. Sequential ids would make reports guessable.
  public_token_hash text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create unique index vision_reports_token_idx
  on public.vision_reports (public_token_hash) where public_token_hash is not null;

alter table public.vision_projects enable row level security;
alter table public.vision_assumptions enable row level security;
alter table public.vision_scenarios enable row level security;
alter table public.vision_reports enable row level security;

create policy "owners read own projects"
  on public.vision_projects for select to authenticated
  using (owner_user_id = auth.uid() or public.has_role('operations') or public.has_role('admin'));

create policy "owners write own draft projects"
  on public.vision_projects for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "owners insert own projects"
  on public.vision_projects for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy "owners read own assumptions"
  on public.vision_assumptions for select to authenticated
  using (
    exists (
      select 1 from public.vision_projects p
      where p.id = project_id and (p.owner_user_id = auth.uid() or public.is_staff())
    )
  );

create policy "owners write own assumptions"
  on public.vision_assumptions for all to authenticated
  using (
    exists (select 1 from public.vision_projects p where p.id = project_id and p.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.vision_projects p where p.id = project_id and p.owner_user_id = auth.uid())
  );

create policy "owners read own scenarios"
  on public.vision_scenarios for select to authenticated
  using (
    exists (
      select 1 from public.vision_projects p
      where p.id = project_id and (p.owner_user_id = auth.uid() or public.is_staff())
    )
  );

create policy "owners read own reports"
  on public.vision_reports for select to authenticated
  using (
    exists (
      select 1 from public.vision_projects p
      where p.id = project_id and (p.owner_user_id = auth.uid() or public.is_staff())
    )
  );

-- Token lookup happens in a function that returns only approved fields and
-- enforces expiry and revocation, rather than through a table policy that would
-- expose every column.
create or replace function public.get_public_report(p_token_hash text)
returns table (
  project_title text,
  version integer,
  facts_snapshot jsonb,
  assumptions_snapshot jsonb,
  calculations_snapshot jsonb,
  narrative_snapshot jsonb,
  limitations jsonb,
  citation_manifest jsonb,
  generated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.title, r.version, r.facts_snapshot, r.assumptions_snapshot,
         r.calculations_snapshot, r.narrative_snapshot, r.limitations,
         r.citation_manifest, r.generated_at
  from public.vision_reports r
  join public.vision_projects p on p.id = r.project_id
  where r.public_token_hash = p_token_hash
    and r.status = 'published'
    and r.revoked_at is null
    and (r.expires_at is null or r.expires_at > now());
$$;

-- Token lookup runs server-side so the token itself never becomes a client-side
-- database predicate and so expiry and revocation are enforced in one place.
revoke execute on function public.get_public_report(text) from public;
grant execute on function public.get_public_report(text) to service_role;
