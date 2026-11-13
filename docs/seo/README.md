# SEO: wsmlending.com

**As of 2026-11-13.** Wholesale Mortgage Lending (WML) only. Nothing here
applies to any other company or product.

## One brand

Wholesale Mortgage Lending is the only name a visitor, a crawler or a
structured-data reader sees (ADR-014, owner decision 2026-11-13). TRACT, the old
product name, is retired from everything public: copy, titles, descriptions,
JSON-LD, llms.txt, the manifest, the logo and the icons. It survives only as
internal code names (`@tract/*` packages, the `x-tract-brand` header, comments).
`tests/unit/brand.test.ts` fails on a `\bTRACT\b` in content data or outside a
comment in `apps/web/app`, `components`, `content` or `lib`; the browser suite
checks visible text and JSON-LD on the landing, a program page, two articles and
`/calculators`.

## The domain decision

wsmlending.com is the company's one domain (ADR-011 in
`docs/architecture/decisions.md`).

| Request                                     | Result                                                    |
| ------------------------------------------- | --------------------------------------------------------- |
| `wsmlending.com/`                           | The WML landing (company homepage), indexable             |
| `wsmlending.com/<any app route>`            | Served directly, with each route's existing noindex rules |
| `wsmlending.com/tract`                      | 308 to `/`, query kept (retired product home, ADR-014)    |
| `wsmlending.com/wml`                        | 308 to `/` (one URL for the homepage)                     |
| `tractrealestate.com/<path>?<query>`        | 308 to `wsmlending.com/<path>?<query>`, `noindex`         |
| workers.dev, Vercel aliases, any other host | Same 308, same `noindex`                                  |
| `www.wsmlending.com`                        | Routed like the apex by the app; DNS is a dashboard step  |

The routing table is `apps/web/lib/host-routing.ts` (pure, unit-tested in
`apps/web/tests/unit/host-routing.test.ts`). The canonical origin is
`NEXT_PUBLIC_SITE_URL` in `apps/web/.env.production`, read at build time.
`pnpm cf:build` refuses to build if `NEXT_PUBLIC_COMPANY_URL` differs from it.

## What each piece does

- **robots.txt** (`apps/web/app/robots.ts`): served by the app on
  wsmlending.com, no redirect. Allows every public page to search crawlers
  (Googlebot, Bingbot, Applebot), answer crawlers (OAI-SearchBot, ChatGPT-User,
  Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User) and training
  crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot,
  Meta-ExternalAgent). Keeps `/admin/`, `/account/`, `/auth/`, `/api/` and the
  other private prefixes disallowed for every group. Ends with
  `Sitemap: https://wsmlending.com/sitemap.xml`. Cloudflare's managed
  robots.txt, if enabled in the dashboard, is prepended at the edge.
- **sitemap.xml** (`apps/web/app/sitemap.ts`): only routes registered as
  indexable in `apps/web/content/routes.ts`, only on wsmlending.com, no
  redirecting or noindex URL. `lastmod` is the day the page or its content last
  changed in Git, from `apps/web/content/route-lastmod.generated.ts`. Run
  `pnpm seo:lastmod` in the same commit as any content change; a unit test fails
  if a sitemap route has no date.
- **llms.txt** (`apps/web/app/llms.txt/route.ts`): generated from the same
  registries and identity as the site. wsmlending.com URLs, the licensing facts
  below, no rates.
- **Structured data** (`packages/seo/src/jsonld.ts`, values from
  `apps/web/lib/site.ts`): an `Organization` with name "Wholesale Mortgage
  Lending", legalName "Wholesale Mortgage Lending LLC", `url` and `@id` on
  wsmlending.com, areaServed Florida, the company NMLS ID as a `PropertyValue`
  identifier, the WML logo, and a `WebSite` node named after the company on
  every page. No `alternateName`: `NEXT_PUBLIC_BRAND_NAME` equals the company
  name, and the builder drops the field when the two match. Telephone +1 727-486-6004 (owner-confirmed 2026-11-13). No
  address: there is no office customers visit, so the node stays an
  `Organization` and does not become a `FinancialService` (ADR-009).
  `sameAs` lists only the NMLS Consumer Access company page, which is in because
  `nmlsRecordPublic` is true (owner-confirmed 2026-11-12).
- **IndexNow**: key file `apps/web/public/3ebfb1c079568642ad474586bff48aca.txt`,
  served at `https://wsmlending.com/3ebfb1c079568642ad474586bff48aca.txt`.
  `node scripts/indexnow-submit.mjs --all` submits every URL in the live
  sitemap; `--since <commit>` submits only pages whose page or content files
  changed; `--dry-run` prints the payload. It checks the live key file first and
  never sends a URL that is not on wsmlending.com. Bing and the other IndexNow
  engines use it; Google does not.

- **Favicon and icons**: `apps/web/app/favicon.ico` (16/32/48), `app/icon.png`
  (512), `app/apple-icon.png` (180) and the PWA icons in `public/brand/`
  (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
  `apple-touch-icon.png`) are the WML glyph in white on the brand purple
  (#461ED2), cropped from `public/brand/wml-logo.png`. Google shows the favicon
  beside the site name in results, so it is the company mark. The header
  lockup uses `wml-glyph.png` (light theme) and `wml-glyph-dark.png` (a lighter
  tint for the dark theme) beside the name in live text.
- **Homepage links**: the landing at `/` links every hub the sitemap lists from
  a free-tools band and an Explore section, in plain `<a>` tags below the form.
  The lists live in `apps/web/content/home-hub.ts`;
  `apps/web/tests/unit/home-hub.test.ts` fails if any of them points at a page
  that is unregistered, noindex or missing from the sitemap. Left out on
  purpose: `/mortgage-rates` (noindex) and `/what-is-my-home-worth` (noindex,
  and it 404s while `FEATURE_SELLER_TOOLS` is off in production).

## Licensing values

| Fact                            | Value                                 | Source                                                                     |
| ------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| Legal name                      | Wholesale Mortgage Lending LLC        | Dan's NMLS portal account list, screenshot relayed by the owner 2026-11-12 |
| Company NMLS ID                 | 2898263                               | Same                                                                       |
| Loan originator                 | Daniel Michael Cuesta, NMLS ID 132852 | Same                                                                       |
| Company licensed                | Yes                                   | Owner statement 2026-11-12                                                 |
| NMLS record public              | Yes                                   | Owner confirmation 2026-11-12 (not read back; Consumer Access blocks bots) |
| Florida mortgage broker license | MBR8794                               | Owner confirmation 2026-11-12                                              |
| Business phone                  | +1 727-486-6004                       | Owner statement 2026-11-13                                                 |
| Public business address         | None (no office customers visit)      | Owner, 2026-11-13; filed address used only for listing verification        |

The "Verify" links go to
`https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/2898263` and
`.../INDIVIDUAL/132852`.

**Licensing status.** The owner confirmed MBR8794 and the public NMLS record on
2026-11-12 (ADR-012). All three `licensingStatus` flags in
`apps/web/lib/site.ts` are true, so `isPreLaunch()` is false: no pre-launch
banner, and the readiness board shows the licensing gates approved. Meta
conversion sending still also needs `META_CAPI_LIVE_CLEARED`.

## Live state found on 2026-11-12 (not in Git)

Read-only requests to the live site on 2026-11-12 showed licensing that no Git
commit contains (every commit through `316b60e` has `nmlsId: null`):

- "Company NMLS ID: 2898263" and JSON-LD `"identifier": "NMLS #2898263"`;
- "Florida mortgage broker license: MBR8794";
- no pre-launch banner, so that build had every `licensingStatus` flag true;
- Organization `@id`, `url` and logo still on tractrealestate.com.

So the live Worker was built from a working tree with uncommitted changes on the
owner's Mac, which belong to another chat that is still working. This branch keeps the Florida licence number null and
the banner on, because neither MBR8794 nor a public-record readback was
confirmed to the engineering side. Deploying it as is would change both on the
live site; the deploy kit stops before building when it sees that and asks the
owner to choose.

**Resolved the same day.** The owner confirmed MBR8794 and the public NMLS
record, so this branch now matches the live licensing display. The deploy kit
also refuses to run while the Mac's tract-platform folder has uncommitted
changes, until that other chat's work is pushed and merged into this branch.

## Owner-side steps still open

1. **Supabase Auth**: set Site URL to `https://wsmlending.com` and add
   `https://wsmlending.com/**` to Redirect URLs. Without it, sign-in and
   password-reset links fall back to the old Site URL and break.
2. **Turnstile**: confirm the widget's hostnames include `wsmlending.com`; every
   form now runs there.
3. **Cloudflare DNS**: `www.wsmlending.com` currently returns 522. Add a
   proxied record for `www` (or a redirect rule to the apex) and turn on
   "Always Use HTTPS". Handled by the dashboard agent.
4. **Google Search Console and Bing Webmaster Tools**: on hold until the new WML
   Gmail account exists. Then verify `wsmlending.com` (domain property), submit
   `https://wsmlending.com/sitemap.xml`, and in Search Console use Change of
   Address from tractrealestate.com if that property was ever verified.
5. **Google Business Profile**: later, once a business address and phone are
   confirmed (they are also what would let the schema become a
   `FinancialService`).
6. **Licence and NMLS record**: done 2026-11-12 (MBR8794, record public).
   Re-verify at each renewal.
7. **External names (ADR-014)**: check that no listing or profile (Google
   Business Profile, Bing Places, Apple Business Connect, social profiles, ad
   accounts) uses TRACT as a business name, and that every one says Wholesale
   Mortgage Lending. After the deploy, submit the changed URLs with
   `node scripts/indexnow-submit.mjs --since <previous deployed commit>`.
