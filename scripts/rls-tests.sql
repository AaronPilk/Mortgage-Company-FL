-- Row Level Security policy tests.
--
-- These run against a real PostgreSQL instance with the migrations applied. Each
-- assertion sets a session role and a JWT subject, then proves that the wrong
-- actor cannot see or change the wrong row. A policy that is only read and not
-- executed is a policy nobody has tested.
--
-- Any failure raises and aborts the transaction, so a non-zero psql exit is the
-- CI signal.

\set ON_ERROR_STOP on

create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

create or replace function tests.assert(condition boolean, label text)
returns void language plpgsql as $$
begin
  if not condition then
    raise exception 'FAILED: %', label;
  end if;
  raise notice 'passed: %', label;
end;
$$;

create or replace function tests.assert_denied(stmt text, label text)
returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception
    -- 42501 covers both a missing grant and a row-level security refusal.
    -- 23514 covers the constraint-backed gates. P0001 covers an explicit guard
    -- such as the append-only audit trigger. Anything else is a genuine bug in
    -- the test and is allowed to propagate.
    when insufficient_privilege or check_violation or raise_exception then
      raise notice 'passed: % (denied as expected)', label;
      return;
  end;
  raise exception 'FAILED: % — statement was permitted but should have been denied', label;
end;
$$;

-- Returns the row count visible to the CURRENT role, which is the whole point:
-- an RLS-filtered select returns zero rows rather than raising.
create or replace function tests.visible_count(stmt text)
returns bigint language plpgsql as $$
declare n bigint;
begin
  execute stmt into n;
  return n;
end;
$$;

-- An UPDATE or DELETE blocked by RLS does not raise; it simply matches no rows.
-- Asserting "no rows were affected" is therefore the correct shape of the test,
-- and a policy that silently widens would fail here.
create or replace function tests.assert_affects_no_rows(stmt text, label text)
returns void language plpgsql as $$
declare n integer;
begin
  execute stmt;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FAILED: % — % row(s) were affected', label, n;
  end if;
  raise notice 'passed: % (no rows affected)', label;
end;
$$;

-- Broader than assert_denied: also accepts the referential and uniqueness
-- rejections, for the structural guarantees that are enforced by a foreign key
-- or a unique index rather than by a policy or a check.
create or replace function tests.assert_rejected(stmt text, label text)
returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception
    when insufficient_privilege or check_violation or raise_exception
      or foreign_key_violation or unique_violation or not_null_violation then
      raise notice 'passed: % (rejected as expected)', label;
      return;
  end;
  raise exception 'FAILED: % — statement was permitted but should have been rejected', label;
end;
$$;

grant execute on function tests.assert_affects_no_rows(text, text) to anon, authenticated;
grant execute on function tests.assert_rejected(text, text) to anon, authenticated;
grant execute on function tests.assert(boolean, text) to anon, authenticated;
grant execute on function tests.assert_denied(text, text) to anon, authenticated;
grant execute on function tests.visible_count(text) to anon, authenticated;

/* ---------------------------------------------------------------- *
 * Fixtures
 * ---------------------------------------------------------------- */

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'admin@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'consumer@example.com'),
  ('00000000-0000-4000-8000-000000000003', 'officer@example.com'),
  ('00000000-0000-4000-8000-000000000004', 'editor@example.com'),
  ('00000000-0000-4000-8000-000000000005', 'compliance@example.com'),
  ('00000000-0000-4000-8000-000000000006', 'agent@example.com'),
  ('00000000-0000-4000-8000-000000000007', 'operations@example.com');

insert into public.profiles (id, display_name) values
  ('00000000-0000-4000-8000-000000000001', 'Admin'),
  ('00000000-0000-4000-8000-000000000002', 'Consumer'),
  ('00000000-0000-4000-8000-000000000003', 'Officer'),
  ('00000000-0000-4000-8000-000000000004', 'Editor'),
  ('00000000-0000-4000-8000-000000000005', 'Compliance'),
  ('00000000-0000-4000-8000-000000000006', 'Agent'),
  ('00000000-0000-4000-8000-000000000007', 'Operations')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000001', 'admin'),
  ('00000000-0000-4000-8000-000000000003', 'loan_officer'),
  ('00000000-0000-4000-8000-000000000004', 'content_editor'),
  ('00000000-0000-4000-8000-000000000005', 'compliance_reviewer'),
  ('00000000-0000-4000-8000-000000000006', 'agent'),
  ('00000000-0000-4000-8000-000000000007', 'operations'),
  ('00000000-0000-4000-8000-000000000002', 'consumer')
on conflict (user_id, role) do nothing;

select tests.assert((select count(*) from public.profiles) = 7,
  'Auth user trigger creates one profile per user');
select tests.assert(
  (select count(*) from public.user_roles where role = 'consumer') = 7,
  'Auth user trigger grants every new account the baseline consumer role');

insert into public.saved_properties (owner_user_id, listing_key, source_mode) values
  ('00000000-0000-4000-8000-000000000002', 'FX-STP-0001', 'fixture'),
  ('00000000-0000-4000-8000-000000000006', 'FX-ORL-0004', 'fixture');

insert into public.saved_calculator_scenarios (
  id, owner_user_id, source, version, calculation_version,
  input_snapshot, result_snapshot, summary
) values
  (
    '00000000-0000-4000-8000-000000000210',
    '00000000-0000-4000-8000-000000000002',
    'mortgage_payment','payment@1','mortgage-math@1',
    jsonb_build_object('priceDollars',425000),
    jsonb_build_object('totalMonthlyDollars',3100),
    'Consumer payment fixture.'
  ),
  (
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000006',
    'affordability','affordability@1','mortgage-math@1',
    jsonb_build_object('monthlyIncomeDollars',9000),
    jsonb_build_object('estimatedPurchasePriceDollars',390000),
    'Agent affordability fixture.'
  );

insert into public.notification_preferences (
  owner_user_id, report_ready_email, report_failure_email
) values ('00000000-0000-4000-8000-000000000002', true, false);

insert into public.saved_searches (id, owner_user_id, search_params, summary) values
  (
    '00000000-0000-4000-8000-000000000230',
    '00000000-0000-4000-8000-000000000002',
    'q=Tampa&beds=3', '3+ beds in Tampa'
  ),
  (
    '00000000-0000-4000-8000-000000000231',
    '00000000-0000-4000-8000-000000000006',
    'q=Orlando', 'Listings in Orlando'
  );

-- Agent directory rows in every visibility state the policies distinguish:
-- publicly visible (approved + consented), owner-only pending, and approved
-- but non-consenting. Names are synthetic fixtures, never real people.
insert into public.agents (
  id, owner_user_id, first_name, last_name, brokerage, license_number,
  email_normalized, phone_e164, cities, bio, slug, status, display_consent
) values
  (
    '00000000-0000-4000-8000-000000000240', null,
    'Pat', 'Fixture', 'Sample Realty', 'SL-0000001',
    'pat.fixture@example.com', '+18135550101', 'Tampa, St. Petersburg',
    'Synthetic directory fixture.', 'pat-fixture', 'approved', true
  ),
  (
    '00000000-0000-4000-8000-000000000241', '00000000-0000-4000-8000-000000000002',
    'Casey', 'Pending', null, 'SL-0000002',
    'casey.pending@example.com', '+18135550102', 'Orlando',
    null, 'casey-pending', 'pending', true
  ),
  (
    '00000000-0000-4000-8000-000000000242', '00000000-0000-4000-8000-000000000006',
    'Robin', 'Private', 'Sample Realty', 'SL-0000003',
    'robin.private@example.com', null, 'Brandon',
    null, 'robin-private', 'approved', false
  );

select public.create_lead_with_receipt(
  jsonb_build_object(
    'intent','purchase','first_name','Dana','last_name','Reyes',
    'email_normalized','dana@example.com','phone_e164','+18135550147',
    'source_path','/mortgage/purchase','dedupe_hash','hash-1'),
  jsonb_build_object(
    'privacy_accepted',true,'contact_requested',true,'sms_marketing',false,
    'email_marketing',true,'disclosure_version','v1','disclosure_text_sha256','abc',
    'source_path','/mortgage/purchase','form_version','1'),
  jsonb_build_array(
    jsonb_build_object('touch_kind','first','landing_path','/','utm_source','google'),
    jsonb_build_object('touch_kind','last','landing_path','/mortgage/purchase','utm_source','google'),
    jsonb_build_object('touch_kind','conversion','landing_path','/mortgage/purchase')
  ),
  jsonb_build_object('event_type','lead.received','idempotency_key','k1','payload','{}'::jsonb),
  '00000000-0000-4000-8000-000000000110',
  jsonb_build_object(
    'source','mortgage_planner','version','mortgage-planner@1.0.0',
    'calculation_version','mortgage-math@1.0.0',
    'input_snapshot',jsonb_build_object('intent','buying'),
    'result_snapshot',jsonb_build_object('estimatedMonthlyDollars',3100),
    'summary','Buying in Tampa in three to six months.'
  )
);

-- The same browser submission id is an exact retry boundary. Even a malformed
-- replay payload returns the original receipt before any new child row is
-- considered; it cannot rewrite the original durable record.
select public.create_lead_with_receipt(
  '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb,
  '00000000-0000-4000-8000-000000000110', null
);
select tests.assert(
  (select count(*) from public.lead_submission_receipts
   where submission_id = '00000000-0000-4000-8000-000000000110') = 1,
  'exact lead retry creates one submission receipt');
select tests.assert(
  (select count(*) from public.leads l
   join public.consent_receipts c on c.lead_id = l.id
   join public.integration_outbox o on o.aggregate_id = l.id
   join public.lead_plans p on p.lead_id = l.id
   where l.dedupe_hash = 'hash-1') = 1,
  'exact lead retry creates one lead, consent, outbox event, and planning snapshot');
select tests.assert(
  (select count(*) from public.attribution_touches a
   join public.leads l on l.id = a.lead_id
   where l.dedupe_hash = 'hash-1') = 3,
  'exact lead retry preserves one first, last, and conversion attribution set');

-- A second lead, created through the planner path. This exercises the single
-- transaction that writes the lead, the consent receipt, the attribution touch,
-- the outbox event AND the planner answers together. It is deliberately a real
-- call rather than a direct insert, because the point of the function is that a
-- caller cannot write four of the five and skip the fifth.
--
-- The lead, consent, and outbox counts asserted further down include this row.
select public.create_lead_with_planner_response(
  jsonb_build_object(
    'intent','refinance','first_name','Sam','last_name','Ortiz',
    'email_normalized','sam@example.com','phone_e164','+18135550188',
    'source_path','/plan','dedupe_hash','hash-2'),
  jsonb_build_object(
    'privacy_accepted',true,'contact_requested',true,'sms_marketing',true,
    'email_marketing',false,'disclosure_version','v1','disclosure_text_sha256','def',
    'source_path','/plan','form_version','lead-planner@1.0.0'),
  jsonb_build_object('landing_path','/plan','utm_source','google'),
  jsonb_build_object('event_type','lead.received','idempotency_key','k2','payload','{}'::jsonb),
  jsonb_build_object(
    'goal','refinance','property_state','fl','property_location','Tampa',
    'property_type','single_family','property_stage','own_it','price_band','350k_500k',
    'down_payment_band','20_plus','current_mortgage_balance_band','250k_500k',
    'current_mortgage_rate_band','6_7','credit_band','720_759','employment','w2',
    'income_band','8k_12k','monthly_debt_band','under_500','timing','within_30_days',
    'planner_version','lead-planner@1.0.0'),
  '00000000-0000-4000-8000-000000000111'
);

select public.create_lead_with_planner_response(
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  jsonb_build_object(
    'goal','refinance','property_state','fl','property_location','Tampa',
    'property_type','single_family','property_stage','own_it','price_band','350k_500k',
    'down_payment_band','20_plus','current_mortgage_balance_band','250k_500k',
    'current_mortgage_rate_band','6_7','credit_band','720_759','employment','w2',
    'income_band','8k_12k','monthly_debt_band','under_500','timing','within_30_days',
    'planner_version','lead-planner@1.0.0'),
  '00000000-0000-4000-8000-000000000111'
);
select tests.assert(
  (select count(*) from public.lead_submission_receipts
   where submission_id = '00000000-0000-4000-8000-000000000111') = 1,
  'exact planner retry creates one submission receipt');
select tests.assert(
  (select count(*) from public.lead_planner_responses r
   join public.leads l on l.id = r.lead_id
   where l.dedupe_hash = 'hash-2') = 1,
  'exact planner retry creates one immutable answer set');

insert into public.vision_projects (id, owner_user_id, title, goal) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000002', 'My house', 'renovate'),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-000000000006', 'Agent project', 'flip');

insert into public.property_entities (id, city, state_code) values
  ('00000000-0000-4000-8000-0000000000b1', 'Tampa', 'FL');

insert into public.listing_records (property_id, provider, provider_record_key, standard_status, attribution_text, is_fixture, published)
values
  ('00000000-0000-4000-8000-0000000000b1', 'fixture', 'FX-1', 'active', 'Sample data.', true, false),
  ('00000000-0000-4000-8000-0000000000b1', 'stellar', 'ST-1', 'active', 'Courtesy of Example Brokerage.', false, true);

insert into public.content_items (id, content_type, slug, title, description, body_mdx, status, indexation)
values ('00000000-0000-4000-8000-0000000000c1', 'article', 'draft-post', 'Draft', 'A draft', '# draft', 'draft', 'noindex');

insert into public.content_sources (
  content_item_id, publisher, title, url, source_kind, accessed_at, is_primary
) values (
  '00000000-0000-4000-8000-0000000000c1',
  'Florida Office of Financial Regulation',
  'Mortgage Broker Resources',
  'https://flofr.gov/',
  'regulator',
  now(),
  true
);

insert into public.quota_policies (subject_kind, feature, period, request_limit, cost_limit_cents, concurrency_limit)
values ('consumer', 'vision_report', 'day', 3, 500, 1);

-- RendProp fixtures. Two projects owned by two different people, each with an
-- original clip, a processing job, a generated asset, and a tour. The pairing is
-- the point: every assertion below is about one of them being invisible to the
-- other, which an empty table would never have proved.
insert into public.rendprop_projects
  (id, owner_user_id, title, city, state_code, status, rights_confirmed_at,
   rights_confirmed_by, rights_statement_version, attribution_text)
values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000002',
   'Consumer walkthrough', 'Tampa', 'FL', 'review', now(),
   '00000000-0000-4000-8000-000000000002', 'rendprop-rights@1', 'Courtesy of the owner.'),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-000000000006',
   'Agent walkthrough', 'Tampa', 'FL', 'draft', now(),
   '00000000-0000-4000-8000-000000000006', 'rendprop-rights@1', 'Courtesy of Example Brokerage.');

insert into public.rendprop_media_assets
  (id, project_id, asset_kind, content_type, byte_size, storage_key, upload_status)
values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000e1',
   'walkthrough_video', 'video/quicktime', 182000000,
   'rendprop/00000000-0000-4000-8000-0000000000e1/originals/f1.mov', 'verified'),
  ('00000000-0000-4000-8000-0000000000f2', '00000000-0000-4000-8000-0000000000e2',
   'walkthrough_video', 'video/quicktime', 214000000,
   'rendprop/00000000-0000-4000-8000-0000000000e2/originals/f2.mov', 'verified');

insert into public.rendprop_processing_jobs
  (id, project_id, source_asset_id, transformation, state, idempotency_key, estimated_cost_cents)
values
  ('00000000-0000-4000-8000-0000000000f3', '00000000-0000-4000-8000-0000000000e1',
   '00000000-0000-4000-8000-0000000000f1', 'virtual_staging', 'queued', 'rendprop:e1:f1:vs:0', 45),
  ('00000000-0000-4000-8000-0000000000f4', '00000000-0000-4000-8000-0000000000e2',
   '00000000-0000-4000-8000-0000000000f2', 'clutter_cleanup', 'queued', 'rendprop:e2:f2:cc:0', 18);

insert into public.rendprop_generated_assets
  (id, project_id, job_id, source_asset_id, transformation, storage_key, content_type,
   disclosure_label, review_state, approved_by, approved_at)
values
  ('00000000-0000-4000-8000-0000000000f5', '00000000-0000-4000-8000-0000000000e1',
   '00000000-0000-4000-8000-0000000000f3', '00000000-0000-4000-8000-0000000000f1',
   'virtual_staging', 'rendprop/e1/generated/f5.jpg', 'image/jpeg',
   'Virtually staged — furnishings are digital and not included in the sale',
   'approved', '00000000-0000-4000-8000-000000000002', now()),
  ('00000000-0000-4000-8000-0000000000f6', '00000000-0000-4000-8000-0000000000e2',
   '00000000-0000-4000-8000-0000000000f4', '00000000-0000-4000-8000-0000000000f2',
   'clutter_cleanup', 'rendprop/e2/generated/f6.jpg', 'image/jpeg',
   'Digitally decluttered — movable items removed', 'pending', null, null);

insert into public.rendprop_tours
  (id, project_id, headline, status, public_token_hash, attribution_text,
   disclosure_version, published_at)
values
  ('00000000-0000-4000-8000-0000000000f7', '00000000-0000-4000-8000-0000000000e1',
   'Consumer tour', 'published', 'token-hash-e1', 'Courtesy of the owner.',
   'rendprop-disclosure@0.1.0', now()),
  ('00000000-0000-4000-8000-0000000000f8', '00000000-0000-4000-8000-0000000000e2',
   'Agent tour', 'draft', null, null, null, null);

insert into public.rendprop_tour_inquiries (id, tour_id, inquiry_kind, message, request_id)
values ('00000000-0000-4000-8000-0000000000f9', '00000000-0000-4000-8000-0000000000f7',
        'showing_request', 'Is Saturday possible?', gen_random_uuid());

-- One real audit row, so the append-only trigger has something to protect and
-- the reader policies are exercised against actual data rather than an empty set.
insert into public.audit_events (actor_kind, action, target_type, target_id, reason)
values ('service', 'lead.created', 'lead', 'seed', 'fixture');

/* ---------------------------------------------------------------- *
 * Anonymous
 * ---------------------------------------------------------------- */

set role anon;
select set_config('request.jwt.claim.sub', '', false);

-- The lead tables have every grant revoked from anon, so the failure mode is a
-- hard permission error rather than an empty result set. That is deliberate:
-- there is no path from the public role to a lead record at all.
select tests.assert_denied('select count(*) from public.leads',
  'anonymous has no grant on the lead table');
select tests.assert_denied(
  $$insert into public.leads (intent, first_name, last_name, email_normalized, phone_e164, source_path, dedupe_hash)
    values ('purchase','A','B','a@b.com','+18135550100','/x','h')$$,
  'anonymous cannot insert a lead directly');
select tests.assert_denied('select count(*) from public.consent_receipts',
  'anonymous has no grant on the consent ledger');
select tests.assert_denied('select count(*) from public.attribution_touches',
  'anonymous has no grant on attribution touches');
select tests.assert_denied('select count(*) from public.integration_outbox',
  'anonymous has no grant on the integration outbox');
select tests.assert_denied('select count(*) from public.lead_planner_responses',
  'anonymous has no grant on planner responses');
select tests.assert_denied(
  $$insert into public.lead_planner_responses
      (lead_id, goal, property_state, property_type, property_stage, price_band,
       down_payment_band, credit_band, employment, income_band, monthly_debt_band,
       timing, planner_version)
    values ('00000000-0000-4000-8000-0000000000d1','purchase','FL','condo','identified',
      'under_200k','3_5','unknown','w2','under_4k','none','researching','x')$$,
  'anonymous cannot insert a planner response directly');
select tests.assert_denied(
  $$select public.create_lead_with_planner_response('{}'::jsonb,'{}'::jsonb,'{}'::jsonb,
      '{}'::jsonb,'{}'::jsonb, gen_random_uuid())$$,
  'anonymous cannot call the planner lead function directly');
select tests.assert(tests.visible_count('select count(*) from public.audit_events') = 0,
  'anonymous sees no audit events');
select tests.assert(tests.visible_count('select count(*) from public.ai_jobs') = 0,
  'anonymous cannot read AI jobs');
select tests.assert(tests.visible_count('select count(*) from public.content_sources') = 0,
  'anonymous cannot read sources attached only to draft content');
select tests.assert(tests.visible_count('select count(*) from public.vision_projects') = 0,
  'anonymous cannot read Vision projects');
select tests.assert_denied('select count(*) from public.saved_searches',
  'anonymous has no grant on saved searches');

-- RendProp. Every grant is revoked from anon, so each of these is a hard
-- permission error rather than an empty result. A published tour does reach the
-- public, but only through rendprop_published_tour, called server-side — and
-- anon cannot execute that either.
select tests.assert_denied('select count(*) from public.rendprop_projects',
  'anonymous has no grant on RendProp projects');
select tests.assert_denied('select count(*) from public.rendprop_media_assets',
  'anonymous has no grant on RendProp original media');
select tests.assert_denied('select count(*) from public.rendprop_processing_jobs',
  'anonymous has no grant on the RendProp job queue');
select tests.assert_denied('select count(*) from public.rendprop_generated_assets',
  'anonymous has no grant on RendProp generated media');
select tests.assert_denied('select count(*) from public.rendprop_tours',
  'anonymous has no grant on RendProp tours, including published ones');
select tests.assert_denied('select count(*) from public.rendprop_tour_inquiries',
  'anonymous has no grant on RendProp tour inquiries');
select tests.assert_denied(
  $$insert into public.rendprop_projects (owner_user_id, title)
    values ('00000000-0000-4000-8000-000000000002','Injected')$$,
  'anonymous cannot create a RendProp project');
select tests.assert_denied(
  $$insert into public.rendprop_media_assets
      (project_id, asset_kind, content_type, byte_size, storage_key)
    values ('00000000-0000-4000-8000-0000000000e1','still_photo','image/jpeg',10,'x')$$,
  'anonymous cannot upload media into somebody else''s project');
select tests.assert_denied(
  $$select public.rendprop_published_tour('token-hash-e1')$$,
  'anonymous cannot call the published tour function directly');
select tests.assert_denied(
  $$select public.rendprop_enqueue_job('00000000-0000-4000-8000-0000000000e1',
      '00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-0000000000f1',
      'virtual_staging','{}'::jsonb, 45, 'anon-key', 4)$$,
  'anonymous cannot enqueue RendProp work');
select tests.assert_denied(
  $$select public.rendprop_claim_job('worker','agent',300,60)$$,
  'anonymous cannot claim a RendProp job and reserve spend');
select tests.assert_denied(
  $$select public.rendprop_settle_job('00000000-0000-4000-8000-0000000000f3',
      'succeeded', 0, null, null, null, null)$$,
  'anonymous cannot settle a RendProp job');

-- Agent directory: approval and display consent are both required before a row
-- reaches the public, and the anonymous key can never write the table at all.
select tests.assert(tests.visible_count('select count(*) from public.agents') = 1,
  'anonymous sees only the approved and consenting agent');
select tests.assert(
  tests.visible_count($$select count(*) from public.agents where status = 'pending'$$) = 0,
  'anonymous never sees a pending agent');
select tests.assert(
  tests.visible_count($$select count(*) from public.agents where not display_consent$$) = 0,
  'anonymous never sees an agent who did not consent to display');
select tests.assert_denied(
  $$insert into public.agents (first_name, last_name, license_number, email_normalized, slug)
    values ('Injected', 'Agent', 'SL-9999999', 'injected@example.com', 'injected-agent')$$,
  'anonymous cannot insert an agent row');
select tests.assert_denied(
  $$update public.agents set cities = 'Everywhere'
    where id = '00000000-0000-4000-8000-000000000240'$$,
  'anonymous cannot update an agent row');
select tests.assert_denied(
  $$delete from public.agents where id = '00000000-0000-4000-8000-000000000240'$$,
  'anonymous cannot delete an agent row');

-- Public listing visibility: the published, non-fixture record only.
select tests.assert(tests.visible_count('select count(*) from public.listing_records') = 1,
  'anonymous sees exactly the published non-fixture listing');
select tests.assert(
  tests.visible_count($$select count(*) from public.listing_records where is_fixture$$) = 0,
  'anonymous never sees fixture listings');

reset role;

/* ---------------------------------------------------------------- *
 * Consumer
 * ---------------------------------------------------------------- */

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false);

select tests.assert(tests.visible_count('select count(*) from public.vision_projects') = 1,
  'consumer sees only their own Vision project');
select tests.assert(tests.visible_count('select count(*) from public.vision_report_requests') = 0,
  'consumer cannot read anonymous Vision report requests');
select tests.assert(
  tests.visible_count($$select count(*) from public.vision_projects
    where id = '00000000-0000-4000-8000-0000000000a2'$$) = 0,
  'consumer cannot see another user''s Vision project');
select tests.assert(tests.visible_count('select count(*) from public.leads') = 0,
  'consumer cannot read the lead table');
select tests.assert(tests.visible_count('select count(*) from public.consent_receipts') = 0,
  'consumer cannot read the consent ledger');
select tests.assert(tests.visible_count('select count(*) from public.lead_plans') = 0,
  'consumer cannot read lead planning snapshots');
select tests.assert(tests.visible_count('select count(*) from public.usage_ledger') = 0,
  'consumer cannot read the usage ledger');
select tests.assert(tests.visible_count('select count(*) from public.saved_properties') = 1,
  'consumer sees only their own saved property');
select tests.assert(
  tests.visible_count('select count(*) from public.saved_calculator_scenarios') = 1,
  'consumer sees only their own saved calculator scenario');
select tests.assert(tests.visible_count('select count(*) from public.notification_preferences') = 1,
  'consumer sees their own notification preferences');
select tests.assert(tests.visible_count('select count(*) from public.saved_searches') = 1,
  'consumer sees only their own saved search');

insert into public.saved_properties (owner_user_id, listing_key, source_mode)
values ('00000000-0000-4000-8000-000000000002', 'FX-OWN-WRITE', 'fixture');
insert into public.saved_calculator_scenarios (
  id, owner_user_id, source, version, calculation_version,
  input_snapshot, result_snapshot, summary
) values (
  '00000000-0000-4000-8000-000000000212',
  '00000000-0000-4000-8000-000000000002',
  'closing_cost','closing@1','mortgage-math@1','{}','{}','Own write fixture.'
);
update public.notification_preferences
set report_ready_email = false
where owner_user_id = '00000000-0000-4000-8000-000000000002';
insert into public.saved_searches (id, owner_user_id, search_params, summary)
values (
  '00000000-0000-4000-8000-000000000232',
  '00000000-0000-4000-8000-000000000002',
  'maxPrice=500000', 'Listings under $500,000'
);
select tests.assert(tests.visible_count('select count(*) from public.saved_properties') = 2,
  'consumer can create an owned saved property');
select tests.assert(tests.visible_count('select count(*) from public.saved_searches') = 2,
  'consumer can create an owned saved search');
select tests.assert(
  tests.visible_count('select count(*) from public.saved_calculator_scenarios') = 2,
  'consumer can create an owned saved calculator scenario');
select tests.assert(
  tests.visible_count($$select count(*) from public.notification_preferences
    where report_ready_email = false$$) = 1,
  'consumer can update their own notification preferences');

select * from public.create_privacy_request(
  '00000000-0000-4000-8000-000000000220', 'export');
select * from public.create_privacy_request(
  '00000000-0000-4000-8000-000000000220', 'delete');
select tests.assert(tests.visible_count('select count(*) from public.privacy_requests') = 1,
  'exact privacy-request retry creates one request');
select tests.assert(
  tests.visible_count($$select count(*) from public.privacy_requests
    where request_type = 'export' and status = 'received'$$) = 1,
  'exact privacy-request retry returns the original received request');

select tests.assert_denied(
  $$insert into public.saved_properties (owner_user_id, listing_key, source_mode)
    values ('00000000-0000-4000-8000-000000000006','FX-HOSTILE-1','fixture')$$,
  'consumer cannot save a property for another user');
select tests.assert_denied(
  $$insert into public.saved_calculator_scenarios (
      id, owner_user_id, source, version, calculation_version,
      input_snapshot, result_snapshot, summary
    ) values (
      gen_random_uuid(),'00000000-0000-4000-8000-000000000006',
      'closing_cost','hostile@1','mortgage-math@1','{}','{}','Hostile write.'
    )$$,
  'consumer cannot save a calculator scenario for another user');
select tests.assert_denied(
  $$insert into public.notification_preferences (owner_user_id)
    values ('00000000-0000-4000-8000-000000000006')$$,
  'consumer cannot create notification preferences for another user');
select tests.assert_denied(
  $$insert into public.saved_searches (id, owner_user_id, search_params, summary)
    values (gen_random_uuid(),'00000000-0000-4000-8000-000000000006','q=Hostile','Hostile write.')$$,
  'consumer cannot save a search for another user');
select tests.assert_affects_no_rows(
  $$delete from public.saved_searches
    where id = '00000000-0000-4000-8000-000000000231'$$,
  'consumer cannot delete another user''s saved search');
select tests.assert_affects_no_rows(
  $$update public.privacy_requests set status = 'completed', completed_at = now()$$,
  'consumer cannot mark their privacy request completed');

-- Privilege escalation attempt.
select tests.assert_denied(
  $$insert into public.user_roles (user_id, role)
    values ('00000000-0000-4000-8000-000000000002','admin')$$,
  'consumer cannot grant themselves the admin role');
select tests.assert(
  tests.visible_count($$select count(*) from public.user_roles
    where user_id <> '00000000-0000-4000-8000-000000000002'$$) = 0,
  'consumer cannot enumerate other users'' roles');

-- Suspending yourself out of existence, or editing someone else, must fail.
select tests.assert_denied(
  $$update public.profiles set status = 'suspended'
    where id = '00000000-0000-4000-8000-000000000002'$$,
  'consumer cannot change their own account status');

select tests.assert_denied(
  $$select public.reserve_ai_budget('vision_report','consumer',
      '00000000-0000-4000-8000-000000000002', null, 100, 'report', '{}'::jsonb, 'k')$$,
  'consumer cannot call the budget reservation function directly');

select tests.assert_denied(
  $$select public.create_lead_with_receipt('{}'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb, gen_random_uuid())$$,
  'consumer cannot call the lead creation function directly');
select tests.assert_denied(
  $$select public.create_vision_report_request(
      gen_random_uuid(),'{}'::jsonb,'{}'::jsonb,'[]'::jsonb,'{}'::jsonb,
      '{}'::jsonb,'{}'::jsonb,'{}'::jsonb)$$,
  'consumer cannot call the Vision report creation function directly');
select tests.assert_denied(
  $$select public.claim_integration_outbox('hostile-worker', 25)$$,
  'consumer cannot claim integration outbox work');
select tests.assert_denied(
  $$select public.complete_integration_outbox(
      gen_random_uuid(),'hostile-worker','succeeded',null,0,'x')$$,
  'consumer cannot complete integration outbox work');

select tests.assert(tests.visible_count('select count(*) from public.lead_planner_responses') = 0,
  'consumer cannot read planner responses');
select tests.assert_denied(
  $$select public.create_lead_with_planner_response('{}'::jsonb,'{}'::jsonb,'{}'::jsonb,
      '{}'::jsonb,'{}'::jsonb, gen_random_uuid())$$,
  'consumer cannot call the planner lead function directly');
select tests.assert_denied(
  $$insert into public.lead_planner_responses
      (lead_id, goal, property_state, property_type, property_stage, price_band,
       down_payment_band, credit_band, employment, income_band, monthly_debt_band,
       timing, planner_version)
    values ('00000000-0000-4000-8000-0000000000d1','purchase','FL','condo','identified',
      'under_200k','3_5','unknown','w2','under_4k','none','researching','x')$$,
  'consumer cannot attach a planner response to a lead');

-- RendProp, as the owner. Everything they can see is theirs and nothing else is.
select tests.assert(tests.visible_count('select count(*) from public.rendprop_projects') = 1,
  'owner sees only their own RendProp project');
select tests.assert(
  tests.visible_count($$select count(*) from public.rendprop_projects
    where id = '00000000-0000-4000-8000-0000000000e2'$$) = 0,
  'owner cannot see another user''s RendProp project');
select tests.assert(tests.visible_count('select count(*) from public.rendprop_media_assets') = 1,
  'owner sees only their own original media');
select tests.assert(
  tests.visible_count('select count(*) from public.rendprop_processing_jobs') = 1,
  'owner sees only their own processing jobs');
select tests.assert(
  tests.visible_count('select count(*) from public.rendprop_generated_assets') = 1,
  'owner sees only their own generated media');
select tests.assert(tests.visible_count('select count(*) from public.rendprop_tours') = 1,
  'owner sees only their own tours');
select tests.assert(
  tests.visible_count('select count(*) from public.rendprop_tour_inquiries') = 1,
  'owner sees inquiries against their own tour');

-- Approving is allowed. Relabelling is not, and the guard is a trigger rather
-- than a policy, so it holds for every role including the table owner.
select tests.assert_denied(
  $$update public.rendprop_generated_assets
    set disclosure_label = 'Photograph'
    where id = '00000000-0000-4000-8000-0000000000f5'$$,
  'owner cannot relabel their own AI-generated image as a photograph');
select tests.assert_denied(
  $$update public.rendprop_generated_assets set ai_generated = false
    where id = '00000000-0000-4000-8000-0000000000f5'$$,
  'owner cannot clear the AI-generated flag on their own asset');
select tests.assert_denied(
  $$update public.rendprop_generated_assets
    set source_asset_id = '00000000-0000-4000-8000-0000000000f2'
    where id = '00000000-0000-4000-8000-0000000000f5'$$,
  'owner cannot rewrite the lineage of a generated asset');

select tests.assert_affects_no_rows(
  $$update public.rendprop_projects set status = 'archived'
    where id = '00000000-0000-4000-8000-0000000000e2'$$,
  'owner cannot modify another user''s RendProp project');
select tests.assert_denied(
  $$insert into public.rendprop_media_assets
      (project_id, asset_kind, content_type, byte_size, storage_key)
    values ('00000000-0000-4000-8000-0000000000e2','still_photo','image/jpeg',10,'intrusion')$$,
  'owner cannot upload media into another user''s project');

select tests.assert_denied(
  $$select public.rendprop_enqueue_job('00000000-0000-4000-8000-0000000000e1',
      '00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-0000000000f1',
      'virtual_staging','{}'::jsonb, 45, 'consumer-key', 4)$$,
  'owner cannot enqueue RendProp work by calling the function directly');
select tests.assert_denied(
  $$select public.rendprop_claim_job('worker','consumer',300,60)$$,
  'owner cannot claim a job and reserve spend');
select tests.assert_denied(
  $$select public.rendprop_settle_job('00000000-0000-4000-8000-0000000000f3',
      'succeeded', 0, null, null, null, null)$$,
  'owner cannot settle a job and move the ledger');
select tests.assert_denied(
  $$select public.rendprop_published_tour('token-hash-e1')$$,
  'owner cannot call the published tour function directly');

-- Agent directory, as the owner of a pending row: they see the public row and
-- their own unpublished one, may edit their profile fields on their own row
-- only, and cannot reach the moderation columns at all.
select tests.assert(tests.visible_count('select count(*) from public.agents') = 2,
  'agent row owner sees the public directory plus their own pending row');
select tests.assert(
  tests.visible_count($$select count(*) from public.agents
    where id = '00000000-0000-4000-8000-000000000241'$$) = 1,
  'agent row owner sees their own pending row');
update public.agents set cities = 'Orlando, Winter Park'
  where id = '00000000-0000-4000-8000-000000000241';
select tests.assert(
  tests.visible_count($$select count(*) from public.agents
    where id = '00000000-0000-4000-8000-000000000241'
      and cities = 'Orlando, Winter Park'$$) = 1,
  'agent row owner can update their own profile fields');
select tests.assert_affects_no_rows(
  $$update public.agents set cities = 'Hijacked'
    where id = '00000000-0000-4000-8000-000000000242'$$,
  'cross-agent update is blocked: another owner''s row is untouchable');
select tests.assert_affects_no_rows(
  $$update public.agents set cities = 'Hijacked'
    where id = '00000000-0000-4000-8000-000000000240'$$,
  'an unowned directory row is not writable just because it is visible');
select tests.assert_denied(
  $$update public.agents set status = 'approved'
    where id = '00000000-0000-4000-8000-000000000241'$$,
  'agent row owner cannot approve their own row');
select tests.assert_denied(
  $$update public.agents set license_verified = true
    where id = '00000000-0000-4000-8000-000000000241'$$,
  'agent row owner cannot mark their own license verified');
select tests.assert_denied(
  $$update public.agents set license_number = 'SL-7777777'
    where id = '00000000-0000-4000-8000-000000000241'$$,
  'agent row owner cannot rewrite their license number through the browser key');
select tests.assert_denied(
  $$insert into public.agents (first_name, last_name, license_number, email_normalized, slug)
    values ('Self', 'Service', 'SL-8888888', 'self.service@example.com', 'self-service')$$,
  'authenticated users cannot insert agent rows directly');
select tests.assert_denied(
  $$delete from public.agents where id = '00000000-0000-4000-8000-000000000241'$$,
  'agent row owner cannot delete their directory row directly');

reset role;

/* ---------------------------------------------------------------- *
 * Agent
 * ---------------------------------------------------------------- */

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000006', false);

select tests.assert(tests.visible_count('select count(*) from public.leads') = 0,
  'agent cannot read unrelated leads');
select tests.assert(tests.visible_count('select count(*) from public.vision_projects') = 1,
  'agent sees only their own Vision project');
select tests.assert(tests.visible_count('select count(*) from public.saved_properties') = 1,
  'agent sees only their own saved property');
select tests.assert(
  tests.visible_count('select count(*) from public.saved_calculator_scenarios') = 1,
  'agent sees only their own saved calculator scenario');
select tests.assert(tests.visible_count('select count(*) from public.saved_searches') = 1,
  'agent sees only their own saved search');
select tests.assert(tests.visible_count('select count(*) from public.privacy_requests') = 0,
  'agent cannot see another user privacy request');
-- This account owns the approved-but-non-consenting directory row: visible to
-- them as owner, and to nobody else through the public policy.
select tests.assert(tests.visible_count('select count(*) from public.agents') = 2,
  'directory row owner sees the public row plus their own non-consenting row');
select tests.assert(
  tests.visible_count($$select count(*) from public.agents
    where id = '00000000-0000-4000-8000-000000000242'$$) = 1,
  'an approved agent who withheld display consent still sees their own row');

-- A DIFFERENT consumer. This account owns its own RendProp project, so a naive
-- policy would pass a "sees exactly one row" test while leaking the other one.
-- Every assertion here is scoped to the first owner's rows specifically.
select tests.assert(
  tests.visible_count($$select count(*) from public.rendprop_projects
    where id = '00000000-0000-4000-8000-0000000000e1'$$) = 0,
  'a different consumer cannot see the owner''s RendProp project');
select tests.assert(
  tests.visible_count($$select count(*) from public.rendprop_media_assets
    where project_id = '00000000-0000-4000-8000-0000000000e1'$$) = 0,
  'a different consumer cannot see the owner''s original media');
select tests.assert(
  tests.visible_count($$select count(*) from public.rendprop_processing_jobs
    where project_id = '00000000-0000-4000-8000-0000000000e1'$$) = 0,
  'a different consumer cannot see the owner''s processing jobs');
select tests.assert(
  tests.visible_count($$select count(*) from public.rendprop_generated_assets
    where project_id = '00000000-0000-4000-8000-0000000000e1'$$) = 0,
  'a different consumer cannot see the owner''s generated media');
select tests.assert(
  tests.visible_count($$select count(*) from public.rendprop_tours
    where project_id = '00000000-0000-4000-8000-0000000000e1'$$) = 0,
  'a different consumer cannot see the owner''s published tour row');
select tests.assert(
  tests.visible_count($$select count(*) from public.rendprop_tour_inquiries
    where tour_id = '00000000-0000-4000-8000-0000000000f7'$$) = 0,
  'a different consumer cannot see inquiries against the owner''s tour');
select tests.assert_affects_no_rows(
  $$update public.rendprop_tours set status = 'unpublished'
    where id = '00000000-0000-4000-8000-0000000000f7'$$,
  'a different consumer cannot withdraw the owner''s tour');
select tests.assert_affects_no_rows(
  $$update public.rendprop_generated_assets set review_state = 'approved'
    where id = '00000000-0000-4000-8000-0000000000f5'$$,
  'a different consumer cannot approve the owner''s generated media');
select tests.assert_affects_no_rows(
  $$delete from public.rendprop_media_assets
    where project_id = '00000000-0000-4000-8000-0000000000e1'$$,
  'a different consumer cannot delete the owner''s originals');
select tests.assert(
  tests.visible_count('select count(*) from public.rendprop_projects') = 1,
  'a different consumer still sees exactly their own project');

reset role;

/* ---------------------------------------------------------------- *
 * Loan officer
 * ---------------------------------------------------------------- */

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', false);

-- Two leads exist: the contact-form fixture and the planner fixture.
select tests.assert(tests.visible_count('select count(*) from public.leads') = 2,
  'loan officer can read leads');
select tests.assert(tests.visible_count('select count(*) from public.lead_planner_responses') = 1,
  'loan officer can read the planner answers a lead arrived with');
select tests.assert(tests.visible_count('select count(*) from public.agents') = 3,
  'loan officer reviews the whole agent directory, pending rows included');
select tests.assert_affects_no_rows(
  $$update public.lead_planner_responses set goal = 'purchase'$$,
  'loan officer cannot rewrite what the consumer answered');
select tests.assert(tests.visible_count('select count(*) from public.consent_receipts') = 0,
  'loan officer cannot read the consent ledger');
select tests.assert(tests.visible_count('select count(*) from public.lead_plans') = 0,
  'loan officer cannot read an unassigned planning snapshot');
select tests.assert(tests.visible_count('select count(*) from public.audit_events') = 0,
  'loan officer cannot read the audit log');

-- Staff is not one thing. RendProp media is operations and admin only; a loan
-- officer has no reason to be looking inside somebody's house.
select tests.assert(tests.visible_count('select count(*) from public.rendprop_projects') = 0,
  'loan officer is not a RendProp staff role and reads no projects');
select tests.assert(tests.visible_count('select count(*) from public.rendprop_media_assets') = 0,
  'loan officer reads no RendProp original media');
select tests.assert(
  tests.visible_count('select count(*) from public.rendprop_generated_assets') = 0,
  'loan officer reads no RendProp generated media');

reset role;

/* ---------------------------------------------------------------- *
 * Operations
 * ---------------------------------------------------------------- */

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000007', false);

select tests.assert(tests.visible_count('select count(*) from public.privacy_requests') = 1,
  'operations can read privacy request lifecycle');
select tests.assert(tests.visible_count('select count(*) from public.audit_events') = 0,
  'operations cannot read compliance audit history');

reset role;

/* ---------------------------------------------------------------- *
 * Compliance reviewer
 * ---------------------------------------------------------------- */

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000005', false);

select tests.assert(tests.visible_count('select count(*) from public.consent_receipts') = 2,
  'compliance reviewer can read the consent ledger');
-- Consent review is a consent question. The planner answers are lead-working
-- context and are deliberately outside this role's reach.
select tests.assert(tests.visible_count('select count(*) from public.lead_planner_responses') = 0,
  'compliance reviewer cannot read planner answers');
select tests.assert_affects_no_rows(
  $$delete from public.lead_planner_responses$$,
  'compliance reviewer cannot delete planner answers');
select tests.assert(tests.visible_count('select count(*) from public.audit_events') = 1,
  'compliance reviewer can read the audit log');
select tests.assert(tests.visible_count('select count(*) from public.content_sources') = 1,
  'compliance reviewer can inspect source completeness');
select tests.assert(tests.visible_count('select count(*) from public.privacy_requests') = 1,
  'compliance reviewer can read privacy request lifecycle');
select tests.assert_affects_no_rows(
  $$update public.quota_policies set enabled = false$$,
  'compliance reviewer cannot change quota policy');
select tests.assert_affects_no_rows(
  $$update public.kill_switches set engaged = true where key = 'global'$$,
  'compliance reviewer cannot engage a kill switch');
select tests.assert_affects_no_rows(
  $$update public.leads set status = 'closed'$$,
  'compliance reviewer cannot alter lead records');

reset role;

/* ---------------------------------------------------------------- *
 * Content editor
 * ---------------------------------------------------------------- */

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', false);

select tests.assert(tests.visible_count('select count(*) from public.content_items') = 1,
  'content editor can read drafts');
select tests.assert(tests.visible_count('select count(*) from public.content_sources') = 1,
  'content editor can inspect sources attached to drafts');

-- The indexable_requires_review constraint is the real gate: an editor cannot
-- flip a draft to index without a published status, an author, and a reviewer.
select tests.assert_denied(
  $$update public.content_items set indexation = 'index'
    where id = '00000000-0000-4000-8000-0000000000c1'$$,
  'content editor cannot index a draft without author, reviewer, and review date');

reset role;

/* ---------------------------------------------------------------- *
 * Admin
 * ---------------------------------------------------------------- */

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false);

select tests.assert(tests.visible_count('select count(*) from public.leads') = 2,
  'admin can read leads');
select tests.assert(tests.visible_count('select count(*) from public.integration_outbox') = 2,
  'admin can read the outbox');
select tests.assert(tests.visible_count('select count(*) from public.lead_planner_responses') = 1,
  'admin can read planner answers');
select tests.assert(
  tests.visible_count($$select count(*) from public.lead_planner_responses r
    join public.leads l on l.id = r.lead_id where l.intent = 'refinance'$$) = 1,
  'admin can join a planner response to the lead it belongs to');

-- RendProp, as staff. An admin can see every project for support and abuse
-- review, and still cannot rewrite a disclosure.
select tests.assert(tests.visible_count('select count(*) from public.rendprop_projects') = 2,
  'admin can read every RendProp project');
select tests.assert(tests.visible_count('select count(*) from public.rendprop_media_assets') = 2,
  'admin can read every RendProp original');
select tests.assert(
  tests.visible_count('select count(*) from public.rendprop_processing_jobs') = 2,
  'admin can read the whole RendProp job queue');
select tests.assert(
  tests.visible_count('select count(*) from public.rendprop_generated_assets') = 2,
  'admin can read every RendProp generated asset');
select tests.assert(tests.visible_count('select count(*) from public.rendprop_tours') = 2,
  'admin can read every RendProp tour');
select tests.assert(
  tests.visible_count('select count(*) from public.rendprop_tour_inquiries') = 1,
  'admin can read RendProp tour inquiries');
-- Staff read RendProp media for support and abuse review. There is no staff
-- write policy at all, so the relabelling attempt matches no row before the
-- immutability trigger even gets a chance to refuse it.
select tests.assert_affects_no_rows(
  $$update public.rendprop_generated_assets set disclosure_label = 'Photograph'
    where id = '00000000-0000-4000-8000-0000000000f5'$$,
  'admin cannot relabel an AI-generated image as a photograph either');
select tests.assert_affects_no_rows(
  $$update public.rendprop_projects set title = 'Renamed by staff'
    where id = '00000000-0000-4000-8000-0000000000e1'$$,
  'admin can read a RendProp project but cannot edit somebody''s listing');
select tests.assert_denied(
  $$select public.rendprop_claim_job('worker','agent',300,60)$$,
  'admin cannot claim a job and reserve spend from a client session');

-- Audit history is append-only for everyone, including an admin.
select tests.assert_denied(
  $$insert into public.audit_events (actor_kind, action, target_type)
    values ('user','tamper','lead')$$,
  'admin cannot insert audit events through an ordinary statement');

reset role;

/* ---------------------------------------------------------------- *
 * Structural guarantees
 * ---------------------------------------------------------------- */

select tests.assert_denied(
  $$update public.audit_events set action = 'rewritten'$$,
  'audit events cannot be updated even by the table owner');

select tests.assert_denied(
  $$insert into public.listing_records (provider, provider_record_key, standard_status, attribution_text, is_fixture, published)
    values ('fixture','FX-2','active','Sample.', true, true)$$,
  'a fixture listing can never be marked published');

select tests.assert_denied(
  $$insert into public.usage_ledger (feature, entry_kind, amount_cents)
    values ('vision_report','adjustment', 100)$$,
  'a usage adjustment without a reason is rejected');

-- One transaction wrote the lead, its consent receipt, its attribution touch,
-- its outbox event, and its planner answers. Invariant 3: there is no success
-- without the durable write, and no partial receipt.
select tests.assert(
  (select count(*) from public.lead_planner_responses r
   join public.leads l on l.id = r.lead_id
   join public.consent_receipts c on c.lead_id = l.id
   join public.attribution_touches a on a.lead_id = l.id
   join public.integration_outbox o on o.aggregate_id = l.id
   where l.dedupe_hash = 'hash-2') = 1,
  'the planner write lands the lead, consent, attribution, outbox, and answers together');

select tests.assert(
  (select relrowsecurity from pg_class where oid = 'public.lead_planner_responses'::regclass),
  'row level security is enabled on the planner table');

-- Invariant 5. EXECUTE is granted to PUBLIC by default, so this is the check
-- that a revoke from anon and authenticated alone would not have satisfied.
select tests.assert(
  not has_function_privilege('public',
    'public.create_lead_with_planner_response(jsonb,jsonb,jsonb,jsonb,jsonb,uuid)', 'execute'),
  'PUBLIC holds no execute grant on the planner lead function');

select tests.assert(
  (select count(*) from pg_constraint
   where conrelid = 'public.lead_planner_responses'::regclass and contype = 'u') >= 1,
  'a lead can carry at most one planner response');

-- Invariant 2, asserted against the schema itself: this is a marketing form, so
-- the table cannot grow a column that belongs to an application.
select tests.assert(
  (select count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'lead_planner_responses'
     and column_name ~ '(ssn|social_security|date_of_birth|birth|account_number|credit_score|document|upload|pay_stub|tax_return)') = 0,
  'the planner table carries no application-grade identifier column');

select tests.assert_denied(
  $$insert into public.lead_planner_responses
      (lead_id, goal, property_state, property_type, property_stage, price_band,
       down_payment_band, current_mortgage_balance_band, credit_band, employment,
       income_band, monthly_debt_band, timing, planner_version)
    select id,'purchase','FL','condo','identified','under_200k','3_5','100k_250k',
      'unknown','w2','under_4k','none','researching','x'
    from public.leads limit 1$$,
  'a current mortgage balance cannot be recorded against a purchase');

select tests.assert_denied(
  $$insert into public.lead_planner_responses
      (lead_id, goal, property_state, property_type, property_stage, price_band,
       down_payment_band, credit_band, employment, income_band, monthly_debt_band,
       timing, planner_version)
    select id,'purchase','FL','condo','identified','under_200k','3_5','excellent',
      'w2','under_4k','none','researching','x'
    from public.leads limit 1$$,
  'a credit band outside the self-reported set is rejected');

/* ---------------------------------------------------------------- *
 * RendProp structural guarantees
 * ---------------------------------------------------------------- */

select tests.assert(
  (select count(*) from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relrowsecurity
     and c.relname in ('rendprop_projects','rendprop_media_assets','rendprop_processing_jobs',
       'rendprop_generated_assets','rendprop_tours','rendprop_tour_inquiries')) = 6,
  'row level security is enabled on all six RendProp tables');

-- Invariant 5, for every function this migration added. EXECUTE is granted to
-- PUBLIC by default, so revoking from anon and authenticated alone would have
-- left all four of these reachable.
select tests.assert(
  not has_function_privilege('public',
    'public.rendprop_enqueue_job(uuid,uuid,uuid,text,jsonb,integer,text,integer)', 'execute'),
  'PUBLIC holds no execute grant on the RendProp enqueue function');
select tests.assert(
  not has_function_privilege('public',
    'public.rendprop_claim_job(text,text,integer,integer)', 'execute'),
  'PUBLIC holds no execute grant on the RendProp claim-and-reserve function');
select tests.assert(
  not has_function_privilege('public',
    'public.rendprop_settle_job(uuid,text,integer,text,text,text,timestamptz)', 'execute'),
  'PUBLIC holds no execute grant on the RendProp settlement function');
select tests.assert(
  not has_function_privilege('public', 'public.rendprop_published_tour(text)', 'execute'),
  'PUBLIC holds no execute grant on the published tour function');
select tests.assert(
  not has_function_privilege('public', 'public.rendprop_freeze_disclosure()', 'execute'),
  'PUBLIC holds no execute grant on the disclosure-freezing trigger function');

-- The disclosure is a database-level guarantee, not a UI convention.
select tests.assert_rejected(
  $$insert into public.rendprop_generated_assets
      (project_id, source_asset_id, transformation, storage_key, content_type, disclosure_label)
    values ('00000000-0000-4000-8000-0000000000e1','00000000-0000-4000-8000-0000000000f1',
      'virtual_staging','rendprop/e1/generated/unlabelled.jpg','image/jpeg','   ')$$,
  'an AI-generated asset cannot be stored without a visible disclosure label');
select tests.assert_rejected(
  $$update public.rendprop_generated_assets set disclosure_label = 'Original photograph'
    where id = '00000000-0000-4000-8000-0000000000f5'$$,
  'a disclosure label cannot be rewritten even by the table owner');
select tests.assert_rejected(
  $$update public.rendprop_generated_assets set lineage = '[{"forged": true}]'::jsonb
    where id = '00000000-0000-4000-8000-0000000000f5'$$,
  'the lineage of a generated asset cannot be rewritten even by the table owner');

-- An original is preserved. A derivative that claims to be a view of it cannot
-- be left pointing at nothing.
select tests.assert_rejected(
  $$delete from public.rendprop_media_assets
    where id = '00000000-0000-4000-8000-0000000000f1'$$,
  'an original cannot be deleted while a generated asset still cites it');

-- Publication is all-or-nothing: no token, no attribution, no disclosure
-- version means no published tour.
select tests.assert_rejected(
  $$update public.rendprop_tours set status = 'published'
    where id = '00000000-0000-4000-8000-0000000000f8'$$,
  'a tour cannot be published without a share token, attribution, and a disclosure version');

-- Upload policy, enforced where it counts rather than only in the browser.
select tests.assert_rejected(
  $$insert into public.rendprop_media_assets
      (project_id, asset_kind, content_type, byte_size, storage_key)
    values ('00000000-0000-4000-8000-0000000000e1','still_photo','image/svg+xml',10,'k-svg')$$,
  'a content type outside the allowlist is rejected at the database');
select tests.assert_rejected(
  $$insert into public.rendprop_media_assets
      (project_id, asset_kind, content_type, byte_size, storage_key)
    values ('00000000-0000-4000-8000-0000000000e1','walkthrough_video','video/mp4',
      2147483648,'k-huge')$$,
  'an asset larger than the per-file ceiling is rejected at the database');

-- Idempotency is a uniqueness guarantee, so a retried enqueue cannot buy the
-- same output twice.
select tests.assert_rejected(
  $$insert into public.rendprop_processing_jobs
      (project_id, source_asset_id, transformation, idempotency_key)
    values ('00000000-0000-4000-8000-0000000000e1','00000000-0000-4000-8000-0000000000f1',
      'virtual_staging','rendprop:e1:f1:vs:0')$$,
  'a duplicate idempotency key cannot create a second processing job');

-- Invariant 2, asserted against the schema: a tour inquiry is a marketing
-- enquiry and must never grow into an application.
select tests.assert(
  (select count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'rendprop_tour_inquiries'
     and column_name ~ '(ssn|social_security|date_of_birth|birth|account_number|credit_score|document|upload|pay_stub|tax_return)') = 0,
  'the tour inquiry table carries no application-grade identifier column');

/* ---------------------------------------------------------------- *
 * Anonymous Vision report transaction and exact retry
 * ---------------------------------------------------------------- */

set role service_role;

select public.create_vision_report_request(
  '00000000-0000-4000-8000-000000000310',
  jsonb_build_object(
    'first_name','Robin','last_name','Patel','email_normalized','robin@example.com',
    'phone_e164','+18135550199','state_code','FL','message','Deterministic scenario summary.',
    'source_path','/vision/start','dedupe_hash','vision-hash-1'),
  jsonb_build_object(
    'privacy_accepted',true,'contact_requested',true,'sms_marketing',false,
    'email_marketing',true,'disclosure_version','vision-v1','disclosure_text_sha256','vision-hash',
    'source_path','/vision/start','form_version','vision-report-request@1.0.0'),
  jsonb_build_array(
    jsonb_build_object('touch_kind','first','landing_path','/vision'),
    jsonb_build_object('touch_kind','last','landing_path','/vision/start'),
    jsonb_build_object('touch_kind','conversion','landing_path','/vision/start')
  ),
  jsonb_build_object(
    'title','The corner house','goal','renovate','data_as_of',now(),
    'assumptions',jsonb_build_object(
      'contingencyRateBasisPoints',jsonb_build_object(
        'value',1500,'unit','basis_points','source','user'),
      'sellingCostRateBasisPoints',jsonb_build_object(
        'value',700,'unit','basis_points','source','company_default')
    )
  ),
  jsonb_build_object(
    'scenario_name','The corner house','scenario_type','existing_home_renovation',
    'input_snapshot',jsonb_build_object('purchasePriceCents',38900000),
    'result_snapshot',jsonb_build_object('producedBy','deterministic_model'),
    'calculation_version','vision-model@1.0.0'),
  jsonb_build_object(
    'facts_snapshot',jsonb_build_object('sourceKind','visitor_input'),
    'assumptions_snapshot',jsonb_build_array(),
    'calculations_snapshot',jsonb_build_object('producedBy','deterministic_model'),
    'narrative_snapshot',jsonb_build_object('generatedByAi',false),
    'limitations',jsonb_build_array('Not an appraisal.'),
    'citation_manifest',jsonb_build_array(
      jsonb_build_object('kind','calculation','version','vision-model@1.0.0'))),
  jsonb_build_object('payload',jsonb_build_object('externalId','00000000-0000-4000-8000-000000000310'))
);

-- A repeated service call with the same browser id must return the original
-- mapping and must not create any partial duplicate lifecycle rows.
select public.create_vision_report_request(
  '00000000-0000-4000-8000-000000000310',
  '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb,
  '{}'::jsonb, '{}'::jsonb, '{}'::jsonb
);

reset role;

select tests.assert(
  (select count(*) from public.vision_report_requests
   where submission_id = '00000000-0000-4000-8000-000000000310') = 1,
  'exact Vision retry creates one anonymous report mapping');
select tests.assert(
  (select count(*) from public.vision_report_requests r
   join public.leads l on l.id = r.lead_id
   join public.consent_receipts c on c.lead_id = l.id
   join public.vision_projects p on p.id = r.project_id
   join public.vision_reports report on report.id = r.report_id
   join public.vision_scenarios scenario on scenario.project_id = p.id
   join public.integration_outbox o on o.aggregate_id = l.id
   where l.dedupe_hash = 'vision-hash-1') = 1,
  'Vision request atomically creates its lead, consent, project, scenario, report, and outbox event');
select tests.assert(
  (select count(*) from public.attribution_touches a
   join public.leads l on l.id = a.lead_id
   where l.dedupe_hash = 'vision-hash-1') = 3,
  'Vision request records first, last, and conversion attribution exactly once');
select tests.assert(
  (select count(*) from public.vision_assumptions a
   join public.vision_projects p on p.id = a.project_id
   join public.leads l on l.id = p.lead_id
   where l.dedupe_hash = 'vision-hash-1') = 2,
  'Vision request stores each resolved assumption exactly once');
select tests.assert(
  (select count(*) from public.vision_assumptions a
   join public.vision_projects p on p.id = a.project_id
   join public.leads l on l.id = p.lead_id
   where l.dedupe_hash = 'vision-hash-1'
     and a.source_kind = 'user' and a.confirmed_by_user) = 1,
  'Vision request preserves visitor-selected assumption provenance');
select tests.assert(
  (select count(*) from public.vision_assumptions a
   join public.vision_projects p on p.id = a.project_id
   join public.leads l on l.id = p.lead_id
   where l.dedupe_hash = 'vision-hash-1'
     and a.source_kind = 'company_default' and not a.confirmed_by_user) = 1,
  'Vision request does not mislabel model defaults as visitor-confirmed');
select tests.assert(
  not has_function_privilege('public',
    'public.create_vision_report_request(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb)',
    'execute'),
  'PUBLIC holds no execute grant on the Vision report function');
select tests.assert(
  has_function_privilege('service_role',
    'public.create_vision_report_request(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb)',
    'execute'),
  'service_role can execute the Vision report function');

select tests.assert(
  (select count(*) from pg_tables t
   where t.schemaname = 'public' and not exists (
     select 1 from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = t.tablename and c.relrowsecurity
   )) = 0,
  'every table in the public schema has row level security enabled');

select 'ALL RLS TESTS PASSED' as result;
