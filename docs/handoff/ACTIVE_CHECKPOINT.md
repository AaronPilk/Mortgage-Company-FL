# Active checkpoint

**As of 2026-08-18.**

## Current checkpoint

The isolated integration branch is `agent/tract-integrated-recovery-20260818`.
Combined code commit `c1fa306` is a two-parent merge of the verified Phase 0–5
recovery work at `5da551d` and Claude's consumer UI/image commit `e641019` from
`main`. The merge preserves both streams and corrects the responsive-image,
accessibility, asset-provenance and full-housing-payment contracts found during
reconciliation.

The owner explicitly changed the earlier hold and authorized the combined work
to be pushed to `main`. This handoff advances both the recovery branch and
`main` with `c1fa306` in their history. That authorization does not waive the
repository's production preflight or authorize an unreviewed remote Supabase
migration.

Claude deployed `e641019` before the reconciliation finished:

- Cloudflare Worker version `671ea10b-2d29-4278-b9e7-0a4b7c8af8a6` became 100%
  live at 2026-08-18 03:22 UTC;
- Vercel production deployment `dpl_WtmJkZvAjU3LSbWVMgwNURt17Jjy` reached
  `READY` from the same commit.

The Cloudflare deployment is healthy but contains Claude's UI on the old
`7998ede` base, not the recovery implementation. The combined `c1fa306` artifact
must not replace it until production preflight passes.

Phase 0 is complete. Error 1102 does not reproduce against the public Worker or
the integrated OpenNext artifact.

## Verified combined state

| Gate                    | Result                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm check`            | Pass: format, lint, typecheck, 638 tests, content lint and 57-route production build              |
| `pnpm db:verify`        | Pass: 14 migrations, 38 public tables, 59 policies, 165 SQL assertions, RLS on every public table |
| `pnpm test:e2e`         | Pass: 80/80 desktop and mobile checks                                                             |
| `pnpm cf:build`         | Pass: combined OpenNext Cloudflare artifact generated                                             |
| `pnpm deploy:preflight` | Blocked on four required configuration names; no values printed                                   |

## Active production blockers

### Cloudflare production configuration

The combined tree correctly refuses a release until these names are configured
in the canonical production environment:

- `HASH_PEPPER`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_MODE`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Do not bypass this gate and do not place values in source control or handoff
documents.

### Supabase remains empty and unproven

The connector exposes one healthy project named `AaronPilk's Project` in
`us-east-2`, but it has not been proven to be the TRACT production project. It
contains none of the 14 repository migrations, public application tables,
policies, Edge Functions, Storage buckets or Auth users. No remote schema,
Auth, RLS, Storage setting or data was changed.

### Public Vercel duplicate remains active

Vercel Git deployment is still active for `main` and creates a publicly
reachable production runtime independent of Cloudflare. The owner authorized
the main-branch push with this known consequence, but did not authorize a
migration from Cloudflare or a second canonical architecture. Cloudflare remains
the canonical origin; Vercel duplicate resolution remains an infrastructure
follow-up.

## Exact next action

1. Verify the resulting Git commit and automatic Vercel deployment without
   changing Vercel project settings.
2. Provision the four required Cloudflare configuration names through approved
   secret/public-variable channels and re-run `pnpm deploy:preflight`.
3. Prove the Supabase project identity and separately authorize the reviewed
   additive migration plan before any remote migration.
4. Only after preflight passes, deploy `c1fa306` or its handoff descendant to
   Cloudflare and verify the live routes and Worker version.

Until steps 2–3 are complete, do not claim that the recovery database, durable
lead capture, Auth, CRM delivery or production bot protection is live.

## Next engineering checkpoint

After the infrastructure gate is resolved, continue Phase 6 with reviewed
content, SEO/AEO, feed/schema and analytics contracts on the reconciled base.
Avoid another broad UI replacement; improve the now-integrated mortgage-first
flows through measured changes.
