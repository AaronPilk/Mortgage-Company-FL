# Current state

**As of 2026-08-18.** This describes the verified integration branch
`agent/tract-integrated-recovery-20260818`. It is not a statement that the branch
is deployed.

## Repository and hosting

| Fact                          | Current evidence                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| Canonical repository          | `https://github.com/AaronPilk/Mortgage-Company-FL`                                          |
| Default / production branch   | `main`                                                                                      |
| Integration base              | `origin/main` at `7998ede`                                                                  |
| Intended canonical host       | Cloudflare Workers through `@opennextjs/cloudflare`                                         |
| Worker                        | `mortgage-company-fl`                                                                       |
| Canonical origin              | `https://mortgage-company-fl.aaron-9c3.workers.dev`                                         |
| Cloudflare deploy             | Manual: `pnpm cf:build && pnpm cf:deploy`                                                   |
| Latest visible Worker version | `a8691060-83c5-473c-8858-cd20b81300ab`, created 2026-08-18 01:38 UTC                        |
| Vercel                        | Public duplicate production target; not canonical and not approved as a second architecture |
| Supabase                      | Healthy but empty candidate project; not proven or migrated                                 |

The Cloudflare Worker is publicly healthy and the intended canonical origin.
Four Worker deployments are visible. The current version exposes only the static
asset binding and the non-secret brand variable; no Worker secrets are listed.
Its public feature routes and health endpoint return HTTP 200.

Vercel team `TRACT Mortgage` contains one Next.js project,
`mortgage-company-fl-web`. It has three ready deployments, all targeted as
`production`, sourced from GitHub `main`. The latest maps to `7998ede` and has
public `vercel.app` aliases. Its canonical tag points back to the Cloudflare
origin, but it is still a second publicly reachable runtime. This must be
resolved before another push to `main`.

## Application shape

Next.js 16.3.1 and React 19 in a pnpm/Turborepo monorepo:

- 46 page files;
- 53 deliberate route-registry entries;
- 10 API route files;
- 57 generated pages/routes in the production build;
- 12 workspace packages plus the web application.

The route registry in `apps/web/content/routes.ts` drives indexation and the
sitemap. Property samples, Vision workspace, RendProp demo/tour, account and
admin surfaces are explicitly noindex where applicable.

### Primary public product flows

- Mortgage program hub and 16 high-intent program routes.
- Ten deterministic calculators with optional save/send/review actions.
- Progressive planner at `/plan`, with value before contact capture.
- Labelled 19-record synthetic property corpus with 18 publicly displayable
  records when all three fixture switches are deliberately enabled.
- Deterministic TRACT Vision workspace at `/vision/start`.
- RendProp illustrative workflow at `/rendprop/demo` and a labelled noindex
  sample tour.
- Optional account persistence and read-only staff administration.

All public calculators and fixture demonstrations remain useful without an
account or paid provider. `/apply` fails closed while no approved POS/LOS URL is
configured.

### API surface

| Route                                 | Purpose                                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /api/v1/health`                  | Bounded configuration/health status without credentials                                         |
| `POST /api/v1/leads`                  | Exact-retry marketing lead, consent, attribution, optional planning snapshot and outbox receipt |
| `POST /api/v1/vision/report-requests` | Server-recomputed deterministic Vision report lifecycle                                         |
| `GET /api/v1/properties/search`       | Provider-neutral listing search with sample-data metadata                                       |
| `POST /api/v1/account/*`              | Owner-scoped saved records, preferences and privacy request receipts                            |
| `POST /api/v1/internal/outbox/drain`  | Token-protected bounded outbox worker entry point                                               |
| `POST /api/v1/webhooks/ghl`           | Signature/replay/dedupe-protected CRM webhook                                                   |

Mutation routes enforce same-origin or explicit authentication boundaries, body
limits, schema validation, no-store responses and noindex headers. Unconfigured
durable storage returns an error; it never presents a false success receipt.

## Local Supabase/Postgres contract

Fourteen additive migrations define 38 public tables, 59 named RLS policies and
19 current public function names. Every public table has RLS enabled. The full
chain applies to disposable PostgreSQL 17 and passes 165 ownership, privilege,
idempotency and transaction assertions.

| Recovery area                 | Local implementation                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Leads / consent / attribution | `leads`, append-oriented consent receipts, suppressions, first/last/conversion touches, exact submission mappings and bounded planning snapshots |
| Outbox                        | Locked claim/completion RPCs, retry/dead handling, webhook receipts and protected drain route                                                    |
| Properties                    | Entities, provider records and fact lineage; fixtures remain code-owned synthetic samples and cannot be published as live listings               |
| Vision                        | Projects, structured assumption provenance, deterministic scenarios, versioned reports and anonymous exact-retry request mapping                 |
| AI / usage                    | Jobs, quota policies, kill switches, reservation RPC and append-oriented usage ledger                                                            |
| Content                       | Items, sources, revisions and link opportunities with staff/source visibility boundaries                                                         |
| Audit                         | Immutable audit events and service-only recorder; application emission remains limited                                                           |
| Accounts                      | Auth profile/consumer trigger, saved properties/scenarios, preferences and tracked privacy requests                                              |
| RendProp                      | Project/media/job/output/tour/inquiry state model with disclosure and lineage constraints                                                        |

The Vision report route accepts only bounded model inputs. It recomputes the
result server-side and stores user-selected versus company-default assumptions
with distinct provenance. It does not trust or persist client-authored financial
figures.

## Remote Supabase inventory

One connector-visible project exists:

- name: `AaronPilk's Project`;
- region: `us-east-2`;
- status: active and healthy;
- PostgreSQL: 17.6.1;
- created: 2026-08-17.

It is a candidate, not a proven TRACT project. Current remote structure:

- zero repository migrations;
- zero public application tables, policies or table triggers;
- zero application Edge Functions;
- zero Storage buckets and objects;
- zero Auth users and no SSO/SAML identities;
- one public `SECURITY DEFINER` event-trigger function, `rls_auto_enable`;
- two security-advisor warnings because `anon` and `authenticated` have execute
  grants on that helper;
- no performance-advisor findings.

The connector does not expose the hosted Auth provider/redirect configuration,
so magic-link settings, allowed redirect URLs and SMTP delivery remain
unverified. No remote query read application row data, and no remote setting or
schema was changed.

## Integration modes

| Integration | Implemented state                                         | Deployed evidence                             |
| ----------- | --------------------------------------------------------- | --------------------------------------------- |
| Supabase    | Clients, schema and Auth/account flows written            | Health reports database unconfigured          |
| GoHighLevel | Disabled, fixture and production adapters plus outbox     | Disabled; no scheduler or credentials proven  |
| Listings    | Disabled and labelled fixture adapters                    | Fixture mode reported; public search flag off |
| AI          | Disabled and deterministic fixture ports; budget controls | Disabled; no paid call path active            |
| Turnstile   | Disabled/fixture/sandbox/production validation            | Disabled; production preflight blocks         |
| Email       | Configuration contract only                               | Disabled                                      |
| POS/LOS     | Secure handoff URL contract                               | Unconfigured; `/apply` refuses intake         |

## What is missing or unused

- A proven and migrated TRACT Supabase project.
- Live Auth provider/redirect/email configuration.
- Storage buckets/object policies and a production media-retention contract.
- A remote outbox scheduler and real CRM configuration.
- Contracted MLS/display rights and an approved live adapter.
- Production AI/media providers and retention/cost approvals.
- Broad audit-event emission and operational privacy-request execution.
- Licensing facts and an approved POS/LOS handoff.
- Resolution of the public Vercel duplicate deployment.

## Deployment boundary

The integration is not production-ready despite green local gates.
`pnpm deploy:preflight` currently refuses on `HASH_PEPPER`,
`SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_MODE` and
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Values were not inspected or recorded.

Do not push/merge while Vercel auto-deploys `main` to a public production target.
Do not apply the 14 migrations until the Supabase project identity and migration
authority are explicit. Do not run the manual Cloudflare deploy until all release
gates pass.
