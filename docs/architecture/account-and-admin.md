# Account and admin architecture

Last verified: 2026-08-18

## Account boundary

Accounts are optional persistence, not a gate in front of public product value. Anonymous visitors can run every calculator, inspect synthetic properties, use the deterministic Vision preview and try the RendProp fixture. A signed-in user adds cross-device saved records only.

Supabase Auth owns email-link verification and the session cookie. The application owns a bounded callback redirect restricted to account paths, same-origin mutation checks and explicit unavailable/error states. Remote Auth settings and redirect allow-lists are infrastructure configuration, not source defaults.

The Auth-user trigger creates one profile plus the baseline consumer role. Additional staff roles are additive; they never replace the consumer identity. Request-scoped Supabase clients carry the session and remain under RLS.

## Owned records

| Record                            | Ownership and mutation rule                                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Saved properties                  | Owner may select, insert and delete; listing identifiers and fixture/live source are bounded and revalidated by the application.         |
| Saved calculator scenarios        | Owner may select, insert and delete; the existing scalar-only PlanningSnapshot schema forbids sensitive application fields.              |
| Notification preferences          | Owner may select, insert and update their two report-lifecycle email choices.                                                            |
| Privacy requests                  | Owner may select and create received requests; only authorized staff may read lifecycle state. Consumer completion updates do not exist. |
| Vision projects/scenarios/reports | Existing project ownership policies constrain all downstream reads.                                                                      |
| AI jobs                           | Existing owner policy exposes status metadata only; provider payloads and request identifiers are not rendered.                          |

Scenario identifiers and privacy-request identifiers are generated in the browser and retained across ambiguous retries. Duplicate scenario inserts return the existing owner-visible record. The privacy RPC serializes a request identifier and returns the original received lifecycle row; a changed retry cannot rewrite its request type.

## Staff matrix

Application authorization and PostgreSQL RLS are both required. The application avoids attempting a disallowed query; RLS remains the database backstop.

| Surface                               | Roles                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Leads                                 | Loan officer, operations, admin, subject to the detailed lead/consent policies                                          |
| Vision and AI jobs                    | Operations and admin; owners retain their own record visibility                                                         |
| Usage, quota and kill-switch overview | Admin application view; database policies retain their narrower staff contracts                                         |
| Content and source completeness       | Content editor, compliance reviewer and admin through the application matrix; staff source reads remain RLS constrained |
| Privacy request lifecycle             | Compliance reviewer, operations and admin                                                                               |
| Audit history                         | Compliance reviewer and admin                                                                                           |
| Integration configuration names       | Admin                                                                                                                   |

Lead list contacts remain masked. Account views do not expose another user identifier, contacts, provider payload, signed URL, secret, input manifest or audit before/after snapshot.

## Privacy lifecycle

Export and deletion entry points create tracked requests with received, in_progress, completed or rejected status. The UI explicitly distinguishes receipt from completion. There is no destructive deletion executor or generated export in this phase.

## Configuration names

Browser-safe Auth identifiers: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Canonical callback generation also depends on NEXT_PUBLIC_SITE_URL. Account availability is controlled by FEATURE_ACCOUNTS.

SUPABASE_SERVICE_ROLE_KEY remains server-only and is not used by ordinary account reads or writes. No configuration value belongs in source, docs, chat or an admin view.

## Deployment boundary

The account migrations are local and additive. They have not been applied to any
remote project because the visible Supabase candidate has not been proven to
belong to TRACT. Cloudflare remains the intended canonical architecture. Vercel
is outside the approved release path but is currently serving a public Git-backed
duplicate; that external configuration must be resolved before another push or
deployment.
