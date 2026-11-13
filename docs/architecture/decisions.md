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

**Amended 2026-11-12 (see ADR-012).** The company NMLS ID is now known, so the
`Organization` node carries it, as a structured `PropertyValue` rather than a
formatted `NMLS #...` string. The end-to-end test still forbids `NMLS #` and now
also asserts that the only identifier in the graph equals the value in
`lib/site.ts`. The pending-state rule is unchanged: the Florida licence number
is still null and still renders as pending.

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

---

## ADR-011 — One canonical domain: wsmlending.com

**Date:** 2026-11-12 · **Status:** accepted · **Owner:** Aaron Pilkington

One Worker served two hosts. wsmlending.com showed only the Wholesale Mortgage
Lending landing and 308'd every other path, robots.txt and sitemap.xml included,
to tractrealestate.com, which served the whole app. Both hosts were indexable,
the landing canonicalised to wsmlending.com while the Organization graph's `@id`
named tractrealestate.com, and the only sitemap listed only tractrealestate.com
URLs. Search engines were being told two different things about one company.

The owner chose wsmlending.com as the company's one domain. The implementation:

- `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_COMPANY_URL` are both
  `https://wsmlending.com`. Every canonical, sitemap URL, `og:url` and JSON-LD
  `@id` is built from the site URL, so they all moved with one value.
  `scripts/check-site-url.mjs` refuses a build where the two differ, and the
  absolute canonical override that let one page point at another domain is
  gone.
- `apps/web/lib/host-routing.ts` holds the routing table as a pure function.
  On wsmlending.com, `/` rewrites to the landing (`app/wml/page.tsx`) with WML
  chrome; `/tract` rewrites to the TRACT product home (`app/page.tsx`); `/wml`
  308s to `/`; everything else is served directly with TRACT chrome. Any other
  host (tractrealestate.com, workers.dev, a Vercel alias) gets a 308 to the same
  path and query on wsmlending.com with `X-Robots-Tag: noindex, nofollow`. That
  includes `/api/*`: no inbound webhook is configured (`GHL_WEBHOOK_PUBLIC_KEY`
  is unset, so the route fails closed), and every API's same-origin check names
  only the site URL anyway.
- The landing stays the homepage because it is the company brand and the page
  already indexed. The old TRACT home is kept, not deleted, at `/tract`,
  noindex and off the sitemap: it shares the landing's funnel and purpose, and
  two homepages would compete for the same queries.
- Links that cross from TRACT chrome to the landing (breadcrumb "Home", the
  footer, the 404 page) are plain anchors. The chrome is chosen in the root
  layout from a request header, and a client-side transition keeps the layout,
  so a `<Link href="/">` would render the landing inside the TRACT header. The
  TRACT wordmark now leads to `/tract`.
- `TURNSTILE_HOSTNAMES` keeps both domains so a Worker rollback to the
  two-domain build needs no configuration change.

Alternatives considered: moving the TRACT home to `app/tract/page.tsx` and the
landing into `app/page.tsx` (cleaner file layout, but a large diff over files
the owner has local edits to); keeping both domains with cross-domain
canonicals (canonicals are hints, and the duplicate stays crawlable).

Consequences: tractrealestate.com stops ranking as itself and passes its signals
to wsmlending.com through permanent redirects. Supabase Auth must allow
`https://wsmlending.com/**` as a redirect URL, and the Turnstile widget must list
wsmlending.com, or sign-in and forms fail on the one remaining domain. Both are
dashboard steps listed in `docs/seo/README.md`.

---

## ADR-012 — Licensing facts from the owner's NMLS portal relay

**Date:** 2026-11-12 · **Status:** accepted · **Owner:** Aaron Pilkington

On 2026-11-12 the owner stated the company is licensed and relayed a screenshot
of Dan's own NMLS portal account list: Wholesale Mortgage Lending LLC, company
NMLS ID 2898263; loan originator Daniel Michael Cuesta, NMLS ID 132852. NMLS
Consumer Access blocks automated lookup, so no public-record readback was
possible from the engineering side.

Applied through the existing model in `apps/web/lib/site.ts`:

- `businessIdentity.nmlsId = "2898263"`, `legalName = "Wholesale Mortgage
Lending LLC"`, and a separate `name` ("Wholesale Mortgage Lending") for the
  schema `name` and the WebSite node.
- `loanOriginator` records Dan's name and NMLS ID; footers, About and Licensing
  show it with a deep link to his Consumer Access page.
- `companyLicenseId` stays null. The Florida broker licence number was not
  provided and is never guessed. Because the company is now stated licensed, a
  null renders as "number pending confirmation" instead of "pending issuance",
  which would contradict the statement.
- `companyLicensed` and `principalLoanOriginatorNamed` are true, from the
  owner's statement (Florida does not issue a broker business licence without a
  principal loan originator, and Dan is the only originator named).
- `nmlsRecordPublic` stays false. It flips only after a person opens the
  Consumer Access page for 2898263 and sees the company listed with an approved
  Florida licence. Until then `isPreLaunch()` is true: the banner stays, no
  application is taken, paid-ads conversion sending stays off, and the
  Consumer Access URL stays out of the Organization `sameAs`.

No street address or telephone is asserted anywhere; neither is confirmed.

**Amended 2026-11-13: business phone.** The owner gave the business line,
727-486-6004, and 24/7 hours. Applied: `telephone = "+17274866004"` in the
Organization node. The address stays null: the filed principal office is not a
place customers visit, so the node remains a plain `Organization` (ADR-009).
Hours are a listings fact (Google, Bing, Apple), not asserted in site schema.

**Amended 2026-11-12, later the same day: owner confirmation.** Aaron
Pilkington (owner) confirmed that MBR8794 is Wholesale Mortgage Lending's
Florida mortgage broker licence and that the company's NMLS Consumer Access
record is public. Consumer Access blocks automated lookup, so this rests on the
owner's confirmation, not an engineering readback. Applied:
`companyLicenseId = "MBR8794"` and `nmlsRecordPublic = true`, so all three
licensing flags are true and `isPreLaunch()` is false. The pre-launch banner and
badges disappear, the readiness board shows the three licensing gates as
approved, and the Consumer Access company page joins the Organization `sameAs`.
Meta conversion sending still also needs `META_CAPI_LIVE_CLEARED`. The schema
stays a plain `Organization`: the type rule in ADR-009 keys on a public office
address, not on licensing, and no address is confirmed.

---

## ADR-013 — Crawl policy, real lastmod, and IndexNow

**Date:** 2026-11-12 · **Status:** accepted · **Owner:** Aaron Pilkington

**Crawlers.** robots.txt allows every public page to search crawlers
(Googlebot, Bingbot, Applebot), answer crawlers (OAI-SearchBot, ChatGPT-User,
Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User) and training
crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot,
Meta-ExternalAgent). Allowing training crawlers reverses the earlier GPTBot and
CCBot block, by owner decision. Each named group repeats the private-surface
disallows, because a crawler that finds its own group ignores `*`.

**lastmod.** The sitemap used one hard-coded date for every URL. It now reads
`apps/web/content/route-lastmod.generated.ts`, written by `pnpm seo:lastmod`:
the UTC day of the newest commit touching the page module or the content
modules it renders (`scripts/seo/route-sources.mjs`). Shared components are
excluded so a restyle does not re-date the site. The map is committed because
the deploy build may not have full Git history. A unit test fails when an
indexable route has no entry.

**IndexNow.** A key file is served from `apps/web/public`, and
`scripts/indexnow-submit.mjs` submits URLs from the live sitemap only, after
verifying the live key file, and refuses any URL not on wsmlending.com. It is an
operator tool run after a deploy, not runtime code: it handles public URLs only,
has no credential, and nothing in the Worker calls it.
