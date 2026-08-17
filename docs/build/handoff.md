# Handoff

## What was built

A working Florida mortgage brokerage platform: a Next.js 16 application on a
pnpm/Turborepo monorepo, nine shared packages, seven SQL migrations defining 24
tables with row-level security, and a verification suite that runs the whole
thing.

Every integration ships disabled or on fixtures. The site builds, tests, and
serves in that configuration with no credential present.

## Verification, as run on 2026-08-17

| Check                                                 | Result                              |
| ----------------------------------------------------- | ----------------------------------- |
| `tsc --noEmit`, strict + `exactOptionalPropertyTypes` | Pass                                |
| Unit and integration (Vitest)                         | 163 passed, 8 files                 |
| Database: migrations + RLS suite (real PostgreSQL 16) | 39 assertions passed                |
| End-to-end (Playwright, desktop + mobile)             | 54 passed                           |
| Content lint                                          | No structural problems, 36 pages    |
| Production build (`next build`)                       | Pass, 41 routes                     |
| Deploy preflight                                      | Correctly refuses, 4 blocking items |

## Where to look first

- `packages/mortgage-math/` — every financial figure on the site comes from here.
- `apps/web/app/api/v1/leads/route.ts` — the conversion path, with the order of
  checks and the reason for each documented inline.
- `supabase/migrations/` and `scripts/rls-tests.sql` — the database contract and
  the suite that executes it.
- `docs/architecture/decisions.md` — why the load-bearing choices were made.
- `/admin/readiness` — what still blocks launch, live.

## The three decisions with the highest leverage

**1. Select the POS/LOS.** It is the single largest architectural dependency
still open. It determines the application boundary in practice, the disclosure
responsibility matrix with each lender, what the CRM may and may not hold, and
what "apply" means on the site. Everything downstream of a lead currently ends at
a link that does not exist yet. Evaluate on: broker and lender compatibility,
disclosure support, audit trail, API depth, role-based access, data portability,
and total cost at expected volume.

**2. Decide the affiliated-business posture before building any cross-entity
flow.** Title, real estate, and processing are family-owned. That is a genuine
advantage and a genuine regulatory exposure, and which one it turns out to be is
determined by decisions made now, not later. Nothing in this codebase shares data
or refers business across entities, and nothing should until counsel has mapped
ownership, money flow, referral flow, data sharing, and the required disclosures.
Retrofitting a firewall onto a system that already assumes shared access is far
harder than building the boundary first.

**3. Choose what to publish first, and hold the quality bar.** The content system
enforces structure — sources, reviewer, dates, indexation gating — but it cannot
enforce value. Ten genuinely useful Florida-specific guides, each written against
primary sources with a named reviewer, will outperform a hundred templated pages
and will not put the domain at risk. The backlog is specified; the first batch
needs an owner and a review cadence.

## What not to do

- Do not remove the pre-launch banner before every licensing gate is approved.
  It is driven by `licensingStatus` in `apps/web/lib/site.ts`, deliberately in
  one place.
- Do not set `MLS_PROVIDER=fixture` in a deployed environment. The preflight
  refuses it and the database constraint refuses it, in that order.
- Do not add a field to the lead form without checking it against
  `docs/security/data-classification.md`. The schema is short on purpose.
- Do not let a marketing stage set a status that implies a credit decision.
  `MarketingLeadStatusSchema` deliberately has no "approved" value.
- Do not publish a page whose licence, rate, or availability claim has not been
  verified against a current primary source.

## Next command

Nothing has been deployed and no external account has been touched. When a
Supabase project exists and the migrations have been applied:

```bash
pnpm deploy:preflight
```

It will list what is still blocking. Fix those, then deploy — with approval.
