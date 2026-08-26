# Implementation plan and checkpoint record

Build date: 2026-08-17. Executed against the TRACT Mortgage build constitution.

## Phases

| Phase | Scope                                                                    | State                                 |
| ----- | ------------------------------------------------------------------------ | ------------------------------------- |
| A     | Repository inspection, plan, dependency baseline                         | Complete                              |
| B     | Monorepo, design tokens, component library, app shell, PWA               | Complete                              |
| C     | Database migrations, roles, RLS, audit, executed policy suite            | Complete                              |
| D     | Attribution, consent, lead receipt, outbox, CRM port, analytics guard    | Complete                              |
| E     | Mortgage math package and five calculators                               | Complete                              |
| F     | Metadata, JSON-LD, sitemap, robots, route registry, content linter       | Complete                              |
| G     | Normalized property model, fixture provider, rights controls, data ports | Complete                              |
| H     | Vision contracts, AI ports, budget reservation, quota engine             | Complete — feature flagged off        |
| I     | RendProp contracts and disclosure rules                                  | Specified — feature flagged off       |
| J     | Admin RBAC, operational views, readiness board                           | Complete — views need a live database |
| K     | Headers, CSP, abuse controls, accessibility, CI                          | Complete                              |
| L     | Documentation and handoff                                                | Complete                              |

## Defects found by writing the tests

Recorded because each one would have shipped silently.

**Amortization did not terminate at zero.** A level payment rounded to whole
cents does not retire the balance exactly; the schedule ended at a 471-cent
remainder. Fixed by making the final scheduled payment absorb the remainder,
which is how a real amortization schedule works. Caught by
`payment.test.ts > reports a remaining balance that falls between the endpoints`.

**Three privileged database functions were callable by any authenticated user.**
`create_lead_with_receipt`, `reserve_ai_budget`, and `record_audit_event` were
revoked from `anon` and `authenticated`, but PostgreSQL grants `EXECUTE` on a new
function to `PUBLIC`, so the revocation did nothing. Fixed by revoking from
`PUBLIC` and granting explicitly to `service_role`. Caught by
`rls-tests.sql > consumer cannot call the budget reservation function directly`.

**Environment validation coupled build to deployment.** Production-readiness
checks lived inside `parseServerEnv`, so `next build` — which runs with
`NODE_ENV=production` — failed while prerendering an unrelated page. Split into
`parseServerEnv` for structure and `assertProductionReady` for deployment policy.
See ADR-003.

## Blocked, and why

| Item                       | Blocker                                                 | Owner                     |
| -------------------------- | ------------------------------------------------------- | ------------------------- |
| Live CRM sync              | No company GoHighLevel account credentials              | Founders                  |
| Listing search             | No MLS or aggregator data agreement                     | Founders                  |
| Secure application handoff | No POS/LOS selected                                     | Founders                  |
| AI features                | No provider accounts, no approved data map              | Founders + compliance     |
| Property data enrichment   | No provider contracts                                   | Founders                  |
| RendProp media pipeline    | No media provider contracts, no capture benchmark       | Founders                  |
| Every legal page           | Draft awaiting counsel                                  | Counsel                   |
| Licensing                  | See `docs/compliance/launch-gates.md`                   | Principal loan originator |
| Email and SMS sending      | No provider, no A2P registration, no approved templates | Compliance                |

Every blocked item has a typed interface, a disabled or fixture implementation,
tests, a feature flag, and an entry on `/admin/readiness`. None of them blocks
the mortgage core, the calculators, the lead receipt, the content foundation, or
the security shell.

## Not done, and deliberately so

- **No live rate display.** Requires an approved, timestamped, source-backed feed
  and a disclosure component. A page that shows a sample rate as though it were
  live is worse than a page that explains why it does not.
- **No published guides.** The editorial system exists; the backlog is briefs.
  Publishing thin articles to fill a resource index is the failure mode the
  content quality gate is designed to prevent.
- **City pages ship on the county bar (updated 2026-08-26).** A template with a
  city name substituted still has no local value and is not published. A city page
  that carries its own real, city-specific material — geography and flood reality,
  the questions a buyer there must research, coupled to a real parent county — does
  qualify. Such pages ship noindex and off the sitemap until a named reviewer
  verifies each city's sources (`docs/compliance/city-pages.md`). See DECISIONS.md,
  2026-08-26.
- **No blog route.** It would be an empty index. It ships with its first
  reviewed article.
