# Deployment history

| Date                  | Commit                                     | Branch | Cloudflare environment                                    | Deployment result                         | Smoke-test result                                                                                                 | Rollback target                                               |
| --------------------- | ------------------------------------------ | ------ | --------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 2026-08-17 (observed) | `f903d60b948d8c6f93f66ade7f682ce6edb0dfec` | `main` | Public Worker `mortgage-company-fl.aaron-9c3.workers.dev` | Existing deployment; no mutation by Codex | `/`, `/api/v1/health`, `/properties` and `/vision` returned 200 in isolated probes; full Error 1102 crawl pending | Prior commit `39fb830`; local preserved baseline is `f903d60` |

No deployment has been triggered during the current recovery checkpoint.
