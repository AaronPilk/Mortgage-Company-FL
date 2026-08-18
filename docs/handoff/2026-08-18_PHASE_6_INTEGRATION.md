# Phase 6 integration checkpoint

Date: 2026-08-18

Agent: Codex

Branch: `agent/tract-integrated-recovery-20260818`

Parents: recovery `5da551d`; consumer UI `e641019`

Integration commit: `c1fa306`

Status: recovery/UI integration complete and authorized for `main`; Phase 6
content work not complete; combined artifact not deployed to Cloudflare

## Summary

- Reconciled recovery Phases 0–5 with the five overlapping feature/brand commits
  already on `main` without discarding either history.
- Kept the richer canonical `/plan`, 19-record synthetic marketplace,
  deterministic Vision engine and RendProp job/demo implementation from the
  newer base.
- Retained exact lead retries, three-touch attribution, account/Auth contracts,
  privacy lifecycle, outbox worker boundary, read-only admin state and canonical
  repository-owned media from the recovery branch.
- Renumbered overlapping additive migrations into one 14-file chain.
- Reworked the Vision report form to send bounded inputs to the server-owned
  report transaction. Server calculations and assumption provenance are now the
  durable source of record.
- Added an integrated desktop/mobile recovery suite and updated the Worker route
  smoke contract to 61 release-visible requests.
- Reconciled the authoritative handoff and architecture inventory against live
  read-only Vercel, Supabase and Cloudflare evidence.
- Merged Claude's image-led consumer experience without discarding recovery
  flows, corrected responsive image behavior and recorded all 42 assets.
- Kept the hero estimate explicit about modeled mortgage insurance and excluded
  costs rather than presenting principal-and-interest as a whole payment.

## Verification

- `pnpm check`: pass; 638 unit/integration tests, 46 pages, 53 registered routes
  and the production build.
- `pnpm db:verify`: pass; 14 migrations, 38 public tables, 59 policies and 165
  SQL assertions; every public table has RLS.
- `pnpm test:e2e`: 80/80 desktop/mobile checks pass.
- `pnpm cf:build`: pass.
- OpenNext/Wrangler preview: 61/61 route smoke, zero Error 1102 responses.
- `pnpm deploy:preflight`: expected fail on four configuration names; no values
  printed.

## Read-only infrastructure findings

- Cloudflare remains the intended canonical host and has five visible Worker
  versions. Claude deployed `e641019` as Worker version
  `671ea10b-2d29-4278-b9e7-0a4b7c8af8a6`; current public probes return HTTP 200.
- Vercel is actively and publicly auto-deploying `main` as a production target.
  It is not merely connected or preview-only. The recovery-branch push also
  created an access-protected preview. No Vercel setting was changed.
- The connector-visible Supabase project is healthy but has no TRACT migrations,
  public tables, buckets, objects, Edge Functions or Auth users. It is unproven
  and was not modified.
- The Supabase security advisor reports two execute-grant warnings on its default
  `rls_auto_enable` event-trigger helper.

## External blockers

1. Record and then disable or privatize the automatic Vercel production path;
   the owner authorized the combined main push but not a second canonical host.
2. Prove the Supabase project identity and explicitly approve the additive
   migration plan.
3. Provision the canonical Cloudflare configuration required by preflight.
4. Complete licensing/POS/vendor decisions before public launch claims.

## Next engineering task

Continue Phase 6 on this reconciled base: reviewed content, SEO/AEO, feed/schema
and analytics contracts. Do not deploy the combined Cloudflare artifact until
the infrastructure blockers above are cleared and every mandatory gate is
re-run.
