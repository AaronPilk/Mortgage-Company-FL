# Test results

**Date: 2026-08-18.** Branch `claude/tract-autonomous-build-20260817`.

Two categories below. The first was re-executed while writing this document and
the output is quoted. The second was measured earlier in the same session and is
recorded with its method so it can be reproduced — it was not re-run here.

---

## Re-executed while writing this document

### `pnpm test`

```
pnpm test          # vitest run
```

```
 Test Files  24 passed (24)
      Tests  606 passed (606)
   Duration  7.07s
```

**606 unit and integration tests across 24 files. All pass.**

Distribution, counted from source (raw `it`/`test` declarations; the executed
total is higher because several suites use table-driven `.each`):

| File                                                | Declarations |
| --------------------------------------------------- | -----------: |
| `apps/web/tests/unit/rendprop-jobs.test.ts`         |           85 |
| `packages/integrations/src/integrations.test.ts`    |           53 |
| `packages/integrations/src/listings/search.test.ts` |           44 |
| `apps/web/tests/unit/property-search.test.ts`       |           25 |
| `apps/web/tests/unit/site-contract.test.ts`         |           23 |
| `packages/schemas/src/contact.test.ts`              |           23 |
| `packages/vision-model/src/engine.test.ts`          |           22 |
| `packages/vision-model/src/range.test.ts`           |           21 |
| `packages/mortgage-math/src/scenarios.test.ts`      |           20 |
| `packages/mortgage-math/src/amortization.test.ts`   |           19 |
| `packages/vision-model/src/flip.test.ts`            |           19 |
| `packages/vision-model/src/rental.test.ts`          |           17 |
| `packages/seo/src/seo.test.ts`                      |           16 |
| `packages/mortgage-math/src/payment.test.ts`        |           13 |
| `apps/web/tests/unit/planner-contract.test.ts`      |           12 |
| `packages/analytics/src/guard.test.ts`              |           12 |
| `packages/mortgage-math/src/dscr.test.ts`           |           12 |
| `packages/vision-model/src/assumptions.test.ts`     |           12 |
| `packages/mortgage-math/src/dti.test.ts`            |           11 |
| `packages/vision-model/src/summary.test.ts`         |           11 |
| `packages/mortgage-math/src/rate-impact.test.ts`    |           10 |
| `packages/vision-model/src/confidence.test.ts`      |            9 |
| `apps/web/tests/unit/vision-analytics.test.ts`      |            8 |
| `packages/tokens/src/tokens.test.ts`                |            5 |

### `pnpm db:verify`

```
pnpm db:verify     # ./scripts/db-verify.sh
```

Applies all nine migrations in `supabase/migrations/` to a throwaway PostgreSQL
database, installs the local auth shim, then executes `scripts/rls-tests.sql` as
each role.

```
NOTICE:  passed: every table in the public schema has row level security enabled
        result
----------------------
 ALL RLS TESTS PASSED
==> dropping tract_rls_check
database contract verified
```

**123 assertion calls in `scripts/rls-tests.sql` (counted from source). All
pass.** Assertion helpers used: `tests.assert`, `tests.assert_denied`,
`tests.assert_affects_no_rows`, `tests.assert_rejected`.

Requires a reachable PostgreSQL. Defaults: `PGHOST=localhost`, `PGPORT=5432`,
`PGUSER=postgres`, `DB_NAME=tract_rls_check`.

---

## Measured earlier in this session, not re-run here

### `pnpm check`

```
pnpm check
# = pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm content:lint && pnpm build
```

**Result: pass.** Six stages: Prettier format check, ESLint, `tsc` typecheck
across the workspace, Vitest, the content linter (`scripts/content-lint.ts`), and
the production `next build`.

### Route crawl — Cloudflare Error 1102 investigation

Error 1102 is a Worker CPU-time exceedance. The brief listed it as a critical
release blocker. It was tested rather than assumed.

| Target                                                       | Requests                       | Result                                       |
| ------------------------------------------------------------ | ------------------------------ | -------------------------------------------- |
| Live production, `mortgage-company-fl.aaron-9c3.workers.dev` | 39 routes crawled              | **All HTTP 200**                             |
| Live production, same host                                   | 390 requests at concurrency 16 | **All HTTP 200. Zero 1102s, zero timeouts.** |
| Local production build                                       | 56 routes × 10 passes = 560    | **560/560 HTTP 200, in 3.2 seconds**         |

**Not reproducible. No code change was made, because there was no defect to
fix.** It was either resolved by the Pages-to-Workers migration (`3a7a2ad`) or it
was observed on the dead Cloudflare Pages deployment. See
`docs/handoff/DECISIONS.md`, D-10.

**How to re-test if a 1102 is ever observed:**

1. Build and serve a production build locally:
   `NEXT_PUBLIC_SITE_URL=https://mortgage-company-fl.aaron-9c3.workers.dev pnpm build`
   then `pnpm --filter @tract/web start`.
2. Derive the route list from `apps/web/content/routes.ts` (52 entries) plus the
   dynamic paths under `/mortgage/[slug]` and `/properties/[listingKey]`.
3. Crawl every route, recording the status code and the response time for each.
4. Repeat against the live Worker under concurrency.
5. Weight the run toward the computation-heavy routes — `/vision/start` (the
   Vision scenario engine) and `/calculators/amortization` (a full schedule).
6. Read the Worker's observability logs for the same window. `observability` is
   already enabled in `apps/web/wrangler.jsonc`.

A 1102 is CPU time, not a network fault. If one appears, look at what the route
computes, not at the host.

---

## Session deltas

| Measure                  | Start of session | End of session |
| ------------------------ | ---------------: | -------------: |
| Unit / integration tests |              165 |        **606** |
| Test files               |                8 |         **24** |
| RLS assertions           |               39 |        **123** |
| Migrations               |                7 |          **9** |
| Tables                   |               24 |         **31** |

The "start of session" figures come from `docs/build/handoff.md`, which was
written on 2026-08-17 and records 163 tests rather than 165. The discrepancy is
one or two tests and is not material; the end-of-session figures are the
re-measured ones above.

**`docs/build/handoff.md` and `docs/build/blocked-items.md` are now stale.** They
still describe 7 migrations, 24 tables, 163 tests, and 39 RLS assertions. Treat
`docs/handoff/` as authoritative.

---

## Not run

| Check                        | Status                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:e2e` (Playwright) | Not run in this session. Previously recorded at 54 passing on 2026-08-17.                                                                                                                                               |
| `pnpm deploy:preflight`      | Not run against a production environment. It refuses on `HASH_PEPPER`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_MODE`, and fixture listings in the default configuration — that is the correct behaviour, not a failure. |
| Full axe accessibility sweep | Not run. Contrast is proven by unit test; keyboard paths are covered by end-to-end tests. Neither is a substitute for an audit.                                                                                         |
| Lighthouse                   | Not measured. Do not claim numbers.                                                                                                                                                                                     |
