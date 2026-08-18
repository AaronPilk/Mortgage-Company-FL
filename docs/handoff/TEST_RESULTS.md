# Test results

**Date: 2026-08-18.** Branch `agent/tract-integrated-recovery-20260818`.

## Mandatory repository gates

### `pnpm check`

Passes all six stages:

- Prettier format check;
- ESLint;
- workspace TypeScript checks;
- Vitest: **31 files, 633 tests, all passing**;
- content lint: **46 page files and 53 registered routes, no structural
  problems**;
- Next.js 16.3.1 production build: **57 generated pages/routes**.

The content gate initially found the noindex RendProp tour missing from the route
registry. Registering `/tour/rendprop-coastal-demo` corrected the sitemap and
content-group contract; the complete gate was then re-run from the beginning and
passed.

### `pnpm db:verify`

Passes against disposable PostgreSQL 17 on a non-production local server:

- 14 migrations applied in filename order;
- 38 public tables;
- 59 named RLS policies;
- 165 SQL assertion calls;
- every public table confirmed RLS-enabled;
- `PUBLIC`, `anon`, `authenticated`, staff-role and owner privilege boundaries
  confirmed;
- exact retry confirmed for ordinary leads, planner leads, Vision report
  requests and privacy requests;
- Vision request confirmed atomic across lead, consent, attribution, project,
  assumptions, scenario, report and outbox records;
- user-selected and company-default Vision assumption provenance confirmed
  distinct.

The test database was dropped by the verification script. No remote Supabase
schema or row was changed.

### `pnpm test:e2e`

**80/80 Playwright checks pass** using the production Next build:

- 40 desktop;
- 40 mobile;
- mortgage-first home and disclosure contracts;
- calculator behavior and keyboard operation;
- exact lead retry and first/last/conversion attribution;
- progressive planner value before contact capture;
- labelled/noindex synthetic property marketplace;
- deterministic Vision result before contact and bounded input-only report
  submission;
- RendProp fail-closed provider boundary and labelled tour;
- account/admin unavailable or unauthorized behavior;
- API origin, content-type, no-store/noindex and method boundaries.

The expected server log for unconfigured durable lead storage appeared during the
honest-failure test. The UI returned an error and never displayed a success
receipt.

## Cloudflare artifact gate

### `pnpm cf:build`

Pass. OpenNext generated `.open-next/worker.js` for compatibility date
2026-08-01 with `nodejs_compat`.

### Local Worker preview and `pnpm smoke:routes`

Pass after starting the OpenNext Wrangler preview:

```text
61 requests
0 failures
10.1 ms average
41.1 ms maximum
```

Every registered route, `/api/v1/health` and repeated higher-value routes returned
HTTP 200. No response contained a Cloudflare Error 1102 page. The stale fixture
detail probe was replaced with `/vision/start` because production-like flags
correctly keep sample detail pages unavailable.

The local preview was shut down after the crawl. No deploy command was run.

## Read-only live probes

- Cloudflare Worker home, health, `/plan`, `/vision/start`, `/rendprop/demo` and
  current brand asset: HTTP 200.
- Latest Vercel production alias: HTTP 200 and publicly reachable.
- Vercel canonical tag: Cloudflare Worker origin.
- Vercel and Cloudflare health endpoints: both report database unconfigured,
  CRM/AI/bot/email disabled and public product feature flags off.
- Current Cloudflare deployment list: four versions, latest created 2026-08-18
  01:38 UTC.

These probes did not submit forms or mutate external state.

## Production preflight

`pnpm deploy:preflight` correctly fails with four blocking configuration names:

- `HASH_PEPPER`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `TURNSTILE_MODE`;
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

No values are printed by the script. This expected failure prevents a production
deployment and is not waived by the green code gates.

## Not run or not claimed

- No remote Supabase migration, RLS, Auth or Storage test.
- No production form submission or CRM delivery.
- No Cloudflare deploy or post-deploy log window for this integration.
- No measured Lighthouse score or full accessibility audit.
- No paid AI/media provider call.
