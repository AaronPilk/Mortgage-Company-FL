# Current state

Last updated: 2026-08-17T23:16:35Z
Last agent: Codex
Current product phase: Phase 2 — conversion engine
Last known healthy commit: `bfd91a5f413219b8c3b38e93c8976e1003e05b94`
Current branch: `agent/tract-autonomous-build-20260817`
Public Cloudflare URL: `https://mortgage-company-fl.aaron-9c3.workers.dev`

## Working features confirmed

- Next.js 16 / OpenNext application deployed as the existing Cloudflare Worker.
- Mortgage marketing shell, program pages, five calculators, contact and legal routes.
- Eight local Supabase migrations defining 25 public tables, RLS on all 25 and a service-role-only idempotent Vision request function.
- Local contracts for leads, consent, attribution, outbox, properties, Vision, AI usage, content and audit events.
- Fixture property adapter with seven visibly distinct synthetic Florida examples; live property search remains disabled.
- Stable property detail routes feed a no-account TRACT Vision workspace with editable assumptions, versioned deterministic calculations, three scenario cases, payment sensitivity and a pre-contact preview.
- The optional Vision gate atomically persists a lead, consent, first/last/conversion attribution, assumptions, scenario, draft report and CRM-compatible outbox event when Supabase is configured. Exact retries return the original receipt.
- Authenticated operations/admin users can observe the lead/project/report lifecycle; unauthenticated access remains closed.
- Verification passes: 172 unit/integration tests, the expanded PostgreSQL RLS/idempotency suite and 64 desktop/mobile end-to-end tests.
- A repository-owned 50-request Worker smoke command exercises the complete route registry and explicitly detects Cloudflare Error 1102 pages.
- Phase 0 is complete. The current local Worker artifact and public deployment each survived the 50-request crawl with zero failures.

## Integration modes observed

| Integration                       | Observed mode                                  | Evidence                                                              |
| --------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| Cloudflare                        | Production host for the public application     | Public Worker responses and committed Wrangler/OpenNext configuration |
| Vercel                            | Connected production deployment, SSO protected | GitHub deployment record; not the public architecture                 |
| Supabase                          | Unconfigured in the deployed application       | Public health response; no TRACT project identity established         |
| Listings                          | Live provider disabled; explicit demo fixtures | Source adapter and production-safe environment default                |
| CRM, AI, Turnstile, email         | Disabled                                       | Public health response and environment schema                         |
| Accounts                          | Feature flag enabled, no complete auth flow    | Source audit                                                          |
| Vision                            | Deterministic demo active; persistence gated    | Property/Vision browser loop and local database verification          |
| RendProp                          | Placeholder                                    | Source audit                                                          |
| Live property search             | Disabled                                       | No executed data agreement                                            |

## Known failures and gaps

- The historical Cloudflare Error 1102 condition is operationally resolved on the current deployment. Historical logs/Ray IDs are unavailable, so its exact code path cannot be reconstructed; continued route-smoke monitoring remains required.
- The only Supabase project visible to the current CLI appears unrelated to TRACT. Remote TRACT schema, Auth, Storage and RLS cannot be asserted from it.
- The public application has no configured database, so lead persistence, accounts, admin records and saved Vision reports are not live.
- No Storage bucket migrations or Edge Functions exist locally.
- The additive Vision migration has not been applied remotely because no TRACT Supabase project identity has been proven.
- The public application still has no configured database or Turnstile production mode, so report/lead submission correctly returns unavailable rather than false success.
- Mortgage planner/save-send, RendProp workflow, consumer account completion, reviewed resource publishing and production integrations remain.
- Existing build documentation overstates completed admin and integration behavior; this handoff ledger supersedes those claims.

## Highest-priority next task

Build Phase 2's mortgage planner and traceable conversion loop, then verify exact retry behavior and fixture CRM projection without weakening the production readiness gates.
