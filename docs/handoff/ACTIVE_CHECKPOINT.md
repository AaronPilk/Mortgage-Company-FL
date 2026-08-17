# Active checkpoint

Checkpoint: Phase 1 — property-to-Vision vertical slice  
Active agent: Codex  
Started: 2026-08-17T22:40:06Z  
Status: in progress

## Exact scope

- Preserve the mortgage core, calculators and visual system.
- Extend the fixture listing provider into an honest, browseable property search and detail experience.
- Add property-to-Vision entry, structured assumptions and deterministic scenario outputs.
- Produce a useful report preview before requesting contact details.
- Persist the gated report request through the first-party lead/consent/attribution/outbox transaction when Supabase is configured.
- Show the resulting lead/report lifecycle in authenticated admin views; remain fail-closed when Auth or Supabase is absent.
- Add focused unit, route and end-to-end coverage for the complete fixture loop.
- Keep MLS and paid AI optional; never present fixtures as live listings.

## Allowed files and directories

- `apps/web/app/properties/**`, `apps/web/app/vision/**`, `apps/web/app/reports/**`
- Relevant `apps/web/components/**`, `apps/web/lib/**`, route registry, metadata and styles
- Relevant fixture, schema, domain, integration and mortgage-math package files
- Additive Supabase migrations and RLS tests required by the vertical slice
- End-to-end/unit tests, image assets and `docs/**`

## Acceptance criteria

- A visitor can browse fixture cards, open a stable property detail route and see clear fixture/source disclosure.
- The property can seed a Vision project without requiring an account or paid AI.
- The visitor can edit assumptions, compare deterministic scenarios and see a report preview before the contact gate.
- Gate submission records lead, consent, distinct attribution, report context and an idempotent outbox event in one durable operation when Supabase is configured.
- Without Supabase, the UI fails honestly and does not return false success.
- An authenticated staff view can observe the lead/report record; unauthenticated access remains denied.
- RLS covers every new table/policy and the local database suite passes.
- Unit, end-to-end, production build, OpenNext build and 50-route smoke checks pass.

## Expected commands

`pnpm check`, local PostgreSQL-backed `pnpm db:verify`, `pnpm test:e2e`, `pnpm cf:build`, `pnpm cf:preview`, `pnpm smoke:routes`, focused tests, `git diff --check` and secret scanning.

## Do not touch

- Production database data, migrations, RLS, Auth settings or credentials.
- Vercel projects, deployments, domains or environment settings.
- Cloudflare deployment configuration or secrets except through the established reviewed GitHub-to-Cloudflare workflow after all gates pass.
- Live MLS/provider calls, paid AI calls or fixture publication.
- Mortgage calculations outside `@tract/mortgage-math`.
- Any marketing-form collection of application-only data.
