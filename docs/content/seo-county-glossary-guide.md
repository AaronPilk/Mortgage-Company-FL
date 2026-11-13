# SEO expansion: county pages, glossary, and the first-time buyer's guide

This feature adds three organic surfaces and one gated lead magnet. All of it is
education plus lead capture for a pre-launch, unlicensed Florida mortgage lead-gen
site: nothing asserts an unestablished fact (invariant 6), and no surface collects
what would make it an application (invariant 2).

Owner: content/SEO. Data assembled **August 2026** (`COUNTY_AS_OF`,
`GLOSSARY_AS_OF`, and the guide's "as of" all read August 2026).

## The three surfaces

1. **County mortgage pages (expansion).** Ten counties added to the existing
   `/florida-mortgage/[county]` template — no new template, no new route shape.
   Each carries real county-specific material: a genuine flood/insurance note
   (coastal vs inland reality), the statutory homestead/tax mechanics rendered by
   the template (which defers the exact millage to the county Property Appraiser),
   and the county's own assistance office. Data lives in
   `apps/web/lib/county-data.ts`; the template is
   `apps/web/app/florida-mortgage/[county]/page.tsx`.

2. **Mortgage glossary.** A hub at `/mortgage-glossary` and one page per term at
   `/mortgage-glossary/[term]` (40 terms across seven categories). Definitions are
   rendered on the hub, so the `DefinedTermSet` JSON-LD is honest; the hub's FAQ
   block is rendered visibly, so its `FAQPage` markup matches on-page content.
   Data + local JSON-LD builders live in `apps/web/lib/glossary-data.ts`.

3. **Florida first-time buyer's guide (lead magnet).** An indexable landing at
   `/florida-buyers-guide` that ranks and captures the lead, plus the actual guide
   at `/florida-buyers-guide/guide` which renders **noindex** so it does not
   compete with the landing for the same query. The gated form
   (`apps/web/components/lead-magnet/guide-request.tsx`) posts to the existing
   `/api/v1/leads` endpoint with intent `first_time_buyer`; on success it reveals
   the guide inline and links to it. The guide is genuinely readable — the "gate"
   is an email for a table of contents, not a wall in front of the education.

## Per-page indexation

| Route                                 | Indexable          | Why                                                                                                                                                                                   |
| ------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/florida-mortgage/{10 new counties}` | **Yes**            | Real county-specific education; no sample data; primary source linked. Mirrors the six existing county pages.                                                                         |
| `/mortgage-glossary`                  | **Yes**            | Substantive reference hub with on-page definitions.                                                                                                                                   |
| `/mortgage-glossary/[term]`           | **Yes** (per term) | Each term is registered individually so indexation stays a deliberate per-page decision, like the article and program pages. Registered via a generated spread from `GLOSSARY_TERMS`. |
| `/florida-buyers-guide`               | **Yes**            | The ranking landing page; describes the guide, carries no sample data.                                                                                                                |
| `/florida-buyers-guide/guide`         | **No (noindex)**   | The delivered guide. Noindex avoids near-duplicate competition with the landing and keeps the funnel clean. `pageMetadata({ noIndex: true })`.                                        |

## County source table (the 10 new counties)

Every appraiser URL is the county Property Appraiser (the primary source for the
exact millage the pages deliberately do not state). Assistance URLs are the
county's own housing office. `cityResourceSlug` is set only where a matching
`/resources/buying-home-*` article already exists — the template renders that link
only when the slug is present, so no county emits a broken link.

| Slug                | Seat            | Flood exposure | Property Appraiser                         | County assistance                                                                                                             | cityResourceSlug       |
| ------------------- | --------------- | -------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `broward-county`    | Fort Lauderdale | high-coastal   | https://bcpa.net/                          | https://www.broward.org/Housing/pages/homebuyer.aspx                                                                          | —                      |
| `palm-beach-county` | West Palm Beach | mixed          | https://pbcpao.gov/                        | https://discover.pbc.gov/HED/Pages/default.aspx                                                                               | —                      |
| `polk-county`       | Bartow          | inland         | https://www.polkflpa.gov/                  | https://www.polkfl.gov/services/housing-and-neighborhood-development/residential-housing-programs/                            | —                      |
| `brevard-county`    | Titusville      | mixed          | https://www.bcpao.us/                      | https://www.brevardfl.gov/HousingAndHumanServices/HousingPrograms/PurchaseAssistanceProgram                                   | —                      |
| `volusia-county`    | DeLand          | mixed          | https://vcpa.vcgov.org/                    | https://www.volusia.org/services/community-services/community-assistance/housing/affordable-housing-programs/                 | —                      |
| `pasco-county`      | Dade City       | mixed          | https://pascopa.com/                       | https://www.pascocountyfl.gov/services/community_development/programs/down_payment_assistance_program_(dpa).php               | —                      |
| `seminole-county`   | Sanford         | inland         | https://www.scpafl.org/                    | https://www.seminolecountyfl.gov/departments-services/community-services/community-development/community-development-programs | —                      |
| `sarasota-county`   | Sarasota        | high-coastal   | https://www.sarasotapropertyappraiser.gov/ | _(omitted — no stable URL; note frames it as "confirm what's currently offered")_                                             | `buying-home-sarasota` |
| `collier-county`    | Naples          | high-coastal   | https://www.collierappraiser.com/          | https://www.collier.gov/Resident-Resources/Community-and-Human-Services-Division/Housing-Programs/Homebuyers                  | `buying-home-naples`   |
| `manatee-county`    | Bradenton       | mixed          | https://www.manateepao.gov/                | https://www.mymanatee.org/departments/community-and-veterans-services-department/community-development-division               | —                      |

Notes reflected in the copy: Volusia and Seminole assistance is framed as able to
pause / close a waitlist ("confirm current status"); Sarasota omits the assistance
URL and frames availability as something to confirm. All assistance notes carry the
"amounts/limits/availability are set by the county and change — confirm current
terms" framing.

## Compliance mapping

| Requirement                                               | How it is met                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Invariant 6 — no unestablished fact.**                  | No page states a precise millage or tax percentage. County pages defer to the Property Appraiser (linked). The glossary `millage-rate` entry defines the concept and defers the number. `county-data.test.ts` asserts no `%` in authored county copy and no `millage/tax rate of N` pattern in any county. |
| **Invariant 2 — a marketing form is not an application.** | The guide form collects only name, email, phone + consent. No SSN, DOB, income, account number, or upload. It reuses the `/api/v1/leads` pipeline (CreateLeadSchema), which rejects those by construction, and the `first_time_buyer` intent already exists — no new intent was added.                     |
| **Consent modeled correctly.**                            | `consent { privacyAccepted, contactRequested: true, smsMarketing: false, emailMarketing, disclosureVersion: LEAD_DISCLOSURE_VERSION }`. Privacy is required; email marketing is a separate optional opt-in; the form has no SMS opt-in so SMS marketing is never consented.                                |
| **Bot / abuse controls.**                                 | Honeypot + Turnstile (action `lead`, matching the leads route's `expectedAction`). Same dedupe, rate-limit, and origin checks as every other lead.                                                                                                                                                         |
| **Disclosures.**                                          | Every new page carries a `Disclosure`: education, not advice; not an offer of credit; broker-not-lender; confirm specifics with the official source. The buyer's-guide success state repeats "not an application, no credit inquiry, not obligated."                                                       |
| **Structured data honesty.**                              | `DefinedTermSet` is emitted on the hub where the definitions are visible; `DefinedTerm` on each term page. `faqNode(..., true)` is emitted only alongside the visible `<Faq>` block.                                                                                                                       |
| **Content linter.**                                       | Titles ≤ 60, descriptions ≤ 165 and unique; every static internal link resolves once routes are registered. Until the integrator registers the new routes, a `content:lint` run will flag them as `unregistered-route` — that is expected.                                                                 |
| **Editorial voice.**                                      | Broker-accurate throughout: TRACT arranges, does not make, mortgage loans; definitions describe how things work, never what a reader qualifies for.                                                                                                                                                        |

## Integrator handoff

These files were intentionally **not** edited (owned by the integrator):
`apps/web/content/routes.ts`, `packages/schemas/src/lead.ts`,
`apps/web/components/site-chrome.tsx`, `apps/web/components/lead-form.tsx`.

### Routes to register (`apps/web/content/routes.ts`)

Ten county paths (indexable, `contentGroup: "locations"`, matching the existing
county entries at `priority: 0.65`, `changeFrequency: "monthly"`):

```
/florida-mortgage/broward-county
/florida-mortgage/palm-beach-county
/florida-mortgage/polk-county
/florida-mortgage/brevard-county
/florida-mortgage/volusia-county
/florida-mortgage/pasco-county
/florida-mortgage/seminole-county
/florida-mortgage/sarasota-county
/florida-mortgage/collier-county
/florida-mortgage/manatee-county
```

Glossary + guide:

- `/mortgage-glossary` — indexable, `contentGroup: "resources"`, `priority: 0.7`,
  `changeFrequency: "monthly"`.
- `/mortgage-glossary/[term]` — register each `GLOSSARY_TERMS` slug individually
  (a generated spread over `GLOSSARY_TERMS`), indexable, `contentGroup: "resources"`,
  `priority: 0.55`, `changeFrequency: "monthly"` — the same per-page posture the
  article library uses.
- `/florida-buyers-guide` — indexable, `contentGroup: "resources"` (or a dedicated
  `"lead-magnet"` group), `priority: 0.7`, `changeFrequency: "monthly"`.
- `/florida-buyers-guide/guide` — **indexable: false**, `contentGroup: "resources"`,
  `priority: 0.3`, `changeFrequency: "monthly"` (the page also renders noindex).

### Footer links (`apps/web/components/site-chrome.tsx`)

Add to the **Explore** group (static hrefs):

- `{ href: "/mortgage-glossary", label: "Mortgage glossary" }`
- `{ href: "/florida-buyers-guide", label: "First-time buyer's guide" }`
