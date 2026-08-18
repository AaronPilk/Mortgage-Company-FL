# Deployment

**As of 2026-08-18.**

How a deploy actually happens, which environment variables exist (by **name**
only), and where the rollback point is.

Operational incident procedures are in `RUNBOOK.md`. Deployment history is in
`docs/handoff/DEPLOYMENT_HISTORY.md`.

---

## Target

| Field          | Value                                               |
| -------------- | --------------------------------------------------- |
| Platform       | Cloudflare Workers                                  |
| Adapter        | `@opennextjs/cloudflare`                            |
| Worker name    | `mortgage-company-fl`                               |
| Config         | `apps/web/wrangler.jsonc`                           |
| Entry point    | `.open-next/worker.js`                              |
| Assets binding | `ASSETS` → `.open-next/assets`                      |
| Compat flags   | `nodejs_compat`                                     |
| Public URL     | `https://mortgage-company-fl.aaron-9c3.workers.dev` |
| Custom domain  | None configured                                     |
| Observability  | Enabled in `wrangler.jsonc`                         |

**Cloudflare Pages is not used and must not be used.** Pages cannot serve this
application's API routes or its server rendering; the Pages deployment returned
permanent 404s. The migration to Workers is commit `3a7a2ad`. The dead Pages
project should be deleted.

**Vercel is connected to the account but is not production.** It serves no
traffic and there is no Vercel configuration in this repository. Do not create a
second production deployment.

---

## How a deploy happens

### The normal path — this is the one that is used

```
push to `main` on https://github.com/AaronPilk/Mortgage-Company-FL
   → Cloudflare builds
   → Cloudflare deploys
   → https://mortgage-company-fl.aaron-9c3.workers.dev
```

That is the whole mechanism. There is no manual step and no dashboard
configuration, because `NEXT_PUBLIC_SITE_URL` is committed in
`apps/web/.env.production`.

Confirmed working: commit `f903d60` was pushed and is live.

### The manual path — break-glass only

```bash
pnpm deploy:preflight              # refuses if configuration is not production-ready
pnpm cf:build                      # check-site-url.mjs, then opennextjs-cloudflare build
pnpm --filter @tract/web exec opennextjs-cloudflare preview
pnpm cf:deploy                     # wrangler deploy
```

Use this only when the Git-connected build is unavailable. A manual deploy from a
working copy is a deploy whose source nobody can identify later.

### The build guard

`pnpm cf:build` runs `scripts/check-site-url.mjs` **before** the Next build. It:

- reads `apps/web/.env.production`;
- **fails the build** if that file contains any key not prefixed
  `NEXT_PUBLIC_` — printing the offending key **name**, never its value;
- fails if `NEXT_PUBLIC_SITE_URL` is unset, is not a valid URL, is not `https`,
  or points at a local host;
- normalises the value to a bare origin.

This exists because `NEXT_PUBLIC_SITE_URL` is read at **build** time. Canonical
tags, `og:url`, the JSON-LD `@id` graph, `robots.txt`, and `sitemap.xml` are all
baked during `next build`. Getting it wrong produces a deployment that looks
completely healthy while telling every crawler the canonical version of each page
lives somewhere that does not exist.

### The deploy preflight

`pnpm deploy:preflight` runs `assertProductionReady` from
`packages/schemas/src/env.ts`. It **prints the variable name that is wrong and
never prints a value.**

In the default configuration it refuses on four items, which is correct:

| Item                        | Why it blocks                                                           |
| --------------------------- | ----------------------------------------------------------------------- |
| `HASH_PEPPER`               | Still the development default.                                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Without a database there is no durable lead receipt.                    |
| `TURNSTILE_MODE`            | Conversion forms need a real bot challenge, not `disabled`/`fixture`.   |
| `MLS_PROVIDER`              | Fixture listing data, unacknowledged. See `SHOW_SAMPLE_LISTINGS` below. |

Environment **parsing** and deployment **policy** are deliberately separate
functions (ADR-003). `next build` legitimately parses the environment without
being a deployment.

---

## Environment variables

**Names only. No value in this document, ever.**

Full annotations — `[browser-safe]` versus `[server-only]` — are in
`.env.example`. The schema is `packages/schemas/src/env.ts`.

### Where each kind of value belongs

| Kind                                             | Where it goes                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BRAND_NAME` | `apps/web/.env.production` (committed)                                                |
| Other `NEXT_PUBLIC_*`                            | `apps/web/.env.production`, or `vars` in `wrangler.jsonc`                             |
| Every secret                                     | `wrangler secret put <NAME>` — **never** a committed file, **never** `wrangler.jsonc` |
| Non-secret server config                         | `vars` in `wrangler.jsonc`                                                            |

### Browser-safe — compiled into the client bundle

```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_BRAND_NAME
NEXT_PUBLIC_GTM_CONTAINER_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
```

### Server-only — secrets

Listed in `SECRET_ENV_KEYS` in `packages/schemas/src/env.ts`. These must never
appear in a browser bundle, a log line, or an error body.

```
SUPABASE_SERVICE_ROLE_KEY
TURNSTILE_SECRET_KEY
GHL_PRIVATE_INTEGRATION_TOKEN
GHL_WEBHOOK_PUBLIC_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
HIGGSFIELD_API_KEY
BYTEPLUS_API_KEY
MLS_ACCESS_TOKEN
ATTOM_API_KEY
REGRID_API_KEY
SHOVELS_API_KEY
AIRDNA_API_KEY
RESEND_API_KEY
SENTRY_DSN
HASH_PEPPER
```

### Server-only — modes, configuration, and flags

```
NODE_ENV

TURNSTILE_MODE
GHL_MODE
AI_MODE
EMAIL_MODE

GHL_LOCATION_ID
GHL_API_BASE_URL
GHL_API_VERSION
GHL_CUSTOM_FIELD_MAP
GHL_PIPELINE_MAP

AI_DAILY_PLATFORM_BUDGET_CENTS
AI_DEFAULT_USER_DAILY_BUDGET_CENTS

MLS_PROVIDER
SHOW_SAMPLE_LISTINGS
MLS_BASE_URL
MLS_ATTRIBUTION_TEXT

FEATURE_VISION
FEATURE_RENDPROP
FEATURE_ACCOUNTS
FEATURE_PROPERTY_SEARCH

SECURE_APPLICATION_URL
```

### Feature modes

`disabled` → no external effect. `fixture` → a deterministic local double.
`sandbox` / `production` → the real provider, and the mode **requires** its
credential or the environment fails to parse.

### `SHOW_SAMPLE_LISTINGS`

Sample listings render publicly only when all three of the following are set:

```
MLS_PROVIDER=fixture
SHOW_SAMPLE_LISTINGS=true
FEATURE_PROPERTY_SEARCH=true
```

`SHOW_SAMPLE_LISTINGS` defaults to `false`. Read `docs/handoff/DECISIONS.md` D-4
before changing it — it carries three conditions that must hold, and a revocation
trigger.

### `HASH_PEPPER` rotation

Rotating it resets deduplication and rate-limit buckets. Expect a short window of
duplicate leads afterwards. That is the correct tradeoff and is not a defect.

---

## Rollback point

**`f903d60` — "Give the site a visual language, in both themes."**

It is the current tip of `origin/main`, it is what production is serving, and it
was verified live: 39 routes crawled, then 390 requests at concurrency 16, all
HTTP 200.

Reverting to it returns production to a known-good state.

### How to roll back

1. **Worker deployments roll back through Cloudflare's deployment history.** This
   is the fast path and does not require a Git operation.
2. Alternatively, revert the offending commit on `main` and push. The Git-connected
   build redeploys.
3. **Database migrations do not roll back automatically.** Take a backup before
   applying one to production, and write the reverse statement into the
   migration's comment header when a reversal is practical. Migrations are
   append-only once shared — never edit one that has been applied anywhere but
   your own machine.

A revert of application code does **not** undo a migration. If a deploy included
a migration, plan the reversal of each separately.

---

## Post-deploy verification

Run this against the live URL before considering any deploy done.

| Check                           | Expect                                                                |
| ------------------------------- | --------------------------------------------------------------------- |
| `GET /api/v1/health`            | HTTP 200                                                              |
| `GET /`                         | HTTP 200, pre-launch banner present                                   |
| `GET /plan`                     | HTTP 200                                                              |
| `GET /calculators/amortization` | HTTP 200 — CPU-heavy route                                            |
| `GET /vision/start`             | HTTP 200 — CPU-heavy route                                            |
| `GET /rendprop/demo`            | HTTP 200                                                              |
| `GET /robots.txt`               | Canonical origin matches `NEXT_PUBLIC_SITE_URL`                       |
| `GET /sitemap.xml`              | Only `indexable: true` routes from `apps/web/content/routes.ts`       |
| `GET /properties`               | 404 while `SHOW_SAMPLE_LISTINGS=false` — correct, not a regression    |
| Page source                     | No `NMLS #` in any JSON-LD block                                      |
| Response headers                | CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` |

Then read the Worker observability logs for the deploy window. Status codes alone
do not show a CPU-time problem developing.
