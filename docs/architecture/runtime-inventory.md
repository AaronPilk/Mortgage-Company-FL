# TRACT runtime and infrastructure inventory

Audit refreshed: 2026-08-18

Scope: read-only repository, Vercel, Supabase and Cloudflare inspection plus
local verification. The audit itself changed no external data, Auth, RLS,
secret or production configuration. Claude separately deployed consumer UI
commit `e641019` while the audit was in progress.

## Hosting topology

### Cloudflare — intended canonical host

The public canonical origin is
`https://mortgage-company-fl.aaron-9c3.workers.dev`, served by Worker
`mortgage-company-fl`. `apps/web/wrangler.jsonc` points at the OpenNext artifact,
enables `nodejs_compat`, binds static assets, enables observability and declares
only the non-secret brand variable.

Five deployments are visible. The current version was created 2026-08-18 at
03:22 UTC with version id `671ea10b-2d29-4278-b9e7-0a4b7c8af8a6`. Wrangler does
not encode its Git commit, but Claude reported the upload from `e641019` and the
timing and UI match. Public probes of home, health, planner, properties, Vision,
RendProp and the new hero asset return HTTP 200.

No Worker secrets are listed. Production preflight therefore correctly refuses
a release that would claim durable lead capture or production bot protection.

Cloudflare deployment is manual:

```text
pnpm cf:build && pnpm cf:deploy
```

A GitHub push does not deploy this Worker.

### Vercel — active public duplicate

Team `TRACT Mortgage` contains one Next.js project,
`mortgage-company-fl-web`. Verified ready production deployments include:

- Git `f903d60`;
- Git `cdacd99`;
- Git `7998ede`;
- Git `e641019` (latest verified, deployment
  `dpl_WtmJkZvAjU3LSbWVMgwNURt17Jjy`).

The latest deployment exposes three `vercel.app` aliases, including
`mortgage-company-fl-web.vercel.app`, and an unauthenticated request returns HTTP 200. The rendered canonical points to the Cloudflare origin, but Vercel is still
actively hosting a second public runtime and automatically follows `main`.

This is not an approved preview-only connection and not a future migration. The
owner explicitly authorized the combined main-branch push with the automatic
Vercel deployment as a known consequence, but did not make Vercel canonical.
Disable the Vercel Git production path or make its aliases non-public. Do not
move Cloudflare production to Vercel or retain dual production architecture.

### Error 1102 disposition

The historical Worker resource-limit event has no retained Ray ID, so its exact
invocation cannot be source-attributed. It does not reproduce:

- current public Worker probes: HTTP 200;
- integrated Next production build: pass;
- integrated OpenNext Cloudflare build: pass;
- local Worker preview: 61/61 route requests, zero failures;
- local smoke timing: 10.1 ms average, 41.1 ms maximum;
- no Error 1102 response body.

No CPU limit was raised. Any recurrence returns Phase 0 to active status and must
be investigated with a Ray ID and same-window Worker logs.

## Application runtime map

| Layer              | Implementation                                  | Current behavior                                        |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------- |
| Web                | Next.js 16.3.1 / React 19                       | 46 page files, 53 registry entries, 57 generated routes |
| Cloudflare adapter | `@opennextjs/cloudflare` 1.20.2                 | One Worker server function plus static/cache assets     |
| Static/SSG         | Mortgage, calculators, legal, product education | Prerendered or generated                                |
| Dynamic public     | Properties and attributed sample tour           | Provider/request state, noindex where required          |
| Dynamic protected  | Account and admin                               | Fail closed without configured Auth/RLS                 |
| APIs               | 10 route files                                  | Node runtime, bounded/no-store, origin/auth protected   |
| Data               | Supabase/Postgres contracts                     | Locally verified; remote application schema absent      |
| Providers          | CRM, listing, AI, property data, Turnstile      | Disabled/fixture modes; no paid call required to boot   |

There is no global middleware/proxy that initializes every provider. Supabase,
CRM and AI clients are created lazily behind server boundaries.

## Supabase inventory

### Remote candidate

The connector exposes one project:

| Field      | Observed value         |
| ---------- | ---------------------- |
| Name       | `AaronPilk's Project`  |
| Reference  | `pywikpvjovaayidxyoii` |
| Region     | `us-east-2`            |
| Status     | Active and healthy     |
| PostgreSQL | 17.6.1                 |
| Created    | 2026-08-17             |

It is a plausible TRACT candidate, not a proven association. Remote structure:

- no repository migrations;
- no public application tables, policies or table triggers;
- no application Edge Functions;
- no Storage buckets, objects or object policies;
- zero Auth users, identities, SSO or SAML records;
- one public `SECURITY DEFINER` event-trigger function named
  `rls_auto_enable`, used by the enabled `ensure_rls` DDL event trigger;
- Supabase security advisor warns that `anon` and `authenticated` can execute
  that helper;
- no performance-advisor findings.

Hosted Auth provider switches, redirect allow-lists and SMTP configuration are
outside the connector's read surface and remain unverified. No publishable or
secret key was requested. No remote schema or row was changed.

### Local schema contract

Fourteen additive migrations define 38 public tables, 59 named policies and 19
current public function names. A disposable PostgreSQL 17 run applies the full
chain and passes 165 RLS, role, ownership, transaction and exact-retry
assertions.

| Recovery requirement | Local implementation                                                                    | Remaining remote/operational gap                  |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Leads                | Durable leads, browser submission mapping, bounded plans, service RPC                   | Remote schema/config absent                       |
| Consent              | Append-oriented receipts and suppressions                                               | Retention/execution unverified remotely           |
| Attribution          | First, last and conversion touches                                                      | Remote rows absent                                |
| Outbox               | Locked claim/complete RPCs, retries, dead state, webhook receipts                       | No scheduler or CRM credentials                   |
| Properties           | Entities, records and fact lineage; 19 code-owned synthetic fixtures                    | No contracted live adapter/display rights         |
| Vision               | Projects, assumption provenance, scenarios, reports and exact anonymous request mapping | Remote schema absent; no report delivery process  |
| AI jobs              | Jobs, quotas, kill switches and reserve-before-spend                                    | No orchestrator/provider enabled                  |
| Usage                | Append-oriented ledger and adjustment guard                                             | No live provider reconciliation                   |
| Content              | Items, sources, revisions, links and staff visibility                                   | No migrated reviewed publishing corpus            |
| Audit                | Immutable events and service recorder                                                   | Limited application emission                      |
| Auth/accounts        | Profile/consumer trigger, saved work, preferences and privacy requests                  | Remote Auth/redirect/email not configured         |
| RendProp             | Rights-aware project/media/job/output/tour contracts                                    | No upload, Storage or provider retention contract |
| Storage              | No bucket migration by design                                                           | Buckets/policies/scanning/retention missing       |
| Edge Functions       | None required by current Worker architecture                                            | None remotely                                     |

The Vision API now accepts bounded model inputs, runs the deterministic model on
the server and stores results with correct user/default assumption provenance.
Client-calculated figures cannot author the durable report.

## Environment contract

Names only are recorded. Values belong in approved platform stores and must
never be copied into source, docs or chat.

### Browser-safe identifiers

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_BRAND_NAME`
- `NEXT_PUBLIC_GTM_CONTAINER_ID`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Server-only secrets

- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_SECRET_KEY`
- `OUTBOX_DRAIN_TOKEN`
- `GHL_PRIVATE_INTEGRATION_TOKEN`
- `GHL_WEBHOOK_PUBLIC_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `HIGGSFIELD_API_KEY`
- `BYTEPLUS_API_KEY`
- `MLS_ACCESS_TOKEN`
- `ATTOM_API_KEY`
- `REGRID_API_KEY`
- `SHOVELS_API_KEY`
- `AIRDNA_API_KEY`
- `RESEND_API_KEY`
- `SENTRY_DSN`
- `HASH_PEPPER`

### Server-only modes, identifiers and policy

- `TURNSTILE_MODE`
- `TURNSTILE_HOSTNAMES`
- `GHL_MODE`
- `GHL_LOCATION_ID`
- `GHL_API_BASE_URL`
- `GHL_API_VERSION`
- `GHL_CUSTOM_FIELD_MAP`
- `GHL_PIPELINE_MAP`
- `AI_MODE`
- `AI_DAILY_PLATFORM_BUDGET_CENTS`
- `AI_DEFAULT_USER_DAILY_BUDGET_CENTS`
- `MLS_PROVIDER`
- `MLS_BASE_URL`
- `MLS_ATTRIBUTION_TEXT`
- `SHOW_SAMPLE_LISTINGS`
- `FEATURE_VISION`
- `FEATURE_RENDPROP`
- `FEATURE_ACCOUNTS`
- `FEATURE_PROPERTY_SEARCH`
- `EMAIL_MODE`
- `SECURE_APPLICATION_URL`

`GHL_CUSTOM_FIELD_MAP` and `GHL_PIPELINE_MAP` are parsed defensively and never
sent to the browser.

Current preflight refuses on `HASH_PEPPER`, `SUPABASE_SERVICE_ROLE_KEY`,
`TURNSTILE_MODE` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. This is a name-only local
result, not authorization to provision values.

## What exists but appears unused

- AI/provider ports, usage controls and property-data ports have no production
  caller.
- Production RendProp upload/media processing and Storage do not exist; the
  demonstration is fixture state.
- Content and audit tables have limited application write traffic.
- The protected outbox drain route has no remote scheduler.
- Account/Auth code has no proven remote project.
- The Vercel deployment is not unused: it is publicly serving and must be
  removed from the production topology.

## Verify next

1. Owner resolves the Vercel public duplicate before any Git push.
2. Owner proves the Supabase candidate identity and approves additive migration
   scope.
3. Review the Supabase security-advisor warnings before migration.
4. Verify remote Auth redirects/providers without reading credential values.
5. Provision the canonical Cloudflare environment through approved channels and
   re-run preflight.
6. Complete Phase 6 content/SEO/analytics work on the reconciled branch.

## Primary platform references

- Cloudflare Workers configuration: <https://developers.cloudflare.com/workers/wrangler/configuration/>
- Cloudflare Worker limits: <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare Worker errors: <https://developers.cloudflare.com/workers/observability/errors/>
- Supabase database linter: <https://supabase.com/docs/guides/database/database-linter>
