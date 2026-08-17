# TRACT Mortgage Platform

A Florida mortgage brokerage website and installable web application. Mortgage-first:
its immediate job is to generate, qualify, route, measure, and nurture mortgage leads.

## What this is

A pnpm/Turborepo monorepo containing a Next.js App Router application, a set of
shared domain packages, and the SQL that defines the database contract.

```
apps/web            Next.js 16 App Router application (public site, API, admin)
apps/mobile         Reserved for a later Expo client. Documentation only.
packages/
  mortgage-math     Deterministic, cents-based financial calculations
  schemas           Zod schemas: lead, consent, API envelope, environment
  domain            Feature flags, roles, lifecycle events, provenance, redaction
  analytics         Event vocabulary and the guard that blocks personal data
  seo               Metadata factory and JSON-LD builders
  integrations      CRM, listing, AI, and property-data ports plus adapters
  database          Supabase client helpers and generated types
  tokens            Design tokens shared with a future native client
  config            Shared TypeScript configuration
supabase/migrations The database contract: schema, RLS policies, functions
scripts             Database verification, content lint, deploy preflight
docs                Architecture, security, compliance, integrations, build
```

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

No credential is required. Every integration defaults to disabled or fixture, and
the whole test suite passes in that configuration.

## Verify

```bash
pnpm check          # format, lint, typecheck, test, content lint, build
pnpm db:verify      # apply migrations to a scratch database and run the RLS suite
pnpm test:e2e       # Playwright smoke tests against a production build
```

## The three things worth knowing before you change anything

**The first-party write is authoritative.** A lead is stored, with its consent
receipt and attribution, in one database transaction that also enqueues an outbox
row. The CRM sync is drained from that outbox by a worker. A CRM outage delays a
sync; it never loses a lead and never makes a visitor wait.

**Marketing forms are not applications.** No form on this site collects — or can
be extended to collect — a government identifier, account number, income
documentation, or a file upload. Applications happen in the approved secure
POS/LOS. The boundary is enforced in the schema, in the CRM payload screen, and
in an end-to-end test.

**Nothing claims a fact that has not been established.** Licence identifiers
render as a visible pending state until issued. Fixture listing data cannot be
published — a database constraint enforces that independently of configuration.
Calculators show their assumptions, their exclusions, and a versioned disclosure.

See `docs/architecture/decisions.md` for why, and `RUNBOOK.md` for how to operate it.
