-- Narrow service-role functions for claiming and completing CRM outbox work.
-- They support concurrent workers with SKIP LOCKED and never expose payloads to
-- an anonymous or authenticated browser role.

create function public.claim_integration_outbox(
  p_worker_id text,
  p_limit integer default 10
)
returns table (
  id uuid,
  aggregate_type text,
  aggregate_id uuid,
  event_type text,
  idempotency_key text,
  payload jsonb,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_worker_id is null or length(p_worker_id) < 8 then
    raise exception 'worker id is required';
  end if;

  return query
  with candidates as (
    select integration_outbox.id
      from public.integration_outbox
     where integration_outbox.status in ('pending', 'retry')
       and integration_outbox.available_at <= now()
     order by integration_outbox.available_at, integration_outbox.created_at
     for update skip locked
     limit least(greatest(p_limit, 1), 25)
  )
  update public.integration_outbox as claimed
     set status = 'processing',
         locked_at = now(),
         locked_by = p_worker_id
    from candidates
   where claimed.id = candidates.id
  returning
    claimed.id,
    claimed.aggregate_type,
    claimed.aggregate_id,
    claimed.event_type,
    claimed.idempotency_key,
    claimed.payload,
    claimed.attempt_count;
end;
$$;

create function public.complete_integration_outbox(
  p_id uuid,
  p_worker_id text,
  p_outcome text,
  p_error_code text default null,
  p_available_in_ms integer default 0,
  p_crm_contact_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_aggregate_id uuid;
begin
  if p_outcome not in ('succeeded', 'retry', 'dead') then
    raise exception 'invalid outbox outcome';
  end if;

  update public.integration_outbox
     set status = p_outcome,
         attempt_count = attempt_count + 1,
         available_at = case
           when p_outcome = 'retry'
             then now() + pg_catalog.make_interval(secs => greatest(p_available_in_ms, 0)::double precision / 1000.0)
           else available_at
         end,
         last_error_code = case when p_outcome = 'succeeded' then null else p_error_code end,
         completed_at = case when p_outcome in ('succeeded', 'dead') then now() else null end,
         locked_at = null,
         locked_by = null
   where id = p_id
     and status = 'processing'
     and locked_by = p_worker_id
  returning aggregate_id into v_aggregate_id;

  if v_aggregate_id is null then
    return false;
  end if;

  if p_outcome = 'succeeded' then
    update public.leads
       set status = 'synced',
           crm_contact_id = p_crm_contact_id,
           crm_synced_at = now()
     where id = v_aggregate_id;
  elsif p_outcome = 'dead' then
    update public.leads set status = 'error' where id = v_aggregate_id;
  end if;

  return true;
end;
$$;

revoke execute on function public.claim_integration_outbox(text, integer) from public;
revoke execute on function public.complete_integration_outbox(uuid, text, text, text, integer, text) from public;
grant execute on function public.claim_integration_outbox(text, integer) to service_role;
grant execute on function public.complete_integration_outbox(uuid, text, text, text, integer, text) to service_role;
