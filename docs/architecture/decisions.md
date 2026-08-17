# Architecture decisions

Dated, with the reasoning. A decision without its reasoning is a decision nobody
can safely revisit.

---

## ADR-001 — Next.js for web now, Expo React Native later

**Date:** 2026-08-17 · **Status:** accepted

The launch depends on server-rendered public pages, route metadata, sitemaps,
structured data, crawl control, content authoring, Core Web Vitals, and
landing-page experimentation. Next.js does all of that natively and is
installable as a PWA without giving up web semantics.

React Native through Expo remains the right choice for a later native capture
application — camera guidance, background upload, push notifications, app-store
distribution — which is what RendProp will eventually need. React Native Web is
explicitly not used for the launch website.

Sharing happens in domain packages, not by forcing every visual component through
one cross-platform abstraction. `apps/mobile` is a documented reservation, not a
second launch application.

---

## ADR-002 — Transactional outbox, not a synchronous CRM call

**Date:** 2026-08-17 · **Status:** accepted

The lead, its consent receipt, its attribution, and an outbox row are written in
one database transaction. A worker drains the outbox and syncs to the CRM.

The alternative — calling the CRM inside the request — couples the consumer's
experience to a third party's availability and makes a provider outage a lost
lead. With the outbox, a CRM outage delays a projection. The lead is already
durable and the visitor already has a receipt.

The CRM is a projection of application truth. It is never the system of record.

---

## ADR-003 — Environment parsing is separate from deployment policy

**Date:** 2026-08-17 · **Status:** accepted

`parseServerEnv` validates structure: a mode claiming to be live must carry its
credential. `assertProductionReady` checks deployment conditions: a real pepper,
no fixture listing data, a database, a real bot challenge.

They were originally one function. That was wrong: `next build` legitimately
parses the environment without being a deployment, so a missing production secret
surfaced as a confusing prerender failure in an unrelated page rather than as a
clear refusal to deploy. The split makes the failure land where the problem is.

---

## ADR-004 — Deterministic financial math, never a model

**Date:** 2026-08-17 · **Status:** accepted

Every monetary figure comes from `@tract/mortgage-math`: integer cents at all
boundaries, basis points for rates, rounding only at defined points, and a
version string on every result.

A language model may draft narrative around those numbers, translate a stated
goal into a structured scope, or ask clarifying questions. It never performs the
arithmetic. A financial figure a consumer might act on has to be reproducible,
testable, and attributable to a specific calculation version.

The tests are not decoration. Writing them surfaced a real defect: a level
payment rounded to whole cents does not retire the balance exactly, so the
schedule terminated at a non-zero remainder until the final payment was made
absorbing.

---

## ADR-005 — Row Level Security plus an explicit application check

**Date:** 2026-08-17 · **Status:** accepted

Both, always. RLS is the backstop that survives an application bug; the
application check produces a correct error page instead of a confusing empty
table and stops a mutation from being attempted at all.

`scripts/rls-tests.sql` executes the policies against real PostgreSQL as each
role. Writing it caught three genuine defects: `create_lead_with_receipt`,
`reserve_ai_budget`, and `record_audit_event` were all callable by any
authenticated user, because PostgreSQL grants `EXECUTE` on a new function to
`PUBLIC` and revoking from `anon` and `authenticated` alone does not remove it.

---

## ADR-006 — Fixture data cannot be published, enforced in the database

**Date:** 2026-08-17 · **Status:** accepted

`listing_records` carries `check (not (is_fixture and published))`.

Configuration is the first line of defence, but configuration drifts and
environments get copied. A synthetic listing shown to a consumer is a
misrepresentation, so the guarantee lives where it cannot be bypassed by an
environment variable.

---

## ADR-007 — A closed analytics vocabulary with a hard guard

**Date:** 2026-08-17 · **Status:** accepted

`@tract/analytics` defines every event that may be emitted. `inspectEvent`
rejects an unknown event name, a prohibited parameter key in either casing, any
value that looks like an email, phone number, or government identifier, and any
string over 200 characters.

It throws in development and test and drops in production. A dropped metric is
recoverable. Borrower data in an ad platform is not.

---

## ADR-008 — Spend is reserved before the provider is called

**Date:** 2026-08-17 · **Status:** accepted

`reserve_ai_budget` locks the quota bucket, sums reserved plus charged usage,
and refuses or creates the job and its reserve ledger entry inside one
transaction. Without the lock, two concurrent requests both read "budget
available" and both spend it.

On an unknown provider outcome the reservation is held, not released. Holding it
overstates spend until a human reconciles; releasing it understates spend against
a charge the provider may still bill. Overstating is the safe direction.

---

## ADR-009 — Licensing facts render as pending, never as placeholders

**Date:** 2026-08-17 · **Status:** accepted

`businessIdentity` types every unissued value as `null`, and `LicenseFact`
renders a visible "pending issuance" state for a null. There is no code path that
can render a plausible-looking placeholder licence number.

The JSON-LD builders omit a null rather than emitting an empty string, and the
`Organization` node only becomes a `FinancialService` once a real public address
exists. An end-to-end test asserts that no structured-data block contains
`NMLS #`.

---

## ADR-010 — TypeScript 5.9, not 7.0

**Date:** 2026-08-17 · **Status:** accepted

Built and verified on TypeScript 7.0.2 first. It works — the whole codebase
typechecks and the production build passes under it.

Then `typescript-eslint` refused to load: it does not support TypeScript 7 yet.
That leaves a choice between the faster compiler and a real linter, and for a
codebase whose safety properties are largely expressed in the type system, the
linter is worth more than the compile time. Static analysis catches the class of
mistake that ships silently; a slower `tsc` costs seconds.

Downgraded to 5.9.3. Nothing in the source depends on a 7-only feature, so this
is reversible the moment `typescript-eslint` supports 7.

The compiler options are the point regardless of version: `strict`,
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and
`verbatimModuleSyntax`.

`exactOptionalPropertyTypes` in particular is load-bearing here: it forces
optional fields to be spread conditionally rather than assigned `undefined`,
which is what keeps an accidental `undefined` out of a database column and out of
a CRM payload.

Relative imports inside packages are extensionless. `moduleResolution: "Bundler"`
resolves them, and Turbopack does not map a `.js` specifier onto a `.ts` source
file in a transpiled workspace package.

The lint rules matter too. `no-explicit-any` is an error, because `any` erases
exactly the guarantees the rest of this design depends on, and a
`no-restricted-syntax` rule blocks reading a secret-shaped `process.env` key
outside `lib/env.ts`.

Actual resolved versions are in `pnpm-lock.yaml` and
`docs/architecture/dependency-baseline.md`.
