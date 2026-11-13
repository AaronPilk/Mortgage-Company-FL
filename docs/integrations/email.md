# Engagement email (alerts)

The email surface sends one kind of thing: a transactional **engagement alert** to
a signed-in owner who asked for it — their home's estimated value moved, or the
market average they are watching reached the level they picked. It is never a
quote, an offer of credit, an APR, or "your rate": the software makes no credit
decision and advertises no rate of its own (invariant 2). Every send is
consent-gated, suppression-gated, carries a one-click unsubscribe, and passes the
reserve-before-spend ledger (invariant 8).

## Ports and adapters

`EmailPort` is the transport (`packages/integrations/src/email`). Three adapters,
same discipline as the CRM and rate integrations:

- `DisabledEmailPort` (default) — nothing leaves the app; a send returns a
  synthetic `disabled:<key>` id so the caller's settle path still runs.
- `FixtureEmailPort` — deterministic in-memory double for tests: records each
  send once, replays a repeated idempotency key, and can force a failure or an
  unknown outcome.
- `ResendEmailPort` — the real one, posting to Resend's `/emails` with a Bearer
  key and an `Idempotency-Key` header. The request shell (AbortController
  timeout, header set, finally-clear) and the HTTP classification
  (`classifyHttpFailure`) are shared with the CRM adapter rather than forked. A
  2xx is `sent`; 429/408/425/5xx is a retryable failure; another 4xx is terminal;
  a timeout or network throw is `unknown` — never a failure — so the ledger holds
  the reservation.

`assertEducationalCopy` is the email analog of `assertCrmPayloadSafe`: it throws
on a quote or decision phrase ("your rate", "apr", "approved", "credit score", …)
and runs over every rendered subject and body before a message is handed to the
port. A template regression fails the run instead of reaching a recipient.

## The run (portable core)

`runEmailAlerts` in `@tract/integrations` is the dependency-injected engine. It
imports no `apps/web` module, no Next, and no environment, so the Cloudflare
Worker's `scheduled` handler runs the exact same code the Next route does — the
Worker cannot call its own route, so both build the same `deps` and call the core.

Two loops:

1. **Home-value moves.** For each owner with `notify_value_change` on whose latest
   snapshot is older than `HOME_VALUE_RESNAPSHOT_INTERVAL_DAYS`, re-snapshot via
   the property (ATTOM AVM) port. If the estimate moved at least
   `HOME_VALUE_ALERT_THRESHOLD_BP` basis points of the prior value (an exact
   integer comparison — no financial figure is computed inline, invariant 1),
   reserve, send, settle.
2. **Rate thresholds.** Read the free market average once — `rateFeed().latest()`
   costs nothing, so no reservation is taken for the read. For each watcher with
   `notify_email` on and a target the average has reached, reserve, send, settle.

The emails carry no number: they state qualitatively what changed and link to the
on-site dashboard / `/mortgage-rates`, where the figure is shown with full
provenance. So an alert can never read as a value claim or an advertised rate. The
required disclosures are "an estimate, not an appraisal" and "a national survey
average, not a quote".

## The ledger (invariant 8)

`email_notifications` plus two SECURITY DEFINER functions, granted to
`service_role` only:

- `email_alert_reserve` takes a per-kind `pg_advisory_xact_lock` and, under it,
  checks the kill switches (`global`, `feature:email_alerts`), resolves the
  recipient from `auth.users`, applies the suppression gate, enforces the
  platform daily cap, and inserts a `reserved` row (retrying only a prior
  `failed` one). It returns the recipient email **only** on a fresh reservation.
- `email_alert_settle` finalizes: `sent`; `failed` (reservable again next run);
  or `sent_unknown` with `requires_reconciliation` — a **hold** the reserve
  retry guard never re-reserves, so an unknown outcome is never resent.

Idempotency is the `(kind, dedupe_key)` unique constraint: the dedupe key scopes a
home-value alert to the new snapshot's date and a rate alert to the observation
date, so two runs over the same move collapse to one send, and it is also the
provider `Idempotency-Key`. `EMAIL_ALERTS_MAX_PER_RUN` caps sends per run; the
table has RLS with a staff (operations/admin) read policy and no write policy.

Unsubscribe is HMAC-token'd (`HASH_PEPPER`), no auth: `/api/v1/email/unsubscribe`
serves the human GET link and the RFC 8058 one-click POST, writes a `suppressions`
row (the authoritative stop), and flips the source opt-in off.

## Modes (`EMAIL_MODE`, mirroring the other integrations)

- `disabled` (default) — no transport; the alert loops send nothing.
- `fixture` — deterministic double for development and tests; never sends in
  production.
- `sandbox` / `production` — the real Resend adapter; requires `RESEND_API_KEY`
  and `EMAIL_FROM`, so the environment fails to parse in a live mode without them.

`serverFeatures().emailAlerts` (from `FEATURE_EMAIL_ALERTS`) gates the whole
feature; there is no public flag — this is a backend-only surface. Each loop also
requires its own source surface to be live (`homeValueAvailable()` /
`rateWatchAvailable()`), which already refuse fixture data in production.

## Compliance posture

Sending mail on behalf of a mortgage broker is an advertising-adjacent, consent-
sensitive surface, and the business is **pre-launch and unlicensed**. It ships
**dark**: `FEATURE_EMAIL_ALERTS` is off and `EMAIL_MODE` is `disabled` by default,
so nothing sends until both are turned on and advertising/licensing review has
cleared the outreach (tracked as a gate on the readiness board). Every send is
gated on the recipient's stored email-marketing consent, checked against the
cross-system suppression list, and carries a working unsubscribe.

## What ships now vs. later

- **Now:** the `EmailPort` + adapters, the portable alert engine, the ledger
  migration (`email_notifications` + reserve/settle/unsubscribe functions), the
  token-guarded `/api/v1/internal/alerts/run` entrypoint, the unsubscribe route,
  and the Worker cron wiring.
- **Later:** additional alert kinds behind the same port and ledger, and a
  reconciliation view for held (`sent_unknown`) rows.
