# Active checkpoint

**As of 2026-08-18.**

---

## Where work stopped

Four commits of finished work are on `claude/tract-autonomous-build-20260817`.
They pass the full verification suite. **They are not on `main` and are not
live.**

Work stopped because the sandbox git proxy denies writes to
`https://github.com/AaronPilk/Mortgage-Company-FL` (HTTP 403, "not in this
session's authorized repository set"). Reads work. This is an environment
restriction, not a repository or credential problem, and no amount of further
engineering clears it.

| Commit    | Summary                                                            |
| --------- | ------------------------------------------------------------------ |
| `7eafc51` | Five calculators, five loan programs                               |
| `14effc2` | Property marketplace (19 labelled sample listings) + Vision engine |
| `b5c1f3a` | Progressive mortgage planner at `/plan`                            |
| `f7ab61c` | RendProp workflow with an enforced job model                       |

Production is still serving `f903d60`, the tip of `origin/main`, verified live.

Nothing is half-written. There is no partially-applied migration, no stubbed
function waiting to be filled in, and no failing test. The tree is clean and the
suite is green.

---

## The exact next action

**Push `claude/tract-autonomous-build-20260817` to
`https://github.com/AaronPilk/Mortgage-Company-FL` and merge it to `main`.**

Owner: Aaron, the repository owner. Anyone with write access to the repository
can do it. It takes about a minute.

Cloudflare builds and deploys automatically on push to `main`. No dashboard
configuration is required — `NEXT_PUBLIC_SITE_URL` is committed in
`apps/web/.env.production` (see `docs/handoff/DECISIONS.md`, D-3).

### Immediately after the merge

1. Wait for the Cloudflare build to finish.
2. Run the verification list in `docs/handoff/DEPLOYMENT_HISTORY.md` against
   `https://mortgage-company-fl.aaron-9c3.workers.dev`. At minimum:
   `/api/v1/health`, `/`, `/plan`, `/calculators/amortization`, `/vision/start`,
   `/rendprop/demo`, `/robots.txt`, `/sitemap.xml`.
3. Confirm `/properties` returns 404. `SHOW_SAMPLE_LISTINGS` is `false`, so that
   is the correct behaviour — not a regression.
4. Read the Worker observability logs for the deploy window.

### If the deploy fails

The rollback point is `f903d60`. It is verified live and known good.

---

## Then, in order

| #   | Action                                                                                                                                                               | Owner                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1   | Delete the dead Cloudflare Pages project.                                                                                                                            | Cloudflare account owner |
| 2   | Decide whether to set `SHOW_SAMPLE_LISTINGS=true` in production. Read `docs/handoff/DECISIONS.md` D-4 first — including the three conditions that make it safe.      | Aaron                    |
| 3   | Produce the missing image assets. `docs/ASSET_MANIFEST.md` lists exactly which paths are referenced in code and currently 404.                                       | Aaron / design           |
| 4   | Provision `TURNSTILE_MODE=production` with its keys, and a real `HASH_PEPPER`. Two of the four items `deploy:preflight` currently refuses on.                        | Aaron                    |
| 5   | Stand up the Supabase project, apply the nine migrations, set the three Supabase variables. No live project association is currently known.                          | Aaron                    |
| 6   | Give the outbox worker a scheduled trigger — a Cloudflare Queue consumer or a cron Worker with a provisioned binding. Without it, `integration_outbox` never drains. | Engineering              |
| 7   | Select the POS/LOS. Highest-leverage open business decision. `/apply` refuses to collect anything while `SECURE_APPLICATION_URL` is unset.                           | Founders                 |

Everything above item 6 is a credential or a dashboard action. None of it is
engineering work.

---

## What a new agent should read first

1. `CLAUDE.md` — the ten invariants. If you find yourself weakening one to make
   something pass, stop; the test is the requirement.
2. `docs/handoff/CURRENT_STATE.md` — what exists.
3. `docs/handoff/DECISIONS.md` — why it is shaped this way, and when each choice
   should be revisited.
4. `docs/handoff/BLOCKERS.md` — what is external and cannot be coded around.
5. `docs/architecture/decisions.md` — ADR-001 through ADR-010.

Then verify with `pnpm check`, `pnpm db:verify`, and `pnpm test:e2e`. A change is
not done until all three pass.
