# Current state

Last updated: 2026-08-17T22:40:06Z  
Last agent: Codex  
Current product phase: Phase 1 — property-to-Vision vertical slice  
Last known healthy commit: `f903d60b948d8c6f93f66ade7f682ce6edb0dfec`  
Current branch: `agent/tract-autonomous-build-20260817`  
Public Cloudflare URL: `https://mortgage-company-fl.aaron-9c3.workers.dev`

## Working features confirmed

- Next.js 16 / OpenNext application deployed as the existing Cloudflare Worker.
- Mortgage marketing shell, program pages, five calculators, contact and legal routes.
- Seven local Supabase migrations defining 24 public tables, RLS on all 24, 37 policies and eight public functions.
- Local contracts for leads, consent, attribution, outbox, properties, Vision, AI usage, content and audit events.
- Fixture property adapter with five records; live property search remains disabled.
- Verification passes: 165 unit/integration tests, 39 RLS assertions and 54 desktop/mobile end-to-end tests.
- A repository-owned 50-request Worker smoke command exercises the complete route registry and explicitly detects Cloudflare Error 1102 pages.
- Phase 0 is complete. The current local Worker artifact and public deployment each survived the 50-request crawl with zero failures.

## Integration modes observed

| Integration                       | Observed mode                                  | Evidence                                                              |
| --------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| Cloudflare                        | Production host for the public application     | Public Worker responses and committed Wrangler/OpenNext configuration |
| Vercel                            | Connected production deployment, SSO protected | GitHub deployment record; not the public architecture                 |
| Supabase                          | Unconfigured in the deployed application       | Public health response; no TRACT project identity established         |
| Listings                          | Fixture                                        | Public health response and source adapter                             |
| CRM, AI, Turnstile, email         | Disabled                                       | Public health response and environment schema                         |
| Accounts                          | Feature flag enabled, no complete auth flow    | Source audit                                                          |
| Vision, RendProp, property search | Disabled or placeholder                        | Public health response and source audit                               |

## Known failures and gaps

- The historical Cloudflare Error 1102 condition is operationally resolved on the current deployment. Historical logs/Ray IDs are unavailable, so its exact code path cannot be reconstructed; continued route-smoke monitoring remains required.
- The only Supabase project visible to the current CLI appears unrelated to TRACT. Remote TRACT schema, Auth, Storage and RLS cannot be asserted from it.
- The public application has no configured database, so lead persistence, accounts, admin records and saved Vision reports are not live.
- No Storage bucket migrations or Edge Functions exist locally.
- Property detail, complete Vision workflow, report gate, RendProp workflow and data-backed admin views are missing.
- Existing build documentation overstates completed admin and integration behavior; this handoff ledger supersedes those claims.

## Highest-priority next task

Build Phase 1's complete fixture-backed property → Vision assumptions → deterministic scenario → report preview → lead gate → durable persistence/outbox → admin-record vertical slice without MLS credentials or paid AI.
