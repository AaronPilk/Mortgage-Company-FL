# Current state

**As of 2026-11-16.** Production serves `main` at `26987fd` on the Cloudflare
Worker `mortgage-company-fl`, version `5d568e0d-6c9b-43ef-9762-61f9bbf69909`.
This replaces the 2026-08-18 version of this file. That version described the
TRACT recovery branch, a public Vercel duplicate and missing licensing facts.
All three are out of date; see "What changed since 2026-08-18".

## Repository and hosting

| Fact                 | Current evidence                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Canonical repository | `https://github.com/AaronPilk/Mortgage-Company-FL`                                       |
| Production branch    | `main` at `26987fd` (merge of PR #9)                                                     |
| Host                 | Cloudflare Workers through `@opennextjs/cloudflare`                                      |
| Worker               | `mortgage-company-fl`                                                                    |
| Public origin        | `https://wsmlending.com` (ADR-011)                                                       |
| Live version         | `5d568e0d-6c9b-43ef-9762-61f9bbf69909`, deployed 2026-11-16 about 18:56 UTC by the owner |
| Rollback point       | `595cfc3b-c906-45e7-b039-09a87e87de50`, commit `3cbf071` (2026-11-13)                    |
| Deploy method        | Manual. The owner runs an out-of-repo deploy kit; a push to `main` deploys nothing       |
| Vercel               | Dead. Last deployment 2026-08-18; the November merges to `main` created none             |
| Open pull requests   | Dependabot #2 to #8 only                                                                 |

The deploy kit wraps `pnpm install --frozen-lockfile`, `pnpm check`,
`pnpm cf:build && pnpm cf:deploy`, a set of live checks and an IndexNow submit.
It is pinned to one commit and refuses to run against anything else. The current
kit is pinned to `26987fd` and has already run; re-pin it before the next
deploy.

## Brand and domains

Wholesale Mortgage Lending is the only visible brand (ADR-014). TRACT is gone
from copy, metadata, JSON-LD, `llms.txt`, the manifest and the icons.

| Request                              | Result                                           |
| ------------------------------------ | ------------------------------------------------ |
| `tractrealestate.com/<path>?<query>` | 308 to the same path and query on wsmlending.com |
| `www.tractrealestate.com`            | 308 to wsmlending.com                            |
| `/tract`                             | 308 to `/`                                       |
| `/wml`                               | 308 to `/`                                       |
| `www.wsmlending.com`                 | 301 to the bare domain                           |
| `http://wsmlending.com`              | 301 to `https://`                                |

TRACT survives only internally: code comments, the `tract_*` GoHighLevel
custom-field keys and the `tract-platform` folder name.

## Licensing display

- Every footer shows company NMLS ID 2898263, loan originator Daniel Michael
  Cuesta (NMLS ID 132852) and Florida licence MBR8794, with Consumer Access
  links. `isPreLaunch()` is false (ADR-012).
- Homepage Organization JSON-LD: Wholesale Mortgage Lending LLC, telephone
  +1 727-486-6004, email dan@wsmlending.com, NMLS ID as identifier. No street
  address; the business is listed as a service-area business by choice.

## Public surface

- Sitemap: 207 URLs, every one 200 on 2026-11-16. IndexNow accepted all 207.
  Split: 101 resources, 41 glossary, 18 program, 16 Florida, 11 calculator,
  `/mortgage-rates`, 19 other.
- `/mortgage-rates`: public and indexable since 2026-11-16 (ADR-015). Freddie
  Mac weekly national averages from FRED. Market information, never an offer.
  Renders only while `FEATURE_RATE_WATCH` is on.
- `/calculators`: hub plus 10 calculators, all indexable.
- `/what-is-my-home-worth`: off on purpose (404, noindex). Returns only after a
  paid ATTOM plan, then sign-off from Dan or counsel, then `FEATURE_SELLER_TOOLS`.
- `/home-lookup`: works, noindex on purpose.
- `/apply`: still fails closed; `secureApplication` is false.

## Integration modes

From `apps/web/wrangler.jsonc` on `main` and a live `GET /api/v1/health` on
2026-11-16. Secret values were not inspected.

| Integration | State                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Database    | Health reports `configured`. Remote schema not re-verified by this update                            |
| GoHighLevel | `production`, pointed at the WML sub-account. `GHL_CUSTOM_FIELD_MAP` is `{}`. No test lead confirmed |
| Turnstile   | `production`. The committed build carries the real site key (see BLOCKERS, item 2)                   |
| Rate feed   | `RATE_FEED_MODE=production`, `FEATURE_RATE_WATCH=true` (ADR-015)                                     |
| ATTOM       | `production` on a 30-day free trial key (500 calls a day). `SHOW_SAMPLE_PROPERTY_DATA=true`          |
| Listings    | `MLS_PROVIDER=fixture`; labelled samples only                                                        |
| AI          | `AI_MODE=production`; `FEATURE_ASSISTANT=false`                                                      |
| Email       | Disabled                                                                                             |
| POS/LOS     | Unconfigured; `/apply` refuses intake                                                                |

## Verification on record

Nothing below was re-run for this update. Each row names its source.

| Check                        | Outcome                                                  | Date       | Source                                  |
| ---------------------------- | -------------------------------------------------------- | ---------- | --------------------------------------- |
| `pnpm check`                 | Pass: 72 test files, 2205 tests                          | 2026-11-16 | Deploy kit log                          |
| `pnpm cf:build`, `cf:deploy` | Pass                                                     | 2026-11-16 | Deploy kit log                          |
| Live checks (23)             | All pass                                                 | 2026-11-16 | Deploy kit log                          |
| `pnpm test:e2e`              | 126 passed, 2 failed (known Turnstile contact-form test) | 2026-11-13 | `2026-11-13_BRAND.md`                   |
| `pnpm db:verify`             | Pass, 31 migrations                                      | 2026-11-13 | `2026-11-13_BRAND.md`                   |
| GitHub Actions on `main`     | Red since 2026-11-13                                     | 2026-11-16 | Owner status file; see BLOCKERS, item 2 |

## Listings and search

Operational context, not code. Last recorded 2026-11-13; not re-checked here.
All accounts are under dan@wsmlending.com unless noted.

| Listing                 | Status                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Google Business Profile | Verification required; everything else filled in                                                    |
| Bing Places             | PIN postcard due 2026-11-20 to 2026-11-23; edits locked until entered                               |
| Yelp                    | In moderation                                                                                       |
| BBB                     | Submitted with Dan's details                                                                        |
| Crunchbase              | Live                                                                                                |
| Google Search Console   | Dan's `sc-domain:wsmlending.com`; sitemap read; Change of Address from tractrealestate.com accepted |
| Bing Webmaster          | Sitemap processing                                                                                  |

## What changed since 2026-08-18

- Vercel duplicate: resolved. No Vercel deployment since 2026-08-18.
- Licensing facts: populated and live (ADR-012).
- Canonical origin: `wsmlending.com`, not the `workers.dev` URL (ADR-011).
- Brand: TRACT retired (ADR-014).
- Database: health reports configured in production. The 2026-08-18 note about
  an empty candidate Supabase project is obsolete as a description of
  production, but this update did not re-verify the remote schema.
- `pnpm deploy:preflight`: not re-checked by this update.

## Code graph

`graphify-out/2026-11-16/` on the owner's Mac copy holds `GRAPH_REPORT.md`,
`graph.json` and `graph.html`, built from `26987fd` (3,599 nodes).
`graphify-out/` is gitignored.
