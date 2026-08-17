# Active checkpoint

Checkpoint: Phase 2 — conversion engine
Active agent: Codex
Started: 2026-08-17T23:22:00Z
Status: in progress

## Exact scope

- Build the privacy-conscious mortgage planner without turning it into a loan application.
- Add local save and explicit send/review behavior for planning results.
- Preserve first-touch, last-touch and conversion-touch attribution as distinct records.
- Make general lead creation idempotent under exact client retries and keep consent coupled to the same transaction.
- Exercise the outbox-to-CRM path with the fixture adapter and prove duplicate suppression.
- Add useful thank-you and authenticated admin lifecycle views.
- Reuse the existing Turnstile boundary; do not create or modify remote widgets or credentials.

## Allowed files and directories

- `apps/web/app/mortgage/**`, `apps/web/app/contact/**`, `apps/web/app/admin/**` and relevant API routes
- Relevant `apps/web/components/**`, `apps/web/lib/**`, route registry, navigation, metadata and styles
- Relevant schema, integration, analytics, domain, database and mortgage-math package files
- Additive Supabase migrations and RLS tests required for idempotency and lifecycle evidence
- End-to-end/unit tests and `docs/**`

## Acceptance criteria

- A visitor can model purchase or refinance inputs, see deterministic outputs and save the plan locally without providing contact details.
- Sending a plan uses explicit consent and an idempotent client submission identifier.
- The durable operation records one lead, one consent receipt, distinct attribution touches and one outbox event under exact retries.
- The CRM fixture projection consumes the event without duplicate external records.
- Thank-you states do not falsely imply successful persistence when infrastructure is unavailable.
- Authenticated staff can trace relevant lead, consent, attribution and outbox lifecycle state within their RLS scope.
- Unit, end-to-end, production build, OpenNext build and 50-route smoke checks pass.

## Expected commands

`pnpm check`, local PostgreSQL-backed `pnpm db:verify`, `pnpm test:e2e`, `pnpm cf:build`, `pnpm cf:preview`, `pnpm smoke:routes`, focused tests, `git diff --check` and secret scanning.

## Do not touch

- Production database data, migrations, RLS, Auth settings, credentials or storage.
- Vercel projects, deployments, domains or environment settings.
- Cloudflare deployment configuration, secrets or remote Turnstile widgets.
- Live CRM, MLS, email or paid AI provider calls.
- Mortgage calculations outside `@tract/mortgage-math`.
- SSNs, full dates of birth, bank credentials, document uploads or other application-only data in marketing forms.
