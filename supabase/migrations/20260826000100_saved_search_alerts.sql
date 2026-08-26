-- Wave 1 — saved-search listing alerts.
--
-- A signed-in visitor who saved a property search can ask to be emailed when a
-- NEW listing matches it. This is the retention loop: it brings people back.
--
-- It reuses the engagement-email ledger from 20260825000600 rather than adding a
-- second one, so every send is still reserve-before-spend under an advisory lock
-- (invariant 8), suppression-gated, capped, and unsubscribable. This migration
-- adds the third notification kind, the opt-in + watermark columns on
-- saved_searches, a column-scoped toggle grant, a dedicated kill switch, and
-- teaches the reserve/unsubscribe functions the new kind.
--
-- It sends nothing today: there is no licensed listing provider, so the loop is
-- dark-gated on the provider key in application code (invariant 6). This holds no
-- application data, no credit fact, and no government identifier (invariant 2) —
-- only which saved search was matched for an already-consenting owner, and when.

-- (a) New notification kind on the shared ledger. The original inline column
-- check is auto-named email_notifications_kind_check; drop and re-add it.
alter table public.email_notifications drop constraint if exists email_notifications_kind_check;
alter table public.email_notifications add constraint email_notifications_kind_check
  check (kind in ('home_value_move', 'rate_threshold', 'saved_search_match'));

-- (b) Opt-in + watermark columns on saved_searches.
--   * alerts_enabled  — the consumer's consent to be emailed. Dark by default.
--   * alert_watermark — the newest listing modificationTimestamp already
--     accounted for. Null means "unseeded": the loop's first pass seeds it to
--     now() and sends nothing, so a newly enabled search is never blasted with
--     the entire existing backlog.
--   * alert_last_checked_at / alert_last_notified_at — operational bookkeeping.
alter table public.saved_searches
  add column if not exists alerts_enabled        boolean     not null default false,
  add column if not exists alert_watermark        timestamptz,
  add column if not exists alert_last_checked_at  timestamptz,
  add column if not exists alert_last_notified_at timestamptz;

-- A signed-in owner may toggle ONLY alerts_enabled on their own row. The existing
-- "owners manage saved searches" FOR ALL policy already scopes the row to
-- auth.uid() (it covers UPDATE); this column-scoped GRANT scopes which column the
-- browser key may write (invariant 4 — RLS and an application check, plus the
-- column privilege). The watermark and last_* columns stay service-role-only,
-- written by the alert loop, so a browser can never forge a baseline that would
-- suppress or replay alerts.
--
-- The REVOKE is load-bearing, not belt: Supabase grants authenticated a
-- table-wide UPDATE on every public table by default (ALTER DEFAULT PRIVILEGES),
-- so a column GRANT alone would be additive and leave summary/search_params/the
-- watermark writable. Revoking the table-level UPDATE first, then granting only
-- the column, is what actually confines the browser key to the opt-in flag. No
-- app path updates any other saved_searches column (the toggle route writes
-- alerts_enabled alone; the loop writes the watermark as service_role), so this
-- takes nothing legitimate away.
revoke update on public.saved_searches from authenticated;
grant update (alerts_enabled) on public.saved_searches to authenticated;

-- Backs the loop's candidate scan: the enabled searches are a small slice.
create index if not exists saved_searches_alerts_enabled_idx
  on public.saved_searches (owner_user_id) where alerts_enabled;

-- (c) Per-feature emergency stop for just this loop, mirroring feature:email_alerts.
-- Checked inside the reserve function under the lock, so engaging it halts new
-- saved-search sends immediately without touching the other two loops.
insert into public.kill_switches (key, scope, engaged, reason) values
  ('feature:saved_search_alerts', 'feature', false, 'Saved-search listing alerts')
on conflict (key) do nothing;

-- (d) Reserve gate: allow the new kind and honor its dedicated kill switch. Body
-- is identical to 20260825000600 except for the kind allow-list and the
-- kill-switch predicate; create-or-replace keeps the existing service_role grant.
create or replace function public.email_alert_reserve(
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
  if p_kind not in ('home_value_move', 'rate_threshold', 'saved_search_match') then
    raise exception 'unknown email alert kind: %', p_kind;
  end if;

  -- One lock per kind for the whole transaction.
  perform pg_advisory_xact_lock(pg_catalog.hashtext('email_alert:' || p_kind)::bigint);

  -- Kill switches: master stop or the shared alerts stop halts every kind; the
  -- dedicated saved-search stop halts only that kind. All evaluated in the lock.
  if exists (
    select 1 from public.kill_switches
    where engaged and (
      key in ('global', 'feature:email_alerts')
      or (p_kind = 'saved_search_match' and key = 'feature:saved_search_alerts')
    )
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

-- (e) Unsubscribe: allow the new kind and flip its source opt-in. The token is
-- per-user + kind, not per-search, so unsubscribing turns alerts off on ALL of
-- the user's saved searches. Body is identical to 20260825000600 except the kind
-- allow-list and the new branch.
create or replace function public.email_unsubscribe(p_email_normalized text, p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if p_kind not in ('home_value_move', 'rate_threshold', 'saved_search_match') then
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
    elsif p_kind = 'rate_threshold' then
      update public.rate_watches set notify_email = false where owner_user_id = v_user_id;
    else
      update public.saved_searches set alerts_enabled = false where owner_user_id = v_user_id;
    end if;
  end if;
end;
$$;

-- (f) Re-affirm invariant 5. create-or-replace preserves prior grants, so this is
-- belt to those braces: EXECUTE is never left with PUBLIC.
revoke execute on function public.email_alert_reserve(text, uuid, text, jsonb, text, integer) from public;
revoke execute on function public.email_unsubscribe(text, text) from public;
grant execute on function public.email_alert_reserve(text, uuid, text, jsonb, text, integer) to service_role;
grant execute on function public.email_unsubscribe(text, text) to service_role;
