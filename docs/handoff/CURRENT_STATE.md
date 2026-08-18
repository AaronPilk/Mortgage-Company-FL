# Current state

Last updated: 2026-08-18T01:01:59Z
Last agent: Codex
Current product phase: Phase 5 — account and admin completion
Last known healthy commit: `deaef698dfd120d2bd7e93a00fe2a92a6773879d`
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
- A canonical 32-entry asset manifest governs local home, property, Vision, RendProp, agent and social media with rights, source, prompt, dimensions, transformations and review state.
- The home hero now proves the property-planning product visually; property details have canonical galleries; Vision has labeled renovation, addition and land comparisons.
- RendProp now has a complete synthetic presentation plus an interactive fixture workflow for rights/privacy attestations, sample selection, room tags, deterministic queued/processing/failure/retry/review states and a stable local tour.
- The noindex sample tour carries visible original/altered labels, synthetic property/presenter attribution, room navigation, an explicit unpublished state, bounded QR attribution, a mortgage CTA and first-party inquiry paths.
- Operations/admin can identify RendProp interest and inspect consent, first/last/conversion attribution and outbox lifecycle under existing RLS; no fixture state or media path enters the lead record.
- Verification passes: 183 unit/integration tests, the expanded PostgreSQL RLS/idempotency/worker suite and 92 desktop/mobile end-to-end tests.
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
| RendProp                  | Interactive synthetic fixture demo             | Browser state machine and stable noindex local sample tour            |
| Live property search      | Disabled                                       | No executed data agreement                                            |

## Known failures and gaps

- The historical Cloudflare Error 1102 condition is operationally resolved on the current deployment. Historical logs/Ray IDs are unavailable, so its exact code path cannot be reconstructed; continued route-smoke monitoring remains required.
- The only Supabase project visible to the current CLI appears unrelated to TRACT. Remote TRACT schema, Auth, Storage and RLS cannot be asserted from it.
- The public application has no configured database, so lead persistence, accounts, admin records and saved Vision reports are not live.
- No Storage bucket migrations or Edge Functions exist locally.
- The additive Vision migration has not been applied remotely because no TRACT Supabase project identity has been proven.
- The public application still has no configured database or Turnstile production mode, so report/lead submission correctly returns unavailable rather than false success.
- RendProp production capture/upload/scanning/processing/storage/retention/deletion and real listing publication remain disabled; Phase 4 implements only the bounded local fixture workflow.
- Consumer account completion, data-backed admin completion, reviewed resource publishing and production integrations remain.
- All asset entries remain pending owner/compliance review even though agent visual QA and automated decoding/fallback checks pass.
- No remote scheduler invokes the protected outbox worker route; production activation requires a reviewed `OUTBOX_DRAIN_TOKEN` and the established Cloudflare scheduling path.
- Existing build documentation overstates completed admin and integration behavior; this handoff ledger supersedes those claims.

## Highest-priority next task

Implement Phase 5's optional consumer-auth persistence and complete data-backed admin views against local Supabase contracts, with ownership/RBAC/RLS verification and no remote Auth or database changes.
