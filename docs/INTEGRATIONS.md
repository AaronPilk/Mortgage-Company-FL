# Integrations

**As of 2026-08-18.**

Every integration, its port, its current mode, and exactly what it needs to go
live.

Three states are used throughout, and they mean different things:

| State            | Meaning                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| **implemented**  | Working now, in production, with no credential outstanding.               |
| **fixture**      | A deterministic local double. Real-looking, invented data. Not real.      |
| **unconfigured** | Code is written and tested. No credential is set. Delivers nothing today. |

"Built" is not a state. A built-but-unconfigured integration delivers nothing.

Every integration follows the same pattern (`CLAUDE.md`, "Adding an
integration"): define the port first, then the disabled adapter, then the fixture
adapter, then the real one. A live mode must require its credential or the
environment fails to parse.

---

## Summary

| Integration          | Port                                 | Adapters present                           | Current mode            | Blocks                                                               |
| -------------------- | ------------------------------------ | ------------------------------------------ | ----------------------- | -------------------------------------------------------------------- |
| GoHighLevel (CRM)    | `CrmPort`                            | Disabled, Fixture, **Ghl (real)**          | **unconfigured**        | CRM delivery only. Lead capture works.                               |
| MLS listings         | `ListingProvider`                    | Disabled, Fixture. **No real adapter.**    | **fixture**             | Real listings. Marketplace UI works.                                 |
| AI providers         | `AiProvider`                         | Disabled, Fixture. **No real adapter.**    | **unconfigured**        | RendProp media, Vision narrative/imagery. **Not the Vision engine.** |
| Cloudflare Turnstile | `verifyTurnstile`                    | disabled / fixture / sandbox / production  | **unconfigured**        | Production readiness. Preflight refuses.                             |
| Property data        | 8 ports (see below)                  | Fixture only                               | **unconfigured**        | Verified property facts in Vision.                                   |
| Supabase             | n/a — direct client                  | Request-scoped and service clients written | **no verified project** | Durable lead receipts.                                               |
| Email (Resend)       | Mode variable only                   | Not built out                              | **unconfigured**        | Transactional email.                                                 |
| Sentry               | DSN variable only                    | Not wired                                  | **unconfigured**        | Error reporting.                                                     |
| Analytics (GTM)      | `@tract/analytics` closed vocabulary | Guard implemented                          | **unconfigured**        | Measurement. Consent-gated regardless.                               |
| POS / LOS            | n/a                                  | `/apply` refuses to collect while unset    | **vendor not selected** | Applications. Highest-leverage open decision.                        |

---

## GoHighLevel — marketing CRM

| Field         | Value                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| Port          | `CrmPort` — `packages/integrations/src/crm/port.ts`                           |
| Adapters      | `DisabledCrmAdapter`, `FixtureCrmAdapter`, `GhlCrmAdapter`                    |
| Worker        | `processOutboxRow` — `packages/integrations/src/crm/outbox.ts`                |
| Webhook       | `packages/integrations/src/crm/webhook.ts`, route `POST /api/v1/webhooks/ghl` |
| Mode variable | `GHL_MODE`                                                                    |
| Current mode  | **unconfigured**                                                              |
| Docs          | `docs/integrations/ghl.md`                                                    |

**The boundary, and it is enforced in code.** The CRM is a projection of
application truth. It is never the system of record (ADR-002). It receives
marketing lead fields only — no government identifier, no account number, no
income documentation, no upload. No status that implies a credit decision may be
added to the marketing schema.

**What works today without it.** The lead, its consent receipt, its attribution,
and an outbox row are written in one database transaction. The consumer gets a
receipt immediately. A CRM outage delays a projection; it never loses a lead.

**What does not work.** Nothing drains `integration_outbox`.

**To go live:**

1. Create the private integration in GoHighLevel.
2. Set `GHL_MODE=production` plus `GHL_PRIVATE_INTEGRATION_TOKEN`,
   `GHL_LOCATION_ID`, `GHL_CUSTOM_FIELD_MAP`, `GHL_PIPELINE_MAP`,
   `GHL_WEBHOOK_PUBLIC_KEY`. `GHL_API_BASE_URL` and `GHL_API_VERSION` have
   defaults.
3. **Deploy the outbox worker.** It needs a Cloudflare Queue consumer or a cron
   Worker with a provisioned binding. Setting credentials alone starts nothing.

`GHL_CUSTOM_FIELD_MAP` and `GHL_PIPELINE_MAP` are JSON maps held as configuration
rather than code, so a CRM rebuild is a variable change rather than a deploy.

Retry behaviour: bounded exponential backoff, `MAX_OUTBOX_ATTEMPTS = 6`, then
dead-letter. A 4xx is terminal and never retried. Replay from `/admin/jobs`
requires a stated reason and writes an audit record.

---

## MLS listings

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Port          | `ListingProvider` — `packages/integrations/src/listings/port.ts`                       |
| Adapters      | `DisabledListingProvider`, `FixtureListingProvider`. **No contracted adapter exists.** |
| Selection     | `apps/web/lib/listings.ts`                                                             |
| Mode variable | `MLS_PROVIDER` — `disabled` \| `fixture` \| `stellar` \| `bridge` \| `mlsgrid`         |
| Current mode  | **fixture** — 19 invented records                                                      |
| Docs          | `docs/integrations/mls.md`                                                             |

Selecting `stellar`, `bridge`, or `mlsgrid` today returns
`DisabledListingProvider`. The contracted adapters are deliberately not written
against a guess at the API; they are written against real credentials and the
actual display agreement.

**Three independent protections against publishing invented listings:**

1. **Database constraint.** `listing_records` carries
   `check (not (is_fixture and published))` (ADR-006). Configuration drifts and
   environments get copied; this cannot be bypassed by a variable.
2. **Two-switch configuration.** `MLS_PROVIDER=fixture` **and**
   `SHOW_SAMPLE_LISTINGS=true` **and** `FEATURE_PROPERTY_SEARCH=true`. See
   `docs/handoff/DECISIONS.md` D-4.
3. **Labelling and crawl control.** Every record is labelled sample data in the
   UI; `/api/v1/properties/search` returns `sampleData.containsSampleData` and a
   per-record `isSampleData`; `/properties` and every `/properties/[listingKey]`
   are `noindex`; and **no listing JSON-LD is emitted** (D-5).

**To go live:** an executed data **and display** agreement, then
`MLS_BASE_URL`, `MLS_ACCESS_TOKEN`, `MLS_ATTRIBUTION_TEXT`, a written contracted
adapter, the display rules recorded in configuration, and `MLS_PROVIDER` set to
the provider. **Delete `SHOW_SAMPLE_LISTINGS` at that point** — it has no
remaining purpose and is a loaded gun if left.

Note also `apps/web/next.config.ts`: `images.remotePatterns` is empty. Remote MLS
imagery is added there only once a display agreement permits it.

---

## AI providers

| Field         | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Port          | `AiProvider` — `packages/integrations/src/ai/port.ts`                |
| Adapters      | `DisabledAiProvider`, `FixtureAiProvider`. **No real adapter.**      |
| Budget        | `packages/integrations/src/ai/budget.ts`, `reserve_ai_budget` in SQL |
| Mode variable | `AI_MODE`                                                            |
| Current mode  | **unconfigured**                                                     |
| Docs          | `docs/integrations/ai-providers.md`                                  |

`DisabledAiProvider` declares no capabilities and throws `AiPolicyError` on every
request, so a misconfiguration cannot spend money.

**What this blocks:** RendProp media transformation, and Vision's narrative and
imagery adapters.

**What this does NOT block: the Vision scenario engine.** `packages/vision-model`
is deterministic arithmetic — no network call, no model call, no clock, no
randomness (ADR-004, `docs/handoff/DECISIONS.md` D-6). It produces low/base/high
ranges and works fully today with no provider configured. Do not describe Vision
as blocked on AI.

**Already built:** budget reservation under a row lock, `quota_policies`,
`usage_ledger`, seven seeded `kill_switches` (global, per-feature, per-provider),
reconciliation state for unknown provider outcomes, and output validation with a
single repair attempt.

**To go live:** provider accounts, an approved data map, and a stated retention
position for each model. Then `AI_MODE`, the relevant key
(`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `HIGGSFIELD_API_KEY`,
`BYTEPLUS_API_KEY`), `AI_DAILY_PLATFORM_BUDGET_CENTS`,
`AI_DEFAULT_USER_DAILY_BUDGET_CENTS`, and rows in `quota_policies`. A model route
registry and data-class enforcement already exist; classify anything new against
`docs/security/data-classification.md`.

---

## Cloudflare Turnstile

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Implementation | `verifyTurnstile` — `packages/integrations/src/turnstile.ts`            |
| Mode variable  | `TURNSTILE_MODE` — `disabled` \| `fixture` \| `sandbox` \| `production` |
| Current mode   | **unconfigured**                                                        |

Server-side verification that fails closed. Fixture mode produces both outcomes.
The widget mount point is on every lead form. It is step 7 in the lead endpoint's
ordered checks — after the free checks, because it is a network call.

`assertProductionReady` refuses a deploy while `TURNSTILE_MODE` is `disabled` or
`fixture`.

**To go live:** `TURNSTILE_MODE=production`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
`TURNSTILE_SECRET_KEY`. The environment schema requires the secret once the mode
is `sandbox` or `production`.

`https://challenges.cloudflare.com` is already allowed in `script-src`,
`connect-src`, and `frame-src` in the CSP.

---

## Property data providers

Eight ports in `packages/integrations/src/property/ports.ts`:

| Port                   | Intended provider  | Adapter present |
| ---------------------- | ------------------ | --------------- |
| `ParcelPort`           | Regrid             | Fixture only    |
| `PermitPort`           | Shovels            | Fixture only    |
| `FloodPort`            | FEMA / provider    | Fixture only    |
| `ZoningPort`           | Regrid / municipal | Fixture only    |
| `SaleComparablePort`   | ATTOM              | Fixture only    |
| `RentalComparablePort` | ATTOM / provider   | Port only       |
| `ShortTermRentalPort`  | AirDNA             | Port only       |
| `ConstructionCostPort` | RSMeans            | Fixture only    |

**Current mode: unconfigured.** All contract-gated.

A provenance wrapper refuses a value with no stated limitations — a property fact
without a source and its caveats cannot enter the system.

**To go live:** contracts, then `ATTOM_API_KEY`, `REGRID_API_KEY`,
`SHOVELS_API_KEY`, `AIRDNA_API_KEY`, and a real adapter per port.

Docs: `docs/integrations/property-data.md`.

---

## Supabase

| Field         | Value                                                         |
| ------------- | ------------------------------------------------------------- |
| Clients       | `apps/web/lib/supabase.ts` — request-scoped and service       |
| Migrations    | `supabase/migrations/` — nine files, 31 tables                |
| Verification  | `pnpm db:verify` — 123 RLS assertions against real PostgreSQL |
| Current state | **No live project association was verified in this session.** |

No project ref, project URL, or organisation is recorded anywhere in this
repository, and none was confirmed. Do not assume one exists. If a hosted project
does exist, its ref is not known here.

**To go live:** create the project, apply all nine migrations in filename order,
then set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY`.

The anon key is designed to be public; row level security is what protects the
data, which is why every table has policies and executed assertions.
`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — its exposure is a data incident, not a
configuration error.

`assertProductionReady` refuses a deploy while `SUPABASE_SERVICE_ROLE_KEY` is
unset: without a database there is no durable lead receipt, and invariant 3 says
never return success without one.

---

## Email

| Field         | Value            |
| ------------- | ---------------- |
| Mode variable | `EMAIL_MODE`     |
| Credential    | `RESEND_API_KEY` |
| Current mode  | **unconfigured** |

The mode variable exists in the schema. A port and adapters are **not** built
out. This is genuinely unimplemented, not merely unconfigured.

Beyond the credential, sending needs provider selection, A2P 10DLC registration
for SMS, approved templates, quiet hours, and workflow review — see
`docs/build/blocked-items.md`.

---

## Sentry

| Field         | Value            |
| ------------- | ---------------- |
| Credential    | `SENTRY_DSN`     |
| Current state | **unconfigured** |

The variable exists and is classified as a secret. Wiring is not done.

Cloudflare Worker observability is enabled in `apps/web/wrangler.jsonc` and is
what is actually available for production diagnostics today.

---

## Analytics

| Field         | Value                          |
| ------------- | ------------------------------ |
| Package       | `@tract/analytics`             |
| Guard         | `inspectEvent`                 |
| Credential    | `NEXT_PUBLIC_GTM_CONTAINER_ID` |
| Current state | **unconfigured**               |

A closed vocabulary (ADR-007). `inspectEvent` rejects an unknown event name, a
prohibited parameter key in either casing, any value that looks like an email,
phone number, or government identifier, and any string over 200 characters. It
throws in development and test and drops in production. A dropped metric is
recoverable; borrower data in an ad platform is not.

**Do not add a bypass.** Invariant 7.

The tag is consent-gated and never loads before a choice is made.

---

## POS / LOS

| Field         | Value                    |
| ------------- | ------------------------ |
| Variable      | `SECURE_APPLICATION_URL` |
| Current state | **Vendor not selected.** |

While unset, `/apply` tells the visitor that applications are not open rather
than collecting anything. That is the whole behaviour, and it is deliberate:
invariant 2 says a marketing form is not an application — no government
identifier, no account number, no income documentation, no file upload, ever,
anywhere on this site.

This is the highest-leverage open business decision in the project. It determines
the application boundary in practice, the disclosure responsibility matrix with
each lender, and what the CRM may and may not hold.
