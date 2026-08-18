# Active checkpoint

Checkpoint: Phase 4 — RendProp demo
Active agent: Codex
Started: 2026-08-18T00:42:00Z
Status: in progress

## Exact scope

- Build a guided, fixture-backed sample capture that records rights/privacy attestations before progress.
- Implement explicit sample processing states and failure/retry behavior without calling a remote media provider.
- Reuse the canonical original, cleanup, staged, enhanced, floor-plan and tour-cover assets from Phase 3.
- Add a stable noindex public-tour demonstration with visible alteration labels and agent attribution.
- Add a non-scannable on-page QR demonstration plus a real local demo link carrying bounded attribution.
- Connect tour inquiry and agent demo interest to the existing first-party lead/consent/attribution/outbox contract.
- Add local persistence/RLS only where required for a traceable end-to-end fixture; apply no remote migration.
- Add admin-observable lifecycle evidence without exposing upload paths, personal media or secrets.

## Allowed files and directories

- RendProp, tour and agent demo routes/components/content
- Relevant lead, attribution, media-job and tour schemas/domain/database contracts
- Additive Supabase migrations and local RLS tests
- Focused unit/integration/E2E tests and `docs/**`
- Existing canonical assets and manifest only when the workflow requires metadata corrections

## Acceptance criteria

- A visitor can run the sample capture, review required rights/privacy boundaries and observe deterministic processing states.
- Original, cleanup, staged, enhanced and floor-plan outputs remain visibly labeled at every use.
- A stable demo tour carries bounded source attribution into an inquiry without exposing personal or application-only data.
- Exact retries do not duplicate the demo lead or outbox event, and unauthorized database access remains denied.
- No UI implies live upload, survey accuracy, automatic defect removal, provider processing or an available production service.
- Desktop/mobile E2E, local database verification, production build, OpenNext build and 50-route smoke checks pass.

## Expected commands

`pnpm check`, local PostgreSQL-backed `pnpm db:verify`, `pnpm test:e2e`, `pnpm cf:build`, `pnpm cf:preview`, `pnpm smoke:routes`, focused tests, `git diff --check` and secret scanning.

## Do not touch

- Production database data, migrations, RLS, Auth settings, credentials or Storage.
- Vercel projects, deployments, domains or environment settings.
- Cloudflare deployment configuration, secrets or remote Turnstile widgets.
- Remote upload, media, QR, email, CRM, MLS or paid AI provider calls.
- Actual property addresses, faces, documents, camera permission or user-supplied media.
- Mortgage calculations outside `@tract/mortgage-math`.
