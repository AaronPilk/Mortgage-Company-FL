# Decisions

**As of 2026-08-18.**

Each entry states the decision, the reasoning, and **the condition under which it
should be revisited**. A decision without a revocation trigger is a decision
nobody can safely change later.

Architecture decisions with a longer life sit in
`docs/architecture/decisions.md` (ADR-001 through ADR-010). This file records the
decisions made in and around the 2026-08-17/18 build session, including the
process ones.

---

## D-1 — Cloudflare Workers, not Cloudflare Pages

**Decision.** Production is a Cloudflare Worker built by `@opennextjs/cloudflare`
(`apps/web/wrangler.jsonc`, worker `mortgage-company-fl`). Cloudflare Pages is
not used.

**Reasoning.** Pages could not serve this application. The API routes and the
server-rendered pages returned permanent 404s under Pages. This site is not a
static export — `/api/v1/leads` writes a durable consent receipt,
`/api/v1/properties/search` calls a provider port, and most public pages are
server rendered with per-request metadata. A host that cannot run server code
cannot run this. The migration is commit `3a7a2ad`.

**Revisit when.** Never for Pages specifically — that avenue is closed by the
architecture, not by preference. Revisit the _host_ only if Workers stops being
able to meet a requirement this application actually has: Node compatibility for
a dependency, CPU time on the Vision engine, or a binding that Workers does not
offer. Moving hosts means re-proving `/api/v1/*` and re-checking every security
header in `apps/web/next.config.ts`.

**Housekeeping.** The dead Pages project should be deleted. Leaving it in place
means a future operator can find it, point a domain at it, and serve 404s.

---

## D-2 — Cloudflare remains canonical; the public Vercel duplicate is a blocker

**Decision.** Do not push, merge or deploy another release while Vercel
automatically publishes `main` as a public `production` target. The owner must
disable that Git production path or make its aliases non-public. Do not migrate
TRACT to Vercel.

**Reasoning.** The original read-only audit saw one protected Vercel deployment
and classified the connector as unused. The refreshed 2026-08-18 inventory
disproved that classification: the project now has three ready production
deployments, its latest artifact maps to `7998ede`, and its aliases return HTTP
200 without authentication. A canonical tag pointing to Cloudflare reduces
search ambiguity but does not remove a second runtime, stale-disclosure surface
or independent header/configuration boundary.

There is still no `vercel.json` or `.vercel` directory in the repository. The
second architecture is a dashboard/Git integration, not an application
dependency, and no source change should legitimize it.

**Revisit when.** When the Vercel aliases no longer serve the site and a push to
`main` no longer creates a public Vercel production artifact. A future host
replacement still requires one-for-one migration, never additive dual hosting.

---

## D-3 — `apps/web/.env.production` is committed

**Decision.** `apps/web/.env.production` is tracked in git and holds
`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_BRAND_NAME`. Only `NEXT_PUBLIC_*` keys
are permitted in it. `scripts/check-site-url.mjs` fails the build if any other
key appears.

**Reasoning.** `NEXT_PUBLIC_SITE_URL` is read at **build** time, not run time:
canonical tags, `og:url`, the JSON-LD `@id` graph, `robots.txt`, and
`sitemap.xml` are all baked during `next build`. If the build environment does
not have it, the deployment looks completely healthy while telling every crawler
that the canonical version of each page lives somewhere that does not exist. That
is a silent, high-cost SEO failure. Committing the value means a Git-connected
Cloudflare build needs no dashboard configuration and cannot drift from the
repository.

The risk this creates — someone puts a secret in a committed file — is closed
mechanically rather than by convention. `check-site-url.mjs` reads the file, and
any key not starting with `NEXT_PUBLIC_` aborts the build with the offending
**name** printed and the value never printed.

**Secrets go to `wrangler secret put`. There is no exception.**

**Revisit when.** The guard script is removed or weakened, or the value stops
being needed at build time. If either happens, this decision has to be re-argued
from scratch.

---

## D-4 — `SHOW_SAMPLE_LISTINGS` as a second, independent switch

**Decision.** Sample listings render publicly only when **all three** hold:

```
MLS_PROVIDER=fixture
SHOW_SAMPLE_LISTINGS=true
FEATURE_PROPERTY_SEARCH=true
```

`SHOW_SAMPLE_LISTINGS` defaults to `false`. In `assertProductionReady`,
`MLS_PROVIDER=fixture` **without** the acknowledgement is still a blocking
problem; **with** it, it becomes a warning that keeps appearing on
`/admin/readiness` until a licensed provider replaces the fixture.

Implementation: `packages/schemas/src/env.ts` (schema and readiness check) and
`apps/web/lib/listings.ts` (`fixturesAllowed()`).

**Reasoning.** `assertProductionReady` previously treated `MLS_PROVIDER=fixture`
as an unconditional blocker. The owner asked for clearly-labelled sample listings
before an MLS agreement exists — a legitimate product decision. The wrong way to
grant that is to weaken the gate, because the failure mode the gate exists for is
not _"someone decided to show sample data"_. It is _"sample data shipped because
nobody noticed `MLS_PROVIDER` was still on its default"_ — and `fixture` **is**
the default value of `MLS_PROVIDER`.

Two independent switches separate those two cases cleanly. A forgotten default
cannot publish invented properties on its own; it takes a second variable that
exists for no other purpose and that nobody sets by accident. And because the
acknowledged state is a _warning_ rather than silence, the readiness board keeps
nagging until it is fixed properly.

**This is safe ONLY while all three of the following hold:**

1. **Every sample record is labelled as sample data in the UI.** The list page
   and the detail page both carry a banner, each card carries a badge, and
   `/api/v1/properties/search` returns `sampleData.containsSampleData` and a
   per-record `isSampleData` as first-class response fields — so an API consumer
   cannot miss what a human reader is told.
2. **The routes stay `noindex`.** `/properties` is `indexable: false` in
   `apps/web/content/routes.ts`, and every `/properties/[listingKey]` path sets
   `noIndex: true` in `generateMetadata`.
3. **No listing JSON-LD is emitted.** See D-5.

**Revisit when — this is the revocation trigger.** If any one of those three
stops being true, `SHOW_SAMPLE_LISTINGS` must go back to being unconditional and
fixture data must become a hard blocker again. Also revisit the moment a
contracted MLS provider lands: at that point the switch has no remaining purpose
and should be deleted rather than left as a loaded gun.

---

## D-5 — No listing structured data while the provider is a fixture

**Decision.** `/properties/[listingKey]` emits **no** `RealEstateListing`,
`Offer`, `Residence`, or `Product` JSON-LD. `BreadcrumbList` is also withheld.
The reasoning is written into the page file itself as a block comment so it
cannot be deleted without being read.

**Reasoning.** A crawler never sees the sample-data banner a person reads. Listing
markup asserts to a search engine that this property exists, is for sale, and
costs the stated amount. On a fixture record, that is an unqualified false claim
made to a third party — a violation of invariant 6 ("nothing claims an
unestablished fact") and a misrepresentation regardless of what the invariant
says. `BreadcrumbList` is withheld for the narrower reason that the page it
describes is `noindex`, so the markup would describe a document that is not
supposed to be in the index.

**Revisit when.** A contracted provider replaces the fixture adapter. At that
point listing structured data may be added, gated on **both**
`provider.key !== "fixture"` **and** the display agreement explicitly permitting
syndication of each field emitted. Not one or the other.

---

## D-6 — The Vision scenario engine is deterministic arithmetic, not a model

**Decision.** `packages/vision-model` performs every calculation in plain
deterministic arithmetic: no network call, no model call, no clock, no
randomness. Every scenario is run three times — low, base, high — and folded into
ranges. It never emits a bare number for a quantity it cannot pin down. A
language model is confined to narrative and imagery adapters, which are separate
and currently unconfigured.

**Reasoning.** This follows ADR-004. A financial figure a consumer might act on
has to be reproducible, testable, and attributable to a specific calculation
version. A model cannot offer any of the three. The determinism also buys
properties that matter operationally: the engine is free to run, instant, safe
inside a Worker CPU budget, and impossible to leak user input through — because
no user input leaves the process.

The practical consequence is the important one for anyone reading this handoff:
**Vision's scenario engine works fully today with no AI provider configured.**
Only the narrative and imagery layers are waiting on credentials. Do not describe
Vision as "blocked on AI".

**Revisit when.** Never for the arithmetic. Revisit the _narrative_ layer when an
AI provider is configured — and even then the model drafts prose around numbers
the engine produced. It does not produce numbers.

---

## D-7 — The planner posts to `/api/v1/leads`, not a new endpoint

**Decision.** The progressive planner at `/plan` submits to the existing
`POST /api/v1/leads` with an optional `planner` object in the body.

**Reasoning.** The lead endpoint carries twelve ordered guarantees: method and
content-type checks, a body size cap before parsing, an origin check, an
anonymous rate limit, schema validation that strips unknown keys, a honeypot, a
Turnstile challenge, contact normalisation, a per-contact rate limit, a single
transaction covering lead plus consent receipt plus attribution plus outbox row,
a fast response, and asynchronous CRM sync. A second lead route would mean a
second copy of every one of those. **Two copies of a guarantee is one
guarantee** — they drift, and the one that drifts is the one nobody is looking
at.

The planner widens only what the transaction writes. It moves nothing in the
order of checks.

**Revisit when.** The planner needs a guarantee the lead endpoint cannot express
— a different consent model, a different rate-limit shape, or a payload that
cannot share the same size cap. If that happens, extract the shared middleware
first and give both routes the same implementation; do not fork the checks.

---

## D-8 — A sibling SQL function, not a defaulted sixth parameter

**Decision.** `create_lead_with_planner_response(p_lead, p_consent,
p_attribution, p_outbox, p_planner, p_request_id)` remains a sibling function.
After integration it delegates to the six-argument exact-retry
`create_lead_with_receipt(..., p_request_id, p_plan)` with a null planning
snapshot. The legacy five-argument receipt function remains only for migration
compatibility and is not executable by `service_role`. The sixth parameter has
no default.

**Reasoning.** Adding a defaulted parameter to a PostgreSQL function does not
replace the old signature; it creates an overload. Every existing five-argument
call site then becomes ambiguous, and PostgreSQL resolves that ambiguity at call
time with rules most readers do not have memorised. On a function that writes a
consent receipt, an ambiguous overload is not an aesthetic problem.

The sibling delegates rather than duplicates, so there is still exactly one
implementation of the receipt write. Because the delegation happens inside a
single function call, the planner insert shares the same transaction — the
consumer still gets all-or-nothing.

`EXECUTE` is revoked from `PUBLIC` on the new function and granted only to
`service_role`, per invariant 5. PostgreSQL grants `EXECUTE` to `PUBLIC` by
default, and revoking from `anon` and `authenticated` alone does not remove it —
this exact mistake was already caught three times by the RLS suite (ADR-005).

**Revisit when.** Never introduce an ambiguous defaulted overload. If the planner
data model changes, change the sibling while keeping one exact-retry receipt
implementation.

---

## D-9 — The user's brief was treated as the authoritative specification

**Decision.** Where the brief and the repository disagreed about intent, the
brief won. Where the brief named a document, and that document did not exist,
work proceeded from the brief.

**Reasoning.** None of the documents named in the brief existed on disk. A
request for access to the Downloads folder — the likeliest place the named
documents lived — went unanswered for the duration of the session. That left
three options: stop and wait, invent the missing specification, or treat the
brief itself as the specification. The first wastes the session; the second is
the worst possible outcome for a compliance-sensitive product, because invented
requirements are indistinguishable from real ones once written down. The third is
honest and reversible.

This is recorded because it changes how the next person should read everything
else. Requirements in this codebase trace to the brief and to primary sources,
**not** to a specification document that was reviewed and signed off.

**Revisit when.** The named documents surface. Reconcile them against
`docs/product/`, `docs/compliance/`, and `apps/web/content/routes.ts`, and treat
any difference as a defect to be triaged rather than as a settled fact in either
direction.

---

## D-10 — Cloudflare Error 1102 was not fixed, because it did not reproduce

**Decision.** No code change was made for the reported Cloudflare Error 1102. It
is not a release blocker.

**Reasoning.** The brief listed it as critical. It was tested rather than
assumed. Against live production: 39 routes crawled, then 390 requests at
concurrency 16 — every response HTTP 200, zero 1102s, zero timeouts. Locally
against a production build: 56 routes × 10 passes = 560 requests, all HTTP 200,
in 3.2 seconds.

It was either fixed by the Pages-to-Workers migration (`3a7a2ad`), or it was
observed on the dead Pages deployment in the first place. Either way, **there was
no defect in the current code to fix**, and writing a speculative mitigation for
an error that does not occur would have added an unexplainable code path.

**Revisit when.** A 1102 is actually observed on
`https://mortgage-company-fl.aaron-9c3.workers.dev`. Error 1102 is a Worker CPU
time exceedance, so the re-test is a load crawl of every route with attention to
the most computation-heavy ones — the Vision engine at `/vision/start` and the
amortization schedule at `/calculators/amortization`. The re-test procedure is in
`docs/handoff/TEST_RESULTS.md`. Capture the Worker's observability logs at the
same time; `observability` is already enabled in `wrangler.jsonc`.

---

## D-11 — Vision report persistence receives inputs and recomputes results

**Decision.** The optional report form at `/vision/start` posts bounded scenario
inputs to `POST /api/v1/vision/report-requests`. It never posts calculated
figures. The server validates those inputs, reruns `@tract/vision-model`, and
atomically persists the lead, consent, attribution, project, assumption
provenance, scenario, report and outbox event.

**Reasoning.** A durable report must be reconstructable and cannot trust a
browser to author financial figures, calculation versions or provenance labels.
The Vision transaction is materially wider than the ordinary lead receipt and
uses a Vision-specific disclosure, so this satisfies D-7's revocation condition
for a distinct endpoint. The route preserves the same body, origin, rate-limit,
schema, honeypot, Turnstile, contact-normalization, exact-retry and no-store
boundaries.

User-selected overrides are stored as `source_kind = 'user'` and confirmed.
Catalogue placeholders are stored as `company_default` and are not falsely
marked visitor-confirmed. SQL assertions prove both states and exact replay.

**Revisit when.** If another report-producing route appears, extract the shared
request controls before duplicating them. Never accept a client-authored result
snapshot merely to reduce server work; the deterministic model is the source of
record.
