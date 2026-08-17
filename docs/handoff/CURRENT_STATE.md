# Current state

Last updated: 2026-08-17T23:45:00Z
Last agent: Codex
Current product phase: Phase 3 — images and product presentation
Last known healthy commit: `3b78e635edc40d5f43e6049fb605414604c934b2`
Current branch: `agent/tract-autonomous-build-20260817`
Public Cloudflare URL: `https://mortgage-company-fl.aaron-9c3.workers.dev`

## Working features confirmed

- Next.js 16 / OpenNext application deployed as the existing Cloudflare Worker.
- Mortgage marketing shell, program pages, five calculators, contact and legal routes.
- Ten local Supabase migrations defining 27 public tables, RLS on all 27 and service-role-only idempotent lead, Vision and outbox-worker functions.
- Local contracts for leads, consent, attribution, outbox, properties, Vision, AI usage, content and audit events.
- Fixture property adapter with seven visibly distinct synthetic Florida examples; live property search remains disabled.
- Stable property detail routes feed a no-account TRACT Vision workspace with editable assumptions, versioned deterministic calculations, three scenario cases, payment sensitivity and a pre-contact preview.
- The optional Vision gate atomically persists a lead, consent, first/last/conversion attribution, assumptions, scenario, draft report and CRM-compatible outbox event when Supabase is configured. Exact retries return the original receipt.
- Authenticated operations/admin users can observe the lead/project/report lifecycle; unauthenticated access remains closed.
- A five-step mortgage planner returns a deterministic range before contact collection and can save locally without transmitting data.
- Every calculator now has precise numeric controls plus local save, optional send/review, compare, talk and property actions.
- General lead submission persists a bounded first-party planning snapshot, separate first/last/conversion attribution, consent and one CRM event under a client-stable exact-retry identifier.
- The database outbox supports locked claims, bounded retry/dead outcomes and lead status projection; the fixture CRM proves replay suppression.
- Turnstile live mode now requires a site key, secret, expected hostnames and action validation; visible retries reset the single-use token.
- Operations/admin views show masked lead lifecycle, consent state, attribution kinds, plan summary and outbox status without rendering raw financial inputs or secret values.
- Verification passes: 177 unit/integration tests, the expanded PostgreSQL RLS/idempotency/worker suite and 76 desktop/mobile end-to-end tests.
- A repository-owned 50-request Worker smoke command exercises the complete route registry and explicitly detects Cloudflare Error 1102 pages.
- Phase 0 is complete. The current local Worker artifact and public deployment each survived the 50-request crawl with zero failures.

## Integration modes observed

| Integration               | Observed mode                                  | Evidence                                                              |
| ------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| Cloudflare                | Production host for the public application     | Public Worker responses and committed Wrangler/OpenNext configuration |
| Vercel                    | Connected production deployment, SSO protected | GitHub deployment record; not the public architecture                 |
| Supabase                  | Unconfigured in the deployed application       | Public health response; no TRACT project identity established         |
| Listings                  | Live provider disabled; explicit demo fixtures | Source adapter and production-safe environment default                |
| CRM, AI, Turnstile, email | Disabled                                       | Public health response and environment schema                         |
| Accounts                  | Feature flag enabled, no complete auth flow    | Source audit                                                          |
| Vision                    | Deterministic demo active; persistence gated   | Property/Vision browser loop and local database verification          |
| RendProp                  | Placeholder                                    | Source audit                                                          |
| Live property search      | Disabled                                       | No executed data agreement                                            |

## Known failures and gaps

- The historical Cloudflare Error 1102 condition is operationally resolved on the current deployment. Historical logs/Ray IDs are unavailable, so its exact code path cannot be reconstructed; continued route-smoke monitoring remains required.
- The only Supabase project visible to the current CLI appears unrelated to TRACT. Remote TRACT schema, Auth, Storage and RLS cannot be asserted from it.
- The public application has no configured database, so lead persistence, accounts, admin records and saved Vision reports are not live.
- No Storage bucket migrations or Edge Functions exist locally.
- The additive Vision migration has not been applied remotely because no TRACT Supabase project identity has been proven.
- The public application still has no configured database or Turnstile production mode, so report/lead submission correctly returns unavailable rather than false success.
- RendProp workflow, consumer account completion, reviewed resource publishing, the remaining image manifest and production integrations remain.
- No remote scheduler invokes the protected outbox worker route; production activation requires a reviewed `OUTBOX_DRAIN_TOKEN` and the established Cloudflare scheduling path.
- Existing build documentation overstates completed admin and integration behavior; this handoff ledger supersedes those claims.

## Highest-priority next task

Build Phase 3's reviewed asset manifest, hero product proof, property galleries, Vision pairs, RendProp fixtures and responsive image verification.
