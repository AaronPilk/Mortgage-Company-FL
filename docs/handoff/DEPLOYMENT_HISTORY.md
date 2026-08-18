# Deployment history

**As of 2026-08-18.** The intended production target is Cloudflare Worker
`mortgage-company-fl` at
`https://mortgage-company-fl.aaron-9c3.workers.dev`.

## Cloudflare Workers

The deploy mechanism is manual:

```text
pnpm cf:build && pnpm cf:deploy
```

A GitHub push does not deploy Cloudflare. Four Worker deployments are visible:

| Created UTC      | Version                                | Source evidence                                |
| ---------------- | -------------------------------------- | ---------------------------------------------- |
| 2026-08-17 20:31 | `f835203c-4143-411b-82b2-e93b9e7da288` | Upload                                         |
| 2026-08-17 21:34 | `c7beef15-674f-4f9c-bc20-6c8713394c44` | Unknown deployment source                      |
| 2026-08-17 22:18 | `02ff84bb-9f8e-41d4-9049-66f74deba249` | Previously verified live around `f903d60`      |
| 2026-08-18 01:38 | `a8691060-83c5-473c-8858-cd20b81300ab` | Unknown version upload; current public version |

The latest version uses compatibility date 2026-08-01, `nodejs_compat`, the
assets binding and the visible non-secret brand variable. No Worker secrets are
listed. Wrangler metadata does not encode a Git commit for the latest upload, so
do not claim an exact commit-to-version mapping. Public probes confirm the newer
`/plan`, `/vision/start`, `/rendprop/demo` and brand routes are present.

The recovery integration branch has not been deployed. `pnpm cf:build` and a
local Worker preview passed, but `pnpm cf:deploy` was not run.

## Vercel

Vercel currently performs an independent Git deployment from `main`. This is a
public duplicate, not an approved preview-only connection.

| Created UTC      | Vercel deployment                  | Git commit | Target     | State |
| ---------------- | ---------------------------------- | ---------- | ---------- | ----- |
| 2026-08-17 20:37 | `dpl_556Wr88RHPtj3Qe8Vjx4QhhXsqut` | `f903d60`  | production | READY |
| 2026-08-18 00:59 | `dpl_6Y1NzPy36c9kzXE7JYnxippz6qGb` | `cdacd99`  | production | READY |
| 2026-08-18 01:18 | `dpl_HAwXfY5vaJ3XjBWVHkV8d9YcSanp` | `7998ede`  | production | READY |

The latest deployment has public aliases including
`mortgage-company-fl-web.vercel.app` and returns HTTP 200 without an
authentication gate. Its canonical tag points to the Cloudflare Worker, but it
still serves a second runtime. No Vercel project, alias, deployment or setting
was changed during this audit.

## Integration branch — not deployed

`agent/tract-integrated-recovery-20260818` reconciles `origin/main` at `7998ede`
with recovery Phases 0–5. Its complete local gates pass:

- `pnpm check`;
- `pnpm db:verify`;
- `pnpm test:e2e`;
- `pnpm cf:build`;
- 61-request local Worker smoke.

It must not be pushed or merged while `main` automatically creates another
public Vercel production deployment. It must not be deployed to Cloudflare while
production preflight is red.

## Required release sequence

1. Disable or privatize the Vercel Git production path; verify its public aliases
   no longer serve the application.
2. Prove and approve the TRACT Supabase project, apply only reviewed additive
   migrations and verify the remote schema/RLS under explicit authority.
3. Provision approved Cloudflare configuration without exposing values.
4. Re-run `pnpm check`, `pnpm db:verify`, `pnpm test:e2e`,
   `pnpm deploy:preflight` and `pnpm cf:build`.
5. Push/merge the reviewed integration.
6. Run the manual Cloudflare deployment.
7. Verify at minimum: `/api/v1/health`, `/`, `/plan`,
   `/calculators/amortization`, `/vision/start`, `/rendprop/demo`,
   `/robots.txt` and `/sitemap.xml`.
8. Submit a controlled, consented test lead only if the production database,
   Turnstile and operational test-data procedure are approved.
9. Review Worker observability for the deploy window and record the exact Worker
   version and Git commit mapping.

Do not call a release complete from a Git push or a build alone.
