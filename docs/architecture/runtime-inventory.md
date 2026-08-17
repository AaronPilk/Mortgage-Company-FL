# TRACT runtime and infrastructure inventory

Audit date: 2026-08-17  
Scope: read-only repository, Vercel, Supabase and Cloudflare inspection. No deployment, data, Auth, RLS, secret or production configuration was changed.

## Hosting architecture

Cloudflare remains the canonical application host. The public origin is `mortgage-company-fl.aaron-9c3.workers.dev`, built by OpenNext and served by Worker `mortgage-company-fl`. The committed `apps/web/wrangler.jsonc` points to `.open-next/worker.js`, enables `nodejs_compat`, binds static assets, enables observability and sets only the non-secret brand variable.

Three Worker deployments are visible on 2026-08-17 at 20:31, 21:34 and 22:18 UTC. They use the same compatibility date, compatibility flag and visible non-secret binding shape. The active artifact was deployed after the historical Error 1102 audit.

No Worker secrets are currently listed. Production preflight therefore correctly refuses a release that would claim durable lead capture or production bot protection.

### Error 1102 disposition

Cloudflare documents Error 1102 as an exceeded CPU-time or memory limit. The historical event has no retained Ray ID or accessible historical error record, so the exact old invocation cannot be attributed to a source line.

The current artifact is operationally stable:

- OpenNext build: pass;
- Wrangler dry run: 7,375.99 KiB uncompressed and 1,432.60 KiB gzip;
- local startup profile: 15.1 ms active CPU in a 70.7 ms profile window;
- local OpenNext route smoke: 50/50 successful;
- public Worker route smoke: 50/50 successful;
- live error-only tail during production probes: no error event.

No CPU limit was raised and no Worker setting was changed. `pnpm smoke:routes` is now a release gate; any Error 1102 recurrence returns Phase 0 to active status.

## Vercel inventory

The visible TRACT-related Vercel project is `mortgage-company-fl-web`. Its latest observed deployment is labelled Production, is protected by Vercel authentication and is associated with the latest GitHub commit. The protected deployment URL is `mortgage-company-fl-9tjimazro-fam-link-v1-s-projects.vercel.app`.

This deployment is not the public TRACT host. It appears to be a newly connected or secondary deployment record rather than the established delivery architecture: among the six most recent commits inspected, only the newest carried a Vercel deployment status. No Vercel project, environment, domain or deployment setting was changed. TRACT must not be migrated to Vercel or operated as a dual-host architecture.

## Application runtime map

| Layer                     | Implementation                                                                     | Runtime behavior                                                             |
| ------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Web                       | Next.js 16.3.1 / React 19                                                          | 41 build routes                                                              |
| Cloudflare adapter        | `@opennextjs/cloudflare` 1.20.2                                                    | One default Worker server function plus static assets/cache artifacts        |
| Static public content     | Home, mortgage pages, calculators, company/legal, Vision and RendProp placeholders | Prerendered or SSG                                                           |
| Dynamic public content    | Properties                                                                         | Server-rendered because provider/feature mode is runtime configuration       |
| Dynamic protected content | Account and admin routes                                                           | Server-rendered and fail-closed without configured Auth                      |
| APIs                      | Health, lead receipt, GHL webhook                                                  | Node runtime, force-dynamic, no-store                                        |
| Data                      | Supabase/Postgres contracts                                                        | Unconfigured in deployed app; local migrations verify on PostgreSQL 17       |
| Integrations              | CRM, listings, AI, property data, Turnstile                                        | Ports with disabled/fixture adapters; no paid/live provider required to boot |

No global middleware or proxy runs on every request. Provider clients are created lazily behind server modules; the root public layout does not initialize Supabase, CRM or AI clients.

## Package map

| Package                | Responsibility                                                 |
| ---------------------- | -------------------------------------------------------------- |
| `@tract/analytics`     | consent-safe events, PII guard and browser attribution capture |
| `@tract/database`      | generated database types and table registry                    |
| `@tract/domain`        | feature modes, roles, events, provenance and redaction         |
| `@tract/integrations`  | CRM, listing, AI, property-data and Turnstile ports/adapters   |
| `@tract/mortgage-math` | integer-cent and basis-point mortgage calculations             |
| `@tract/schemas`       | API, lead, contact and environment validation                  |
| `@tract/seo`           | metadata and JSON-LD contracts                                 |
| `@tract/tokens`        | design tokens                                                  |
| `@tract/testing`       | test-only server-only shim                                     |

## Supabase inventory

### Remote visibility

The Supabase CLI currently exposes one project named `DustinGY6's Project` with reference `mzvlupbnqgiosfwpuoae`. It is in `us-east-2`, reports PostgreSQL 17 and healthy compute, but its main branch reports `MIGRATIONS_FAILED`. No Edge Functions are listed. Point-in-time recovery is disabled, daily backups are present, SSL enforcement is off and database network restrictions are open.

Nothing establishes that project as TRACT. The deployed TRACT health endpoint reports database configuration absent, public API probes were unauthorized and a safe CLI link attempt found a local PostgreSQL-version mismatch. The repository was not linked, no schema was pulled and no remote setting was changed.

### Local schema contract

Seven additive migrations define 24 public tables, enable RLS on every table, create 37 named policies and define eight public functions. A disposable PostgreSQL 17 execution applies all migrations and passes all 39 RLS assertions.

| Recovery requirement | Local implementation                                                                        | Gap / next verification                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Leads                | `leads` and service-only `create_lead_with_receipt` RPC                                     | Dedupe hash is not unique; RPC inserts a lead before outbox conflict handling              |
| Consent              | Append-oriented `consent_receipts` plus `suppressions`                                      | Live configuration absent; immutability and channel semantics need vertical-slice coverage |
| Attribution          | `attribution_touches`; browser captures first/last locally                                  | Conversion currently collapses first and last into one stored touch                        |
| Outbox events        | `integration_outbox`, webhook receipts and retrying processor library                       | No scheduled/queue consumer is deployed                                                    |
| Properties           | `property_entities`, `listing_records`, `property_facts` and fixture publication constraint | Five fixtures only; no detail route; remote tables unverified                              |
| Vision projects      | Projects, assumptions, scenarios, reports and public report-token RPC                       | UI is placeholder; no end-to-end persistence or report workflow                            |
| AI jobs              | Jobs, budget reservation, quota policies and kill switches                                  | Disabled and unused; no orchestrator or queue                                              |
| Usage                | Append-oriented `usage_ledger` and adjustment constraints                                   | No live provider reconciliation                                                            |
| Content              | Items, sources, revisions and link opportunities                                            | Admin views are not data-backed; no migrated content                                       |
| Audit events         | Immutable `audit_events` and service-only recorder                                          | Few application actions emit audit events                                                  |
| Auth                 | Profiles, roles and local email-signup config                                               | Remote Auth settings and redirect URLs unverified; no complete user flow                   |
| Storage              | None in migrations                                                                          | Buckets, object policies and upload contracts are missing                                  |
| Edge Functions       | None                                                                                        | No remote or local Edge Function implementation                                            |

Supabase's 2026 platform changes relevant to future work are recorded in the recovery decision process: Node 20 client support has ended, new public-schema tables may require explicit Data API exposure, extension version pinning is ignored and the realtime schema must not be modified.

## Environment contract

Only names and requirements are recorded here. Values must remain in the appropriate secret/configuration stores.

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
- `FEATURE_VISION`
- `FEATURE_RENDPROP`
- `FEATURE_ACCOUNTS`
- `FEATURE_PROPERTY_SEARCH`
- `EMAIL_MODE`
- `SECURE_APPLICATION_URL`

`GHL_CUSTOM_FIELD_MAP` and `GHL_PIPELINE_MAP` are consumed directly by the application but are not yet part of the Zod server environment schema; Phase 2 should close that validation gap.

## What appears unused

- The protected Vercel deployment is not part of the public traffic path.
- AI ports, usage controls, property-data ports and RendProp contracts are largely uninvoked.
- Content and audit tables have little or no application write traffic.
- The outbox processor is library code without a deployed trigger.
- Accounts are flagged on but do not provide a usable Auth lifecycle.

## Verify next

1. Build and test the fixture property-to-Vision vertical slice locally.
2. Prove the TRACT Supabase project identity before any remote database action.
3. Inspect the Cloudflare environment-variable name inventory after project identity is known; do not read or copy values.
4. Add Storage buckets and RLS through reviewed additive migrations only when the active checkpoint reaches uploads.
5. Keep Vercel read-only and outside the production architecture.

## Primary platform references

- Cloudflare Workers configuration: <https://developers.cloudflare.com/workers/wrangler/configuration/>
- Cloudflare Worker limits: <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare Worker errors: <https://developers.cloudflare.com/workers/observability/errors/>
- Supabase changelog: <https://supabase.com/changelog.md>
