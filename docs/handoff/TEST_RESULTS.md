# Test results

## 2026-08-17 — Phase 0 setup

| Command/check                            | Working tree                  | Result | Relevant output / unresolved issue                                                  |
| ---------------------------------------- | ----------------------------- | ------ | ----------------------------------------------------------------------------------- |
| `git status --short --branch`            | canonical `main` at `f903d60` | Pass   | Clean and aligned with `origin/main` before isolation                               |
| `git fetch --prune origin`               | canonical checkout            | Pass   | `origin/main` remained `f903d60`                                                    |
| recovery protocol SHA-256 / `cmp`        | isolated branch               | Pass   | Initial install matched the attached 2,151-line source before repository formatting |
| Node / pnpm / Wrangler version inventory | isolated branch               | Pass   | Node `25.9.0`; pnpm `10.28.0`; repo Wrangler dependency `4.123.0`                   |

## 2026-08-17 — Phase 0 completion

| Command/check                                                | Result                   | Relevant output / unresolved issue                                                                                                |
| ------------------------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                             | Pass                     | 12 workspace projects, frozen lockfile                                                                                            |
| `pnpm check`                                                 | Pass                     | Format, lint, 10-package typecheck, 165 tests, 36-page content lint and 41-route production build                                 |
| `pnpm db:verify` on disposable local PostgreSQL 17           | Pass                     | Seven migrations applied; all 39 RLS assertions passed; test database dropped                                                     |
| `pnpm test:e2e`                                              | Pass                     | 54/54 desktop and mobile tests; Playwright command repaired to use the configured Next server directly                            |
| `pnpm cf:build`                                              | Pass                     | OpenNext 1.20.2 produced the Worker artifact                                                                                      |
| `wrangler deploy --dry-run`                                  | Pass                     | 7,375.99 KiB uncompressed / 1,432.60 KiB gzip; no deployment                                                                      |
| `wrangler check startup`                                     | Pass                     | 15.1 ms active local startup CPU in a 70.7 ms profile window; 1.5 ms garbage collection                                           |
| `pnpm smoke:routes` against OpenNext preview                 | Pass                     | 50 requests, zero failures, 15.7 ms average wall time, 202.1 ms maximum                                                           |
| `pnpm smoke:routes` against public Cloudflare Worker         | Pass                     | 50 requests, zero failures, 61.4 ms average wall time, 190.1 ms maximum                                                           |
| live `wrangler tail --status error` during production probes | Pass                     | No error invocation emitted                                                                                                       |
| `wrangler secret list`                                       | Pass with launch blocker | No Worker secrets configured; no values requested or displayed                                                                    |
| `pnpm deploy:preflight`                                      | Expected refusal         | Four requirements remain: `HASH_PEPPER`, non-fixture `MLS_PROVIDER`, `SUPABASE_SERVICE_ROLE_KEY`, and production `TURNSTILE_MODE` |

Phase 0 exit decision: complete. Error 1102 is operationally resolved for the current artifact/deployment. The exact historical cause cannot be proven without the original Ray IDs or retained logs; Cloudflare classifies 1102 as an exceeded CPU or memory limit, so the route smoke remains a release gate.

## 2026-08-17 — Phase 1 completion

| Command/check                                   | Result | Relevant output / unresolved issue                                                                |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `pnpm check`                                    | Pass   | Formatting, lint, 10-package typecheck, 172 tests, content lint and 40-page production build      |
| `pnpm db:verify` on disposable PostgreSQL 17    | Pass   | Eight migrations; idempotent Vision retry; three attribution touches; RLS on every public table   |
| `pnpm test:e2e`                                 | Pass   | 64/64 desktop/mobile checks including the complete property-to-Vision UI and honest no-DB failure |
| `pnpm cf:build`                                 | Pass   | OpenNext 1.20.2 built the dynamic property-detail route and report API                            |
| `wrangler deploy --dry-run`                     | Pass   | 7,599.37 KiB uncompressed / 1,486.55 KiB gzip; no deployment                                      |
| `pnpm smoke:routes` against OpenNext preview    | Pass   | 50 requests, zero failures, 12.9 ms average and 57.6 ms maximum                                   |
| Direct OpenNext property route and asset probes | Pass   | Known detail 200, unknown detail 404, generated image 200                                         |
| Static-route adapter regression and forward fix | Pass   | OpenNext preview exposed `NoFallbackError`; route changed to dynamic SSR and reverified           |
| Secret-pattern scan and `git diff --check`      | Pass   | No credential-shaped value detected; no diff whitespace errors                                    |

Phase 1 exit decision: complete locally. The full workflow functions without MLS or paid AI. Durable persistence is verified against disposable PostgreSQL and remains intentionally unapplied/unconfigured in production pending proof of the TRACT Supabase project.

## 2026-08-17 — Phase 2 completion

| Command/check                                 | Result           | Relevant output / unresolved issue                                                                                                                        |
| --------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`, typecheck, unit and content lint | Pass             | 10-package typecheck; 177 unit/integration tests; 38 pages and 40 registered routes                                                                       |
| `pnpm db:verify` on disposable PostgreSQL 17  | Pass             | Ten migrations; exact lead retry; three touches; plan snapshot; outbox claim/complete/retry; RLS                                                          |
| `pnpm test:e2e`                               | Pass             | 76/76 desktop/mobile checks for planner, calculator actions, stable retry and fail-closed behavior                                                        |
| `pnpm cf:build`                               | Pass             | OpenNext 1.20.2 built planner, general lead contract and protected outbox route                                                                           |
| `wrangler deploy --dry-run`                   | Pass             | 7,722.21 KiB uncompressed / 1,514.40 KiB gzip; no deployment                                                                                              |
| `pnpm smoke:routes` against OpenNext preview  | Pass             | 50 requests, zero failures, 14.1 ms average and 220.3 ms maximum                                                                                          |
| Fixture CRM exact replay                      | Pass             | Two projections with one idempotency key leave exactly one fixture CRM contact                                                                            |
| Turnstile contract                            | Pass             | Live mode fails closed without config and validates action plus approved hostname                                                                         |
| `pnpm deploy:preflight`                       | Expected refusal | Four requirements remain: `HASH_PEPPER`, `SUPABASE_SERVICE_ROLE_KEY`, production `TURNSTILE_MODE` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; no values printed |

Phase 2 exit decision: complete locally. Production persistence, Turnstile, CRM and outbox scheduling remain disabled until the real TRACT Supabase project and deployment configuration are proven.

## 2026-08-17 — Phase 3 completion

| Command/check                                | Result | Relevant output / unresolved issue                                                                           |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| `pnpm check`                                 | Pass   | Format, lint, 10-package typecheck, 179 tests, 38-page content lint and 41-route production build            |
| `pnpm db:verify` on disposable PostgreSQL 17 | Pass   | Ten migrations and the complete lead/Vision/outbox/RLS matrix; test database dropped and server stopped      |
| `pnpm test:e2e`                              | Pass   | 84/84 desktop/mobile checks, including media decoding, labels, fallback and mobile overflow                  |
| Canonical manifest file/dimension validation | Pass   | 32 unique assets; every file exists, dimensions match and provenance fields are complete                     |
| Local hydrated visual QA                     | Pass   | Six critical routes at 1440 and 390 pixels; no broken image, console error, overlay or final overflow        |
| `pnpm cf:build`                              | Pass   | OpenNext 1.20.2 built the canonical media/product-presentation artifact                                      |
| `wrangler deploy --dry-run`                  | Pass   | 77 static assets; 7,737.93 KiB uncompressed / 1,514.36 KiB gzip; no deployment                               |
| `pnpm smoke:routes` against OpenNext preview | Pass   | 50 requests, zero failures, 13.9 ms average and 211.5 ms maximum                                             |
| Direct OpenNext asset probes                 | Pass   | Home WebP, Vision WebP, RendProp WebP, default OG PNG and manifest JSON all returned 200 with expected types |

Phase 3 exit decision: complete locally. All required media is local, synthetic, labeled and manifest-tracked. Manifest entries remain pending owner/compliance review, and RendProp processing/public-tour behavior remains Phase 4 work.

## 2026-08-17 — Phase 4 completion

| Command/check                                   | Result | Relevant output / unresolved issue                                                                                  |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                                    | Pass   | Format, lint, 10-package typecheck, 183 tests, 40-page content lint and 43-page production generation               |
| `pnpm db:verify` on disposable PostgreSQL 17    | Pass   | Ten migrations; RendProp exact retry yields one lead/receipt/outbox and three touches; complete RLS matrix; stopped |
| `pnpm test:e2e`                                 | Pass   | 92/92 desktop/mobile checks for attestations, state recovery, labels, noindex, UTM bounds and exact request replay  |
| Hydrated RendProp visual QA                     | Pass   | Demo/tour at 1440 and 390 pixels; zero console/page errors, final overflow or broken in-viewport media              |
| `pnpm cf:build`                                 | Pass   | OpenNext 1.20.2 built both new routes without changing hosting configuration                                        |
| `wrangler deploy --dry-run`                     | Pass   | 79 static files; 7,816.52 KiB uncompressed / 1,526.52 KiB gzip; no deployment                                       |
| `pnpm smoke:routes` against OpenNext preview    | Pass   | 50 requests, zero failures, 11.8 ms average and 73.7 ms maximum; zero Error 1102 pages                              |
| Direct demo/tour/unpublished probes and headers | Pass   | All return 200; tour carries CSP, disabled camera/microphone policy and `X-Robots-Tag: noindex, nofollow`           |
| Secret-pattern scan and `git diff --check`      | Pass   | No credential-shaped value or whitespace error detected                                                             |

Phase 4 exit decision: complete locally. The fixture proves the agent experience, bounded attribution and inquiry lifecycle without upload or remote provider infrastructure. Production media capture/storage/processing/deletion remains disabled and Phase 5 begins with account/admin completion.
