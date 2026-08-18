# Deployment

**As of 2026-08-18.**

How a deploy actually happens, which environment variables exist (by **name**
only), and where the rollback point is.

Operational incident procedures are in `RUNBOOK.md`. Deployment history is in
`docs/handoff/DEPLOYMENT_HISTORY.md`.

---

> **Corrected 2026-08-18.** Pushing to `main` does **not** currently deploy.
> Measured: commits `4ecb1f0`…`cdacd99` reached `origin/main`, and the Cloudflare
> Worker's `modified_on` stayed at `2026-08-17T22:18:23Z` — no build ran. The
> earlier claim that GitHub deploys automatically was inferred from `f903d60`
> going live; that was a manual `wrangler deploy`, not a Git-triggered build.
>
> **The working deploy is manual**, from the repo root:
>
> ```bash
> pnpm cf:build && pnpm cf:deploy
> ```
>
> Wiring Workers Builds (Cloudflare dashboard → the `mortgage-company-fl` Worker
> → Settings → Builds → connect the GitHub repo, build command `pnpm cf:build`,
> deploy command `pnpm cf:deploy`) is what would make push-to-deploy real. Until
> someone confirms a Git-triggered build actually ran, treat the manual command
> as the only deploy path.

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

**Vercel is an active but unapproved duplicate runtime.** Its Git integration
automatically creates a public production deployment from `main`. Feature
branches create access-protected previews. Cloudflare remains the intended
canonical host; do not migrate TRACT to Vercel or create a second production
architecture. The owner explicitly authorized the combined recovery/UI push to
`main` with this consequence; resolve the public Vercel production path rather
than treating that exception as a new hosting decision.

---

## How a deploy happens

### The current path — manual Cloudflare deployment

```bash
pnpm deploy:preflight              # refuses if configuration is not production-ready
pnpm cf:build                      # check-site-url.mjs, then opennextjs-cloudflare build
pnpm --filter @tract/web exec opennextjs-cloudflare preview
pnpm cf:deploy                     # wrangler deploy
```

Run the deploy only from a clean, reviewed commit after every release gate is
green. Record both the Git commit and resulting Worker version because Wrangler
metadata does not currently provide that mapping.

A Git push has two different effects today:

```text
push to `main`
   -> GitHub updates
   -> Vercel creates a public production duplicate
   -> Cloudflare does not build or deploy

push to a feature branch
   -> GitHub updates
   -> Vercel creates an access-protected preview
   -> Cloudflare does not build or deploy
```

The Vercel behavior is a release blocker, not the TRACT deployment mechanism.

### Optional future Git path — not configured

Cloudflare Workers Builds could be connected to the repository with build
command `pnpm cf:build` and deploy command `pnpm cf:deploy`. Do not document or
rely on push-to-deploy unless a Git-triggered Worker build is observed and its
commit-to-version mapping is recorded.

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

| Item                             | Why it blocks                                                         |
| -------------------------------- | --------------------------------------------------------------------- |
| `HASH_PEPPER`                    | Still the development default.                                        |
| `SUPABASE_SERVICE_ROLE_KEY`      | Without a database there is no durable lead receipt.                  |
| `TURNSTILE_MODE`                 | Conversion forms need a real bot challenge, not `disabled`/`fixture`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public identifier required for the production Turnstile widget.       |

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

The current public Worker version is
`a8691060-83c5-473c-8858-cd20b81300ab`. Public probes are healthy, but its exact
Git source is unproven. The previously verified Worker version associated around
commit `f903d60` is `02ff84bb-9f8e-41d4-9049-66f74deba249`. Use Cloudflare's
deployment history as the rollback source of truth and record the selected
version during an incident.

### How to roll back

1. **Worker deployments roll back through Cloudflare's deployment history.** This
   is the fast path and does not require a Git operation.
2. Reverting a Git commit does not change Cloudflare until the reviewed revert is
   manually built and deployed.
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
