-- Close the Supabase default-privilege gap on security definer functions.
--
-- Every prior migration revokes EXECUTE from PUBLIC and grants service_role,
-- which is complete on plain PostgreSQL. Supabase is not plain PostgreSQL: its
-- default privileges grant EXECUTE on every new public-schema function
-- DIRECTLY to anon and authenticated, and a direct grant survives a revoke
-- from PUBLIC. Verified on the live project: anon held EXECUTE on all
-- seventeen security definer functions, meaning any holder of the public
-- browser key could call /rest/v1/rpc/create_lead_with_receipt and bypass
-- validation, Turnstile, rate limiting, and the honeypot entirely.
--
-- The local RLS suite could not have caught this: the CI shim runs plain
-- PostgreSQL, where these default grants do not exist. This migration is the
-- environment-specific correction, and the default-privilege change at the
-- bottom stops the gap from reopening on the next function anyone creates.

-- Service-role-only functions: the application server is the only caller.
revoke execute on function public.create_lead_with_receipt(jsonb, jsonb, jsonb, jsonb, uuid) from anon, authenticated;
revoke execute on function public.create_lead_with_receipt(jsonb, jsonb, jsonb, jsonb, uuid, jsonb) from anon, authenticated;
revoke execute on function public.create_lead_with_planner_response(jsonb, jsonb, jsonb, jsonb, jsonb, uuid) from anon, authenticated;
revoke execute on function public.create_vision_report_request(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) from anon, authenticated;
revoke execute on function public.record_audit_event(text, text, text, text, jsonb, jsonb, uuid) from anon, authenticated;
revoke execute on function public.claim_integration_outbox(text, integer) from anon, authenticated;
revoke execute on function public.complete_integration_outbox(uuid, text, text, text, integer, text) from anon, authenticated;
revoke execute on function public.reserve_ai_budget(text, text, uuid, uuid, integer, text, jsonb, text) from anon, authenticated;
revoke execute on function public.rendprop_enqueue_job(uuid, uuid, uuid, text, jsonb, integer, text, integer) from anon, authenticated;
revoke execute on function public.rendprop_claim_job(text, text, integer, integer) from anon, authenticated;
revoke execute on function public.rendprop_settle_job(uuid, text, integer, text, text, text, timestamptz) from anon, authenticated;

-- Token-gated public readers: called server-side with the service credential,
-- never from the browser. The token hash is the authorization; the transport
-- for it is the application server.
revoke execute on function public.get_public_report(text) from anon, authenticated;
revoke execute on function public.rendprop_published_tour(text) from anon, authenticated;

-- Trigger and event-trigger plumbing: fired by the system, called by nobody.
revoke execute on function public.handle_new_auth_user() from anon, authenticated;
-- rls_auto_enable exists only on the hosted project (Supabase-side tooling
-- created it, not our migrations), so this revoke has to tolerate its absence
-- when the chain runs against plain PostgreSQL in CI.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from anon, authenticated;
  end if;
end;
$$;

-- has_role and is_staff stay executable by authenticated ON PURPOSE: RLS
-- policy expressions evaluate as the querying role, so revoking authenticated
-- would break every staff policy in the schema. anon evaluates no policy that
-- references them, so anon loses EXECUTE.
revoke execute on function public.has_role(public.app_role) from anon;
revoke execute on function public.is_staff() from anon;

-- Stop the gap from reopening: new functions in public no longer receive
-- automatic EXECUTE for the API roles. Each future function grants its own
-- callers explicitly, which is what the migrations already do.
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

-- The three trigger functions the linter flags for a mutable search_path.
-- They take no caller input that could exploit it, but pinning is free.
alter function public.set_updated_at() set search_path = '';
alter function public.audit_events_immutable() set search_path = '';
alter function public.rendprop_freeze_disclosure() set search_path = '';
