# Current state

**As of 2026-08-18.** Written against the working tree on branch
`claude/tract-autonomous-build-20260817`. Every count below was checked against
the repository, not copied from a summary.

Read this with `docs/handoff/BLOCKERS.md` and `docs/handoff/DECISIONS.md`. This
file says what exists. Those say what stops it and why it is shaped this way.

---

## Where the code lives and where it runs

| Fact                   | Value                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Canonical repository   | `https://github.com/AaronPilk/Mortgage-Company-FL`                                                   |
| Default branch         | `main`                                                                                               |
| Production branch      | `main`                                                                                               |
| Production platform    | Cloudflare Workers, via `@opennextjs/cloudflare`                                                     |
| Worker name            | `mortgage-company-fl` (`apps/web/wrangler.jsonc`)                                                    |
| Public URL             | `https://mortgage-company-fl.aaron-9c3.workers.dev`                                                  |
| Custom domain          | None configured                                                                                      |
| Deploy trigger         | **Manual: `pnpm cf:build && pnpm cf:deploy`.** Push-to-`main` does NOT deploy — verified 2026-08-18. |
| Current working branch | `claude/tract-autonomous-build-20260817` — four commits, **not deployed**                            |

**Cloudflare Pages is not the production host and must not be used.** Pages
cannot serve this application's API routes and server rendering; that project
returned permanent 404s. It is dead and should be deleted. The migration to
Workers is commit `3a7a2ad`.

### Vercel

A Vercel connector is present on the account. **It has no role in the live
site.** No Vercel deployment serves production traffic. There is no `vercel.json`
and no `.vercel` directory in this repository — the connection is dashboard-level
only.

Record it as: _connector present, unused; do not create a second production
deployment._ Do not migrate to Vercel. Two production deployments of a regulated
marketing site is a compliance problem, not a redundancy win.

### Supabase

Schema and migrations live in `supabase/migrations/` — nine files, applied in
filename order. `scripts/db-verify.sh` applies all nine to a throwaway PostgreSQL
database and executes `scripts/rls-tests.sql` against it.

**No live Supabase project association was verified in this session.** No project
ref, project URL, or org is recorded anywhere in this repository, and none was
confirmed. If a hosted project exists, its ref is not known here. Do not assume
one; find out.

---

## Configuration files that matter

| File                          | What it does                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `apps/web/wrangler.jsonc`     | Worker name, entry point, assets binding, `nodejs_compat`, observability.               |
| `apps/web/.env.production`    | **Committed deliberately.** `NEXT_PUBLIC_*` keys only.                                  |
| `scripts/check-site-url.mjs`  | Fails the build if `.env.production` holds any non-`NEXT_PUBLIC_` key.                  |
| `scripts/deploy-preflight.ts` | Refuses a deploy whose configuration is not production-ready. Prints names, not values. |
| `.env.example`                | Every variable, annotated browser-safe or server-only. No real values.                  |
| `.github/workflows/ci.yml`    | Format, lint, typecheck, test, build. Uses **no** repository secrets.                   |

Secrets go to `wrangler secret put`. Never to `.env.production`.

---

## Application shape

Next.js 16 on a pnpm + Turborepo monorepo.

- `apps/web` — the site.
- `apps/mobile` — a documented reservation. Not a second launch application.
- `packages/` — twelve workspace packages: `analytics`, `config`, `database`,
  `domain`, `integrations`, `mortgage-math`, `schemas`, `seo`, `testing`,
  `tokens`, `ui-web`, `vision-model`.

### Route registry

`apps/web/content/routes.ts` is the single list that drives navigation, the
sitemap, and the indexation test. **52 entries; 8 marked `indexable: false`.** A
page not registered there never enters the sitemap. That is the intended failure
mode.

On disk: 45 `page.tsx` files and 4 API `route.ts` files, plus `robots.ts`,
`sitemap.ts`, `manifest.ts`, `layout.tsx`, and `not-found.tsx`.

### Major public routes

| Group         | Routes                                                                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry         | `/`, `/plan` (progressive mortgage planner — the primary conversion path)                                                                                                                                               |
| Loan programs | `/mortgage` plus 16 program pages: purchase, refinance, first-time-home-buyers, conventional, fha, va, usda, jumbo, investment-property, self-employed, condo, **dscr, bank-statement, renovation, construction, land** |
| Calculators   | `/calculators` plus 10: mortgage-payment, affordability, refinance-break-even, rent-vs-buy, closing-cost, **amortization, debt-to-income, investment-property-cash-flow, dscr, rate-impact**                            |
| Marketplace   | `/properties`, `/properties/[listingKey]` — both `noindex`                                                                                                                                                              |
| Vision        | `/vision`, `/vision/start`                                                                                                                                                                                              |
| RendProp      | `/rendprop`, `/rendprop/demo` (`/rendprop/demo` is `noindex`)                                                                                                                                                           |
| Trust / legal | `/about`, `/contact`, `/licenses`, `/disclosures`, `/privacy`, `/terms`, `/security`, `/accessibility`, `/sms-terms`, `/do-not-sell-or-share`                                                                           |
| Other         | `/apply`, `/resources`, `/locations/florida`, `/partners/real-estate-agents`, `/account`, `/offline`                                                                                                                    |
| Admin         | `/admin`, `/admin/readiness`, `/admin/integrations`, `/admin/leads`, `/admin/jobs`, `/admin/usage`, `/admin/content`, `/admin/audit` — all `no-store` + `noindex, nofollow`                                             |

The five calculators and five loan programs in bold were added this session
(commit `7eafc51`).

### API routes

| Route                            | Purpose                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `POST /api/v1/leads`             | Marketing lead receipt. Also serves `/plan` via an optional `planner` object. |
| `GET  /api/v1/properties/search` | Listing search over the provider port. Rate limited: 30 req / 60 s.           |
| `GET  /api/v1/health`            | Health probe.                                                                 |
| `POST /api/v1/webhooks/ghl`      | Inbound GoHighLevel webhook. Signature-verified, replay-checked, deduped.     |

All `/api/*` responses carry `no-store` and `X-Robots-Tag: noindex, nofollow`.

---

## Database

**31 tables across 9 migrations.** Row level security is enabled on every table
in the `public` schema — this is itself asserted by the RLS suite.

| Migration                        | Tables                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `..._identity_and_authorization` | `profiles`, `user_roles`                                                                                                                                                |
| `..._audit`                      | `audit_events`                                                                                                                                                          |
| `..._leads_consent_..._outbox`   | `leads`, `consent_receipts`, `suppressions`, `attribution_touches`, `integration_outbox`, `webhook_receipts`                                                            |
| `..._property_and_listings`      | `property_entities`, `listing_records`, `property_facts`                                                                                                                |
| `..._vision`                     | `vision_projects`, `vision_assumptions`, `vision_scenarios`, `vision_reports`                                                                                           |
| `..._ai_jobs_and_quotas`         | `ai_jobs`, `usage_ledger`, `quota_policies`, `kill_switches`                                                                                                            |
| `..._content_and_links`          | `content_items`, `content_sources`, `content_revisions`, `link_opportunities`                                                                                           |
| `..._lead_planner_responses`     | `lead_planner_responses` _(new this session)_                                                                                                                           |
| `..._rendprop`                   | `rendprop_projects`, `rendprop_media_assets`, `rendprop_processing_jobs`, `rendprop_generated_assets`, `rendprop_tours`, `rendprop_tour_inquiries` _(new this session)_ |

Security-definer functions, all with `EXECUTE` revoked from `PUBLIC`:
`create_lead_with_receipt`, `create_lead_with_planner_response`,
`reserve_ai_budget`, `record_audit_event`, `get_public_report`,
`rendprop_enqueue_job`, `rendprop_claim_job`, `rendprop_settle_job`,
`rendprop_published_tour`, `has_role`, `is_staff`.

---

## Integrations: implemented, fixture, or unconfigured

Full detail in `docs/INTEGRATIONS.md`. Summary:

| Integration                                    | Port defined | Adapter state                                  | Current mode                      |
| ---------------------------------------------- | ------------ | ---------------------------------------------- | --------------------------------- |
| GoHighLevel (CRM)                              | Yes          | disabled / fixture / real — all three written  | **Unconfigured.** No credentials. |
| MLS listings                                   | Yes          | disabled + fixture only; no contracted adapter | **Fixture.** 19 sample records.   |
| AI providers                                   | Yes          | disabled + fixture only                        | **Unconfigured.** No credentials. |
| Cloudflare Turnstile                           | Yes          | disabled / fixture / sandbox / production      | **Unconfigured.** No keys.        |
| Property data (ATTOM, Regrid, Shovels, AirDNA) | Yes          | fixture only                                   | **Unconfigured.** No credentials. |
| Email (Resend)                                 | Mode only    | Not built out                                  | **Unconfigured.**                 |
| Supabase                                       | n/a          | Client code written, migrations written        | **No verified live project.**     |
| Sentry                                         | Mode only    | DSN variable exists                            | **Unconfigured.**                 |
| POS / LOS                                      | n/a          | `/apply` refuses to collect while unset        | **Vendor not selected.**          |

### What is genuinely working today, with no credential

- Every calculator. All arithmetic is in `@tract/mortgage-math`.
- The `/plan` progressive planner, end to end, writing through `/api/v1/leads`.
- **TRACT Vision's scenario engine.** `packages/vision-model` is deterministic
  arithmetic — no network call, no model call, no clock, no randomness. It
  produces low/base/high ranges and works fully today. Vision's _narrative_ and
  _imagery_ adapters are the parts that need an AI provider. Do not conflate the
  two.
- The property marketplace against the 19-record fixture provider: search,
  filter, sort, pagination, and detail pages.
- The RendProp job model: state machine, idempotency keys, leases, reserve-
  before-spend, frozen disclosure labels, and the clickable demo at
  `/rendprop/demo`. The media transformation itself needs an AI provider.

---

## Known limitations

1. **No raster image assets ship at all.** See `docs/ASSET_MANIFEST.md`. Three
   asset paths are referenced in code but do not exist on disk and currently
   404: the PWA manifest icons (`/brand/icon-192.png`, `/brand/icon-512.png`,
   `/brand/icon-maskable-512.png`), the JSON-LD organisation logo
   (`/brand/wordmark.svg`), and the default Open Graph image (`/og/default.png`).
2. **Rate limiting is in-process.** `MemoryRateLimitStore` is correct for a
   single instance and wrong for a horizontally scaled Worker. The interface is
   already abstracted; a KV or Durable Object store is the replacement.
3. **CSP allows `'unsafe-inline'` for scripts.** A documented Next.js exception.
   A nonce-based policy is the follow-up.
4. **The outbox worker has no scheduled trigger.** `processOutboxRow` is
   implemented and tested. It needs a Cloudflare Queue consumer or cron Worker
   and a provisioned binding. Until then, nothing drains `integration_outbox`.
5. **Licence identifiers are null by design.** `businessIdentity.nmlsId` and the
   Florida company licence render a visible "pending issuance" state. The
   pre-launch banner is driven by `licensingStatus` in `apps/web/lib/site.ts` and
   gated on `docs/compliance/launch-gates.md`.
6. **Accessibility has not been fully audited.** Contrast is proven by test and
   keyboard paths are covered by end-to-end tests. A full axe run and measured
   Lighthouse numbers have not been recorded.
7. **`docs/build/handoff.md` and `docs/build/blocked-items.md` are stale.** They
   were written on 2026-08-17 and state 7 migrations, 24 tables, 163 tests, and
   39 RLS assertions. The current numbers are 9, 31, 606, and 123. Treat this
   directory (`docs/handoff/`) as authoritative.

---

## Next recommended checkpoint

**Get this branch onto `main`.**

Four commits of finished, tested work are sitting on
`claude/tract-autonomous-build-20260817` and cannot be pushed from the sandbox
(see `docs/handoff/BLOCKERS.md`, blocker 1). Nothing in this session's work is
live. That is the single highest-value action available, it takes one person one
minute, and every other item below is blocked behind seeing it in production.

After that, in order:

1. Verify the deploy at `https://mortgage-company-fl.aaron-9c3.workers.dev` —
   check `/plan`, `/calculators/dscr`, `/rendprop/demo`, and `/api/v1/health`.
2. Delete the dead Cloudflare Pages project.
3. Decide whether `SHOW_SAMPLE_LISTINGS` is turned on in production. It is
   `false` today, so `/properties` is not serving. See
   `docs/handoff/DECISIONS.md`.
4. Produce the missing icon, logo, and Open Graph assets.
5. Provision Turnstile keys and a real `HASH_PEPPER`. Those are two of the four
   items `deploy-preflight` currently refuses on.
