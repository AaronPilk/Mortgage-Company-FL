# Changelog

## 2026-11-16 — CI green, ATTOM honesty, short-term rental calculator

### Added

- `/calculators/short-term-rental`: nightly rate and occupancy, or a monthly
  lease, through the existing cash-flow and coverage engines, with gross rent
  multiplier and rent-to-price. `@tract/mortgage-math` gains `investor.ts`, a
  composition layer over `rentalCashFlow` and `debtServiceCoverage`.
- `ATTOM_PLAN` (`trial` | `paid`). The readiness board reads "in progress", not
  "approved", while production runs on the trial key.
- `AttomAuthError` and `AttomQuotaError`, so a lapsed key or spent quota is
  named in the logs.
- `scripts/secret-scan.sh`, the CI secret scan as a script you can run locally.

### Changed

- CI: secret scan allows `NEXT_PUBLIC_*` lines in `apps/web/.env.production`
  only (ADR-016); e2e builds use Cloudflare's test Turnstile sitekey; runner
  actions bumped (checkout v7, setup-node v7, upload-artifact v7,
  pnpm/action-setup v6).
- Dependabot: TypeScript majors ignored per ADR-010; GitHub Actions bumps
  grouped into one weekly PR.
- Lead form: stops with a plain message if the Turnstile token has not arrived
  yet, instead of sending an empty token.
- `docs/handoff/CURRENT_STATE.md`, `BLOCKERS.md`, `ACTIVE_CHECKPOINT.md` and
  `DEPLOYMENT_HISTORY.md` refreshed to the 16 Nov state.

## 2026-08-17 — Initial platform build

### Added

- pnpm/Turborepo monorepo: `apps/web` plus nine shared packages
- `@tract/mortgage-math`: cents-based payment, amortization, affordability,
  cash-to-close, refinance break-even, rent-vs-buy, rental cash flow, and flip
  scenarios, with a versioned disclosure registry
- Seven SQL migrations: 24 tables, row-level security on every one, an
  append-only audit model, and transactional lead creation
- `scripts/rls-tests.sql`: 39 policy assertions executed against real PostgreSQL
- Hardened lead endpoint with a twelve-step check order, transactional receipt,
  and an outbox
- CRM port with disabled, fixture, and GoHighLevel adapters; Ed25519 webhook
  verification with replay and dedupe
- Analytics vocabulary with a guard that blocks personal data from leaving
- SEO layer: canonical construction resistant to host injection, JSON-LD
  builders that omit unverified facts, route registry, sitemap, robots
- Five client-side calculators, each showing inputs, assumptions, exclusions, and
  a disclosure version
- Eleven loan program pages with a full server-rendered content contract
- Eight legal pages, shipped as labelled drafts
- Provider-neutral listing and property-data ports with synthetic Florida fixtures
- AI provider port with budget reservation, quota enforcement, kill switches, and
  reconciliation for unknown outcomes
- RBAC-gated admin with a live launch-readiness board
- Security headers, CSP, PWA manifest, offline fallback
- CI: format, typecheck, test, content lint, build, database, e2e, secret scan
- Content linter and deploy preflight

### Fixed during the build

- Amortization schedules terminated at a non-zero balance because a rounded level
  payment does not retire the principal exactly. The final scheduled payment now
  absorbs the remainder.
- `create_lead_with_receipt`, `reserve_ai_budget`, and `record_audit_event` were
  callable by any authenticated user: PostgreSQL grants `EXECUTE` on a new
  function to `PUBLIC`, and revoking from `anon` and `authenticated` alone does
  not remove it.
- Environment validation coupled build to deployment, so `next build` failed on
  missing production secrets while prerendering an unrelated page. Split into
  `parseServerEnv` and `assertProductionReady`.

### Not included

Live rates, published guides, city pages, a blog index, and every integration
requiring a credential or contract. See `docs/build/blocked-items.md`.
