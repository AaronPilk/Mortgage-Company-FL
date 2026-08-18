# Active checkpoint

Checkpoint: Phase 5 — account and admin completion
Active agent: Codex
Started: 2026-08-18T01:01:59Z
Status: in progress

## Exact scope

- Complete the approved Supabase email-auth browser/server flow with explicit unconfigured and verification-pending states; do not change remote Auth settings.
- Make account creation optional and keep all public calculators, properties, Vision previews and RendProp fixtures useful without sign-in.
- Add data-backed account views for saved properties, calculator scenarios, owned Vision projects, report/job status and completed reports.
- Add notification preferences plus clearly bounded export and deletion request entry points; do not imply an unimplemented deletion has completed.
- Complete admin home, leads, jobs/usage, content, integrations, audit and readiness views from existing first-party tables where the current role permits.
- Add additive local schema/RLS contracts only where account persistence or request traceability requires them; apply no remote migration.
- Enforce role and ownership checks in both application authorization and PostgreSQL RLS, including masked lead contact data by role.
- Preserve disabled provider modes, secret-name-only inventory and honest empty/unconfigured states.

## Allowed files and directories

- Account, auth callback/sign-in/sign-out and saved-item routes/components
- Admin operations routes/components and authorization contracts
- Relevant account, preference, request, scenario, report, job, content, audit and database contracts
- Additive Supabase migrations and local RBAC/RLS tests
- Focused unit/integration/E2E tests and `docs/**`

## Acceptance criteria

- Anonymous visitors retain the complete useful public product experience; signing in is requested only for persistence.
- A configured user can request a magic link, complete the callback, sign out and see only their own saved records.
- Saved properties/scenarios, Vision/report/job status and preferences are data-backed under ownership RLS; unauthorized users see no rows and cannot mutate them.
- Export/deletion requests have explicit received/pending/completed semantics and exact retries cannot duplicate a request.
- Required admin surfaces show real first-party state or an honest empty/unconfigured result under the role matrix; no placeholder claim reads as implemented behavior.
- Contact detail, consent, integration, usage, audit and publication permissions pass the documented staff-role matrix.
- Desktop/mobile E2E, local database verification, production build, OpenNext build and 50-route smoke checks pass.

## Expected commands

`pnpm check`, local PostgreSQL-backed `pnpm db:verify`, `pnpm test:e2e`, `pnpm cf:build`, `pnpm cf:preview`, `pnpm smoke:routes`, focused tests, `git diff --check` and secret scanning.

## Do not touch

- Production database data, migrations, RLS, Auth settings, redirect URLs, credentials or Storage.
- Vercel projects, deployments, domains or environment settings.
- Cloudflare deployment configuration, secrets or remote Turnstile widgets.
- Remote email, CRM, MLS, media or paid AI provider calls.
- Destructive account deletion, production exports or claims that an external notification was sent.
- Mortgage calculations outside `@tract/mortgage-math`.
