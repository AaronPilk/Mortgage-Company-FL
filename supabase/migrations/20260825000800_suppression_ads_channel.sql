-- Do-not-sell/share suppression channel.
--
-- The suppressions table already carries per-channel opt-outs (sms/email/call)
-- and a global 'all'. This adds an 'ads' channel for a consumer's do-not-sell or
-- do-not-share choice, distinct from contact suppression: someone may accept
-- email but refuse having their identifiers shared with an ad platform. The
-- server-side Meta Conversions dispatch consults ('all','ads') before sending,
-- so this channel is the honored signal — and a global 'all' opt-out already
-- blocks the ad send too.
--
-- The check constraint is inline and auto-named suppressions_channel_check;
-- widen it in place. No data changes — existing rows use the prior values.

alter table public.suppressions
  drop constraint if exists suppressions_channel_check;

alter table public.suppressions
  add constraint suppressions_channel_check
  check (channel in ('sms', 'email', 'call', 'all', 'ads'));
