-- Agent referral dashboard.
--
-- An approved, claimed partner sees the leads their /r/<slug> link drove — a
-- count, coarse buckets, recency — and nothing that identifies a consumer.
-- Two structural facts make that safe:
--   1. The agent<->user link already exists: agents.owner_user_id = auth.uid()
--      (20260819000100_agents_directory.sql), with an "owners read own agent
--      row" SELECT policy already in place.
--   2. The agent NEVER gets row access to public.leads. No agent policy is added
--      to leads; two SECURITY DEFINER functions return only aggregates and an
--      identity-free timeline, self-scoped by auth.uid(). A direct agent read of
--      public.leads still returns zero rows.
-- referring_agent_id is written in the SAME transaction as the lead, and only to
-- a real agents.id; a stale/unknown id becomes NULL, so a referral can never
-- break or delay the lead (mirrors apps/web/lib/referral.ts's fail-open posture).

-- 1. The one new queryable fact on the marketing lead.
alter table public.leads
  add column referring_agent_id uuid references public.agents(id) on delete set null;

create index leads_referring_agent_idx
  on public.leads (referring_agent_id, created_at desc)
  where referring_agent_id is not null;

-- 2. Persist the referral inside the existing single transaction. This reproduces
-- the current 6-arg body from 20260817001100_lead_idempotency_and_plans.sql
-- verbatim and changes ONLY the leads INSERT (one column + one NULL-safe value).
-- CREATE OR REPLACE preserves the existing ACL (already revoked from
-- public/anon/authenticated, granted to service_role), so invariant 5 holds. The
-- planner sibling delegates to this function and inherits the column unchanged.
create or replace function public.create_lead_with_receipt(
  p_lead jsonb,
  p_consent jsonb,
  p_attribution jsonb,
  p_outbox jsonb,
  p_request_id uuid,
  p_plan jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead_id uuid;
  v_touch jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_request_id::text, 0)
  );

  select lead_id
    into v_lead_id
    from public.lead_submission_receipts
   where submission_id = p_request_id;

  if v_lead_id is not null then
    return v_lead_id;
  end if;

  insert into public.leads (
    intent, first_name, last_name, email_normalized, phone_e164,
    preferred_contact, state_code, timeline, estimated_credit_band,
    message, source_path, dedupe_hash, status,
    referring_agent_id
  ) values (
    p_lead->>'intent',
    p_lead->>'first_name',
    p_lead->>'last_name',
    p_lead->>'email_normalized',
    p_lead->>'phone_e164',
    p_lead->>'preferred_contact',
    coalesce(p_lead->>'state_code', 'FL'),
    p_lead->>'timeline',
    p_lead->>'estimated_credit_band',
    p_lead->>'message',
    p_lead->>'source_path',
    p_lead->>'dedupe_hash',
    'queued',
    -- NULL-safe: only a real agents.id is stored; anything else becomes NULL and
    -- never fails the foreign key or the insert.
    (select a.id from public.agents a
      where a.id = nullif(p_lead->>'referring_agent_id', '')::uuid)
  )
  returning id into v_lead_id;

  insert into public.consent_receipts (
    lead_id, privacy_accepted, contact_requested, sms_marketing, email_marketing,
    disclosure_version, disclosure_text_sha256, source_path, form_version,
    request_id, ip_prefix_hash, user_agent_family
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
    p_request_id,
    p_consent->>'ip_prefix_hash',
    p_consent->>'user_agent_family'
  );

  for v_touch in
    select value
      from pg_catalog.jsonb_array_elements(
        case
          when pg_catalog.jsonb_typeof(p_attribution) = 'array' then p_attribution
          else pg_catalog.jsonb_build_array(p_attribution)
        end
      )
  loop
    insert into public.attribution_touches (
      lead_id, touch_kind, occurred_at, landing_path, referrer_host,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      gclid, gbraid, wbraid, msclkid, fbclid
    ) values (
      v_lead_id,
      coalesce(v_touch->>'touch_kind', 'conversion'),
      coalesce((v_touch->>'occurred_at')::timestamptz, now()),
      v_touch->>'landing_path',
      v_touch->>'referrer_host',
      v_touch->>'utm_source',
      v_touch->>'utm_medium',
      v_touch->>'utm_campaign',
      v_touch->>'utm_content',
      v_touch->>'utm_term',
      v_touch->>'gclid',
      v_touch->>'gbraid',
      v_touch->>'wbraid',
      v_touch->>'msclkid',
      v_touch->>'fbclid'
    );
  end loop;

  insert into public.integration_outbox (
    aggregate_type, aggregate_id, event_type, idempotency_key, payload
  ) values (
    'lead', v_lead_id, p_outbox->>'event_type', p_outbox->>'idempotency_key', p_outbox->'payload'
  );

  if p_plan is not null then
    insert into public.lead_plans (
      lead_id, submission_id, source, version, calculation_version,
      input_snapshot, result_snapshot, summary
    ) values (
      v_lead_id,
      p_request_id,
      p_plan->>'source',
      p_plan->>'version',
      p_plan->>'calculation_version',
      p_plan->'input_snapshot',
      p_plan->'result_snapshot',
      p_plan->>'summary'
    );
  end if;

  insert into public.lead_submission_receipts (submission_id, lead_id)
  values (p_request_id, v_lead_id);

  return v_lead_id;
end;
$$;

-- 3. The partner's read: a single summary row of counts + recency, self-scoped to
-- the caller's own APPROVED agent row. Zeros/NULL for anyone who is not a claimed,
-- approved partner (consumer, pending applicant, other agent, staff). Modeled on
-- public.loan_list_my_files (20260824000100_loan_compartment.sql).
create or replace function public.agent_referral_summary()
returns table (
  total_count bigint,
  new_count bigint,
  working_count bigint,
  closed_count bigint,
  -- A date, not a timestamp: the partner's recency signal is kept to the same
  -- day-level coarseness as the timeline, never the exact minute a lead arrived.
  last_referral_at date
)
language sql
security definer
set search_path = ''
as $$
  select
    count(*),
    count(*) filter (where l.status in ('new','queued','synced','error')),
    count(*) filter (where l.status in ('contacted','qualified','application_invited')),
    count(*) filter (where l.status in ('closed','suppressed')),
    max(l.created_at)::date
  from public.leads l
  where l.referring_agent_id in (
    select a.id from public.agents a
    where a.owner_user_id = auth.uid() and a.status = 'approved'
  );
$$;

-- 4. A coarse, identity-free timeline: one row per referred lead — a bucket and
-- the day it arrived. Never a name, email, phone, message, intent, or the raw
-- status (qualified / application_invited are folded into 'working', so nothing
-- here implies a credit step — invariant 6). Newest first, bounded.
create or replace function public.agent_referral_timeline(p_limit integer default 50)
returns table (status_bucket text, referred_on date)
language sql
security definer
set search_path = ''
as $$
  select
    case
      when l.status in ('contacted','qualified','application_invited') then 'working'
      when l.status in ('closed','suppressed') then 'closed'
      else 'new'
    end,
    l.created_at::date
  from public.leads l
  where l.referring_agent_id in (
    select a.id from public.agents a
    where a.owner_user_id = auth.uid() and a.status = 'approved'
  )
  order by l.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

-- 5. Function grants (invariant 5). Supabase grants EXECUTE to PUBLIC/anon/
-- authenticated by default; revoke, then grant only to the signed-in role.
revoke execute on function public.agent_referral_summary() from public, anon;
grant  execute on function public.agent_referral_summary() to authenticated, service_role;
revoke execute on function public.agent_referral_timeline(integer) from public, anon;
grant  execute on function public.agent_referral_timeline(integer) to authenticated, service_role;
