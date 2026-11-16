# Active checkpoint

**As of 2026-11-16.**

## Current checkpoint

`main` at `26987fd` is live as Worker version
`5d568e0d-6c9b-43ef-9762-61f9bbf69909`. Nothing is waiting to deploy.

The last two merges:

| Merge     | Date       | What it shipped                                                                   |
| --------- | ---------- | --------------------------------------------------------------------------------- |
| `54d23c5` | 2026-11-13 | PR #1: WML SEO, one domain, rebrand, licensing (branch `claude/seo-sop-20261112`) |
| `26987fd` | 2026-11-16 | PR #9: `/mortgage-rates` public and indexable (ADR-015)                           |

Working copies on the owner's Mac:

- `tract-platform` is at `97eabee` on `agent/mobile-ux-20260819`, clean.
  `main` contains that commit and is ahead of it. Do not deploy from this
  branch; deploy `main`.
- `tract-seo-20261112` is the clean worktree the deploy kit builds from.

## Deploy kit

Out of the repo, at `Claude outputs/seo-20261112/deploy-wml-seo-20261112.sh` in
the owner's project folder. It is pinned to `26987fd` and ran on 2026-11-16;
running it again would redeploy the same commit. Re-pin `BRANCH` and `SHA` to
the new commit before the next deploy. Logs live in the same folder.

## This branch: `claude/wml-fixes-20261116`

Built from `26987fd`, not yet merged or deployed. It carries: the CI fixes
(ADR-016), `ATTOM_PLAN` and the honest readiness state, named ATTOM failures,
the runner-action bumps, the Dependabot config, the rebuilt
`/calculators/short-term-rental` (sitemap 208), the lead form's pending-token
guard, and these handoff files. Verified locally: `pnpm check` green (2217 unit
tests, 71 pages, build), `pnpm test:e2e` 128 passed. `pnpm db:verify` not run
(no migration in the change). After merge: re-pin the deploy kit to the merge
commit, deploy, confirm `/mortgage-rates`, the footer licence line and
`/calculators/short-term-rental` are 200, then submit the changed URLs with
`node scripts/indexnow-submit.mjs --since 26987fd`.

## Exact next action

Aaron decides ATTOM before the 30-day trial ends: buy a plan, or set
`ATTOM_MODE=fixture` and deploy so the home lookup shows labelled samples. The
trial start date is not recorded in the repo.

## Anything that contradicts what you were told

- The 2026-08-18 versions of `CURRENT_STATE.md`, `BLOCKERS.md` and this file
  described Vercel as a live duplicate and licensing as missing. Both have been
  wrong since November. `CLAUDE.md` tells agents to read these files first,
  which is why they were refreshed.
- `2026-11-12_SEO_DOMAIN.md` and `2026-11-13_BRAND.md` both say not to merge to
  `main` while Vercel builds `main` publicly. PR #1 merged on 2026-11-13 and
  Vercel created no deployment from it.
- The 2026-11-13 deploy-kit run deployed `3cbf071` as `595cfc3b` but stopped on
  one live check: `/tract` returned 308, which the 2026-11-13 brand change
  intended. IndexNow was not submitted that day. The 2026-11-16 run passed all
  23 checks and submitted 207 URLs.
- `/admin/readiness` shows ATTOM as "approved" while production runs on a
  trial key.
- `DEPLOYMENT_HISTORY.md` stopped at 2026-11-12. This refresh adds the
  2026-11-13 and 2026-11-16 deploys.
