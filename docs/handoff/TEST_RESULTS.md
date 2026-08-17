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
