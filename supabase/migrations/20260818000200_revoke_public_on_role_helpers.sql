-- The first hardening pass revoked the DIRECT anon/authenticated grants, but
-- has_role, is_staff and rls_auto_enable still carried their original grant to
-- PUBLIC — the earlier migrations only revoked PUBLIC on the service functions,
-- and a PUBLIC grant makes every role executable again. Revoke it, then grant
-- back exactly the callers each function needs.

revoke execute on function public.has_role(public.app_role) from public;
revoke execute on function public.is_staff() from public;

-- RLS policy expressions evaluate as the querying role, so authenticated must
-- keep EXECUTE or every staff policy in the schema stops evaluating.
grant execute on function public.has_role(public.app_role) to authenticated, service_role;
grant execute on function public.is_staff() to authenticated, service_role;

do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public;
  end if;
end;
$$;
