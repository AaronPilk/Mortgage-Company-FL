# Deployment history

**As of 2026-08-18.**

Deployment target for every entry is Cloudflare Workers, worker
`mortgage-company-fl`, served at
`https://mortgage-company-fl.aaron-9c3.workers.dev`.

Deploy mechanism: **manual** `pnpm cf:build && pnpm cf:deploy`. Pushing to `main`
does not trigger a Cloudflare build — verified 2026-08-18 by comparing the pushed
commits against the Worker's `modified_on`. See `docs/DEPLOYMENT.md`.

---

## `main` — deployed

| Commit    | Date       | Summary                                                    | Deployed | Production verification                                                                                                                                 |
| --------- | ---------- | ---------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `f903d60` | 2026-08-17 | Give the site a visual language, in both themes            | **Yes**  | **Verified live.** Pushed, built, deployed, and confirmed serving. Subsequently crawled: 39 routes, then 390 requests at concurrency 16 — all HTTP 200. |
| `39fb830` | 2026-08-17 | Read canonical origin from the committed env file          | Yes      | Superseded by `f903d60`.                                                                                                                                |
| `6174688` | 2026-08-17 | Commit public site URL so deploys need no dashboard config | Yes      | Superseded.                                                                                                                                             |
| `cb70410` | 2026-08-17 | Refuse a deploy build without a real canonical origin      | Yes      | Superseded.                                                                                                                                             |
| `3a7a2ad` | 2026-08-17 | **Deploy as a Cloudflare Worker, not Pages**               | Yes      | The migration commit. Everything before this targeted Cloudflare Pages.                                                                                 |
| `60d9fd7` | 2026-08-17 | Initial TRACT Mortgage platform build                      | Yes      | —                                                                                                                                                       |

`f903d60` is the current tip of `origin/main` and is what
`https://mortgage-company-fl.aaron-9c3.workers.dev` is serving.

**It is the rollback point.** Reverting to `f903d60` returns production to a
known-good, verified-live state.

---

## `claude/tract-autonomous-build-20260817` — NOT deployed

**Four commits. None of this is live.** The sandbox git proxy denies writes to
this repository (HTTP 403, "not in this session's authorized repository set"), so
the branch exists only locally. Reads work; writes do not. See
`docs/handoff/BLOCKERS.md`, blocker 1.

| Commit    | Date       | Summary                                                           | Deployed | Verification                                        |
| --------- | ---------- | ----------------------------------------------------------------- | -------- | --------------------------------------------------- |
| `f7ab61c` | 2026-08-18 | Build RendProp as a real workflow with an enforced job model      | **No**   | Local only: `pnpm check` and `pnpm db:verify` pass. |
| `b5c1f3a` | 2026-08-18 | Add the progressive mortgage planner and make it the primary path | **No**   | Local only.                                         |
| `14effc2` | 2026-08-17 | Build the property marketplace and the TRACT Vision engine        | **No**   | Local only.                                         |
| `7eafc51` | 2026-08-17 | Add five calculators and five loan programs                       | **No**   | Local only.                                         |

Every one is committed locally and passes the full verification suite (606 tests,
123 RLS assertions — see `docs/handoff/TEST_RESULTS.md`). **They have never run in
production and have never been served to a visitor.**

---

## The Cloudflare Pages project

Dead. It predates `3a7a2ad`.

Cloudflare Pages cannot serve this application's API routes or its server
rendering, and the Pages deployment returned permanent 404s. It was replaced, not
repaired.

**It should be deleted.** Leaving it in place means a future operator can find it,
point a domain at it, and serve 404s — or worse, serve a stale build of a
regulated marketing site. Deleting it is a dashboard action for the Cloudflare
account owner.

---

## Verifying a deployment

After any push to `main`, check the following against the live URL before
considering it done:

| Check                           | Expect                                                   |
| ------------------------------- | -------------------------------------------------------- |
| `GET /api/v1/health`            | HTTP 200                                                 |
| `GET /`                         | HTTP 200, pre-launch banner present                      |
| `GET /plan`                     | HTTP 200, planner renders                                |
| `GET /calculators/amortization` | HTTP 200, schedule renders (CPU-heavy route)             |
| `GET /vision/start`             | HTTP 200 (CPU-heavy route)                               |
| `GET /rendprop/demo`            | HTTP 200                                                 |
| `GET /robots.txt`               | Canonical origin matches `NEXT_PUBLIC_SITE_URL`          |
| `GET /sitemap.xml`              | Contains only `indexable: true` routes from the registry |
| `GET /properties`               | 404 while `SHOW_SAMPLE_LISTINGS=false` — that is correct |
| Any page source                 | No string `NMLS #` in any JSON-LD block                  |

Cloudflare Worker observability is enabled in `apps/web/wrangler.jsonc`. Read the
logs for the deploy window rather than only the status codes.
