# Deployment history

**As of 2026-08-18.** The intended production target is Cloudflare Worker
`mortgage-company-fl` at
`https://mortgage-company-fl.aaron-9c3.workers.dev`.

## Cloudflare Workers

The deploy mechanism is manual:

```text
pnpm cf:build && pnpm cf:deploy
```

A GitHub push does not deploy Cloudflare. Five Worker deployments are visible:

| Created UTC      | Version                                | Source evidence                            |
| ---------------- | -------------------------------------- | ------------------------------------------ |
| 2026-08-17 20:31 | `f835203c-4143-411b-82b2-e93b9e7da288` | Upload                                     |
| 2026-08-17 21:34 | `c7beef15-674f-4f9c-bc20-6c8713394c44` | Unknown deployment source                  |
| 2026-08-17 22:18 | `02ff84bb-9f8e-41d4-9049-66f74deba249` | Previously verified live around `f903d60`  |
| 2026-08-18 01:38 | `a8691060-83c5-473c-8858-cd20b81300ab` | Unknown version upload                     |
| 2026-08-18 03:22 | `671ea10b-2d29-4278-b9e7-0a4b7c8af8a6` | Claude consumer UI upload; current version |

The latest version uses compatibility date 2026-08-01, `nodejs_compat`, the
assets binding and the visible non-secret brand variable. Wrangler metadata does
not encode a Git commit, but Claude reported this deployment from `e641019` and
the upload timing and public UI match that report. Public probes confirm the new
hero imagery plus `/plan`, `/properties`, `/vision` and `/rendprop` return HTTP 200.

The combined recovery/UI commit `c1fa306` has not been deployed to Cloudflare.
Its `pnpm cf:build` passes, but `pnpm cf:deploy` was not run because production
preflight is blocked.

## Vercel

Vercel currently performs an independent Git deployment from `main`. This is a
public duplicate, not an approved preview-only connection.

| Created UTC      | Vercel deployment                  | Git commit | Target                   | State |
| ---------------- | ---------------------------------- | ---------- | ------------------------ | ----- |
| 2026-08-17 20:37 | `dpl_556Wr88RHPtj3Qe8Vjx4QhhXsqut` | `f903d60`  | production               | READY |
| 2026-08-18 00:59 | `dpl_6Y1NzPy36c9kzXE7JYnxippz6qGb` | `cdacd99`  | production               | READY |
| 2026-08-18 01:18 | `dpl_HAwXfY5vaJ3XjBWVHkV8d9YcSanp` | `7998ede`  | production               | READY |
| 2026-08-18 02:31 | `dpl_8zgxNAVkwSqcfpvSnZ7quBLXSEdo` | `400c6d8`  | protected branch preview | READY |
| 2026-08-18 03:22 | `dpl_WtmJkZvAjU3LSbWVMgwNURt17Jjy` | `e641019`  | production               | READY |

The latest production deployment has public aliases including
`mortgage-company-fl-web.vercel.app` and returns HTTP 200 without an
authentication gate. Its canonical tag points to the Cloudflare Worker, but it
still serves a second runtime. The recovery-branch preview redirects
unauthenticated requests to Vercel SSO. The preview was created automatically by
the Git push; no Vercel project, alias or setting was changed during this audit.

## Combined integration — verified, Git-pushed, not Cloudflare-deployed

`agent/tract-integrated-recovery-20260818` merge commit `c1fa306` reconciles
recovery Phases 0–5 at `5da551d` with Claude's deployed UI commit `e641019`.
The owner explicitly authorized the handoff descendant to fast-forward `main`.
Its complete local gates pass:

- `pnpm check`;
- `pnpm db:verify`;
- `pnpm test:e2e`;
- `pnpm cf:build`;
- `pnpm deploy:preflight` blocks on the four required configuration names.

The Git push causes an automatic Vercel production build but does not deploy the
canonical Cloudflare Worker. The combined Cloudflare release remains blocked
while production preflight is red.

## Required release sequence

1. Record and verify the automatic Vercel deployment created by the combined
   main-branch push; do not treat it as the canonical release.
2. Disable or privatize the Vercel Git production path; verify its public aliases
   no longer serve the application.
3. Prove and approve the TRACT Supabase project, apply only reviewed additive
   migrations and verify the remote schema/RLS under explicit authority.
4. Provision approved Cloudflare configuration without exposing values.
5. Re-run `pnpm check`, `pnpm db:verify`, `pnpm test:e2e`,
   `pnpm deploy:preflight` and `pnpm cf:build`.
6. Run the manual Cloudflare deployment.
7. Verify at minimum: `/api/v1/health`, `/`, `/plan`,
   `/calculators/amortization`, `/vision/start`, `/rendprop/demo`,
   `/robots.txt` and `/sitemap.xml`.
8. Submit a controlled, consented test lead only if the production database,
   Turnstile and operational test-data procedure are approved.
9. Review Worker observability for the deploy window and record the exact Worker
   version and Git commit mapping.

Do not call a release complete from a Git push or a build alone.
