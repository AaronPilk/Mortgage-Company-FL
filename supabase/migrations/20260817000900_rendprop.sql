-- RendProp: listing media captured on a phone, processed off the request path.
--
-- Architecture note, because it is a constraint rather than a preference:
-- media processing NEVER runs inside a request handler. The runtime is
-- Cloudflare Workers, which has a hard CPU budget per request; a request that
-- tried to transcode a walkthrough would be killed mid-flight and the consumer
-- would be told nothing. So the request path does exactly one thing — insert a
-- `queued` row and return — and a separate worker drains the queue.
--
-- Money follows invariant 8. A queued row costs nothing. The worker reserves
-- spend inside `rendprop_claim_job`, which takes the quota lock through
-- `reserve_ai_budget`, and only then may a provider be called. Reservation is
-- deliberately NOT taken at enqueue time: a job can sit in the queue for hours,
-- and holding budget for a job that has not started starves the ones that have.
--
-- Two facts about generated media are enforced by constraints rather than by
-- convention, because virtual staging is a regulated disclosure in real-estate
-- marketing and a UI-only label is one refactor away from disappearing:
--   1. a generated asset cannot exist without a non-empty disclosure label;
--   2. that label, its AI-generated flag, and its lineage cannot be edited after
--      the fact, by anyone, through any policy.

/* ---------------------------------------------------------------- *
 * Projects
 * ---------------------------------------------------------------- */

create table public.rendprop_projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.property_entities(id) on delete set null,
  listing_record_id uuid references public.listing_records(id) on delete set null,
  title text not null,
  address_line_1 text,
  city text,
  state_code char(2),
  postal_code text,
  property_type text
    check (property_type in ('single_family','condo','townhouse','multi_family','land','other')),
  bedrooms numeric,
  bathrooms numeric,
  living_area_sqft integer,
  status text not null default 'draft'
    check (status in ('draft','capturing','tagging','processing','review','approved','published','archived')),
  -- Nothing is processed until the person capturing asserts they may capture and
  -- publish this property. It is a precondition of enqueueing, not a checkbox.
  rights_confirmed_at timestamptz,
  rights_confirmed_by uuid references public.profiles(id),
  rights_statement_version text,
  -- The attribution that must appear on the shared tour. Never stripped for layout.
  attribution_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rendprop_rights_are_attributed
    check (rights_confirmed_at is null or (rights_confirmed_by is not null and rights_statement_version is not null))
);

create index rendprop_projects_owner_idx
  on public.rendprop_projects (owner_user_id, updated_at desc);
create index rendprop_projects_status_idx on public.rendprop_projects (status);

create trigger rendprop_projects_updated_at
  before update on public.rendprop_projects
  for each row execute function public.set_updated_at();

/* ---------------------------------------------------------------- *
 * Original media
 * ---------------------------------------------------------------- */

-- Originals are immutable and are never overwritten by a derivative. Every
-- generated asset points back here, so "show me the unedited frame" is always
-- answerable — which is the whole basis of an honest disclosure.
create table public.rendprop_media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.rendprop_projects(id) on delete cascade,
  asset_kind text not null check (asset_kind in ('walkthrough_video','still_photo','audio_note')),
  capture_stage text not null default 'unassigned'
    check (capture_stage in ('unassigned','exterior','entry','living','kitchen','dining','bedroom','bathroom','utility','outdoor','other')),
  room_label text,
  room_order integer,
  -- Mirrors RENDPROP_UPLOAD_POLICY in apps/web/lib/rendprop/uploads.ts. Two
  -- copies is the point: the client-side check is a courtesy, this one is the rule.
  content_type text not null
    check (content_type in ('video/mp4','video/quicktime','image/jpeg','image/png','image/webp','image/heic','image/heif')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 1073741824),
  checksum_sha256 text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  width_px integer check (width_px is null or width_px > 0),
  height_px integer check (height_px is null or height_px > 0),
  captured_at timestamptz,
  -- Storage keys are derived from ids, never from a filename, so an upload
  -- cannot choose where it lands.
  storage_key text not null unique,
  upload_status text not null default 'pending'
    check (upload_status in ('pending','uploaded','verified','rejected')),
  rejection_reason text,
  is_original boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint rendprop_assets_are_originals check (is_original),
  constraint rendprop_video_is_not_an_image
    check (asset_kind <> 'still_photo' or content_type like 'image/%'),
  constraint rendprop_rejection_has_a_reason
    check (upload_status <> 'rejected' or rejection_reason is not null)
);

create index rendprop_assets_project_idx
  on public.rendprop_media_assets (project_id, room_order, created_at);
create index rendprop_assets_pending_idx
  on public.rendprop_media_assets (upload_status) where upload_status = 'pending';

/* ---------------------------------------------------------------- *
 * Processing jobs
 * ---------------------------------------------------------------- */

-- The queue. `queued` costs nothing; `reserved` means budget is held under the
-- quota lock; `running` means a provider call is outstanding. The state names
-- match RENDPROP_JOB_STATES in apps/web/lib/rendprop/jobs.ts exactly, because a
-- state machine that disagrees with its own storage is not a state machine.
create table public.rendprop_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.rendprop_projects(id) on delete cascade,
  source_asset_id uuid references public.rendprop_media_assets(id) on delete restrict,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  transformation text not null
    check (transformation in ('clutter_cleanup','lighting_correction','virtual_staging','still_enhancement','floor_plan','tour_sequencing','room_classification')),
  parameters jsonb not null default '{}'::jsonb,
  state text not null default 'queued'
    check (state in ('queued','reserved','running','succeeded','failed','cancelled')),
  -- Stable across retries on purpose: a retry of the same logical work must not
  -- be able to buy the same output twice.
  idempotency_key text not null unique,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 4 check (max_attempts between 1 and 10),
  next_attempt_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  locked_by text,
  locked_at timestamptz,
  estimated_cost_cents integer not null default 0 check (estimated_cost_cents >= 0),
  reserved_cost_cents integer not null default 0 check (reserved_cost_cents >= 0),
  actual_cost_cents integer check (actual_cost_cents is null or actual_cost_cents >= 0),
  -- An ambiguous provider outcome parks here. The reservation is NOT released.
  requires_reconciliation boolean not null default false,
  error_code text,
  error_class text check (error_class in ('terminal','retryable','unknown')),
  -- Redacted only. A raw provider error can echo the prompt back.
  error_detail_redacted text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rendprop_reserved_holds_budget
    check (state not in ('reserved','running') or reserved_cost_cents >= 0),
  constraint rendprop_failure_is_explained
    check (state <> 'failed' or error_code is not null)
);

-- The worker's drain query. Partial, because a settled job is never claimed again.
create index rendprop_jobs_drain_idx
  on public.rendprop_processing_jobs (next_attempt_at, created_at)
  where state = 'queued';
create index rendprop_jobs_project_idx
  on public.rendprop_processing_jobs (project_id, created_at desc);
create index rendprop_jobs_reconcile_idx
  on public.rendprop_processing_jobs (requires_reconciliation) where requires_reconciliation;

create trigger rendprop_processing_jobs_updated_at
  before update on public.rendprop_processing_jobs
  for each row execute function public.set_updated_at();

/* ---------------------------------------------------------------- *
 * Generated media
 * ---------------------------------------------------------------- */

create table public.rendprop_generated_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.rendprop_projects(id) on delete cascade,
  job_id uuid references public.rendprop_processing_jobs(id) on delete set null,
  -- Lineage. `restrict` so an original cannot be deleted out from under the
  -- derivative that claims to be a view of it.
  source_asset_id uuid not null references public.rendprop_media_assets(id) on delete restrict,
  -- Every contributing input, the model, and the prompt version. A floor plan
  -- derives from many frames; source_asset_id is the primary, this is the rest.
  lineage jsonb not null default '[]'::jsonb,
  transformation text not null
    check (transformation in ('clutter_cleanup','lighting_correction','virtual_staging','still_enhancement','floor_plan','tour_sequencing','room_classification')),
  storage_key text not null unique,
  content_type text not null check (content_type in ('image/jpeg','image/png','image/webp','application/pdf','application/json')),
  byte_size bigint check (byte_size is null or byte_size > 0),
  width_px integer,
  height_px integer,
  -- The regulated bit. This string is rendered in the visible UI, next to the
  -- image, not tucked into EXIF where no buyer will ever see it.
  disclosure_label text not null,
  ai_generated boolean not null default true,
  provider text,
  model_key text,
  review_state text not null default 'pending'
    check (review_state in ('pending','approved','rejected')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint rendprop_generated_carries_a_label
    check (not ai_generated or length(btrim(disclosure_label)) > 0),
  constraint rendprop_approval_is_attributed
    check (review_state <> 'approved' or (approved_by is not null and approved_at is not null))
);

create index rendprop_generated_project_idx
  on public.rendprop_generated_assets (project_id, created_at desc);
create index rendprop_generated_source_idx
  on public.rendprop_generated_assets (source_asset_id);

-- The disclosure, the AI flag, and the lineage are write-once. Approval is the
-- only thing a later UPDATE may move. Without this, "approve" could quietly
-- become "approve and relabel as a photograph".
create or replace function public.rendprop_freeze_disclosure()
returns trigger
language plpgsql
as $$
begin
  if new.disclosure_label is distinct from old.disclosure_label
     or new.ai_generated is distinct from old.ai_generated
     or new.source_asset_id is distinct from old.source_asset_id
     or new.transformation is distinct from old.transformation
     or new.storage_key is distinct from old.storage_key
     or new.lineage is distinct from old.lineage then
    raise exception
      'the disclosure label, AI flag, and lineage of a generated asset are immutable';
  end if;
  return new;
end;
$$;

create trigger rendprop_generated_disclosure_is_immutable
  before update on public.rendprop_generated_assets
  for each row execute function public.rendprop_freeze_disclosure();

/* ---------------------------------------------------------------- *
 * Tours and inquiries
 * ---------------------------------------------------------------- */

create table public.rendprop_tours (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.rendprop_projects(id) on delete cascade,
  headline text not null,
  summary text,
  -- Ordered scene list: original asset ids and approved generated asset ids,
  -- each with the label the viewer must see.
  scene_sequence jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','published','unpublished','expired')),
  -- High-entropy token stored as a hash. A sequential id would make an
  -- unlisted property guessable.
  public_token_hash text,
  attribution_text text,
  disclosure_version text,
  published_at timestamptz,
  unpublished_at timestamptz,
  expires_at timestamptz,
  view_count integer not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rendprop_published_tour_is_complete
    check (
      status <> 'published'
      or (public_token_hash is not null
          and published_at is not null
          and attribution_text is not null
          and disclosure_version is not null)
    )
);

create unique index rendprop_tours_token_idx
  on public.rendprop_tours (public_token_hash) where public_token_hash is not null;
create index rendprop_tours_project_idx on public.rendprop_tours (project_id, created_at desc);

create trigger rendprop_tours_updated_at
  before update on public.rendprop_tours
  for each row execute function public.set_updated_at();

-- An inquiry from a tour is a marketing enquiry and nothing more. Contact
-- details live on `leads`, behind the same consent receipt as every other form,
-- so this table holds the tour context and a pointer. Invariant 2: it must never
-- grow a document, an account number, or a government identifier.
create table public.rendprop_tour_inquiries (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.rendprop_tours(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  inquiry_kind text not null default 'general'
    check (inquiry_kind in ('general','showing_request','financing_question')),
  message text,
  scene_key text,
  request_id uuid not null,
  created_at timestamptz not null default now()
);

create index rendprop_inquiries_tour_idx
  on public.rendprop_tour_inquiries (tour_id, created_at desc);

/* ---------------------------------------------------------------- *
 * Row level security
 * ---------------------------------------------------------------- */

alter table public.rendprop_projects enable row level security;
alter table public.rendprop_media_assets enable row level security;
alter table public.rendprop_processing_jobs enable row level security;
alter table public.rendprop_generated_assets enable row level security;
alter table public.rendprop_tours enable row level security;
alter table public.rendprop_tour_inquiries enable row level security;

-- Anonymous clients get no direct table access to anything RendProp. A published
-- tour reaches the public through exactly one path — `rendprop_published_tour`,
-- called by a server route holding a narrowly scoped credential, which enforces
-- publication, expiry, and revocation in one place and returns only the columns
-- a viewer is allowed to see. A table policy would have exposed every column.
revoke all on public.rendprop_projects from anon;
revoke all on public.rendprop_media_assets from anon;
revoke all on public.rendprop_processing_jobs from anon;
revoke all on public.rendprop_generated_assets from anon;
revoke all on public.rendprop_tours from anon;
revoke all on public.rendprop_tour_inquiries from anon;

create policy "owners read own rendprop projects"
  on public.rendprop_projects for select to authenticated
  using (
    owner_user_id = auth.uid()
    or public.has_role('operations')
    or public.has_role('admin')
  );

create policy "owners insert own rendprop projects"
  on public.rendprop_projects for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy "owners update own rendprop projects"
  on public.rendprop_projects for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "owners read own rendprop assets"
  on public.rendprop_media_assets for select to authenticated
  using (
    exists (
      select 1 from public.rendprop_projects p
      where p.id = project_id
        and (p.owner_user_id = auth.uid()
             or public.has_role('operations')
             or public.has_role('admin'))
    )
  );

create policy "owners insert own rendprop assets"
  on public.rendprop_media_assets for insert to authenticated
  with check (
    exists (
      select 1 from public.rendprop_projects p
      where p.id = project_id and p.owner_user_id = auth.uid()
    )
  );

create policy "owners read own rendprop jobs"
  on public.rendprop_processing_jobs for select to authenticated
  using (
    exists (
      select 1 from public.rendprop_projects p
      where p.id = project_id
        and (p.owner_user_id = auth.uid()
             or public.has_role('operations')
             or public.has_role('admin'))
    )
  );

create policy "owners read own rendprop generated assets"
  on public.rendprop_generated_assets for select to authenticated
  using (
    exists (
      select 1 from public.rendprop_projects p
      where p.id = project_id
        and (p.owner_user_id = auth.uid()
             or public.has_role('operations')
             or public.has_role('admin'))
    )
  );

-- Approval is an owner decision. The trigger above is what keeps it from
-- becoming a relabelling decision.
create policy "owners approve own rendprop generated assets"
  on public.rendprop_generated_assets for update to authenticated
  using (
    exists (
      select 1 from public.rendprop_projects p
      where p.id = project_id and p.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rendprop_projects p
      where p.id = project_id and p.owner_user_id = auth.uid()
    )
  );

create policy "owners read own rendprop tours"
  on public.rendprop_tours for select to authenticated
  using (
    exists (
      select 1 from public.rendprop_projects p
      where p.id = project_id
        and (p.owner_user_id = auth.uid()
             or public.has_role('operations')
             or public.has_role('admin'))
    )
  );

create policy "owners write own rendprop tours"
  on public.rendprop_tours for all to authenticated
  using (
    exists (
      select 1 from public.rendprop_projects p
      where p.id = project_id and p.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rendprop_projects p
      where p.id = project_id and p.owner_user_id = auth.uid()
    )
  );

create policy "owners read own rendprop inquiries"
  on public.rendprop_tour_inquiries for select to authenticated
  using (
    exists (
      select 1 from public.rendprop_tours t
      join public.rendprop_projects p on p.id = t.project_id
      where t.id = tour_id
        and (p.owner_user_id = auth.uid()
             or public.has_role('operations')
             or public.has_role('admin'))
    )
  );

/* ---------------------------------------------------------------- *
 * Enqueue — the request path. No provider, no money, no lock.
 * ---------------------------------------------------------------- */

-- Called by the API route. It writes one row and returns. Anything that could
-- take longer than a request budget happens in the worker, which is the only
-- shape that survives a Cloudflare Workers CPU limit.
create or replace function public.rendprop_enqueue_job(
  p_project_id uuid,
  p_owner_user_id uuid,
  p_source_asset_id uuid,
  p_transformation text,
  p_parameters jsonb,
  p_estimated_cost_cents integer,
  p_idempotency_key text,
  p_max_attempts integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_id uuid;
  v_rights timestamptz;
begin
  select rights_confirmed_at into v_rights
  from public.rendprop_projects
  where id = p_project_id and owner_user_id = p_owner_user_id;

  -- No project, not yours, or no rights assertion: nothing is queued. Capture
  -- rights are a precondition of processing, not a step you can come back to.
  if not found or v_rights is null then
    return null;
  end if;

  insert into public.rendprop_processing_jobs (
    project_id, source_asset_id, transformation, parameters,
    state, idempotency_key, estimated_cost_cents, max_attempts
  ) values (
    p_project_id, p_source_asset_id, p_transformation, coalesce(p_parameters, '{}'::jsonb),
    'queued', p_idempotency_key, greatest(coalesce(p_estimated_cost_cents, 0), 0),
    coalesce(p_max_attempts, 4)
  )
  on conflict (idempotency_key) do nothing
  returning id into v_job_id;

  -- A duplicate enqueue returns the original job rather than a second one. This
  -- is what makes a retried POST safe.
  if v_job_id is null then
    select id into v_job_id
    from public.rendprop_processing_jobs
    where idempotency_key = p_idempotency_key;
  end if;

  return v_job_id;
end;
$$;

revoke execute on function public.rendprop_enqueue_job(uuid, uuid, uuid, text, jsonb, integer, text, integer) from public;
grant execute on function public.rendprop_enqueue_job(uuid, uuid, uuid, text, jsonb, integer, text, integer) to service_role;

/* ---------------------------------------------------------------- *
 * Claim and reserve — the worker path. Invariant 8 lives here.
 * ---------------------------------------------------------------- */

-- Invariant 8, in one transaction and in this order:
--   1. kill switches
--   2. claim a queued job with FOR UPDATE SKIP LOCKED, so two workers cannot
--      take the same job
--   3. reserve spend through reserve_ai_budget, which takes FOR UPDATE on the
--      quota bucket — without that lock two workers both read "budget available"
--   4. only then does the caller have permission to call a provider
--
-- A denial does not fail the job. It pushes it out and leaves it queued, because
-- "over quota right now" is not the same fact as "this work is impossible".
create or replace function public.rendprop_claim_job(
  p_worker_id text,
  p_subject_kind text,
  p_lease_seconds integer,
  p_backoff_seconds integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.rendprop_processing_jobs%rowtype;
  v_owner uuid;
  v_ai_job_id uuid;
begin
  if exists (select 1 from public.kill_switches where key = 'global' and engaged) then
    return null;
  end if;
  if exists (
    select 1 from public.kill_switches where key = 'feature:rendprop_media' and engaged
  ) then
    return null;
  end if;

  select * into v_job
  from public.rendprop_processing_jobs
  where state = 'queued' and next_attempt_at <= now()
  order by next_attempt_at, created_at
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  if v_job.attempt_count >= v_job.max_attempts then
    update public.rendprop_processing_jobs
    set state = 'failed',
        error_code = 'attempts_exhausted',
        error_class = 'terminal',
        completed_at = now()
    where id = v_job.id;
    return null;
  end if;

  select owner_user_id into v_owner
  from public.rendprop_projects where id = v_job.project_id;

  -- The lock is inside this call. Nothing above it has spent anything.
  v_ai_job_id := public.reserve_ai_budget(
    'rendprop_media',
    p_subject_kind,
    v_owner,
    null,
    v_job.estimated_cost_cents,
    v_job.transformation,
    jsonb_build_object(
      'rendprop_job_id', v_job.id,
      'project_id', v_job.project_id,
      'source_asset_id', v_job.source_asset_id,
      'transformation', v_job.transformation
    ),
    v_job.idempotency_key
  );

  if v_ai_job_id is null then
    update public.rendprop_processing_jobs
    set next_attempt_at = now() + make_interval(secs => greatest(coalesce(p_backoff_seconds, 60), 1)),
        error_code = 'quota_denied',
        error_class = 'retryable'
    where id = v_job.id;
    return null;
  end if;

  update public.rendprop_processing_jobs
  set state = 'reserved',
      ai_job_id = v_ai_job_id,
      reserved_cost_cents = v_job.estimated_cost_cents,
      attempt_count = v_job.attempt_count + 1,
      locked_by = p_worker_id,
      locked_at = now(),
      lease_expires_at = now() + make_interval(secs => greatest(coalesce(p_lease_seconds, 300), 30)),
      started_at = coalesce(v_job.started_at, now()),
      error_code = null,
      error_class = null
  where id = v_job.id;

  return v_job.id;
end;
$$;

revoke execute on function public.rendprop_claim_job(text, text, integer, integer) from public;
grant execute on function public.rendprop_claim_job(text, text, integer, integer) to service_role;

/* ---------------------------------------------------------------- *
 * Settle — the only place a reservation is released.
 * ---------------------------------------------------------------- */

-- Mirrors settleReservation() in @tract/integrations. The case that matters is
-- `unknown`: the provider may or may not have done billable work, so the
-- reservation is HELD, the job is flagged for reconciliation, and no ledger
-- entry is written. Releasing here would understate spend against a bill that
-- still arrives.
create or replace function public.rendprop_settle_job(
  p_job_id uuid,
  p_outcome text,
  p_actual_cost_cents integer,
  p_error_code text,
  p_error_class text,
  p_error_detail_redacted text,
  p_next_attempt_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.rendprop_processing_jobs%rowtype;
  v_owner uuid;
  v_actual integer;
  v_difference integer;
  v_next_state text;
begin
  select * into v_job from public.rendprop_processing_jobs where id = p_job_id for update;
  if not found then
    return null;
  end if;
  if v_job.state not in ('reserved','running') then
    return v_job.state;
  end if;

  select owner_user_id into v_owner
  from public.rendprop_projects where id = v_job.project_id;

  if p_outcome = 'unknown' then
    update public.rendprop_processing_jobs
    set requires_reconciliation = true,
        state = 'running',
        error_code = coalesce(p_error_code, 'provider_outcome_unknown'),
        error_class = 'unknown',
        error_detail_redacted = p_error_detail_redacted
    where id = v_job.id;

    update public.ai_jobs
    set requires_reconciliation = true,
        error_code = coalesce(p_error_code, 'provider_outcome_unknown')
    where id = v_job.ai_job_id;

    -- No ledger entry. The reservation stands.
    return 'running';
  end if;

  if p_outcome = 'succeeded' then
    v_actual := greatest(coalesce(p_actual_cost_cents, 0), 0);
    insert into public.usage_ledger (owner_user_id, ai_job_id, feature, entry_kind, amount_cents)
    values (v_owner, v_job.ai_job_id, 'rendprop_media', 'charge', v_actual);

    v_difference := v_job.reserved_cost_cents - v_actual;
    if v_difference > 0 then
      insert into public.usage_ledger (owner_user_id, ai_job_id, feature, entry_kind, amount_cents)
      values (v_owner, v_job.ai_job_id, 'rendprop_media', 'release', v_difference);
    elsif v_difference < 0 then
      insert into public.usage_ledger
        (owner_user_id, ai_job_id, feature, entry_kind, amount_cents, reason)
      values (v_owner, v_job.ai_job_id, 'rendprop_media', 'adjustment', -v_difference,
        'actual provider cost exceeded the reservation');
    end if;

    update public.rendprop_processing_jobs
    set state = 'succeeded', actual_cost_cents = v_actual, completed_at = now(),
        locked_by = null, lease_expires_at = null
    where id = v_job.id;

    update public.ai_jobs
    set status = 'succeeded', actual_cost_cents = v_actual, completed_at = now()
    where id = v_job.ai_job_id;

    return 'succeeded';
  end if;

  -- Failed before any billable provider work: release the whole reservation.
  insert into public.usage_ledger (owner_user_id, ai_job_id, feature, entry_kind, amount_cents)
  values (v_owner, v_job.ai_job_id, 'rendprop_media', 'release', v_job.reserved_cost_cents);

  v_next_state := case
    when p_error_class = 'retryable' and v_job.attempt_count < v_job.max_attempts
      then 'queued'
    else 'failed'
  end;

  update public.rendprop_processing_jobs
  set state = v_next_state,
      reserved_cost_cents = 0,
      error_code = coalesce(p_error_code, 'provider_failed'),
      error_class = coalesce(p_error_class, 'terminal'),
      error_detail_redacted = p_error_detail_redacted,
      next_attempt_at = coalesce(p_next_attempt_at, now()),
      locked_by = null,
      lease_expires_at = null,
      completed_at = case when v_next_state = 'failed' then now() else null end
  where id = v_job.id;

  update public.ai_jobs
  set status = case when v_next_state = 'failed' then 'failed' else 'queued' end,
      error_code = coalesce(p_error_code, 'provider_failed')
  where id = v_job.ai_job_id;

  return v_next_state;
end;
$$;

revoke execute on function public.rendprop_settle_job(uuid, text, integer, text, text, text, timestamptz) from public;
grant execute on function public.rendprop_settle_job(uuid, text, integer, text, text, text, timestamptz) to service_role;

/* ---------------------------------------------------------------- *
 * The published tour path
 * ---------------------------------------------------------------- */

-- The one and only route by which an anonymous viewer reaches RendProp data.
-- It returns the approved scene list and, with every generated scene, the
-- disclosure label that must be rendered beside it — so a public page
-- physically cannot show a staged image without having been handed its label.
create or replace function public.rendprop_published_tour(p_token_hash text)
returns table (
  headline text,
  summary text,
  city text,
  state_code char(2),
  attribution_text text,
  disclosure_version text,
  published_at timestamptz,
  scene_sequence jsonb,
  disclosures jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.headline,
    t.summary,
    p.city,
    p.state_code,
    t.attribution_text,
    t.disclosure_version,
    t.published_at,
    t.scene_sequence,
    coalesce(
      (select jsonb_agg(jsonb_build_object(
          'generatedAssetId', g.id,
          'sourceAssetId', g.source_asset_id,
          'transformation', g.transformation,
          'disclosureLabel', g.disclosure_label,
          'aiGenerated', g.ai_generated
        ) order by g.created_at)
       from public.rendprop_generated_assets g
       where g.project_id = t.project_id and g.review_state = 'approved'),
      '[]'::jsonb
    ) as disclosures
  from public.rendprop_tours t
  join public.rendprop_projects p on p.id = t.project_id
  where t.public_token_hash = p_token_hash
    and t.status = 'published'
    and t.unpublished_at is null
    and (t.expires_at is null or t.expires_at > now());
$$;

revoke execute on function public.rendprop_published_tour(text) from public;
grant execute on function public.rendprop_published_tour(text) to service_role;

revoke execute on function public.rendprop_freeze_disclosure() from public;
