# Active checkpoint

Checkpoint: Phase 3 — images and product presentation
Active agent: Codex
Started: 2026-08-17T23:46:00Z
Status: in progress

## Exact scope

- Create the canonical reviewed asset manifest with source, rights, prompt version, dimensions and transformation metadata.
- Complete the required original home, property, Vision, RendProp, agent and social image fixtures.
- Implement a visual home hero/product proof panel using HTML for all labels and numbers.
- Add honest property galleries and labeled Vision before/concept comparisons.
- Replace the RendProp placeholder with labeled original/cleanup/staged/enhanced/floor-plan demonstration media.
- Optimize responsive loading, intrinsic sizing, alt text and graceful fallbacks.
- Add desktop/mobile visual and route verification without remote hotlinks or copied listing media.

## Allowed files and directories

- Home, properties, Vision, RendProp and agent presentation routes and components
- `apps/web/public/images/**`, asset-manifest files and source-review documentation
- Relevant metadata, Open Graph, styles and responsive image configuration
- Focused end-to-end/unit/visual tests and `docs/**`

## Acceptance criteria

- Every required fixture has a repository-owned file and manifest entry; no remote placeholder remains.
- Before/concept pairs preserve the subject and viewpoint closely enough for an honest labeled demonstration.
- Home and product routes use responsive optimized images with stable dimensions and useful alt text.
- Visual labels remain HTML, concept and fixture disclosures remain visible and floor plans disclaim measurement use.
- Desktop and mobile verification covers critical images, fallbacks and layout stability.
- Unit, end-to-end, production build, OpenNext build and 50-route smoke checks pass.

## Expected commands

`pnpm check`, local PostgreSQL-backed `pnpm db:verify`, `pnpm test:e2e`, `pnpm cf:build`, `pnpm cf:preview`, `pnpm smoke:routes`, focused tests, `git diff --check` and secret scanning.

## Do not touch

- Production database data, migrations, RLS, Auth settings, credentials or storage.
- Vercel projects, deployments, domains or environment settings.
- Cloudflare deployment configuration, secrets or remote Turnstile widgets.
- Live CRM, MLS, email or paid AI provider calls.
- Copied MLS/Zillow media, remote hotlinks or generated images presented as real properties.
- Mortgage calculations outside `@tract/mortgage-math`.
- SSNs, full dates of birth, bank credentials, document uploads or other application-only data in marketing forms.
