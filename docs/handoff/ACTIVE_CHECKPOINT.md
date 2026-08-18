# Active checkpoint

**As of 2026-08-18.**

## Current checkpoint

The isolated integration branch is `agent/tract-integrated-recovery-20260818`,
based on `origin/main` at `7998ede`. It intentionally reconciles the verified
recovery implementation through Phase 5 with the newer calculator, marketplace,
Vision, planner, RendProp and brand work already on `main`.

The integration is locally complete and green. It has not been pushed, merged or
deployed. No remote database, Auth, RLS, Storage, Vercel or Cloudflare setting was
changed.

Phase 0 is complete. Error 1102 does not reproduce against the current public
Worker or the integrated OpenNext artifact. The local Worker preview completed
61 route requests with zero failures, 10.1 ms average and 41.1 ms maximum.

## Verified state

| Gate                    | Result                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm check`            | Pass: format, lint, typecheck, 633 tests, content lint and 57-page production build               |
| `pnpm db:verify`        | Pass: 14 migrations, 38 public tables, 59 policies, 165 SQL assertions, RLS on every public table |
| `pnpm test:e2e`         | Pass: 80/80 desktop and mobile checks                                                             |
| `pnpm cf:build`         | Pass: OpenNext Cloudflare artifact generated                                                      |
| local Worker preview    | Pass: 61/61 route smoke, no Error 1102                                                            |
| `pnpm deploy:preflight` | Correctly blocked on four configuration names; no values printed                                  |

The integrated Vision report path now sends bounded inputs, recomputes the
deterministic result server-side, and atomically records lead, consent, three
attribution touches, project, assumption provenance, scenario, report and outbox
state. Exact retries are proved for ordinary leads, planner leads, Vision reports
and privacy requests.

## Newly confirmed external blockers

### Public Vercel duplicate

Vercel is not merely connected. Team `TRACT Mortgage` contains project
`mortgage-company-fl-web`. It has three ready deployments targeted as
`production`; the latest was built from `main` commit `7998ede`. Its three
`vercel.app` aliases are publicly reachable and the primary alias returns HTTP 200. The rendered canonical still points to the Cloudflare Worker.

Cloudflare remains the intended canonical host, but there are currently two
public runtimes. Pushing or merging to `main` would automatically deploy another
Vercel production artifact. The read-only infrastructure scope does not permit
disconnecting or deleting it.

Owner action required before the integration is pushed or deployed: disable the
Vercel Git production deployment or otherwise make the Vercel aliases non-public,
then verify that Cloudflare remains the sole production architecture. Do not
migrate the application to Vercel.

### Supabase is empty and unproven

The connector now exposes one healthy project named `AaronPilk's Project` in
`us-east-2` on PostgreSQL 17. It is a plausible TRACT candidate, but identity has
not been proven. It contains no repository migrations, no public tables or
policies, no application Edge Functions, no Storage buckets or objects and no
Auth users. The only public function is Supabase's RLS event-trigger helper; the
security advisor reports that `anon` and `authenticated` retain execute grants.

No migration may be applied until the owner confirms this project is TRACT and
explicitly authorizes the remote database change.

### Deployment preflight

The integrated tree correctly refuses a release until these names are configured
in the canonical production environment:

- `HASH_PEPPER`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_MODE`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

This list is the local preflight result, not permission to set values. The full
environment contract is in `docs/architecture/runtime-inventory.md`.

## Exact next action

1. Review and commit the local integration checkpoint.
2. Have the owner resolve the public Vercel duplicate without creating another
   hosting architecture.
3. Prove the Supabase project identity and approve an additive migration plan.
4. Provision the required Cloudflare configuration through approved secret and
   public-variable channels, then re-run `pnpm deploy:preflight`.
5. Only after every gate is green: push/merge the reviewed branch, run the manual
   Cloudflare workflow (`pnpm cf:build && pnpm cf:deploy`), and verify production.

Until steps 2–4 are complete, do not push, merge or deploy this integration and
do not claim that durable production lead capture, Auth, CRM delivery or bot
protection is live.

## Next engineering checkpoint

After the infrastructure gate is assigned, Phase 6 continues with reviewed
content, SEO/AEO, feed/schema and analytics contracts on this reconciled base.
Avoid broad UI replacement: the mortgage-first product routes and differentiated
workflows are already implemented and should be improved through measured,
bounded changes.
