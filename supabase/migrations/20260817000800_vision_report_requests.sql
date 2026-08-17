-- Anonymous TRACT Vision report requests.
--
-- The browser may calculate and display a deterministic preview without an
-- account. When a visitor explicitly asks for follow-up, this function records
-- the complete first-party lifecycle in one short transaction. It is additive,
-- service-role-only, and exact retries return the original receipt.

create table public.vision_report_requests (
  submission_id uuid primary key,
  lead_id uuid not null unique references public.leads(id) on delete restrict,
  project_id uuid not null unique references public.vision_projects(id) on delete restrict,
  report_id uuid not null unique references public.vision_reports(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index vision_report_requests_created_idx
  on public.vision_report_requests (created_at desc);

alter table public.vision_report_requests enable row level security;
revoke all on public.vision_report_requests from anon;

create policy "operations read vision report requests"
  on public.vision_report_requests for select to authenticated
  using (public.has_role('operations') or public.has_role('admin'));

create or replace function public.create_vision_report_request(
  p_submission_id uuid,
  p_lead jsonb,
  p_consent jsonb,
  p_attribution jsonb,
  p_project jsonb,
  p_scenario jsonb,
  p_report jsonb,
  p_outbox jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing jsonb;
  v_lead_id uuid;
  v_project_id uuid;
  v_report_id uuid;
begin
  -- Serialize only exact retries of this submission. The lock lives for this
  -- transaction and avoids creating orphaned duplicate rows under a race.
  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 0));

  select jsonb_build_object(
    'receipt_id', r.submission_id,
    'lead_id', r.lead_id,
    'project_id', r.project_id,
    'report_id', r.report_id,
    'replayed', true
  )
  into v_existing
  from public.vision_report_requests r
  where r.submission_id = p_submission_id;

  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.leads (
    intent, first_name, last_name, email_normalized, phone_e164,
    preferred_contact, state_code, timeline, message, source_path,
    dedupe_hash, status
  ) values (
    'vision_report',
    p_lead->>'first_name',
    p_lead->>'last_name',
    p_lead->>'email_normalized',
    p_lead->>'phone_e164',
    p_lead->>'preferred_contact',
    coalesce(p_lead->>'state_code', 'FL'),
    p_lead->>'timeline',
    p_lead->>'message',
    p_lead->>'source_path',
    p_lead->>'dedupe_hash',
    'queued'
  )
  returning id into v_lead_id;

  insert into public.consent_receipts (
    lead_id, privacy_accepted, contact_requested, sms_marketing,
    email_marketing, disclosure_version, disclosure_text_sha256,
    source_path, form_version, request_id, ip_prefix_hash,
    user_agent_family
  ) values (
    v_lead_id,
    (p_consent->>'privacy_accepted')::boolean,
    (p_consent->>'contact_requested')::boolean,
    coalesce((p_consent->>'sms_marketing')::boolean, false),
    coalesce((p_consent->>'email_marketing')::boolean, false),
    p_consent->>'disclosure_version',
    p_consent->>'disclosure_text_sha256',
    p_consent->>'source_path',
    p_consent->>'form_version',
    p_submission_id,
    p_consent->>'ip_prefix_hash',
    p_consent->>'user_agent_family'
  );

  insert into public.attribution_touches (
    lead_id, touch_kind, occurred_at, landing_path, referrer_host,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    gclid, gbraid, wbraid, msclkid, fbclid
  )
  select
    v_lead_id,
    touch->>'touch_kind',
    coalesce((touch->>'occurred_at')::timestamptz, now()),
    touch->>'landing_path',
    touch->>'referrer_host',
    touch->>'utm_source',
    touch->>'utm_medium',
    touch->>'utm_campaign',
    touch->>'utm_content',
    touch->>'utm_term',
    touch->>'gclid',
    touch->>'gbraid',
    touch->>'wbraid',
    touch->>'msclkid',
    touch->>'fbclid'
  from jsonb_array_elements(p_attribution) as attribution(touch);

  insert into public.vision_projects (
    owner_user_id, lead_id, title, goal, status, data_as_of
  ) values (
    null,
    v_lead_id,
    p_project->>'title',
    p_project->>'goal',
    'analysis_complete',
    coalesce((p_project->>'data_as_of')::timestamptz, now())
  )
  returning id into v_project_id;

  insert into public.vision_assumptions (
    project_id, assumption_key, value, source_kind, source_reference,
    confirmed_by_user
  )
  select
    v_project_id,
    assumption.key,
    assumption.value,
    'user',
    'visitor_report_request',
    true
  from jsonb_each(p_project->'assumptions') as assumption(key, value);

  insert into public.vision_scenarios (
    project_id, scenario_name, scenario_type, input_snapshot,
    result_snapshot, calculation_version
  ) values (
    v_project_id,
    coalesce(p_scenario->>'scenario_name', 'Planning range'),
    coalesce(p_scenario->>'scenario_type', 'vision_planning_preview'),
    p_scenario->'input_snapshot',
    p_scenario->'result_snapshot',
    p_scenario->>'calculation_version'
  );

  insert into public.vision_reports (
    project_id, version, status, facts_snapshot, assumptions_snapshot,
    calculations_snapshot, narrative_snapshot, limitations,
    citation_manifest, generated_at
  ) values (
    v_project_id,
    1,
    'draft',
    p_report->'facts_snapshot',
    p_report->'assumptions_snapshot',
    p_report->'calculations_snapshot',
    p_report->'narrative_snapshot',
    p_report->'limitations',
    p_report->'citation_manifest',
    now()
  )
  returning id into v_report_id;

  insert into public.integration_outbox (
    aggregate_type, aggregate_id, event_type, idempotency_key, payload
  ) values (
    'lead',
    v_lead_id,
    'lead.received',
    'lead.received:vision:' || p_submission_id::text,
    p_outbox->'payload'
  );

  insert into public.vision_report_requests (
    submission_id, lead_id, project_id, report_id
  ) values (
    p_submission_id, v_lead_id, v_project_id, v_report_id
  );

  return jsonb_build_object(
    'receipt_id', p_submission_id,
    'lead_id', v_lead_id,
    'project_id', v_project_id,
    'report_id', v_report_id,
    'replayed', false
  );
end;
$$;

revoke execute on function public.create_vision_report_request(
  uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb
) from public;
grant execute on function public.create_vision_report_request(
  uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb
) to service_role;

