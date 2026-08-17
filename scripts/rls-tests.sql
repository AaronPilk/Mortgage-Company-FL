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

grant execute on function tests.assert_affects_no_rows(text, text) to anon, authenticated;
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
  ('00000000-0000-4000-8000-000000000006', 'agent@example.com');

insert into public.profiles (id, display_name) values
  ('00000000-0000-4000-8000-000000000001', 'Admin'),
  ('00000000-0000-4000-8000-000000000002', 'Consumer'),
  ('00000000-0000-4000-8000-000000000003', 'Officer'),
  ('00000000-0000-4000-8000-000000000004', 'Editor'),
  ('00000000-0000-4000-8000-000000000005', 'Compliance'),
  ('00000000-0000-4000-8000-000000000006', 'Agent');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000001', 'admin'),
  ('00000000-0000-4000-8000-000000000003', 'loan_officer'),
  ('00000000-0000-4000-8000-000000000004', 'content_editor'),
  ('00000000-0000-4000-8000-000000000005', 'compliance_reviewer'),
  ('00000000-0000-4000-8000-000000000006', 'agent'),
  ('00000000-0000-4000-8000-000000000002', 'consumer');

select public.create_lead_with_receipt(
  jsonb_build_object(
    'intent','purchase','first_name','Dana','last_name','Reyes',
    'email_normalized','dana@example.com','phone_e164','+18135550147',
    'source_path','/mortgage/purchase','dedupe_hash','hash-1'),
  jsonb_build_object(
    'privacy_accepted',true,'contact_requested',true,'sms_marketing',false,
    'email_marketing',true,'disclosure_version','v1','disclosure_text_sha256','abc',
    'source_path','/mortgage/purchase','form_version','1'),
  jsonb_build_object('landing_path','/mortgage/purchase','utm_source','google'),
  jsonb_build_object('event_type','lead.received','idempotency_key','k1','payload','{}'::jsonb),
  gen_random_uuid()
);

select public.create_vision_report_request(
  '00000000-0000-4000-8000-000000000100',
  jsonb_build_object(
    'first_name','Vision','last_name','Visitor','email_normalized','vision@example.com',
    'phone_e164','+18135550148','source_path','/vision','dedupe_hash','vision-hash'),
  jsonb_build_object(
    'privacy_accepted',true,'contact_requested',true,'sms_marketing',false,
    'email_marketing',false,'disclosure_version','vision-v1',
    'disclosure_text_sha256','vision-copy-hash','source_path','/vision','form_version','1'),
  jsonb_build_array(
    jsonb_build_object('touch_kind','first','occurred_at',now(),'landing_path','/properties'),
    jsonb_build_object('touch_kind','last','occurred_at',now(),'landing_path','/vision'),
    jsonb_build_object('touch_kind','conversion','occurred_at',now(),'landing_path','/vision')
  ),
  jsonb_build_object(
    'title','Synthetic bungalow planning report','goal','renovate','data_as_of',now(),
    'assumptions',jsonb_build_object('purchasePriceCents',38900000,'downPaymentCents',7780000)),
  jsonb_build_object(
    'scenario_name','Planning range','scenario_type','vision_planning_preview',
    'input_snapshot','{}'::jsonb,'result_snapshot','{}'::jsonb,
    'calculation_version','mortgage-math@1.0.0'),
  jsonb_build_object(
    'facts_snapshot',jsonb_build_object('listingKey','FX-STP-0001','isFixture',true),
    'assumptions_snapshot','{}'::jsonb,'calculations_snapshot','{}'::jsonb,
    'narrative_snapshot',jsonb_build_object('kind','deterministic_preview'),
    'limitations',jsonb_build_array('Planning illustration only.'),
    'citation_manifest',jsonb_build_array(jsonb_build_object('kind','visitor_input'))),
  jsonb_build_object('payload',jsonb_build_object('externalId','vision-fixture'))
);

-- An exact retry must return the original receipt and create nothing else.
select public.create_vision_report_request(
  '00000000-0000-4000-8000-000000000100',
  '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb,
  '{}'::jsonb, '{}'::jsonb, '{}'::jsonb
);

select tests.assert(
  (select count(*) from public.vision_report_requests
   where submission_id = '00000000-0000-4000-8000-000000000100') = 1,
  'Vision report request is idempotent by submission id');
select tests.assert(
  (select count(*) from public.leads where intent = 'vision_report') = 1,
  'Vision report retry does not duplicate the lead');
select tests.assert(
  (select count(*) from public.attribution_touches
   where lead_id = (select lead_id from public.vision_report_requests
     where submission_id = '00000000-0000-4000-8000-000000000100')) = 3,
  'Vision report stores distinct first, last, and conversion touches');

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

insert into public.quota_policies (subject_kind, feature, period, request_limit, cost_limit_cents, concurrency_limit)
values ('consumer', 'vision_report', 'day', 3, 500, 1);

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
select tests.assert_denied('select count(*) from public.vision_report_requests',
  'anonymous has no grant on Vision report requests');
select tests.assert(tests.visible_count('select count(*) from public.audit_events') = 0,
  'anonymous sees no audit events');
select tests.assert(tests.visible_count('select count(*) from public.ai_jobs') = 0,
  'anonymous cannot read AI jobs');
select tests.assert(tests.visible_count('select count(*) from public.vision_projects') = 0,
  'anonymous cannot read Vision projects');

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
select tests.assert(tests.visible_count('select count(*) from public.usage_ledger') = 0,
  'consumer cannot read the usage ledger');

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

reset role;

/* ---------------------------------------------------------------- *
 * Loan officer
 * ---------------------------------------------------------------- */

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', false);

select tests.assert(tests.visible_count('select count(*) from public.leads') = 2,
  'loan officer can read leads');
select tests.assert(tests.visible_count('select count(*) from public.vision_report_requests') = 0,
  'loan officer cannot read Vision report request mappings');
select tests.assert(tests.visible_count('select count(*) from public.consent_receipts') = 0,
  'loan officer cannot read the consent ledger');
select tests.assert(tests.visible_count('select count(*) from public.audit_events') = 0,
  'loan officer cannot read the audit log');

reset role;

/* ---------------------------------------------------------------- *
 * Compliance reviewer
 * ---------------------------------------------------------------- */

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000005', false);

select tests.assert(tests.visible_count('select count(*) from public.consent_receipts') = 2,
  'compliance reviewer can read the consent ledger');
select tests.assert(tests.visible_count('select count(*) from public.audit_events') = 1,
  'compliance reviewer can read the audit log');
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
select tests.assert(tests.visible_count('select count(*) from public.vision_report_requests') = 1,
  'admin can read Vision report request mappings');

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

select tests.assert(
  (select count(*) from pg_tables t
   where t.schemaname = 'public' and not exists (
     select 1 from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = t.tablename and c.relrowsecurity
   )) = 0,
  'every table in the public schema has row level security enabled');

select 'ALL RLS TESTS PASSED' as result;
