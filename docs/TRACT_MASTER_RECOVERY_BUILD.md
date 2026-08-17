# TRACT Mortgage — Master Recovery Build, Audit, and Claude–Codex Operating Protocol

Version: 1.0
Created: August 17, 2026
Owner: Aaron Pilkington
Working brand: TRACT Mortgage
Purpose: this is the shared source of truth for repairing and completing the TRACT platform with Claude and Codex working in the same repository.

## How Aaron operates

Aaron works locally in a project folder connected to Claude and Codex. Both agents may inspect and edit the same repository. When a checkpoint is complete, Aaron asks the active agent to prepare copy-and-paste terminal commands. Aaron runs those commands himself. The commands commit and push the reviewed files to GitHub. GitHub is connected to Cloudflare, so the push triggers the configured deployment automatically.

This workflow is authoritative:

- Agents may inspect, plan, edit, run local tests, build previews, inspect diffs and prepare commands.
- Agents must not push, force-push, merge, deploy, purchase services, change production environment variables or mutate external production systems unless Aaron explicitly asks them to perform that action.
- The normal handoff is a set of exact copy-and-paste Git commands for Aaron.
- Do not run Wrangler deployment commands when GitHub integration already owns deployment.
- Before telling Aaron to push, state whether the current branch triggers a preview deployment or the production deployment.
- Never assume a deployment succeeded merely because Git push succeeded. The post-push checklist must verify Cloudflare deployment health and the live smoke-test routes.

## How to install this file in the repository

Place this file at:

```text
docs/TRACT_MASTER_RECOVERY_BUILD.md
```

Then make the root agent instruction files reference it.

If AGENTS.md already exists, preserve it and add:

```markdown
## TRACT project constitution

Before substantive work, read docs/TRACT_MASTER_RECOVERY_BUILD.md and the current files under docs/handoff/. The master recovery document defines product scope, acceptance criteria, agent coordination, Git handoff and deployment gates.
```

If CLAUDE.md already exists, preserve it and add:

```markdown
## TRACT project constitution

Before substantive work, read docs/TRACT_MASTER_RECOVERY_BUILD.md and the current files under docs/handoff/. The master recovery document defines product scope, acceptance criteria, agent coordination, Git handoff and deployment gates.
```

Do not replace existing AGENTS.md or CLAUDE.md blindly. Merge the reference into their existing structure.

## Immediate directive to either coding agent

Read this entire document before editing.

Do not begin by redesigning the site or generating more generic mortgage articles. Begin by inspecting the actual repository, current Git status, route tree, build scripts, Cloudflare configuration, tests, environment schema and handoff records.

The current site is not a failed design. It is an incomplete product with a serious runtime failure. Preserve the useful mortgage pages and design system. Repair the deployment, then build the missing differentiated acquisition loop.

The minimum product loop that must exist before the recovery can be called successful is:

```text
Property search or fixture
  -> Property detail
  -> Send to TRACT Vision
  -> Choose a scenario
  -> Confirm facts and assumptions
  -> Run deterministic analysis
  -> View useful preview
  -> Save or send full report through transparent lead capture
  -> First-party lead and scenario record
  -> CRM outbox
  -> Admin visibility
```

A marketing card labeled In development does not satisfy a feature requirement. A disabled external provider is acceptable only when a complete fixture-backed user experience, adapter interface, tests, feature state and admin blocker are implemented.

## Product truth

TRACT is a mortgage brokerage first.

The website must immediately communicate mortgage services and must support normal high-intent mortgage acquisition: purchase, refinance, first-time buyer, conventional, FHA, VA, USDA, jumbo, investment property, self-employed, condo, calculators, contact, agent relationships and secure application handoff.

Mortgage-first does not mean mortgage-only.

The competitive advantage is that TRACT can build technology other brokerages do not have:

- a property marketplace powered initially by fixtures and later by licensed MLS/IDX data;
- TRACT Vision for property, renovation, land, rental, flip, hold and financing analysis;
- saved scenarios and reports that create a durable lead relationship;
- RendProp as an agent-facing listing-media and lead-capture product;
- a connected agent, mortgage and future title ecosystem;
- measurable first-party acquisition rather than permanent dependence on purchased mortgage leads.

The software is an acquisition engine for the mortgage company. It is not a separate company category on the home page.

## Brand truth

Use TRACT, never Tracked.

Original TRACT meaning:

```text
Turnkey Real Estate Asset Consulting & Transactions Team
```

Original TRACT tagline:

```text
Where Vision Becomes Value.
```

The mortgage-facing working name is TRACT Mortgage. The existing mortgage headline A clearer path from home search to mortgage plan may remain where it performs well.

Do not discard the original TRACT meaning. Use it selectively in the company story, TRACT Vision, investor/property intelligence and future ecosystem architecture. The phrase Where Vision Becomes Value is especially appropriate for TRACT Vision, property analysis and the broader brand narrative.

Visual direction:

- purple-first;
- white and soft-neutral canvas;
- modern and credible;
- substantial whitespace without empty-feeling pages;
- clean dynamic cards;
- restrained motion;
- real property and product imagery;
- data-rich interfaces that remain understandable;
- no generic stock-photo mortgage-broker aesthetic;
- no permanent logo decision until Aaron approves it;
- current typographic wordmark may remain during recovery.

## What this document contains

1. The full public deployment audit.
2. The exact product additions and corrections.
3. Image creation and implementation requirements.
4. A phased remediation build order.
5. Claude–Codex coordination rules.
6. GitHub and Cloudflare handoff rules.
7. Testing and completion gates.
8. The required completion report format.

---

# Part I — Full Deployed-Site Audit

# TRACT Mortgage Deployed-Site Audit

Audit date: August 17, 2026
Deployment: https://mortgage-company-fl.aaron-9c3.workers.dev/
Reference specification: TRACT_MORTGAGE_200K_CLAUDE_BUILD_PROMPT.md and the preceding TRACT project conversation

## Executive verdict

Claude built a polished phase-zero mortgage marketing site. It did not build the mortgage-first technology platform described in the project.

The distinction matters. The site is not pointed at the wrong business: it clearly presents TRACT as a Florida mortgage brokerage, which was a central requirement. The problem is that Claude implemented almost exclusively the conventional mortgage-content layer—home page, program pages, calculators, disclosures and contact forms—while reducing the actual differentiated acquisition products to two status badges:

- TRACT Vision: In development.
- RendProp: In development.

There is no visible property marketplace, MLS fixture experience, property-detail experience, Vision project builder, scenario report, report gate, account area, RendProp capture demo, public tour, or agent media workflow. The home page repeatedly emphasizes that calculator inputs stay on-device and are never stored, but the original growth concept depended on users doing meaningful property and financing work, then saving or receiving a useful report through transparent lead capture. The current implementation removes the very conversion loop that was supposed to make TRACT different.

The build is also operationally unstable. During the audit, the first 18 linked routes rendered. Starting with the affordability calculator, 12 subsequent linked routes returned Cloudflare Error 1102: Worker exceeded resource limits. Direct checks of /vision and /properties returned the same error. After a cooldown, even the home page timed out or returned Error 1102. That is a release-blocking deployment issue. Cloudflare Worker logs are required to identify the precise CPU, memory, initialization, or rendering cause.

Overall assessment:

- Mortgage brand and basic content foundation: good.
- Visual direction: clean and on-color, but generic and too brochure-like.
- Mortgage lead-generation engine: incomplete.
- Differentiated product experience: essentially absent from the public build.
- Technical SEO scaffolding: partially strong.
- Content engine: largely absent.
- Runtime stability: failed during normal multi-page traversal.
- Production readiness: no.

## What was actually inspected

The public deployment was inspected through rendered DOM, visible page state, metadata, JSON-LD, forms, inputs, links, calculators and a full-page visual capture.

Thirty internally linked routes were requested. The following 18 rendered successfully before the Worker began failing:

1. /
2. /mortgage
3. /calculators
4. /resources
5. /partners/real-estate-agents
6. /about
7. /contact
8. /mortgage/purchase
9. /mortgage/refinance
10. /mortgage/investment-property
11. /mortgage/self-employed
12. /mortgage/first-time-home-buyers
13. /mortgage/conventional
14. /mortgage/fha
15. /mortgage/va
16. /mortgage/usda
17. /mortgage/jumbo
18. /calculators/mortgage-payment

The following 12 linked routes returned Cloudflare Error 1102 after the deployment crossed the failure condition:

1. /calculators/affordability
2. /calculators/refinance-break-even
3. /calculators/rent-vs-buy
4. /calculators/closing-cost
5. /licenses
6. /disclosures
7. /security
8. /privacy
9. /terms
10. /accessibility
11. /sms-terms
12. /do-not-sell-or-share

Additional required product routes /vision and /properties also returned Error 1102. Because the Worker had entered a global failure state by then, those responses do not prove whether the routes contain code, return a normal application 404, or fail independently. Their absence from all successful navigation and their replacement by In development labels do prove that no user-facing implementation is exposed.

The contact and partner forms were not submitted, so lead persistence, Turnstile verification, CRM synchronization, notifications and workflow side effects were not claimed as working. A source-repository identifier and Cloudflare logs were not available in the connected project, so hidden backend code could not be audited.

## Product-definition cross-reference

| Product requirement                                               | What the deployment shows                                                                                                                      | Status                      | Severity |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------- |
| Mortgage brokerage is the primary business                        | Home page and all navigation clearly present TRACT as a Florida mortgage brokerage                                                             | Meets                       | None     |
| Purple, modern, clean, spacious brand                             | Purple system, strong typography, whitespace, rounded cards and restrained gradients                                                           | Mostly meets                | Low      |
| Technology-forward differentiated experience                      | Conventional long-form marketing site with one embedded calculator                                                                             | Misses                      | Critical |
| Direct mortgage lead forms connected to a lifecycle system        | Contact and agent forms exist; backend effect was not verified                                                                                 | Partial/unverified          | High     |
| GoHighLevel integration, outbox, retries and idempotency          | No public evidence; requires source and endpoint audit                                                                                         | Unverified                  | High     |
| Mortgage calculators                                              | Payment calculator visibly works; four additional routes became unavailable during Worker failure                                              | Partial/unstable            | High     |
| Save or email useful calculator/report results                    | No visible save, email, account or report action                                                                                               | Missing                     | Critical |
| Progressive qualification and transparent lead capture            | Contact form only; no interactive planner-to-lead journey                                                                                      | Missing                     | Critical |
| MLS/IDX property marketplace                                      | No Properties navigation, search, map, cards, filters or listing pages                                                                         | Missing from public product | Critical |
| Mini-Zillow browsing behavior                                     | No browsing experience exists                                                                                                                  | Missing                     | Critical |
| Paste a listing link or resolve an address                        | No visible input or workflow                                                                                                                   | Missing                     | Critical |
| TRACT Vision workspace                                            | One marketing card marked In development                                                                                                       | Placeholder only            | Critical |
| Renovation/addition/land scenarios                                | No builder, assumptions, property facts, job state or results                                                                                  | Missing                     | Critical |
| Financing plus LTR/STR/flip comparison                            | No scenario workspace; only generic investment content                                                                                         | Missing                     | Critical |
| Source-aware facts versus assumptions versus AI output            | Described in copy, but no report or workspace demonstrates it                                                                                  | Placeholder only            | Critical |
| Lead-gated durable Vision report                                  | No report request, status, notification or report page                                                                                         | Missing                     | Critical |
| Consumer accounts, saved properties and reports                   | No login/account navigation or visible account flow                                                                                            | Missing from public product | High     |
| RendProp agent product                                            | One In development badge on home/partner positioning                                                                                           | Placeholder only            | Critical |
| Smartphone capture/upload demo                                    | No capture or upload flow                                                                                                                      | Missing                     | Critical |
| Cleanup, staging, enhanced media and floor-plan workflow          | No demo, samples, job state or before/after experience                                                                                         | Missing                     | Critical |
| Shareable tour, QR and listing-level lead capture                 | No public tour or share flow                                                                                                                   | Missing                     | High     |
| Agent acquisition through software                                | Agent page is a normal partnership page and contact form                                                                                       | Misses differentiator       | High     |
| Authenticated admin dashboard                                     | No public evidence; appropriate not to expose navigation, but source/auth audit is required                                                    | Unverified                  | High     |
| AI provider abstraction, jobs, budget ledger and quotas           | No public evidence or user-facing job flow                                                                                                     | Unverified/unused           | High     |
| Bot protection and Turnstile                                      | Forms contained privacy/marketing consent and a likely honeypot field; no visible Turnstile field/iframe was observed                          | Partial/unverified          | High     |
| Installable PWA                                                   | Theme color and app-oriented metadata exist; installability and service worker were not verified                                               | Partial/unverified          | Medium   |
| Blog/resource publishing engine                                   | Resources page says guides are being written and exposes no articles                                                                           | Missing                     | High     |
| Hundreds of useful draft content assets                           | No public evidence; source audit required                                                                                                      | Unverified                  | Medium   |
| Technical SEO                                                     | Canonicals, robots directives, Open Graph, Twitter metadata and JSON-LD were present on successful pages                                       | Partial strength            | Medium   |
| AEO/AI-search foundation                                          | Clear direct copy and entity schema exist; original data, cited research, author/reviewer system and substantive resources are absent publicly | Partial                     | High     |
| Analytics, Google tags, click identifiers and offline attribution | Not verifiable from the completed public audit                                                                                                 | Unverified                  | High     |
| Stable Cloudflare deployment                                      | Error 1102 and later timeouts across the site                                                                                                  | Fails                       | Critical |

## Page-by-page findings

### Home page

What is good:

- It immediately identifies TRACT as a Florida mortgage brokerage.
- The hero is clear, visually strong and matches the purple/white direction.
- It has useful intent paths for buying, refinancing, investing, self-employed and unsure visitors.
- The embedded payment calculator is more transparent than typical mortgage calculators.
- The page has a single H1, index/follow directive, canonical URL, Open Graph, Twitter metadata, WebPage, BreadcrumbList, Organization and WebSite JSON-LD.
- The page is readable, accessible in its basic structure, and does not present fabricated rates.

What is wrong relative to the project:

- The hero sells clarity, not the differentiated TRACT technology.
- There is no Properties, Vision or account entry point in the main navigation.
- The site provides no visual signal of a property marketplace: no real-estate imagery, listing cards, map, parcel view, scenario preview or sample report.
- TRACT Vision appears near the bottom as a small In development card. It was supposed to be a major acquisition engine while remaining subordinate to mortgage.
- RendProp is reduced to a badge.
- The primary CTA routes to a generic contact form instead of a mortgage-planning wizard.
- The home page itself has no lead form.
- The calculator promises that nothing is transmitted, stored or used to contact the visitor. That is transparent, but there is no optional Save this scenario or Send my report conversion path. The tool therefore supplies utility without capturing the lead.
- The long page is visually polished but repetitive and highly text-driven. It feels like a premium mortgage brochure, not an unusually advanced platform.
- The original broader TRACT brand story—Turnkey Real Estate Asset Consulting & Transactions Team and Where Vision Becomes Value—is absent. The later mortgage-first decision did not require discarding that DNA; it required subordinating it to mortgage conversion.

Verdict: strong conventional home page, wrong level of product ambition.

### Mortgage hub

Rendered successfully with 545 words, canonical metadata and JSON-LD. It links to purchase, refinance, first-time buyer, conventional, FHA, VA, USDA, jumbo, investment property, self-employed and condo content.

Strength: a clear SEO and education hub.

Gap: it is a directory of articles. It does not route visitors through an interactive qualification or product-selection flow, and it does not connect mortgage options to actual properties or TRACT Vision scenarios.

### Mortgage program pages

The ten pages tested rendered between roughly 560 and 830 words each. They had distinct titles, H1s, canonical URLs, index/follow and two JSON-LD blocks. That is meaningful implementation work and a good structural SEO start.

The observed set:

- Purchase: 830 words.
- Refinance: 709 words.
- Investment property: 640 words.
- Self-employed: 599 words.
- First-time buyer: 636 words.
- Conventional: 604 words.
- FHA: 649 words.
- VA: 616 words.
- USDA: 566 words.
- Jumbo: 560 words.

Gap: these pages appear to follow one reusable educational template. They establish coverage, but they are not the interactive acquisition experience we discussed. They need stronger calculators, planning flows, original examples, source/reviewer metadata, and page-specific lead offers. Condo was discovered in the mortgage hub but was not independently loaded before the Worker failure.

### Calculators hub

The hub accurately describes payment, affordability, refinance break-even, rent versus buy and cash to close. It has useful positioning: calculators that show their work.

Gap: it has no report-saving, emailing, scenario comparison or handoff mechanism. It functions as a list of utilities instead of a conversion system.

### Payment calculator

This is the strongest working feature in the deployment.

It exposes purchase price, down payment, interest-rate assumption, term, annual property tax, annual insurance, HOA and mortgage-insurance inputs. It breaks out principal and interest, taxes, insurance and MI, and displays the calculation/disclosure version.

The calculator responds in the browser and clearly labels assumptions. The implementation aligns with the deterministic-math requirement.

Missing:

- editable numeric inputs in addition to sliders for precision and accessibility;
- save scenario;
- email/download report;
- compare programs;
- use an actual property;
- capture an optional lead after delivering value;
- hand off the exact scenario to the mortgage professional;
- create an attribution event visible to the business.

### Affordability, refinance break-even, rent-versus-buy and cash-to-close calculators

The routes were linked from the site but returned Error 1102 after the deployment failed. Because the Worker later failed even on the home page, the audit cannot separate route-specific defects from site-wide resource exhaustion.

Verdict: unverified and blocked by a critical runtime problem.

### Resources

The page is indexed and says Guides are being written. It exposes no guides or articles.

This is the wrong indexation state. A placeholder resources page provides little user value and should remain noindex until it has substantive resources. More importantly, the content engine, author/reviewer model, cited research, market reports, glossary, blog, RSS/feed and linkable assets are not visible.

### For real-estate agents

What exists:

- a clear agent value proposition;
- three service/communication themes;
- an agent inquiry form;
- privacy acceptance and separate SMS/email marketing choices;
- a likely honeypot field named company;
- a RendProp In development section.

What is missing:

- actual RendProp demonstration;
- guided capture preview;
- virtual cleanup/staging examples;
- floor-plan artifact example;
- shareable tour example;
- QR/listing attribution workflow;
- agent dashboard or trial entitlement;
- property/listing handoff into mortgage lead capture.

Verdict: good generic partnership page, not the software-led agent acquisition strategy discussed.

### Contact

The contact page has a form containing first name, last name, email, phone, timeline, preferred contact, message, a likely honeypot, privacy acceptance, SMS marketing and email marketing. Its consent separation is directionally good.

Not verified:

- server validation;
- first-party database write;
- Turnstile server validation;
- duplicate/idempotency handling;
- transactional outbox;
- GoHighLevel upsert;
- attribution persistence;
- notification;
- error and retry behavior.

The form was not submitted, so these cannot be inferred from the UI.

### About

The page rendered with 590 words and presents the company as deliberately built. It is structurally complete as a marketing page.

Gap: the public story does not surface the earlier TRACT vision, the technology thesis, RendProp history, the family’s title/real-estate ecosystem, or why the company can build a uniquely integrated experience. Those facts need to be framed carefully, but omitting all of them makes the company sound like another clean mortgage startup.

### Legal, disclosure and security pages

These routes were present in the footer but fell inside the Error 1102 period. Their content could not be verified. The links existing is not sufficient; they must be load-tested after the Worker issue is fixed.

### Required product routes not exposed

No successful public page linked to:

- /properties;
- /properties/[source]/[listingKey];
- /vision;
- /vision/project/[id];
- /vision/report/[id];
- /rendprop;
- /tour/[publicId];
- /account;
- /account/saved;
- /account/reports;
- /apply;
- /blog;
- /blog/[slug];
- /locations/florida;
- /admin or its operational children.

Some of those routes should be private or noindex, so absence from the public navigation is not automatically a defect. The user-facing property, Vision, report and RendProp entry points should exist and were explicitly required. They do not.

## Functional architecture gaps

### Lead generation

The deployed strategy is: educate, then ask the user to contact TRACT.

The discussed strategy was: let the visitor do valuable work, progressively understand the property and financing goal, deliver a meaningful preview, then transparently collect contact information to save or deliver the result. The latter creates a proprietary acquisition funnel. The current site defaults back to the same contact-page funnel every mortgage company already has.

### Property and MLS layer

No visible normalized listing fixture, search UI, list/map view, filters, property-detail page, source attribution, saved property, paste-link resolver or listing-to-Vision transition exists.

The launch did not require production MLS credentials. It did require a fixture-backed vertical slice and provider-neutral architecture that visibly demonstrates the product.

### TRACT Vision

No visible state machine or vertical slice exists. The minimum useful demo should have allowed a synthetic Florida property, a goal selection, sourced/fixture facts, user assumptions, deterministic calculations, a limited report preview and a lead-gated saved report. That could have been built without one paid AI call.

### RendProp

No visible product exists. A lightweight demo could have shown the capture sequence, sample original media, cleanup/staging comparison, room navigation, floor-plan candidate, public tour and QR lead path using synthetic assets. Instead, it is a label.

### Accounts and reports

No visible sign-in, saved scenario, saved property, report status or report history exists. Without this, the platform cannot create the return behavior or durable lead relationship discussed.

### Admin

The public UI cannot prove or disprove a properly protected admin dashboard. There is no repository or authenticated test context. Source verification is required for leads, outbox, jobs, spend, content, consent, sources, audit events, feature flags, integration health and readiness.

### CRM and analytics

The forms could be wired to real endpoints, but the rendered form alone is not evidence. The same is true for GA4, GTM, Google Ads identifiers, enhanced lead conversions, server-side tagging, click IDs and offline conversion architecture. These require source, network, database and external sandbox evidence.

### AI and cost controls

No visible AI job is available, so provider routing, budgets, quotas, kill switches, queue behavior and provenance cannot be exercised. The architecture may exist as unused code, but the product does not demonstrate it.

## Visual and brand audit

The visual implementation is one of the stronger pieces:

- purple is used consistently;
- typography is strong;
- card corners, shadows and gradients are restrained;
- whitespace is clean;
- the page does not look cluttered;
- the inline calculator result card looks credible.

But it is not the visual language of the platform we discussed:

- almost no property imagery;
- no listing cards;
- no map or parcel geometry;
- no before/after renderings;
- no report samples;
- no floating property or scenario data;
- no visual demonstration of AI-enhanced real estate;
- no sense that a user can build, model, compare, save or return.

The current home page could belong to any well-designed mortgage brokerage. The desired experience should still say mortgage company immediately, but the second impression should be: this company has tools nobody else has.

## SEO and AEO audit

Implemented strengths on successful pages:

- distinct titles;
- meta descriptions;
- canonical URLs;
- index/follow directives;
- Open Graph and Twitter tags on home;
- Organization and WebSite entity schema;
- WebPage and Breadcrumb schema;
- two JSON-LD blocks on the program pages;
- clean semantic H1/H2 structure;
- substantial copy on the mortgage pages.

Material gaps:

- resources page is an indexed placeholder;
- no visible articles, guides, glossary or market reports;
- no visible author/reviewer/source/update system;
- no original research or downloadable dataset;
- no property or Vision pages creating unique answerable content;
- no evidence of RSS/feed;
- sitemap and robots raw files could not be inspected in the browser environment;
- no evidence of internal content graph beyond hubs and footer links;
- no visible backlink operating assets;
- no public proof of analytics or Search Console integration;
- the runtime failure can make crawling unreliable even when markup is correct.

The site has decent on-page scaffolding. It does not yet have the content, data or product originality that would make TRACT consistently cite-worthy in search or answer engines.

## Why Claude likely went off course

Claude appears to have optimized the safest, easiest-to-verify interpretation of the instructions:

1. Mortgage-first became mortgage-only.
2. Advanced integrations may be disabled became advanced products may be replaced with In development badges.
3. Core site must work without MLS or AI became do not build the fixture-backed vertical slices.
4. Compliance and data-boundary controls dominated the product language.
5. The large instruction set rewarded creating many complete content pages before proving the differentiated product loop.
6. The phase ordering let Claude stop after the conventional foundation.

This is not entirely random model failure. The implementation ignored explicit definition-of-done requirements, but the prompt also gave Claude too much room to count disabled adapters and placeholders as progress. The correction prompt needs a harder product acceptance contract: no completion claim until a consumer can browse a fixture property, model a scenario, see a report preview, save/request the report, and an admin can observe the lead/job lifecycle.

## Correct target experience

The correct product hierarchy is:

1. TRACT is unmistakably a mortgage brokerage.
2. The home page offers normal high-intent mortgage paths and calculators.
3. The same home page prominently introduces a property intelligence experience.
4. A user can browse synthetic or licensed property data immediately.
5. A property can enter TRACT Vision.
6. The user chooses renovation, addition, land/build, LTR, STR, hold or flip.
7. The system displays facts, assumptions and calculations separately.
8. A useful preview is delivered before contact capture.
9. Contact capture saves or delivers the full report and creates the mortgage lead.
10. The scenario is visible in an account and operational admin pipeline.
11. Agents get a separate RendProp-powered acquisition path that feeds listing and mortgage leads.

That is still mortgage-first. The software is the acquisition advantage, not the company category.

## Remediation order

### P0 — Stabilize the deployment

- Inspect Cloudflare Worker logs for Error 1102 Ray IDs and route timing.
- Determine whether the failure is CPU time, memory, initialization, recursive rendering, bundle behavior or another OpenNext issue.
- Add per-route smoke tests against the deployed preview.
- Verify all 30 currently linked routes individually.
- Keep a lightweight static/error fallback for public content.
- Do not continue feature deployment until the home, form, calculators and legal pages survive a realistic crawl.

### P1 — Build one complete acquisition loop

- Add Properties to navigation.
- Build a fixture-backed Florida search/list experience.
- Build one fixture property-detail page.
- Add Send to TRACT Vision.
- Build one deterministic renovation/addition scenario.
- Show a limited report preview.
- Gate save/send of the full report behind transparent contact capture.
- Persist the lead, consent, attribution, scenario and outbox.
- Show the lifecycle in admin.

Do not add five more mortgage articles before this loop works.

### P2 — Repair conversion paths

- Replace generic Build my mortgage plan contact routing with a short interactive planner.
- Add optional Save this calculation and Email my scenario actions to calculators.
- Preserve local computation until the user explicitly chooses to save.
- Carry scenario context into the contact and CRM record.
- Verify Turnstile, first-party receipt, GHL sync, idempotency and failure recovery.
- Add thank-you and next-step states.

### P3 — Expose the agent product

- Build a RendProp demo with synthetic media.
- Show capture guidance, before/after cleanup, virtual staging label, floor-plan candidate, tour and QR page.
- Connect a tour inquiry to attribution and mortgage follow-up.
- Make Request demo secondary to Try sample tour.

### P4 — Complete content and discovery

- Change Resources to noindex until real resources exist.
- Publish the first five to twelve reviewed guides.
- Add visible sources, author, reviewer and update dates.
- Create one original Florida affordability report and one renovation-cost methodology asset.
- Verify sitemap, robots, feed, OpenAI crawler choice, Search Console, Bing and analytics.

### P5 — Finish the platform surfaces

- Consumer account and reports.
- Saved properties and scenarios.
- Admin leads, jobs, usage, integrations, content, sources, consent, audit and readiness.
- AI provider sandbox, spend reservation and quotas.
- Production MLS provider after rights and credentials exist.
- Native Expo RendProp capture app later, not before the web acquisition loop works.

## Evidence needed for the source-level audit

To move from public product audit to full engineering audit, provide the GitHub repository identifier or add the repository to the project. The next audit should inspect:

- file tree and route tree;
- package versions and lockfile;
- Cloudflare/OpenNext configuration;
- Worker logs for Error 1102;
- Supabase migrations and RLS;
- lead route and outbox;
- GoHighLevel adapter and webhook verification;
- analytics event layer;
- environment validation;
- feature flags;
- MLS fixtures/adapters;
- Vision jobs, calculations and report assembly;
- RendProp domain model;
- admin authorization;
- tests and CI;
- service worker and manifest;
- security headers and CSP;
- actual sitemap, robots and feed output.

## Bottom line

Do not throw away the current mortgage pages. They are a solid content shell and visual foundation. But do not confuse them with the product.

The fastest correction is not a full rebuild. Stabilize the Worker, retain the design system and mortgage pages, then force the next build around one end-to-end fixture-backed property-to-Vision-to-report-to-lead-to-admin loop. Once that exists, the site will begin to resemble the business discussed instead of another polished mortgage brochure.

---

# Part II — Required Product Additions and Corrections

## 1. Preserve these existing assets

Do not rebuild the entire application from zero.

Preserve and improve:

- the purple/white design token system;
- typography and spacing;
- global header/footer structure;
- mortgage-first positioning;
- existing home-page content that remains useful;
- mortgage hub;
- purchase, refinance, first-time, conventional, FHA, VA, USDA, jumbo, investment, self-employed and condo pages;
- payment-calculator logic if its tests are correct;
- contact and agent form design;
- canonical/metadata/JSON-LD helpers;
- pre-launch feature flags;
- disclosure components;
- any correct Supabase, CRM, analytics, AI, MLS or admin code found during source audit.

Refactor rather than duplicate. Do not create a second design system, second lead type, second database client or second analytics vocabulary.

## 2. P0: repair Cloudflare Worker stability

This is the first engineering checkpoint.

Observed public failure:

- the first 18 routes rendered;
- the next 12 internally linked routes returned Cloudflare Error 1102;
- /vision and /properties also returned Error 1102;
- after the failure condition, the home page timed out or returned Error 1102.

Required investigation:

- inspect Cloudflare Worker logs using the existing project configuration;
- capture representative Error 1102 Ray IDs from the audit if useful;
- inspect OpenNext configuration;
- inspect wrangler configuration and compatibility date;
- identify server imports that initialize large SDKs on every public request;
- identify recursive rendering, metadata or sitemap work;
- identify dynamic imports that accidentally enter the public bundle;
- identify middleware or proxy work applied to every route;
- inspect database, AI, CRM or provider clients created during module initialization;
- inspect runtime incompatibilities and polyfills;
- inspect source maps and production logs;
- measure cold and warm route CPU time;
- inspect memory use where supported;
- verify whether content generation or massive configuration is parsed per request;
- verify that server-only dependencies do not enter client or edge bundles;
- verify that no route calls an unavailable external service during render;
- check whether all pages are unnecessarily dynamic;
- move safe public pages to static generation or cacheable rendering;
- lazy-load heavy admin, map, media and AI code;
- isolate provider SDKs behind route-level server modules.

Use existing scripts when present. Personal project context indicates these scripts may already exist:

```text
pnpm check
pnpm deploy:preflight
pnpm cf:build
pnpm cf:preview
pnpm cf:deploy
```

Verify the actual package.json before running them. Do not invent commands if the scripts differ.

P0 acceptance:

- clean install works;
- pnpm check passes;
- deploy preflight passes;
- Cloudflare build passes;
- local/preview smoke test passes;
- every currently linked public route can be requested in sequence without Error 1102;
- home, contact, partner form, five calculators and all legal routes render after cold start;
- a 50-route sequential smoke test does not destabilize the Worker;
- no production push has occurred without Aaron running the prepared command.

## 3. Information architecture

Target public navigation:

```text
Mortgage
Properties
TRACT Vision
Calculators
For Agents
Resources
About
[Build My Mortgage Plan]
[Account icon when enabled]
```

Mobile navigation must expose the same core paths.

Target route groups:

```text
/
 /mortgage
 /mortgage/purchase
 /mortgage/refinance
 /mortgage/first-time-home-buyers
 /mortgage/conventional
 /mortgage/fha
 /mortgage/va
 /mortgage/usda
 /mortgage/jumbo
 /mortgage/investment-property
 /mortgage/self-employed
 /mortgage/condo

 /properties
 /properties/[source]/[listingKey]

 /vision
 /vision/project/[id]
 /vision/report/[id]

 /calculators
 /calculators/mortgage-payment
 /calculators/affordability
 /calculators/refinance-break-even
 /calculators/rent-vs-buy
 /calculators/closing-cost

 /rendprop
 /tour/[publicId]
 /partners/real-estate-agents

 /account
 /account/saved
 /account/reports

 /resources
 /resources/guides
 /resources/glossary
 /blog
 /blog/[slug]
 /locations/florida
 /locations/florida/[market]

 /apply
 /contact
 /about
 /licenses
 /disclosures
 /security
 /privacy
 /terms
 /accessibility
 /sms-terms
 /do-not-sell-or-share
```

Admin remains protected and absent from public navigation:

```text
 /admin
 /admin/leads
 /admin/leads/[id]
 /admin/jobs
 /admin/usage
 /admin/integrations
 /admin/content
 /admin/properties
 /admin/sources
 /admin/consent
 /admin/audit
 /admin/settings
 /admin/readiness
```

## 4. Home-page correction

The existing home page is useful but reads as a long mortgage brochure. Recompose it without hiding the mortgage company.

Required order:

1. Pre-launch banner while applicable.
2. Header with Mortgage, Properties, TRACT Vision, Calculators, For Agents and Resources.
3. Mortgage-first hero.
4. Interactive or visual product proof beside the hero.
5. Fast mortgage intent selector.
6. Featured property or synthetic-property strip.
7. TRACT Vision demonstration.
8. Mortgage calculator preview.
9. Loan-program grid.
10. How the mortgage process works.
11. Agent and RendProp section.
12. Reviewed resources.
13. FAQ.
14. Final conversion block.
15. licensing/disclosure/footer.

Hero recommendation:

- Keep a mortgage-first H1.
- On desktop, pair the copy with a composed property intelligence panel:
  - synthetic listing image;
  - purchase price;
  - payment preview;
  - renovation scenario;
  - potential post-improvement range;
  - clear Sample scenario label.
- On mobile, stack the proof panel beneath the CTA.
- The panel must link to a working fixture property or Vision demo.

CTA hierarchy:

- Primary: Build my mortgage plan.
- Secondary: Explore properties.
- Tertiary contextual: Try TRACT Vision.

Build my mortgage plan must become a short interactive planner, not a plain link to the contact page.

## 5. Mortgage-planning funnel

Create a progressive planner.

Step 1 — intent:

- buying;
- refinancing;
- investing;
- building;
- unsure.

Step 2 — timing and location:

- target Florida market or ZIP;
- now, zero to three months, three to six months, six-plus months, researching.

Step 3 — optional planning inputs:

- target purchase range;
- target monthly payment;
- down-payment range;
- self-reported credit band;
- income type;
- optional monthly gross income for an illustrative affordability calculation;
- optional monthly debt;
- occupancy type.

Step 4 — immediate value:

- preliminary payment or affordability range;
- visible assumptions;
- recommended next tool;
- relevant property or Vision path where appropriate.

Step 5 — save or talk:

- name;
- email;
- phone;
- preferred contact;
- privacy/contact request;
- separate optional SMS marketing;
- separate optional email marketing.

Do not request Social Security number, date of birth, bank login, documents or a full application. Secure application remains a POS/LOS handoff.

Persist the planning snapshot with the lead. Send only approved marketing fields and a concise scenario summary to GoHighLevel.

## 6. Calculator conversion corrections

Keep calculator arithmetic local until the user explicitly chooses to save.

Every calculator must offer:

- Save this scenario;
- Email me this breakdown;
- Compare another scenario;
- Talk through these numbers;
- Use a property from TRACT.

When the user chooses save or email:

- explain what will be stored;
- collect the minimum contact data;
- store calculation version and input snapshot;
- store consent;
- create first-party receipt;
- enqueue CRM sync;
- create account invitation or magic-link option when enabled;
- show a useful confirmation state.

Do not gate the basic result. Deliver value first, then gate persistence and the expanded report.

Add precise numeric fields beside sliders. Sliders alone are not adequate for exact property and financing inputs.

## 7. Property marketplace MVP

Production MLS credentials are not required for this checkpoint.

Build a complete fixture-backed experience first.

### Property-search page

Required:

- search field for address, city, ZIP or listing identifier;
- paste listing link field with safe explanatory copy;
- list/map toggle;
- price range;
- beds;
- baths;
- property type;
- status;
- lot or land option;
- sort;
- accessible filter controls;
- result count;
- pagination or cursor loading;
- saved search when accounts are enabled;
- provider and data-as-of label.

Fixture set must include at least:

- St. Petersburg bungalow;
- Tampa contemporary home;
- Sarasota coastal property;
- Orlando suburban home;
- Jacksonville duplex or investment property;
- Florida vacant residential lot;
- Florida larger land parcel.

Use synthetic addresses or clearly marked demo records. Do not present fictional properties as active listings.

### Property cards

Each card includes:

- generated or licensed image;
- price;
- address or demo label;
- beds/baths/square footage;
- property type;
- status;
- estimated payment preview using editable assumptions;
- Save;
- Analyze with TRACT Vision;
- source attribution.

### Property detail

Required:

- gallery;
- property facts;
- listing/source attribution;
- map or fixture map placeholder with clear state;
- tax, insurance and HOA input/known-state display;
- payment preview;
- saved state;
- Ask about financing;
- Analyze with TRACT Vision;
- source/data-as-of;
- no claim that fixture data is live.

### Paste-link behavior

Do not scrape Zillow.

For MVP:

- accept a URL;
- validate the hostname;
- explain that TRACT will attempt to identify the address;
- use a fixture resolver for approved demo URLs;
- otherwise request address confirmation;
- rehydrate through fixture/licensed property adapters;
- deny arbitrary server-side URL fetches.

## 8. TRACT Vision MVP

The Vision MVP must work without paid AI.

### Entry modes

- analyze a TRACT property;
- enter an address;
- choose a fixture;
- analyze vacant land;
- start from saved scenario.

### Goal selection

- cosmetic renovation;
- add bedroom/bathroom;
- add square footage;
- conceptual home on land;
- long-term rental;
- short-term rental;
- fix and flip;
- buy and hold;
- compare scenarios.

### Four data lanes

The interface must visually separate:

1. Sourced facts.
2. User inputs.
3. Company defaults.
4. AI or model inferences.

Never merge these into one unexplained number.

### Required deterministic outputs

For the first vertical slice:

- purchase price;
- down payment;
- interest-rate assumption;
- taxes;
- insurance;
- HOA;
- renovation low/expected/high;
- contingency;
- financing/holding cost;
- post-improvement value range;
- long-term rental income and expense range when selected;
- short-term rental assumptions when selected;
- flip sale-cost and holding-period assumptions;
- cash flow;
- cash required;
- sensitivity table;
- excluded items;
- calculation version.

### Preview and lead gate

Before lead capture, show:

- property;
- goal;
- major assumptions;
- three to five key results;
- one sensitivity insight;
- source/fixture state.

The full report contains:

- all inputs;
- sources;
- low/expected/high scenarios;
- financing;
- renovation or build scope;
- value methodology;
- LTR/STR/flip/hold outputs;
- risks;
- next actions;
- concept images when available;
- mortgage CTA.

To save, send or generate the durable report, collect transparent contact and consent.

### AI integration

AI is optional in the MVP and must sit behind an adapter.

Use it later for:

- source summarization;
- structured scope drafting;
- missing-question generation;
- photo classification;
- narrative;
- concept images.

Do not use AI as the financial calculator.

## 9. RendProp MVP

RendProp must become a visible agent product rather than a badge.

### Public RendProp page

Show:

- what the capture flow does;
- a sample guided phone capture;
- a sample interactive tour;
- cleanup before/after;
- virtual staging before/after;
- enhanced listing image;
- floor-plan candidate;
- QR code;
- listing inquiry flow;
- Try sample tour;
- Request agent demo.

### Fixture capture flow

Build a demo using synthetic media:

1. Create capture session.
2. Confirm media rights.
3. Show capture instructions.
4. Upload or select sample fixture.
5. Tag rooms.
6. Select cleanup or staging mode.
7. Show queued/processing fixture state.
8. Show derived assets.
9. Review.
10. Publish sample tour.

The demo must not imply survey-grade floor plans or exact Matterport equivalence.

### Public tour

Required:

- fast mobile layout;
- room navigation;
- original versus staged indicator;
- listing and agent attribution;
- lead form;
- mortgage CTA;
- share link;
- QR campaign attribution;
- expiration/unpublish state.

## 10. Consumer account and report system

Add:

- email magic-link or approved auth;
- saved properties;
- saved calculator scenarios;
- Vision projects;
- report job status;
- completed reports;
- notification preferences;
- delete/export request entry point.

The public site must remain useful without an account. Account creation is for persistence.

## 11. Admin operational dashboard

The dashboard is required even if external providers remain disabled.

Required sections:

### Home

- new leads;
- lead sync backlog;
- dead letters;
- reports queued/processing/failed;
- AI reserved and actual cost;
- content review backlog;
- integration status;
- deployment/readiness blockers.

### Leads

- source;
- intent;
- scenario;
- consent;
- attribution;
- CRM sync;
- assignment;
- timeline;
- masked contact fields based on role.

### Jobs and usage

- feature;
- provider;
- status;
- duration;
- retry;
- cost;
- quota;
- kill switches.

### Content

- brief/draft/review/published;
- sources;
- author;
- reviewer;
- indexation;
- review date;
- preview.

### Integrations

- disabled, fixture, sandbox or production;
- required environment-variable names without secret values;
- health;
- last success/failure;
- backlog;
- setup blocker.

### Audit and readiness

- role changes;
- retries;
- content publication;
- quota changes;
- integration changes;
- launch-gate checklist.

## 12. Lead, CRM and analytics verification

Do not claim forms are complete because they render.

Verify:

- Zod validation;
- origin/content-type/body-size checks;
- honeypot;
- Turnstile server verification;
- rate limiting;
- normalized email/phone;
- deduplication;
- first-party transaction;
- consent receipt;
- attribution touch;
- outbox event;
- fast success response;
- GoHighLevel worker;
- retry classification;
- idempotency;
- dead letter;
- webhook signature verification;
- redacted logging.

Analytics must include a typed vocabulary for:

- page view;
- CTA click;
- form start;
- generate lead;
- calculator start/complete/save;
- property search;
- property view;
- property save;
- Vision start;
- scenario configured;
- report request;
- report ready;
- application handoff;
- partner inquiry;
- RendProp tour view;
- RendProp inquiry.

Do not send raw contact, income, debt, credit band, address, prompts or report narrative to general analytics.

## 13. Content, SEO and AEO correction

Keep the good canonical and JSON-LD scaffolding.

Immediately:

- change the empty Resources page to noindex until it contains useful resources;
- confirm sitemap and robots output directly;
- confirm the PWA manifest and service worker;
- verify Organization, WebSite, WebPage and Breadcrumb graphs;
- add truthful Article/BlogPosting graphs to reviewed content;
- add visible author, reviewer, sources, publication date and review date;
- add RSS or Atom feed;
- add glossary;
- add content revision workflow;
- add OAI-SearchBot policy when approved;
- treat GPTBot policy separately;
- connect Search Console and Bing verification through configuration;
- add GA4/GTM/Google Ads configuration and typed events;
- capture first/last touch and click identifiers;
- prepare offline conversion mapping without enabling it blindly.

First public content batch after review:

- first-time buyer roadmap for Florida;
- cash-to-close breakdown;
- prequalification versus preapproval;
- mortgage payment components;
- how rate and points work;
- Florida property tax and homestead planning;
- Florida homeowners-insurance planning;
- flood-map and mortgage planning;
- condo financing questions;
- refinance break-even guide;
- investment-property expense stack;
- vacant-land due-diligence checklist.

First linkable assets:

- TRACT Florida Affordability Report;
- TRACT Florida Renovation Cost Methodology;
- interactive payment calculator;
- interactive refinance break-even calculator;
- property-to-Vision sample report;
- RendProp listing-media benchmark when real aggregate data exists.

No mass publishing. Drafts begin noindex.

# Part III — Image Creation and Asset Implementation

## 14. Non-negotiable image requirement

The corrected site may not ship as a wall of text, gradients and empty cards.

Images must be created, optimized, committed to the repository and used in the actual interfaces.

If the active agent has an image-generation tool, it must generate the required assets. If it does not, it must create the complete asset manifest and generation prompts, mark the checkpoint blocked on asset generation and continue the code with clearly named local fixture placeholders. A task is not complete while production UI uses random stock placeholders, remote hotlinks or blank gradient rectangles.

All property fixtures and product demonstrations must use:

- original company-owned media;
- properly licensed media; or
- clearly documented AI-generated synthetic media.

Do not copy Zillow, MLS or another listing site's images.

## 15. Required image asset manifest

Create:

```text
public/images/
  home/
    tract-hero-property.webp
    tract-vision-preview.webp
    mortgage-planning-dashboard.webp
  properties/
    fixture-st-pete-bungalow-01.webp
    fixture-st-pete-bungalow-02.webp
    fixture-tampa-contemporary-01.webp
    fixture-sarasota-coastal-01.webp
    fixture-orlando-suburban-01.webp
    fixture-jacksonville-duplex-01.webp
    fixture-florida-lot-01.webp
    fixture-florida-land-01.webp
  vision/
    renovation-before.webp
    renovation-after-concept.webp
    addition-before.webp
    addition-after-concept.webp
    land-aerial.webp
    land-home-concept.webp
    report-cover.webp
  rendprop/
    phone-capture.webp
    living-room-original.webp
    living-room-cleanup-concept.webp
    living-room-staged-concept.webp
    kitchen-original.webp
    kitchen-enhanced.webp
    sample-floor-plan.webp
    sample-tour-cover.webp
  agents/
    agent-toolkit.webp
    open-house-qr-demo.webp
  og/
    default.png
    properties.png
    vision.png
    rendprop.png
```

Exact filenames may adapt to existing conventions, but create one canonical manifest rather than scattered assets.

## 16. Image briefs

### Home hero

Create a photorealistic modern Florida home with:

- warm natural light;
- real landscaping;
- no text;
- no logos;
- room for interface cards to be overlaid by HTML;
- credible architecture;
- subtle high-end feel;
- no exaggerated luxury mansion unless the page is explicitly about jumbo financing;
- wide composition suitable for desktop crop and mobile focal positioning.

Target source: 2400 by 1600 or larger.

### Property fixtures

Create visibly different Florida properties:

- St. Petersburg bungalow with mature tropical landscaping;
- Tampa contemporary single-family home;
- Sarasota coastal-influenced home;
- Orlando suburban family home;
- Jacksonville duplex suitable for investor analysis;
- vacant infill lot;
- larger residential land parcel.

Do not generate visible addresses, signs, watermarks or listing-site branding.

### TRACT Vision before/after pairs

Pairs must preserve camera angle, building footprint and surrounding conditions.

Renovation pair:

- original dated but structurally plausible exterior/interior;
- concept version with cosmetic improvement;
- do not remove permanent defects dishonestly;
- label Concept visualization in HTML outside the image.

Addition pair:

- same home and camera;
- visually plausible bedroom or living-area addition;
- not presented as permitted construction;
- clear concept label.

Land pair:

- original aerial or elevated land view;
- concept home placement;
- keep parcel context;
- overlay parcel/setback lines with SVG or canvas in the interface rather than asking the image model to create exact geometry.

### RendProp pairs

Create matched fixtures:

- original furnished living room with ordinary clutter;
- cleanup version that removes movable clutter but preserves physical conditions;
- virtually staged version with modern furniture;
- original kitchen;
- enhanced version that improves exposure and color but does not remove defects.

Use HTML badges:

- Original;
- Cleanup visualization;
- Virtually staged;
- Enhanced;
- Floor-plan candidate.

### Floor plan

A generated sample floor plan may be used only as a demonstration artifact. It must be labeled Not for measurement, appraisal, survey or construction.

## 17. Image implementation rules

- Use next/image or the repository's equivalent optimized component.
- Provide width and height to avoid layout shift.
- Use responsive sizes.
- Load the hero eagerly only when it is the Largest Contentful Paint asset.
- Lazy-load below-fold media.
- Generate WebP and/or AVIF from high-quality sources.
- Keep source originals outside the public runtime when practical.
- Do not upscale a visibly weak generation.
- Check hands, windows, doors, rooflines, stairs, reflections and repeated objects.
- Check every before/after pair for geometry drift.
- Add alt text based on the visible purpose of the image.
- Use empty alt only for genuinely decorative assets.
- Do not keyword-stuff alt text.
- Record source, generator/provider, prompt key, date, rights class and transformations in an asset manifest.
- Include image assets in visual regression tests or screenshot review.
- Do not place important text inside generated images.
- Use HTML for numbers, labels, disclosures and CTAs.
- Add a graceful fallback when an image fails.
- Confirm remote image domains rather than allowing all hosts.

Asset manifest example:

```json
{
  "key": "vision.renovation.after",
  "path": "/images/vision/renovation-after-concept.webp",
  "kind": "ai_generated",
  "rights": "company_generated_fixture",
  "label": "Concept visualization",
  "alt": "Concept rendering of the same Florida bungalow after an exterior renovation",
  "width": 1800,
  "height": 1200,
  "promptVersion": "vision-renovation-exterior@1",
  "createdAt": "YYYY-MM-DD",
  "reviewed": false
}
```

# Part IV — Claude and Codex Working Hand-in-Hand

## 18. Shared repository state

Chats are not the source of truth. The repository is.

Create and maintain:

```text
docs/handoff/
  CURRENT_STATE.md
  ACTIVE_CHECKPOINT.md
  DECISIONS.md
  BLOCKERS.md
  TEST_RESULTS.md
  DEPLOYMENT_HISTORY.md
  HANDOFF_TEMPLATE.md
```

### CURRENT_STATE.md

Contains:

- current product phase;
- last known healthy commit;
- current branch;
- deployed URL;
- working features;
- fixture/sandbox/production integrations;
- known failures;
- highest-priority next task;
- last agent and date.

### ACTIVE_CHECKPOINT.md

Contains:

- checkpoint name;
- active agent: Claude or Codex;
- exact scope;
- allowed files or directories;
- acceptance criteria;
- commands expected;
- started time;
- status;
- do-not-touch list.

Only one active writer by default.

### DECISIONS.md

Append:

- date;
- decision;
- reason;
- alternatives;
- consequences;
- owner.

### BLOCKERS.md

Each blocker includes:

- feature;
- exact missing dependency;
- whether code can continue with fixture;
- owner;
- next action;
- evidence needed.

### TEST_RESULTS.md

Record:

- command;
- date;
- commit/working tree state;
- pass/fail;
- relevant output;
- unresolved failure.

### DEPLOYMENT_HISTORY.md

Record:

- commit;
- branch;
- Cloudflare environment;
- deployment result;
- smoke-test result;
- rollback target.

## 19. Default agent roles

These are defaults, not hard limitations.

### Claude as builder

Best default tasks:

- large UI and page implementation;
- design-system composition;
- product-flow scaffolding;
- content drafting;
- fixture generation;
- component refactoring;
- executing a clearly defined multi-file build checkpoint.

Claude must still run tests and update handoff files.

### Codex as architect, auditor and hardener

Best default tasks:

- inspect repository and diffs;
- debug Cloudflare/OpenNext;
- review data flow;
- migrations and RLS;
- lead/CRM/analytics contracts;
- job and quota systems;
- security;
- performance;
- tests;
- code review;
- fixing failures;
- deployment preflight;
- generating the exact Git handoff commands.

Codex may also be the builder when Aaron assigns it.

### Alternating workflow

Recommended:

1. Codex audits and defines a bounded checkpoint.
2. Claude builds the checkpoint.
3. Codex reviews the actual diff, runs tests and repairs defects.
4. Aaron requests push commands.
5. Aaron pushes.
6. Cloudflare deploys.
7. Codex or Claude verifies the new live checkpoint.
8. CURRENT_STATE and DEPLOYMENT_HISTORY are updated.

Do not make the next agent reconstruct the prior agent's work from chat.

## 20. Concurrency rule

Do not let Claude and Codex edit the same working tree at the same time.

Default to sequential work.

Parallel work is allowed only when:

- separate Git branches or worktrees are used;
- file ownership is non-overlapping;
- the integration plan is written first;
- one agent is designated integration owner.

Without that setup, one agent writes and the other waits or reviews after the writer finishes.

## 21. Start-of-task protocol

Every agent must:

1. Read AGENTS.md or CLAUDE.md.
2. Read this master document.
3. Read docs/handoff/CURRENT_STATE.md.
4. Read docs/handoff/ACTIVE_CHECKPOINT.md.
5. Inspect git status.
6. Inspect the relevant files.
7. Confirm the task fits the active checkpoint.
8. Preserve unrelated changes.
9. State any load-bearing blocker.
10. Work through all safe, unblocked portions.

Do not reinitialize the repository. Do not delete existing work to make a clean scaffold.

## 22. End-of-task protocol

Every agent must:

1. Format changed files.
2. Run focused tests.
3. Run typecheck.
4. Run lint.
5. Run production build or Cloudflare preflight when relevant.
6. Inspect git diff.
7. Check for secrets and unintended files.
8. Update CURRENT_STATE.
9. Update TEST_RESULTS.
10. Complete a handoff entry.
11. Report exact changed files.
12. Report blockers.
13. Stop before push unless Aaron explicitly requests otherwise.

## 23. Handoff template

```markdown
# Agent handoff

Date:
Agent:
Checkpoint:
Branch:
Working tree before:
Working tree after:

## Outcome

## Files changed

## Behavior added or fixed

## Commands run

## Test results

## Known gaps

## External integrations

- disabled:
- fixture:
- sandbox:
- production:

## Required human decisions

## Recommended next task

## Do not touch until
```

## 24. Review protocol between agents

When Aaron asks one agent to review the other's work:

- inspect actual files and Git diff;
- do not trust the previous agent's summary;
- compare against checkpoint acceptance criteria;
- run the relevant tests;
- look for partial stubs presented as completion;
- look for duplicated types/components;
- inspect secrets and environment boundaries;
- inspect mobile and accessibility;
- inspect Worker compatibility;
- repair within scope when Aaron asked for implementation;
- otherwise report findings and exact recommended changes;
- update the handoff after repairs.

# Part V — GitHub and Cloudflare Command Handoff

## 25. Normal no-surprise deployment rule

The agent does not push by default.

When Aaron says prepare the push command, the agent must first inspect:

```text
git status --short
git branch --show-current
git remote -v
git diff --stat
git diff --check
```

It must also run the repository's required test/preflight commands.

It must identify:

- exact current branch;
- exact files that will be staged;
- whether untracked files include secrets or local artifacts;
- whether pushing that branch triggers a preview or production Cloudflare deployment;
- whether database migrations or environment changes are required.

## 26. Command format returned to Aaron

Return separate copy-and-paste lines using the exact branch and explicit paths.

Example only:

```bash
git add -- apps/web/app apps/web/components packages/mortgage-math docs/handoff
git commit -m "feat: add fixture property to Vision report flow"
git push origin main
```

The active agent must replace the example paths, message and branch with actual values.

Do not give:

- git add -A without reviewing every changed/untracked file;
- git add . without checking for secrets and local artifacts;
- git reset --hard;
- git clean -fd;
- force push;
- rewritten history;
- a branch placeholder Aaron has to guess;
- a deploy command in addition to Git push when GitHub already triggers Cloudflare.

If many files changed, the agent may stage reviewed top-level directories, but it must list excluded unrelated files.

## 27. Pre-push response format

When Aaron asks for the push commands, respond:

```markdown
Ready to push.

Branch: main
Cloudflare effect: This branch triggers the production deployment.
Files included:

- ...
  Files intentionally excluded:
- ...

Checks:

- format: pass
- lint: pass
- typecheck: pass
- tests: pass
- build/preflight: pass
- diff check: pass
- secret check: pass

Run:

[exact command block]

Expected result:

- GitHub receives commit ...
- Cloudflare starts ...
- Verify these URLs: ...
```

If a check fails, do not label it ready. Provide the fix or clearly state that Aaron would be pushing with a known failure.

## 28. Post-push verification

After Aaron says the push completed:

- inspect the GitHub commit when available;
- verify Cloudflare deployment status through the configured workflow or deployed site;
- verify the deepest safe deployment URL;
- smoke-test:
  - home;
  - contact;
  - payment calculator;
  - affordability;
  - privacy;
  - properties;
  - fixture property;
  - Vision fixture;
  - report preview;
  - admin auth boundary;
- check console errors;
- check Error 1102 recurrence;
- update DEPLOYMENT_HISTORY;
- update CURRENT_STATE.

Do not mutate production data during smoke testing.

## 29. Rollback plan

Before a production push, identify the last known healthy commit.

If the deployment is unhealthy:

- stop new feature work;
- preserve logs and evidence;
- decide whether a forward fix or rollback is safer;
- prepare exact commands;
- do not perform a destructive reset;
- Aaron runs the approved command unless he explicitly delegates the action.

# Part VI — Phased Recovery Roadmap

## Phase 0 — repository and runtime audit

Deliver:

- route inventory;
- architecture map;
- package/dependency assessment;
- Cloudflare Error 1102 root cause;
- working local/preflight build;
- stable public route smoke test;
- existing backend/integration inventory;
- updated handoff files.

Exit gate: public shell survives the full route crawl.

## Phase 1 — property-to-Vision vertical slice

Deliver:

- fixture provider;
- property search;
- fixture cards/images;
- property detail;
- Vision entry;
- scenario assumptions;
- deterministic analysis;
- report preview;
- lead gate;
- persistence;
- outbox;
- admin record;
- tests.

Exit gate: the complete loop works without MLS or paid AI.

## Phase 2 — conversion engine

Deliver:

- mortgage planner;
- calculator save/send;
- first-party attribution;
- consent;
- Turnstile;
- GHL fixture/sandbox;
- retries/idempotency;
- thank-you states;
- admin lead timeline.

Exit gate: a synthetic lead can be traced from page to first-party record to CRM sandbox without duplication.

## Phase 3 — images and product presentation

Deliver:

- all required image fixtures;
- asset manifest;
- hero product proof;
- property galleries;
- Vision pairs;
- RendProp pairs;
- responsive optimization;
- visual QA.

This phase may run partly alongside Phase 1 only when file ownership is isolated.

Exit gate: no important public section depends on generic placeholder blocks.

## Phase 4 — RendProp demo

Deliver:

- product page;
- sample capture;
- processing state;
- original/cleanup/staged assets;
- floor-plan candidate;
- public tour;
- QR attribution;
- inquiry;
- agent demo lead.

Exit gate: an agent can understand and try the concept without a sales call.

## Phase 5 — account and admin completion

Deliver:

- consumer auth;
- saved properties;
- scenarios;
- reports;
- job status;
- admin leads/jobs/usage/integrations/content/sources/consent/audit/readiness;
- RBAC and RLS tests.

Exit gate: consumers see only their records and staff permissions pass the matrix.

## Phase 6 — SEO, AEO, content and analytics

Deliver:

- reviewed resources;
- content workflow;
- sources/authors/reviewers;
- sitemap/robots/feed;
- schema tests;
- analytics events;
- Search Console/Bing readiness;
- original report/linkable asset.

Exit gate: no indexed placeholder and every indexable page has a deliberate reason to exist.

## Phase 7 — production integrations

Only after credentials and agreements:

- MLS/IDX provider;
- property enrichment;
- OpenAI/Anthropic;
- Higgsfield/BytePlus where appropriate;
- GoHighLevel production;
- email/SMS;
- approved POS/LOS handoff;
- monitoring and spend caps.

Exit gate: each integration has health, quota, failure, audit and disable behavior.

# Part VII — Acceptance Criteria

## 30. Product acceptance

Do not call recovery complete unless:

- TRACT is clearly a mortgage brokerage;
- Properties is visible;
- at least seven fixture properties exist;
- one property detail works;
- one land detail works;
- Vision runs one complete deterministic scenario;
- report preview delivers value before contact capture;
- report save/send creates a lead and scenario;
- account shows saved result when enabled;
- admin shows lead, job and sync state;
- RendProp has a real sample experience;
- five calculators work;
- mortgage planning funnel works;
- secure application handoff is configured or clearly disabled;
- no advanced feature is represented only by In development copy.

## 31. Visual acceptance

- required assets exist locally;
- assets have manifest/rights metadata;
- no unauthorized listing imagery;
- no broken images;
- no important text embedded in images;
- responsive crops reviewed;
- before/after pairs preserve geometry;
- generated content is labeled;
- image dimensions prevent layout shift;
- home feels like a technology-enabled mortgage platform;
- mobile remains clear.

## 32. Engineering acceptance

- strict typecheck passes;
- lint passes;
- tests pass;
- production build passes;
- Cloudflare preflight passes;
- 50-route smoke test passes;
- Error 1102 is resolved;
- no secret in client or repository;
- RLS tests pass;
- form/CRM idempotency passes;
- AI/usage kill switches exist before paid providers;
- heavy providers are not imported into every public route;
- default fixture/disabled mode boots.

## 33. SEO acceptance

- no indexed placeholder pages;
- canonical per public page;
- deliberate robots state;
- sitemap valid;
- feed valid;
- JSON-LD matches visible content;
- author/reviewer/source metadata;
- content review dates;
- internal links;
- image alt workflow;
- Open Graph images;
- analytics configuration;
- Core Web Vitals reviewed after images.

## 34. Agent-process acceptance

- AGENTS.md and CLAUDE.md reference this file;
- handoff directory exists;
- one active checkpoint owner;
- decisions and blockers recorded;
- tests recorded;
- push commands are exact;
- deployment history updated;
- next agent can continue from files without reading prior chats.

# Part VIII — Required Agent Completion Report

At the end of each checkpoint, return:

1. Outcome.
2. What exists now that did not exist before.
3. Files changed.
4. Images created and where used.
5. Database changes.
6. Integration modes.
7. Commands run.
8. Test results.
9. Runtime/performance results.
10. Known blockers.
11. Exact next checkpoint.
12. Whether the work is ready for Aaron to request push commands.

Do not repeat generic disclaimers. Do not claim a fixture is live MLS data. Do not claim a model integration exists when it is disabled. Do not call a badge or empty page a completed feature.

# Part IX — Start Commands for the Agents

## Start instruction for Codex

```text
Read AGENTS.md, docs/TRACT_MASTER_RECOVERY_BUILD.md and docs/handoff/*. Inspect the repository and Git state. Do not rewrite the site. Begin Phase 0: reproduce and diagnose Cloudflare Error 1102, inventory the actual implementation against the master recovery document, preserve existing work, implement safe fixes, run the repository checks and update the handoff files. Do not push or deploy. When the checkpoint is truly ready, tell me it is ready for me to request the exact Git commands.
```

## Start instruction for Claude

```text
Read CLAUDE.md, docs/TRACT_MASTER_RECOVERY_BUILD.md and docs/handoff/*. Inspect the repository and Git state. Work only within the active checkpoint. Preserve the existing mortgage pages and design system. Do not replace missing product features with In development badges. Build the assigned fixture-backed user experience, create and add the required local image assets when the checkpoint calls for them, run the repository checks and update the handoff files. Do not push or deploy. When finished, provide the structured handoff for Codex review.
```

# Final directive

The next step is Phase 0, not another one-shot rewrite.

Stabilize the existing application, inventory what is genuinely present in source, and establish the shared handoff files. Then build one complete property-to-Vision-to-report-to-lead-to-admin loop. That loop is the proof that Claude and Codex are now building the same product.
