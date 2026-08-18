# Security and cost controls

**As of 2026-08-18.**

What is in place, where it lives, and what state it is in. Related: the ten
invariants in `CLAUDE.md`, `docs/security/threat-model.md`,
`docs/security/data-classification.md`, `docs/security/secrets.md`, and
`docs/security/incident-runbook.md`.

Several controls below are **implemented but unconfigured** — Turnstile in
particular. Those are marked. An implemented control that is not configured
protects nothing.

---

## The lead endpoint: ordered checks

`POST /api/v1/leads` (`apps/web/app/api/v1/leads/route.ts`). The order is
deliberate — cheap checks first, network calls last.

| #   | Check                   | Purpose                                                               |
| --- | ----------------------- | --------------------------------------------------------------------- |
| 1   | Method and content type | Reject obviously wrong shapes cheaply.                                |
| 2   | Body size cap           | 16 KB, **before** parsing, so a large body costs nothing.             |
| 3   | Origin check            | A cross-site POST is never legitimate here. A missing `Origin` fails. |
| 4   | Anonymous rate limit    | Before any expensive work.                                            |
| 5   | Schema validation       | Unknown keys are stripped, not stored.                                |
| 6   | Honeypot                | Free bot signal, checked **before** Turnstile.                        |
| 7   | Turnstile               | A network call, so it comes after every free check.                   |
| 8   | Contact normalisation   | Deterministic dedupe and suppression keys.                            |
| 9   | Per-contact rate limit  | Needs the normalised contact to be meaningful.                        |
| 10  | Single transaction      | Lead + consent receipt + attribution + outbox row.                    |
| 11  | Fast response           | The consumer never waits on the CRM.                                  |
| 12  | Asynchronous CRM sync   | Drained from the outbox by a worker.                                  |

The progressive planner at `/plan` posts to this same endpoint with an optional
`planner` object. It widens what step 10 writes and **moves nothing** in the
order (`docs/handoff/DECISIONS.md` D-7).

The endpoint **fails closed**. If the database is unreachable it returns
`INTEGRATION_UNAVAILABLE` / 503. Do not add a fallback that returns success
without a durable write — invariant 3.

---

## Rate limits

**Implementation:** `apps/web/lib/rate-limit.ts`.

| Surface                         | Window | Limit | Dimension              |
| ------------------------------- | ------ | ----: | ---------------------- |
| `POST /api/v1/leads`            | 10 min |    12 | Per network bucket     |
| `POST /api/v1/leads`            | 60 min |     3 | Per normalised contact |
| `GET /api/v1/properties/search` | 60 s   |    30 | Per network bucket     |

Two dimensions on the lead endpoint, on purpose. A single global IP limit is not
enough in either direction: legitimate users share IPs, and attackers distribute
traffic. The per-contact bucket is what stops a distributed script from
re-submitting the same person hundreds of times.

**Known limitation.** `MemoryRateLimitStore` is in-process. It is correct for a
single instance and wrong for a horizontally scaled Worker. The `RateLimitStore`
interface is already abstracted, so replacing the backing store with KV or a
Durable Object does not touch the routes. Cloudflare edge rate-limiting rules are
the other half of this and are configured at the platform, not in code.

---

## Turnstile

**Implemented. Unconfigured.**

`verifyTurnstile` in `packages/integrations/src/turnstile.ts`. Server-side
verification that fails closed. Fixture mode produces both outcomes. The widget
mount point is on every lead form.

`TURNSTILE_MODE` is `disabled` by default. `assertProductionReady` refuses a
deploy while the mode is `disabled` or `fixture`, so this cannot be forgotten
into production silently. The environment schema requires
`TURNSTILE_SECRET_KEY` once the mode is `sandbox` or `production`.

`https://challenges.cloudflare.com` is enumerated in `script-src`, `connect-src`,
and `frame-src` in the CSP.

---

## Honeypot

A hidden field on the lead form. A non-empty value rejects the submission as
`rejected_honeypot` with a generic `BAD_REQUEST` — the response does not tell the
caller which check it failed.

It is checked at step 6, before Turnstile, because it costs nothing and Turnstile
costs a round trip.

---

## Quotas, budgets, and reserve-before-spend

**Invariant 8: reserve spend before calling a provider. Under a lock. An unknown
outcome holds the reservation.**

### `reserve_ai_budget`

`supabase/migrations/20260817000600_ai_jobs_and_quotas.sql`. In one transaction:

1. Check the **global** kill switch. Engaged → refuse.
2. Check the **feature** kill switch. Engaged → refuse.
3. `SELECT ... FOR UPDATE` on the matching `quota_policies` row — this is the
   lock. Without it, two concurrent requests both read "budget available" and
   both spend it.
4. Sum reserved plus charged usage from `usage_ledger` over the policy period,
   plus in-flight jobs from `ai_jobs`.
5. Refuse, or create the job and its reserve ledger entry.

It returns `null` on refusal, so **the caller never learns how much budget
remains**. That is deliberate: a remaining-budget number is a probing oracle.

### `rendprop_claim_job`

`supabase/migrations/20260817000900_rendprop.sql`. The same invariant, in the
worker path, in this order:

1. Kill switches.
2. Claim a queued job with `FOR UPDATE SKIP LOCKED`, so two workers cannot take
   the same job.
3. Reserve spend through `reserve_ai_budget`, which takes the quota lock.
4. **Only then** does the caller have permission to call a provider.

A quota denial does not fail the job. It pushes `next_attempt_at` out and leaves
the job queued — "over quota right now" is not the same fact as "this work is
impossible".

### Unknown outcomes

A job whose provider outcome is ambiguous sets `requires_reconciliation` and the
reservation is **held, not released**. Holding it overstates spend until a human
reconciles; releasing it understates spend against a charge the provider may
still bill. Overstating is the safe direction (ADR-008). `/admin/usage` separates
reserved from charged.

### Budget variables

`AI_DAILY_PLATFORM_BUDGET_CENTS`, `AI_DEFAULT_USER_DAILY_BUDGET_CENTS`. Both
default to **0**, so a provider configured without a budget spends nothing.

### Job durability controls

`rendprop_processing_jobs` carries: a unique `idempotency_key` stable across
retries (a retry of the same logical work cannot buy the same output twice),
`attempt_count` / `max_attempts` (default 4, capped at 10), `next_attempt_at`,
`lease_expires_at`, `locked_by`, `locked_at`, and a
`rendprop_failure_is_explained` constraint requiring an `error_code` on a failed
job. Provider error text is stored redacted only — a raw provider error can echo
the prompt back.

---

## Kill switches

Table `kill_switches`, seeded with seven rows:

| Key                      | Scope    |
| ------------------------ | -------- |
| `global`                 | global   |
| `feature:vision_report`  | feature  |
| `feature:rendprop_media` | feature  |
| `provider:openai`        | provider |
| `provider:anthropic`     | provider |
| `provider:higgsfield`    | provider |
| `provider:byteplus`      | provider |

Engaging `global` causes `reserve_ai_budget` to refuse every new reservation
immediately. Only `admin` may write them; `operations` and `admin` may read.

Feature flags are a separate, coarser control: `FEATURE_VISION`,
`FEATURE_RENDPROP`, `FEATURE_ACCOUNTS`, `FEATURE_PROPERTY_SEARCH`. The browser
receives derived booleans only, never the raw values.

---

## Row level security

**Invariant 4: RLS and an application check. Both.**

RLS is the backstop that survives an application bug. The application check
produces a correct error page instead of a confusing empty table, and stops a
mutation from being attempted at all (ADR-005).

- RLS is enabled on **every table** in the `public` schema. The RLS suite asserts
  this as its own check.
- `scripts/rls-tests.sql` executes the policies against real PostgreSQL as each
  role: **123 assertions, all passing** as of 2026-08-18.
- A new table gets policies **and** assertions in the same change.

**Invariant 5: revoke function `EXECUTE` from `PUBLIC`, not just from `anon` and
`authenticated`.** PostgreSQL grants it to `PUBLIC` by default. Writing the RLS
suite caught this exact mistake three times — `create_lead_with_receipt`,
`reserve_ai_budget`, and `record_audit_event` were all callable by any
authenticated user.

Every security-definer function sets `search_path = ''` and is granted only to
`service_role`.

### Append-only audit

`audit_events` has a `before update or delete` trigger that raises
`audit_events is append-only`. Even a privileged connection cannot rewrite
history through an ordinary statement. There is no update or delete path.

`lead_planner_responses` has **no** insert, update, or delete policy at all — it
is written once by `create_lead_with_planner_response` and is not editable
through an ordinary session.

`rendprop_generated_assets` freezes the disclosure label, the `ai_generated`
flag, the source asset, the transformation, the storage key, and the lineage on
update. Approval is the only field a later UPDATE may move. Without that trigger,
"approve" could quietly become "approve and relabel as a photograph".

---

## Content Security Policy and headers

`apps/web/next.config.ts`. The CSP enumerates every third-party origin, so a new
tag forces a conversation before it can load.

```
default-src 'self'
script-src 'self' 'unsafe-inline' [+ 'unsafe-eval' in development only]
           https://challenges.cloudflare.com https://www.googletagmanager.com
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https:
font-src 'self' data:
connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com
            https://www.google-analytics.com
frame-src https://challenges.cloudflare.com
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests
```

Other headers on every response:

| Header                       | Value                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `X-Content-Type-Options`     | `nosniff`                                                                          |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                                                  |
| `Permissions-Policy`         | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` |
| `Cross-Origin-Opener-Policy` | `same-origin`                                                                      |
| `X-Frame-Options`            | `DENY`                                                                             |
| `Strict-Transport-Security`  | `max-age=63072000; includeSubDomains; preload` — production only                   |

Per-path:

| Path         | Headers                                                                                 |
| ------------ | --------------------------------------------------------------------------------------- |
| `/api/*`     | `Cache-Control: no-store, no-cache, must-revalidate`, `X-Robots-Tag: noindex, nofollow` |
| `/admin/*`   | `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`                            |
| `/account/*` | `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`                            |

`images.remotePatterns` is **empty**. No remote image origin is permitted until a
display agreement allows it.

**Known limitation.** `script-src` includes `'unsafe-inline'` — a documented
Next.js exception. A nonce-based policy is the follow-up. Camera is off globally;
the RendProp capture route re-enables it explicitly behind its flag when that
ships.

---

## Personal data handling

**Invariant 2: a marketing form is not an application.** No government
identifier, no account number, no income documentation, no file upload — ever,
anywhere on this site. No status implying a credit decision may be added to the
marketing schema.

**IP addresses are never stored in the clear.** `apps/web/lib/request-context.ts`
truncates IPv4 to `/24` and IPv6 to `/48`, peppers it, hashes with SHA-256, and
stores 32 hex characters. One household is one bucket. The prefix hash is enough
to rate limit and to spot abuse, and cannot be reversed into a subscriber.

`dedupeHash` is peppered so the stored hash is not a rainbow-table lookup.

**Invariant 7: no personal data to analytics.** `inspectEvent` in
`@tract/analytics` rejects an unknown event name, a prohibited parameter key in
either casing, any value that looks like an email, phone number, or government
identifier, and any string over 200 characters. It throws in development and test
and drops in production (ADR-007). **Do not add a bypass.**

Consent receipts record the exact disclosure version and a SHA-256 of the
disclosure text shown, the form version, the request id, the IP prefix hash, and
the user-agent family — so the ledger can say what a specific person was actually
shown.

---

## Secret handling

**Invariant 9: secrets are `server-only`. No `NEXT_PUBLIC_` secret, ever.**

| Mechanism                          | What it enforces                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `import "server-only"`             | Pulling `apps/web/lib/env.ts` into a client component is a **build error**, not a convention.                          |
| `no-restricted-syntax` ESLint rule | Reading a secret-shaped `process.env` key outside `lib/env.ts` fails lint.                                             |
| `SECRET_ENV_KEYS`                  | The explicit list of keys that must never appear in a bundle, a log line, or an error body.                            |
| `scripts/check-site-url.mjs`       | Fails `cf:build` if any non-`NEXT_PUBLIC_` key appears in the committed `.env.production`, printing the **name** only. |
| `scripts/deploy-preflight.ts`      | Prints the **name** of a misconfigured variable. Never a value.                                                        |
| `.github/workflows/ci.yml`         | Uses **no** repository secrets. Untrusted pull-request code never runs with production credentials.                    |

Secrets are set with `wrangler secret put <NAME>`. Never in `wrangler.jsonc`,
never in a committed file, never in a fixture.

`assertProductionReady` refuses a deploy while `HASH_PEPPER` is the recognisable
development default. Rotating `HASH_PEPPER` resets dedupe and rate-limit buckets
— expect a short window of duplicate leads, which is the correct tradeoff.

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Treat its exposure as a data incident,
not a configuration error: rotate at the provider first, then update the secret
binding, then check `audit_events` for privileged actions in the window.

---

## Webhook verification

`POST /api/v1/webhooks/ghl`. Ed25519 signature verification against
`GHL_WEBHOOK_PUBLIC_KEY`, replay protection, and deduplication backed by the
`webhook_receipts` table.

---

## Things that must not happen

- No secret in a `NEXT_PUBLIC_` variable, a log line, an error body, or a fixture.
- No borrower personal information in git, an issue title, a commit message, a
  URL, an analytics event, or a prompt.
- No fixture listing data published. The database constraint blocks it; do not
  work around it.
- No production provider call, message send, or paid AI request from a test.
- No deploy, publish, message to a real person, contact import, spend, or
  production account mutation without explicit approval.
