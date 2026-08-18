# Blockers

**As of 2026-08-18.**

Five items. Every one is external. **None of them can be solved by writing
code** — the code side of each is already built, tested, and waiting on a switch.

Each entry states the smallest concrete action that clears it and who can do it.

---

## 1. Push to the canonical repository is blocked

| Field               | Value                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Hard blocker. Nothing from this session is live.                                                                                             |
| **What**            | The sandbox git proxy denies writes to this repository. Reads work.                                                                          |
| **Error**           | HTTP 403 — "not in this session's authorized repository set"                                                                                 |
| **Where**           | Four commits on `claude/tract-autonomous-build-20260817`                                                                                     |
| **Smallest action** | The repository owner pulls or recreates the branch and pushes it, then merges to `main`. Cloudflare deploys automatically on push to `main`. |
| **Who**             | Aaron (repository owner). One person, one minute.                                                                                            |

**Everything else in this document is downstream of this one.** The work exists
and passes its full verification suite; it simply is not on `main`.

The four commits, oldest first:

| Commit    | Summary                                          |
| --------- | ------------------------------------------------ |
| `7eafc51` | Five calculators and five loan programs          |
| `14effc2` | Property marketplace and the TRACT Vision engine |
| `b5c1f3a` | Progressive mortgage planner at `/plan`          |
| `f7ab61c` | RendProp workflow with an enforced job model     |

---

## 2. No MLS credentials

| Field               | Value                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Blocks real listings. Does **not** block the marketplace UI.                                                               |
| **What**            | Listings come from a labelled fixture provider — 19 invented records in `packages/integrations/src/listings/fixtures.ts`.  |
| **Needs**           | An executed data **and display** agreement with Stellar MLS or an approved aggregator (MLS Grid, Bridge).                  |
| **Smallest action** | Execute the agreement, obtain `MLS_BASE_URL`, `MLS_ACCESS_TOKEN`, and the required `MLS_ATTRIBUTION_TEXT`.                 |
| **Who**             | The principal loan originator or a broker principal — an MLS agreement requires a licensed party. Not an engineering task. |

**Already built, so this is a switch and one adapter rather than a project:** a
provider-neutral `ListingProvider` port, a fixture provider, a normalised
property model with source lineage, attribution and status handling, unpublish
logic, and a database constraint on `listing_records`
(`check (not (is_fixture and published))`) that makes publishing fixture data
impossible regardless of configuration (ADR-006).

**Remaining engineering after the contract lands:** write the contracted adapter
against the real API, record the display rules in configuration, then set
`MLS_PROVIDER` to the provider, `FEATURE_PROPERTY_SEARCH=true`, and **remove**
`SHOW_SAMPLE_LISTINGS` (see `docs/handoff/DECISIONS.md`, D-4 and D-5).

---

## 3. No AI provider configured

| Field               | Value                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Blocks RendProp media transformation and Vision narrative/imagery only.                                                                                                                |
| **Does NOT block**  | **The Vision scenario engine.** It is deterministic arithmetic and works fully today with no provider.                                                                                 |
| **Needs**           | Provider accounts, an approved data map, and a stated retention position for each model chosen.                                                                                        |
| **Smallest action** | Open the accounts, agree retention terms, then set `AI_MODE`, the provider key, `AI_DAILY_PLATFORM_BUDGET_CENTS`, `AI_DEFAULT_USER_DAILY_BUDGET_CENTS`, and populate `quota_policies`. |
| **Who**             | Founders for the commercial and retention decision; engineering for the wiring afterwards.                                                                                             |

Make the distinction in the second row loudly whenever this comes up. "Vision is
blocked on AI" is wrong and has been wrong since the engine was written.

**Already built:** the `AiProvider` port, a `DisabledAiProvider` that refuses
every request so a misconfiguration cannot spend money, a deterministic
`FixtureAiProvider`, budget reservation under a row lock (`reserve_ai_budget`),
`quota_policies`, seven seeded `kill_switches` (global, per-feature,
per-provider), a `usage_ledger`, reconciliation state, and output validation with
a single repair attempt.

Relevant variable names only: `AI_MODE`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
`HIGGSFIELD_API_KEY`, `BYTEPLUS_API_KEY`.

---

## 4. No GoHighLevel credentials

| Field               | Value                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**          | Blocks CRM delivery. Does **not** block lead capture.                                                                                                                                                        |
| **What**            | Leads are written durably first-party and queued in `integration_outbox`. Nothing drains the queue.                                                                                                          |
| **Needs**           | A private integration token, location id, custom field map, pipeline map, and the webhook public key.                                                                                                        |
| **Smallest action** | Create the private integration in GoHighLevel, then set `GHL_MODE=production` plus `GHL_PRIVATE_INTEGRATION_TOKEN`, `GHL_LOCATION_ID`, `GHL_CUSTOM_FIELD_MAP`, `GHL_PIPELINE_MAP`, `GHL_WEBHOOK_PUBLIC_KEY`. |
| **Who**             | Whoever administers the GoHighLevel account.                                                                                                                                                                 |

**Already built:** the typed `CrmPort`, three adapters (disabled, fixture, real),
`processOutboxRow` with retry classification and bounded backoff
(`MAX_OUTBOX_ATTEMPTS = 6`), idempotency keys, a webhook verifier with replay and
dedupe protection backed by `webhook_receipts`, and a health view at
`/admin/integrations`.

**Separate engineering item, and it is real:** the outbox worker has no scheduled
trigger. `processOutboxRow` is implemented and unit-tested, but it needs a
Cloudflare Queue consumer or a cron Worker with a provisioned binding. Setting
the credentials alone will not start delivery.

**Boundary, enforced in code:** the CRM is a projection of application truth and
is never the system of record (ADR-002). It receives marketing lead fields only —
no government identifier, no account number, no income documentation, no upload.
See `docs/integrations/ghl.md`.

---

## 5. Licence identifiers not yet issued

| Field               | Value                                                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Blocks launch entirely. Not a technical blocker — a regulatory one.                                                                                                                       |
| **What**            | `businessIdentity.nmlsId` and `companyLicenseId` are `null` in `apps/web/lib/site.ts`. The UI renders a visible "pending issuance" state. `licensingStatus` drives the pre-launch banner. |
| **Needs**           | Every gate in `docs/compliance/launch-gates.md` under "Licensing".                                                                                                                        |
| **Smallest action** | There is no small action. The nearest first step is: form the legal entity and create the company NMLS record.                                                                            |
| **Who**             | The principal loan originator, with counsel. **Nothing in code can close these.**                                                                                                         |

The design is deliberate (ADR-009): there is no code path that can render a
plausible-looking placeholder licence number. JSON-LD builders omit a null rather
than emitting an empty string, the `Organization` node only becomes a
`FinancialService` once a real public address exists, and an end-to-end test
asserts no structured-data block contains `NMLS #`.

Do not describe any person as "getting the mortgage broker licence".
`launch-gates.md` separates twelve distinct licensing items that are easy to
conflate — the company licence, an individual MLO licence, and the principal loan
originator designation are three different things and one does not imply another.

**While any licensing gate is blocked:** no application may be accepted, no
credit pulled, no rate or term quoted or negotiated, and no prequalification or
preapproval issued.

---

## Not blockers, but tracked

These are engineering follow-ups. They do not need an external party.

| Item                       | Why it matters                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Outbox worker trigger      | Without it, `integration_outbox` never drains even once GoHighLevel is configured.                                         |
| Shared-store rate limiting | `MemoryRateLimitStore` is per-instance. Needs KV or a Durable Object before scale.                                         |
| CSP nonce                  | `'unsafe-inline'` for scripts is a documented Next.js exception, not a permanent one.                                      |
| Missing image assets       | Manifest icons, the JSON-LD logo, and the default OG image are referenced and 404. See `docs/ASSET_MANIFEST.md`.           |
| Accessibility audit        | A full axe run and measured Lighthouse numbers should be recorded, not claimed.                                            |
| POS / LOS selection        | `/apply` refuses to collect anything while `SECURE_APPLICATION_URL` is unset. The highest-leverage open business decision. |
