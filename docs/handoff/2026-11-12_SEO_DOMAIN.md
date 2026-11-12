# Agent handoff

Date: 2026-11-12
Agent: Claude
Checkpoint: WML SEO rollout, code side (one domain, licensing facts, crawl
foundations, IndexNow)
Branch: `claude/seo-sop-20261112`, from `316b60e`
(`agent/mobile-ux-20260819`). Not merged to `main`.
Working tree before: clean at `316b60e`
Working tree after: committed and pushed; nothing uncommitted

## Outcome

wsmlending.com becomes the only public origin. Every route is served there; the
WML landing stays the homepage; tractrealestate.com and every other host 308 to
the same path and query on wsmlending.com with `noindex`. Licensing facts the
owner relayed are applied through `lib/site.ts`. robots.txt, sitemap.xml,
llms.txt and the Organization/WebSite graph are all on wsmlending.com. IndexNow
has a key file and a submit script. Not deployed: the owner runs the deploy.

The live Worker was last deployed 2026-08-26T19:35Z, around `789aaa2`.
Commits `c1019dd` and `316b60e` were never deployed, so this release ships them
too. The live build is not exactly `789aaa2`, though: it shows company NMLS ID
2898263, Florida licence MBR8794 and no pre-launch banner, none of which is in
Git. It was built from uncommitted changes; see `docs/seo/README.md`, "Live
state found on 2026-11-12".

## Files changed

See `git log 316b60e..claude/seo-sop-20261112 --stat`. Load-bearing:
`apps/web/lib/host-routing.ts`, `apps/web/middleware.ts`,
`apps/web/.env.production`, `apps/web/wrangler.jsonc`, `apps/web/lib/site.ts`,
`packages/seo/src/jsonld.ts`, `apps/web/app/{robots,sitemap}.ts`,
`apps/web/app/llms.txt/route.ts`, `scripts/indexnow-submit.mjs`,
`scripts/seo-lastmod.ts`, `scripts/seo/route-sources.mjs`.

## Behavior added or fixed

- Host routing per ADR-011; `/tract` is the TRACT home (noindex), `/wml` 308s
  to `/`.
- Company NMLS ID 2898263, legal name Wholesale Mortgage Lending LLC, loan
  originator Daniel Michael Cuesta (NMLS ID 132852) shown in both footers,
  About, Licensing, llms.txt; deep links to Consumer Access. Florida licence
  MBR8794 (ADR-012).
- Owner confirmed 2026-11-12: Florida licence MBR8794 and the public NMLS
  record, so `isPreLaunch()` is false (ADR-012 amendment).
- robots.txt names search, answer and training crawlers, all allowed, private
  prefixes disallowed for each; sitemap lastmod from Git (ADR-013).
- `pnpm cf:build` refuses a build whose company URL differs from the site URL.

## Commands run

`pnpm install --frozen-lockfile`, `pnpm check`, `pnpm db:verify`,
`pnpm test:e2e`, `pnpm cf:build`, `pnpm seo:lastmod`, local `next start` with
spoofed Host headers.

## Test results

- `pnpm check`: pass (Vitest 70 files, 2181 tests; content lint clean; build).
- `pnpm db:verify`: pass on local PostgreSQL 16.15 (31 migrations, all RLS
  assertions). This change touches no migration.
- `pnpm test:e2e`: 108 passed, 2 failed. Both failures are
  `recovery.spec.ts` "fails honestly when durable lead storage is unavailable"
  (desktop and mobile): the contact form now stops at a client validation
  message before the storage error. The same test fails on an untouched
  `316b60e` build, so it predates this checkpoint.
- `pnpm cf:build`: pass; key file present in `.open-next/assets`.

## Known gaps

- `nmlsRecordPublic` rests on the owner's confirmation; engineering could not
  read Consumer Access.
- The pre-existing e2e failure above.
- `scripts/route-smoke.ts` still expects 61 requests; it predates this work and
  is not part of any gate.

## External integrations

- disabled: none changed
- fixture: none changed
- sandbox: none
- production: none changed. IndexNow is an operator script, not an integration.

## Required human decisions

1. Resolved 2026-11-12: the owner confirmed MBR8794 and the public Consumer
   Access record; both are applied and `isPreLaunch()` is false. The Mac's
   uncommitted tract-platform changes belong to another chat that is still
   working; the deploy kit refuses to run until they are pushed and merged here.
2. Supabase Auth Site URL and redirect allowlist for wsmlending.com; Turnstile
   hostnames; Cloudflare `www` record and Always Use HTTPS; Search Console and
   Bing under the new WML Gmail. Details in `docs/seo/README.md`.

## Recommended next task

After deploy, confirm the Consumer Access record and flip `nmlsRecordPublic`;
fix the contact-form e2e regression.

## Do not touch until

Do not merge this branch to `main` while Vercel still builds `main` publicly.
