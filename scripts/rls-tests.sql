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

-- service_role asserts too, so a door granted only to service_role can be
-- exercised (and its ownership guard proven) from within that role.
grant usage on schema tests to service_role;
grant execute on function tests.assert(boolean, text) to service_role;
grant execute on function tests.assert_denied(text, text) to service_role;

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

insert into public.affordability_profiles (
  owner_user_id, annual_income_cents, down_payment_cents, monthly_debts_cents, credit_band
) values
  ('00000000-0000-4000-8000-000000000002', 9500000, 4000000, 50000, 'good'),
  ('00000000-0000-4000-8000-000000000006', 12000000, 6000000, 80000, 'excellent');

insert into public.home_profiles (
  owner_user_id, address_line1, address_city, address_state, address_postal_code,
  latitude, longitude, estimated_balance_cents
) values
  ('00000000-0000-4000-8000-000000000002',
    '123 Bayshore Blvd', 'Tampa', 'FL', '33606', 27.9, -82.5, 28000000),
  ('00000000-0000-4000-8000-000000000006',
    '9 Beach Dr', 'St Petersburg', 'FL', '33701', 27.77, -82.63, 15000000);

-- Two snapshots for the consumer (a trend), one for the other owner.
insert into public.home_value_snapshots (
  owner_user_id, captured_on, estimated_value_cents, value_low_cents, value_high_cents, source
) values
  ('00000000-0000-4000-8000-000000000002', '2026-06-01', 42000000, 40000000, 44000000, 'fixture'),
  ('00000000-0000-4000-8000-000000000002', '2026-08-01', 43500000, 41000000, 46000000, 'fixture'),
  ('00000000-0000-4000-8000-000000000006', '2026-08-01', 60000000, 57000000, 63000000, 'fixture');

insert into public.rate_watches (owner_user_id, term, target_rate_bp, notify_email) values
  ('00000000-0000-4000-8000-000000000002', 'thirtyYearFixed', 600, true),
  ('00000000-0000-4000-8000-000000000006', 'fifteenYearFixed', null, false);

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

-- An unclaimed public-record row, as the DBPR import writes it: no owner, no
-- email, no phone, no bio, no display consent — public anyway, because it
-- restates a state license record and holds no private contact data.
insert into public.agents (
  id, owner_user_id, first_name, last_name, brokerage, license_number,
  email_normalized, phone_e164, cities, bio, slug, status, display_consent,
  county, source, imported_at, license_rank
) values
  (
    '00000000-0000-4000-8000-000000000243', null,
    'Devon', 'Unclaimed', 'Public Records Realty', 'SL0000004',
    null, null, 'Clearwater', null, 'devon-unclaimed-sl0000004', 'unclaimed', false,
    'Pinellas', 'dbpr_import', now(), 'SL Sales Associate'
  );

select public.create_lead_with_receipt(
  jsonb_build_object(
    'intent','purchase','first_name','Dana','last_name','Reyes',
    'email_normalized','dana@example.com','phone_e164','+18135550147',
    'source_path','/mortgage/purchase','dedupe_hash','hash-1',
    'referring_agent_id','00000000-0000-4000-8000-000000000242'),
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
    'source_path','/plan','dedupe_hash','hash-2',
    'referring_agent_id','00000000-0000-4000-8000-000000000240'),
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
select tests.assert_denied(
  $$update public.saved_searches set alerts_enabled = true
    where id = '00000000-0000-4000-8000-000000000230'$$,
  'anonymous cannot toggle saved-search alerts');
select tests.assert_denied('select count(*) from public.affordability_profiles',
  'anonymous has no grant on affordability profiles');
select tests.assert_denied('select count(*) from public.home_profiles',
  'anonymous has no grant on home profiles');
select tests.assert_denied('select count(*) from public.home_value_snapshots',
  'anonymous has no grant on home value snapshots');
select tests.assert_denied('select count(*) from public.rate_watches',
  'anonymous has no grant on rate watches');

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

-- Agent directory: a row reaches the public either as approved-and-consenting
-- or as an unclaimed public-record import, and the anonymous key can never
-- write the table at all.
select tests.assert(tests.visible_count('select count(*) from public.agents') = 2,
  'anonymous sees the approved consenting agent and the unclaimed import');
select tests.assert(
  tests.visible_count($$select count(*) from public.agents where status = 'unclaimed'$$) = 1,
  'anonymous sees unclaimed public-record rows');
select tests.assert(
  tests.visible_count($$select count(*) from public.agents where status = 'pending'$$) = 0,
  'anonymous never sees a pending agent');
select tests.assert(
  tests.visible_count($$select count(*) from public.agents
    where status <> 'unclaimed' and not display_consent$$) = 0,
  'anonymous never sees a joined agent who did not consent to display');
-- The privacy posture of an unclaimed row is structural, not just a policy:
-- the import writes no contact data, so there is nothing for a policy bug to
-- leak.
select tests.assert(
  tests.visible_count($$select count(*) from public.agents
    where status = 'unclaimed'
      and (email_normalized is not null or phone_e164 is not null or bio is not null)$$) = 0,
  'unclaimed rows carry no email, phone, or bio to expose');
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
select tests.assert_denied(
  $$update public.agents set first_name = 'Hijacked'
    where id = '00000000-0000-4000-8000-000000000243'$$,
  'anonymous cannot edit an unclaimed public-record row');

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
select tests.assert(tests.visible_count('select count(*) from public.affordability_profiles') = 1,
  'consumer sees only their own affordability profile');
select tests.assert(tests.visible_count('select count(*) from public.home_profiles') = 1,
  'consumer sees only their own home profile');
select tests.assert(tests.visible_count('select count(*) from public.home_value_snapshots') = 2,
  'consumer sees only their own home value snapshots');
select tests.assert(tests.visible_count('select count(*) from public.rate_watches') = 1,
  'consumer sees only their own rate watch');

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

-- Owner CAN toggle only alerts_enabled on their own search.
update public.saved_searches set alerts_enabled = true
  where id = '00000000-0000-4000-8000-000000000230';
select tests.assert(
  tests.visible_count($$select count(*) from public.saved_searches
    where id = '00000000-0000-4000-8000-000000000230' and alerts_enabled$$) = 1,
  'owner can enable alerts on their own saved search');

-- The column grant does NOT leak other columns (42501 from column privilege).
select tests.assert_denied(
  $$update public.saved_searches set summary = 'hijack'
    where id = '00000000-0000-4000-8000-000000000230'$$,
  'owner cannot update non-alert columns of their saved search');
select tests.assert_denied(
  $$update public.saved_searches set alert_watermark = now()
    where id = '00000000-0000-4000-8000-000000000230'$$,
  'owner cannot write the alert watermark column');

-- Cannot flip another user's search (RLS filters the row → no rows affected).
select tests.assert_affects_no_rows(
  $$update public.saved_searches set alerts_enabled = true
    where id = '00000000-0000-4000-8000-000000000231'$$,
  'owner cannot enable alerts on another user''s saved search');
update public.affordability_profiles set monthly_debts_cents = 60000
where owner_user_id = '00000000-0000-4000-8000-000000000002';
select tests.assert(
  tests.visible_count($$select count(*) from public.affordability_profiles
    where monthly_debts_cents = 60000$$) = 1,
  'consumer can update their own affordability profile');
update public.home_profiles set estimated_balance_cents = 25000000
where owner_user_id = '00000000-0000-4000-8000-000000000002';
select tests.assert(
  tests.visible_count($$select count(*) from public.home_profiles
    where estimated_balance_cents = 25000000$$) = 1,
  'consumer can update their own home profile');
insert into public.home_value_snapshots (owner_user_id, captured_on, estimated_value_cents, source)
values ('00000000-0000-4000-8000-000000000002', '2026-08-20', 44000000, 'fixture');
select tests.assert(tests.visible_count('select count(*) from public.home_value_snapshots') = 3,
  'consumer can add an owned home value snapshot');
update public.rate_watches set target_rate_bp = 575
where owner_user_id = '00000000-0000-4000-8000-000000000002';
select tests.assert(
  tests.visible_count($$select count(*) from public.rate_watches
    where target_rate_bp = 575$$) = 1,
  'consumer can update their own rate watch');
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
select tests.assert_denied(
  $$insert into public.affordability_profiles (
      owner_user_id, annual_income_cents, down_payment_cents, credit_band
    ) values ('00000000-0000-4000-8000-000000000006', 1, 1, 'good')$$,
  'consumer cannot create an affordability profile for another user');
select tests.assert_denied(
  $$insert into public.home_profiles (
      owner_user_id, address_line1, address_city, address_state, address_postal_code
    ) values ('00000000-0000-4000-8000-000000000006', '1 Hostile Way', 'Tampa', 'FL', '33607')$$,
  'consumer cannot create a home profile for another user');
select tests.assert_denied(
  $$insert into public.home_value_snapshots (
      owner_user_id, captured_on, estimated_value_cents
    ) values ('00000000-0000-4000-8000-000000000006', '2026-09-01', 12345600)$$,
  'consumer cannot add a home value snapshot for another user');
select tests.assert_denied(
  $$insert into public.rate_watches (owner_user_id, term, notify_email)
    values ('00000000-0000-4000-8000-000000000006', 'thirtyYearFixed', true)$$,
  'consumer cannot create a rate watch for another user');
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
select tests.assert(tests.visible_count('select count(*) from public.agents') = 3,
  'agent row owner sees the public directory (including unclaimed) plus their own pending row');
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
select tests.assert_affects_no_rows(
  $$update public.agents set cities = 'Hijacked'
    where id = '00000000-0000-4000-8000-000000000243'$$,
  'an unclaimed row is not writable by an authenticated user: claiming goes through the join API');
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
select tests.assert(tests.visible_count('select count(*) from public.agents') = 3,
  'directory row owner sees the public rows (including unclaimed) plus their own non-consenting row');
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
select tests.assert(tests.visible_count('select count(*) from public.agents') = 4,
  'loan officer reviews the whole agent directory, pending and unclaimed rows included');
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

/* ---------------------------------------------------------------- *
 * TRACT loan compartment
 *
 * The `loan` schema is off the REST surface and every default grant is
 * revoked, so anon and authenticated have no direct path to a row. The only
 * doors are the SECURITY DEFINER functions. These tests prove the compartment
 * is sealed at the schema level, that the server door is server-only, and that
 * a borrower's own reads are scoped to their own files.
 * ---------------------------------------------------------------- */

-- The compartment is sealed at the schema level: no usage, no table reads.
select tests.assert(not has_schema_privilege('anon', 'loan', 'usage'),
  'anon has no usage on the loan schema');
select tests.assert(not has_schema_privilege('authenticated', 'loan', 'usage'),
  'authenticated has no usage on the loan schema');
select tests.assert(
  (select count(*) from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'loan' and c.relrowsecurity
     and c.relname in
       ('loan_files','loan_stage_events','loan_conditions','loan_documents','access_log')) = 5,
  'row level security is enabled on all five loan tables');

-- Seed two files through the server door, for two different borrowers. The file
-- id is captured from the function's own return value — service_role has no
-- direct read on the compartment either, which is exactly the point.
set role service_role;
select public.loan_open_file(
  '00000000-0000-4000-8000-000000000002', 'purchase',
  jsonb_build_object('loanPurpose','purchase','employmentType','w2'),
  '400k_500k', '350k_450k') as loan_own_file \gset
select public.loan_open_file(
  '00000000-0000-4000-8000-000000000006', 'refinance',
  jsonb_build_object('loanPurpose','refinance','employmentType','self_employed'),
  null, null) as loan_other_file \gset
reset role;

-- Anonymous: the compartment does not exist as far as they can tell.
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select tests.assert_denied('select count(*) from loan.loan_files',
  'anon cannot read the loan files table directly');
select tests.assert_denied(
  $$select public.loan_open_file('00000000-0000-4000-8000-000000000006','purchase',null,null,null)$$,
  'anon cannot open a loan file');
reset role;

-- A borrower, only through the doors, only their own file.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false);
select tests.assert_denied('select count(*) from loan.loan_files',
  'a signed-in borrower still cannot read the loan files table directly');
select tests.assert_denied(
  $$select public.loan_open_file('00000000-0000-4000-8000-000000000002','purchase',null,null,null)$$,
  'a borrower cannot call the server open-file door');
select tests.assert_denied(
  $$select public.loan_advance_stage(gen_random_uuid(),'processing',
      '00000000-0000-4000-8000-000000000002',null)$$,
  'a borrower cannot advance a loan stage');
select tests.assert(tests.visible_count('select count(*) from public.loan_list_my_files()') = 1,
  'a borrower sees exactly their own loan file');
select tests.assert(
  (select public.loan_get_file(id) is not null from public.loan_list_my_files() limit 1),
  'a borrower can read the full detail of their own file');
select tests.assert(public.loan_get_file(:'loan_other_file') is null,
  'a borrower cannot read another borrower''s file detail');
reset role;

-- Invariant 5: EXECUTE defaults to PUBLIC; prove every revoke holds.
select tests.assert(
  not has_function_privilege('public',
    'public.loan_open_file(uuid, loan.loan_purpose, jsonb, text, text)', 'execute'),
  'PUBLIC holds no execute grant on the loan open-file door');
select tests.assert(
  not has_function_privilege('authenticated',
    'public.loan_open_file(uuid, loan.loan_purpose, jsonb, text, text)', 'execute'),
  'authenticated holds no execute grant on the loan open-file door');
select tests.assert(
  not has_function_privilege('public',
    'public.loan_create_file(uuid, loan.loan_purpose, text, text)', 'execute'),
  'PUBLIC holds no execute grant on the loan create-file door');
select tests.assert(
  not has_function_privilege('anon', 'public.loan_get_file(uuid)', 'execute'),
  'anon holds no execute grant on the loan detail read');
select tests.assert(
  has_function_privilege('authenticated', 'public.loan_get_file(uuid)', 'execute'),
  'a borrower can execute the loan detail read for their own file');

-- Document doors are server-only (service_role), and each verifies ownership.
select tests.assert(
  not has_function_privilege('authenticated',
    'public.loan_add_document(uuid, uuid, text, loan.document_type, text, text, bigint)', 'execute'),
  'authenticated cannot record a document (server door only)');
select tests.assert(
  not has_function_privilege('public',
    'public.loan_mark_document_uploaded(uuid, uuid)', 'execute'),
  'PUBLIC holds no execute grant on the document-uploaded door');

set role service_role;
select public.loan_add_document(
  '00000000-0000-4000-8000-000000000002', :'loan_own_file'::uuid,
  'income.w2_2yr', 'w2', 'loan/own/doc-a', 'application/pdf', 1024) as loan_doc_a \gset
select tests.assert(:'loan_doc_a' is not null, 'the server door records a document for the file owner');
select tests.assert_denied(
  format('select public.loan_add_document(%L,%L,%L,%L,%L,%L,%L)',
    '00000000-0000-4000-8000-000000000002', :'loan_other_file',
    'x', 'other', 'loan/other/doc-x', 'application/pdf', 10),
  'the document door rejects a file the borrower does not own');
select public.loan_mark_document_uploaded(
  '00000000-0000-4000-8000-000000000002', :'loan_doc_a'::uuid);
select tests.assert_denied(
  format('select public.loan_mark_document_uploaded(%L,%L)',
    '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000009ff'),
  'the uploaded door rejects a document that is not the borrower''s');
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false);
select tests.assert(
  (public.loan_get_file(:'loan_own_file'::uuid) -> 'documents') @> '[{"upload_status":"uploaded"}]'::jsonb,
  'an uploaded document shows on the borrower''s own file as uploaded');
reset role;

/* ---------------------------------------------------------------- *
 * Agent referral dashboard (agent_referral_summary / _timeline)
 * ---------------------------------------------------------------- *
 * Dana's lead is referred by approved agent …242 (owner …006); Sam's lead is
 * referred by approved agent …240, which has NO owner, so it is visible to
 * nobody. The partner's read never touches public.leads directly.                */

set role anon;
select set_config('request.jwt.claim.sub', '', false);
select tests.assert_denied('select * from public.agent_referral_summary()',
  'anonymous cannot execute the agent referral summary');
select tests.assert_denied('select * from public.agent_referral_timeline()',
  'anonymous cannot execute the agent referral timeline');
reset role;

-- Consumer …002 owns only a PENDING agent row (…241); eligibility is
-- status='approved', so the dashboard is empty for them.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false);
select tests.assert((select total_count from public.agent_referral_summary()) = 0,
  'a pending (non-approved) agent row yields an empty referral summary');
select tests.assert(
  tests.visible_count('select count(*) from public.agent_referral_timeline()') = 0,
  'a pending agent sees an empty referral timeline');
reset role;

-- Approved partner …006 (owns approved …242) sees exactly the one lead their
-- link drove, as coarse aggregates — Sam (referred to owner-less …240) is
-- excluded, and the agent has zero direct row access to public.leads.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000006', false);
select tests.assert((select total_count from public.agent_referral_summary()) = 1,
  'approved agent summary counts exactly the lead their link referred');
select tests.assert((select new_count from public.agent_referral_summary()) = 1,
  'the referred lead is bucketed coarsely (queued -> new), never by raw status');
select tests.assert(
  tests.visible_count('select count(*) from public.agent_referral_timeline()') = 1,
  'the coarse timeline lists only the agent''s own referred lead');
select tests.assert(
  tests.visible_count('select count(*) from public.leads') = 0,
  'an agent cannot read any lead row directly, referred or not');
reset role;

/* ---------------------------------------------------------------- *
 * Agent marketplace — ZIP coverage + routing lookup
 * ---------------------------------------------------------------- */

-- Seed through the service role: …240 is ownerless, so an authenticated insert
-- could not create its coverage. service_role bypasses RLS.
set role service_role;
insert into public.agent_zip_coverage (agent_id, zip5) values
  ('00000000-0000-4000-8000-000000000242', '33701'),  -- approved, owned by …006, consent=false
  ('00000000-0000-4000-8000-000000000240', '33602'),  -- approved, ownerless, consent=true
  ('00000000-0000-4000-8000-000000000241', '34600');  -- PENDING, owned by …002
reset role;

-- Anonymous: no grant on the table, no EXECUTE on the routing lookup.
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select tests.assert_denied('select count(*) from public.agent_zip_coverage',
  'anonymous has no grant on agent coverage');
select tests.assert_denied($$select * from public.agent_coverage_for_zip('33701')$$,
  'anonymous cannot execute the coverage routing lookup');
reset role;

-- Owner …006 (owns approved …242): sees only their coverage, may add/remove
-- their own ZIPs, and cannot touch coverage for an agent they do not own.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000006', false);
select tests.assert(tests.visible_count('select count(*) from public.agent_zip_coverage') = 1,
  'agent owner sees only their own coverage rows');
insert into public.agent_zip_coverage (agent_id, zip5)
  values ('00000000-0000-4000-8000-000000000242', '33702');
select tests.assert(tests.visible_count('select count(*) from public.agent_zip_coverage') = 2,
  'agent owner can add a ZIP to their own coverage');
select tests.assert_denied(
  $$insert into public.agent_zip_coverage (agent_id, zip5)
      values ('00000000-0000-4000-8000-000000000240','33603')$$,
  'agent owner cannot add coverage for an agent they do not own (ownerless)');
select tests.assert_denied(
  $$insert into public.agent_zip_coverage (agent_id, zip5)
      values ('00000000-0000-4000-8000-000000000241','34601')$$,
  'agent owner cannot add coverage for another user''s agent');
select tests.assert_affects_no_rows(
  $$delete from public.agent_zip_coverage
      where agent_id='00000000-0000-4000-8000-000000000240'$$,
  'agent owner cannot delete coverage they do not own');
delete from public.agent_zip_coverage
  where agent_id='00000000-0000-4000-8000-000000000242' and zip5='33702';
select tests.assert(tests.visible_count('select count(*) from public.agent_zip_coverage') = 1,
  'agent owner can remove their own ZIP');
reset role;

-- A different owner …002 (owns PENDING …241): isolated from …006's coverage,
-- and may still pre-register coverage for their own pending agent.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false);
select tests.assert(
  tests.visible_count($$select count(*) from public.agent_zip_coverage
    where agent_id='00000000-0000-4000-8000-000000000242'$$) = 0,
  'a different owner cannot see another agent''s coverage');
insert into public.agent_zip_coverage (agent_id, zip5)
  values ('00000000-0000-4000-8000-000000000241','34601');
select tests.assert(tests.visible_count('select count(*) from public.agent_zip_coverage') = 2,
  'a pending agent''s owner can pre-register coverage (routing gates on approval, not this)');
reset role;

-- Routing lookup (server-side): approved agents only, correct agent, pending
-- excluded, and approval — not directory consent — is what routing turns on.
set role service_role;
select tests.assert((select count(*) from public.agent_coverage_for_zip('33701')) = 1,
  'routing returns the approved covering agent for a ZIP');
select tests.assert(
  (select agent_id from public.agent_coverage_for_zip('33701'))
    = '00000000-0000-4000-8000-000000000242',
  'routing resolves to the correct approved agent even though it withheld directory consent');
select tests.assert((select count(*) from public.agent_coverage_for_zip('34600')) = 0,
  'routing excludes a pending agent''s coverage');
select tests.assert((select count(*) from public.agent_coverage_for_zip('33602')) = 1,
  'routing includes an approved ownerless (imported) agent''s coverage');
reset role;

-- Invariant 5: EXECUTE was revoked from PUBLIC and granted only to service_role.
select tests.assert(
  not has_function_privilege('public','public.agent_coverage_for_zip(text)','execute'),
  'PUBLIC holds no execute grant on the coverage routing lookup');
select tests.assert(
  not has_function_privilege('authenticated','public.agent_coverage_for_zip(text)','execute'),
  'authenticated holds no execute grant on the coverage routing lookup');
select tests.assert(
  has_function_privilege('service_role','public.agent_coverage_for_zip(text)','execute'),
  'service_role can execute the coverage routing lookup');
reset role;

/* ---------------------------------------------------------------- *
 * Engagement email ledger (email_notifications + reserve/settle)
 * ---------------------------------------------------------------- */

reset role;
-- Seeded as the table owner (bypasses RLS), so the staff read policy and the
-- consumer's zero-visibility both have a row to prove.
insert into public.email_notifications
  (id, kind, owner_user_id, recipient_email_normalized, dedupe_key, status, run_id)
values
  ('00000000-0000-4000-8000-000000000260', 'home_value_move',
   '00000000-0000-4000-8000-000000000002', 'consumer@example.com',
   'home_value_move:00000000-0000-4000-8000-000000000002:seed', 'reserved', 'rls-fixture');

-- Anonymous: no grant on the ledger, no EXECUTE on the definer functions.
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select tests.assert_denied('select count(*) from public.email_notifications',
  'anonymous has no grant on the email notification ledger');
select tests.assert_denied(
  $$select public.email_alert_reserve('home_value_move',
      '00000000-0000-4000-8000-000000000002','k','{}'::jsonb,'run',500)$$,
  'anonymous cannot reserve an email send');
select tests.assert_denied(
  $$select public.email_alert_settle(
      '00000000-0000-4000-8000-000000000260','sent',null,null,null)$$,
  'anonymous cannot settle an email send');
reset role;

-- Consumer: staff-only read means zero rows, and no EXECUTE on the ledger fns.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false);
select tests.assert(
  tests.visible_count('select count(*) from public.email_notifications') = 0,
  'consumer cannot read the email notification ledger');
select tests.assert_denied(
  $$select public.email_alert_reserve('home_value_move',
      '00000000-0000-4000-8000-000000000002','k','{}'::jsonb,'run',500)$$,
  'consumer cannot reserve an email send directly');
select tests.assert_denied(
  $$select public.email_alert_settle(
      '00000000-0000-4000-8000-000000000260','sent',null,null,null)$$,
  'consumer cannot settle an email send directly');
reset role;

-- Operations: the staff read policy exposes the ledger for reconciliation.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000007', false);
select tests.assert(
  tests.visible_count('select count(*) from public.email_notifications') = 1,
  'operations can read the email notification ledger');
reset role;

/* ---------------------------------------------------------------- *
 * Do-not-sell/share suppression channel
 * ---------------------------------------------------------------- */
reset role;
insert into public.suppressions (channel, email_normalized, reason, source)
  values ('ads', 'dns-optout@example.com', 'do-not-sell-or-share', 'rls-test');
select tests.assert(
  (select count(*) from public.suppressions
     where channel = 'ads' and email_normalized = 'dns-optout@example.com') = 1,
  'the ads (do-not-sell/share) suppression channel is accepted by the constraint');

select tests.assert(
  (select count(*) from pg_tables t
   where t.schemaname = 'public' and not exists (
     select 1 from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = t.tablename and c.relrowsecurity
   )) = 0,
  'every table in the public schema has row level security enabled');

select 'ALL RLS TESTS PASSED' as result;
