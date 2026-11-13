-- Engagement email notifications: the reserve-before-spend ledger for alerts.
--
-- Two engagement loops (home-value moves, rate thresholds) turn a signed-in
-- owner's saved home and rate watch into recurring, consent-gated email touches.
-- This migration adds the home-value opt-in columns and the notification ledger
-- that makes every send auditable and idempotent.
--
-- The ledger is invariant 8 applied to email: a send is reserved under an
-- advisory lock before the provider is called, and an unknown provider outcome
-- holds the reservation forever (status 'sent_unknown') rather than risking a
-- duplicate send. All writes go through two SECURITY DEFINER functions granted
-- to service_role only; the table itself has RLS with a staff read policy and no
-- write policy, so no browser role can forge, read another owner's, or replay a
-- notification. This holds no application data, no credit fact, and no
-- government identifier (invariant 2) — only which alert was sent to which
-- already-consenting recipient, and when.

alter table public.home_profiles
  add column if not exists notify_value_change boolean not null default false,
  add column if not exists last_value_notified_on date;

create table public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('home_value_move','rate_threshold')),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  -- The resolved recipient, normalized. Kept for the suppression join and audit;
  -- the address itself comes from auth.users, never from a request body.
  recipient_email_normalized text not null,
  -- Stable per-alert key. Two runs over the same move or observation collapse to
  -- one notification via the unique (kind, dedupe_key) below.
  dedupe_key text not null,
  status text not null default 'reserved'
    check (status in ('reserved','sent','failed','suppressed','skipped','sent_unknown')),
  context jsonb not null default '{}'::jsonb,
  provider text,
  provider_message_id text,
  -- An unknown provider outcome sets this: the row is held for a human to
  -- reconcile and is never resent.
  requires_reconciliation boolean not null default false,
  attempt_count integer not null default 0,
  error_code text,
  run_id text,
  reserved_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kind, dedupe_key)
);

create index email_notifications_owner_idx
  on public.email_notifications (owner_user_id, created_at desc);
create index email_notifications_recon_idx
  on public.email_notifications (requires_reconciliation)
  where requires_reconciliation;
-- Backs the platform-wide daily-cap count in the reserve function.
create index email_notifications_cap_idx
  on public.email_notifications (created_at)
  where status in ('reserved','sent','sent_unknown');

alter table public.email_notifications enable row level security;

-- anon gets nothing at all: a hard permission error, not an empty set.
revoke all on public.email_notifications from anon;
-- authenticated keeps SELECT (governed by the staff policy below) but never
-- writes directly — every write is a definer function. Belt to the RLS braces.
revoke insert, update, delete on public.email_notifications from authenticated;

-- Operations and admin may read the ledger for reconciliation and support. No
-- write policy exists, so even staff cannot insert, update, or delete a row
-- through the browser key; the SECURITY DEFINER functions are the only writers.
create policy "staff read email notifications"
  on public.email_notifications for select to authenticated
  using (public.has_role('operations') or public.has_role('admin'));

-- Per-feature emergency stop, mirroring the AI kill switches. Checked inside the
-- reserve function under the lock, so flipping it halts new sends immediately.
insert into public.kill_switches (key, scope, engaged, reason) values
  ('feature:email_alerts', 'feature', false, 'Engagement email alerts')
on conflict (key) do nothing;

-- Reserve a send under an advisory lock (invariant 8). Returns one row: on a
-- fresh reservation, the notification id and the resolved recipient email with
-- outcome 'reserved'; otherwise a null id/email with outcome 'suppressed' or
-- 'skipped'. The lock is per-kind so the two loops never serialize against each
-- other. Kill switch, suppression, and the platform daily cap are all evaluated
-- inside the lock, so the gate cannot be out-raced.
create function public.email_alert_reserve(
  p_kind text,
  p_owner_user_id uuid,
  p_dedupe_key text,
  p_context jsonb,
  p_run_id text,
  p_daily_cap integer
)
returns table (notification_id uuid, recipient_email text, outcome text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_email_normalized text;
  v_recent integer;
  v_id uuid;
begin
  if p_kind not in ('home_value_move', 'rate_threshold') then
    raise exception 'unknown email alert kind: %', p_kind;
  end if;

  -- One lock per kind for the whole transaction.
  perform pg_advisory_xact_lock(pg_catalog.hashtext('email_alert:' || p_kind)::bigint);

  -- Kill switches: master stop or the feature stop halts every new send.
  if exists (
    select 1 from public.kill_switches
    where key in ('global', 'feature:email_alerts') and engaged
  ) then
    return query select null::uuid, null::text, 'skipped'::text;
    return;
  end if;

  -- Resolve the recipient from identity, never from a caller-supplied value.
  select users.email into v_email from auth.users users where users.id = p_owner_user_id;
  if v_email is null or pg_catalog.btrim(v_email) = '' then
    return query select null::uuid, null::text, 'skipped'::text;
    return;
  end if;
  v_email_normalized := pg_catalog.lower(pg_catalog.btrim(v_email));

  -- Suppression gate. A prior unsubscribe or STOP wins even if a source opt-in
  -- lagged. Record a suppressed row for the audit trail and send nothing.
  if exists (
    select 1 from public.suppressions
    where email_normalized = v_email_normalized and channel in ('email', 'all')
  ) then
    insert into public.email_notifications
      (kind, owner_user_id, recipient_email_normalized, dedupe_key, status, context, run_id)
    values
      (p_kind, p_owner_user_id, v_email_normalized, p_dedupe_key, 'suppressed', p_context, p_run_id)
    on conflict (kind, dedupe_key) do nothing;
    return query select null::uuid, null::text, 'suppressed'::text;
    return;
  end if;

  -- Platform-wide daily cap: a rolling 24h ceiling on reserved-or-sent rows.
  select count(*) into v_recent
  from public.email_notifications
  where status in ('reserved', 'sent', 'sent_unknown')
    and created_at >= now() - interval '1 day';
  if p_daily_cap is not null and v_recent >= p_daily_cap then
    return query select null::uuid, null::text, 'skipped'::text;
    return;
  end if;

  -- Fresh reservation, or a retry of a previously failed one. A conflict on any
  -- other status (sent, sent_unknown, suppressed, reserved) is a duplicate and
  -- updates nothing, so RETURNING yields no row.
  insert into public.email_notifications
    (kind, owner_user_id, recipient_email_normalized, dedupe_key, status, context, run_id, reserved_at)
  values
    (p_kind, p_owner_user_id, v_email_normalized, p_dedupe_key, 'reserved', p_context, p_run_id, now())
  on conflict (kind, dedupe_key) do update
    set status = 'reserved',
        run_id = p_run_id,
        context = p_context,
        reserved_at = now(),
        error_code = null,
        attempt_count = email_notifications.attempt_count + 1
    where email_notifications.status = 'failed'
  returning id into v_id;

  if v_id is null then
    -- Duplicate: an existing non-failed row already owns this dedupe key.
    return query select null::uuid, null::text, 'skipped'::text;
    return;
  end if;

  return query select v_id, v_email, 'reserved'::text;
end;
$$;

-- Settle a reservation. 'sent' finalizes the send; 'failed_before_send' marks it
-- failed (and reservable again next run); 'unknown' holds the reservation as
-- 'sent_unknown' with requires_reconciliation set, which the reserve function's
-- retry guard (status = 'failed' only) will never re-reserve — so an unknown
-- outcome is never resent. Guarded to only act on a row still 'reserved'.
create function public.email_alert_settle(
  p_notification_id uuid,
  p_outcome text,
  p_provider text default null,
  p_provider_message_id text default null,
  p_error_code text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if p_outcome not in ('sent', 'failed_before_send', 'unknown') then
    raise exception 'invalid email settle outcome: %', p_outcome;
  end if;

  update public.email_notifications
     set status = case p_outcome
           when 'sent' then 'sent'
           when 'failed_before_send' then 'failed'
           else 'sent_unknown'
         end,
         provider = coalesce(p_provider, provider),
         provider_message_id = case when p_outcome = 'sent' then p_provider_message_id else provider_message_id end,
         requires_reconciliation = (p_outcome = 'unknown'),
         error_code = case when p_outcome = 'sent' then null else p_error_code end,
         attempt_count = attempt_count + 1,
         sent_at = case when p_outcome = 'sent' then now() else sent_at end
   where id = p_notification_id
     and status = 'reserved'
  returning status into v_status;

  return v_status;
end;
$$;

revoke execute on function public.email_alert_reserve(text, uuid, text, jsonb, text, integer) from public;
revoke execute on function public.email_alert_settle(uuid, text, text, text, text) from public;
grant execute on function public.email_alert_reserve(text, uuid, text, jsonb, text, integer) to service_role;
grant execute on function public.email_alert_settle(uuid, text, text, text, text) to service_role;

-- Honor an unsubscribe. The suppression is the authoritative cross-system stop
-- the reserve gate reads; the source opt-in flip is a best-effort courtesy so
-- the account UI agrees. Resolving the owner from the email needs auth.users,
-- so this runs as a definer rather than from the app's service client — the
-- unsubscribe route holds no owner id, only the verified email and kind.
create function public.email_unsubscribe(p_email_normalized text, p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if p_kind not in ('home_value_move', 'rate_threshold') then
    raise exception 'unknown email alert kind: %', p_kind;
  end if;

  insert into public.suppressions (channel, email_normalized, reason, source)
  values ('email', p_email_normalized, 'unsubscribe', 'email_alert_link')
  on conflict do nothing;

  select users.id into v_user_id
  from auth.users users
  where pg_catalog.lower(pg_catalog.btrim(users.email)) = p_email_normalized;

  if v_user_id is not null then
    if p_kind = 'home_value_move' then
      update public.home_profiles set notify_value_change = false where owner_user_id = v_user_id;
    else
      update public.rate_watches set notify_email = false where owner_user_id = v_user_id;
    end if;
  end if;
end;
$$;

revoke execute on function public.email_unsubscribe(text, text) from public;
grant execute on function public.email_unsubscribe(text, text) to service_role;
