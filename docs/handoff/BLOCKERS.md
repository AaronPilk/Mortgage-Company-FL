# Blockers

**As of 2026-08-18.** Local implementation gates are green. The blockers below
are external configuration, authority, vendor or regulatory gates; none permits
weakening a test or inventing a production claim.

## 1. Vercel is an active public duplicate

| Field           | Value                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Status          | Active topology blocker; owner explicitly waived it for the combined Git push, not as a canonical-host decision                        |
| Evidence        | One Vercel project with public production aliases; latest verified build is GitHub `main` at `e641019`                                 |
| Risk            | A push to `main` automatically publishes Vercel while Cloudflare remains canonical, creating two public runtimes for a regulated site  |
| Smallest action | Disable the Vercel Git production deployment or make the Vercel aliases non-public, then verify Cloudflare is the sole production host |
| Owner           | Vercel/GitHub account owner                                                                                                            |

Do not migrate TRACT to Vercel and do not create another deployment architecture.
The current Vercel page points its canonical tag to Cloudflare, but canonical
metadata does not make a publicly served duplicate disappear.

## 2. No proven or migrated TRACT Supabase project

| Field           | Value                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status          | Blocks durable production leads, Vision reports, accounts, admin state and outbox delivery                                                         |
| Evidence        | Connector-visible candidate is healthy but has zero repository migrations, public tables, policies, buckets, objects, Edge Functions or Auth users |
| Smallest action | Owner confirms the candidate project is TRACT and explicitly approves the reviewed 14-migration additive plan                                      |
| Owner           | Supabase project owner plus engineering reviewer                                                                                                   |

The candidate also has two security-advisor warnings on the default
`rls_auto_enable` helper. Those must be reviewed before treating the project as a
production boundary. No migration, Auth setting, RLS policy or data was changed.

## 3. Production preflight is red

The current local environment reports four blocking names:

- `HASH_PEPPER`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_MODE`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Provision values only through approved Cloudflare secret/public-variable paths.
Do not put values in source, docs, chat or Vercel. Re-run preflight before any
combined Cloudflare deploy.

## 4. Licensing and legal launch facts are incomplete

`businessIdentity.nmlsId` and `companyLicenseId` remain null. The application
shows a pending state and never renders a plausible placeholder. Until every
licensing gate in `docs/compliance/launch-gates.md` is cleared, do not accept an
application, pull credit, quote or negotiate a rate/term, or issue a
prequalification/preapproval.

Owner: principal loan originator with counsel/compliance.

## 5. No contracted MLS/display provider

The marketplace is a labelled synthetic demonstration. Nineteen invented records
exist; one closed record is excluded from the 18 displayable samples. Routes stay
noindex and fixture detail pages emit no listing JSON-LD.

Real listings require a data and display agreement, provider credentials,
required attribution, a contracted adapter and field-by-field display review.
Never publish fixture data as live MLS content.

## 6. CRM delivery has no credentials or scheduler

First-party lead/outbox code is complete locally, but GoHighLevel is disabled.
Real delivery requires reviewed credentials/maps plus a Cloudflare Queue or cron
trigger for the protected drain route. Credential provisioning alone does not
drain the outbox.

Relevant names only: `GHL_MODE`, `GHL_PRIVATE_INTEGRATION_TOKEN`,
`GHL_LOCATION_ID`, `GHL_CUSTOM_FIELD_MAP`, `GHL_PIPELINE_MAP`,
`GHL_WEBHOOK_PUBLIC_KEY`, `OUTBOX_DRAIN_TOKEN`.

## 7. Provider and operational decisions

| Item             | What remains                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| POS/LOS          | Select and approve the secure application system; `SECURE_APPLICATION_URL` is unset                                        |
| AI/media         | Approve provider, data map, retention and cost policy before enabling RendProp transformations or Vision narrative/imagery |
| Email            | Select/configure transactional delivery and reviewed templates                                                             |
| Storage          | Define buckets, object policies, upload scanning, retention and deletion before production media upload                    |
| Privacy requests | Define identity confirmation, retention exceptions, export/deletion execution and completion audit process                 |

The deterministic Vision arithmetic is not blocked by AI. Public calculators,
planner, synthetic marketplace, Vision preview and RendProp illustration all work
without paid providers.

## Engineering follow-ups, not release authority

- Replace per-instance rate limiting with a shared store before scale.
- Design a nonce-based CSP to remove the documented inline-script exception.
- Expand audit-event emission around privileged operational actions.
- Run and record a full accessibility audit and measured Lighthouse pass.
- Complete reviewed content, SEO/AEO, feed/schema and analytics work in Phase 6.
