# Blocked items

What each blocked item needs, from whom, and what already exists so it can be
switched on rather than built.

## Needs a credential

**GoHighLevel** — private integration token, location id, custom field map,
pipeline map, webhook public key.
Exists: typed port, three adapters, outbox worker with retry classification and
bounded backoff, webhook verifier with replay and dedupe, admin health view.
To enable: set `GHL_MODE=production` plus the credentials.

**Cloudflare Turnstile** — site key and secret.
Exists: server-side verification that fails closed, fixture mode with both
outcomes, widget mount point on every lead form.
To enable: set `TURNSTILE_MODE=production` plus the keys.

**Supabase** — project URL, anon key, service-role key.
Exists: seven migrations, 24 tables, RLS on every one, 39 executed policy
assertions, request-scoped and service clients.
To enable: create the project, apply migrations, set the three variables.

## Needs a contract

**MLS or IDX** — a data agreement with Stellar MLS or an approved aggregator.
Exists: provider-neutral port, fixture provider, normalized property model with
source lineage, attribution and status handling, unpublish logic, a database
constraint preventing fixture publication.
To enable: implement the contracted adapter, record the display rules in
configuration, set `MLS_PROVIDER` and `FEATURE_PROPERTY_SEARCH`.

**AI providers** — accounts, an approved data map, and a retention position for
the specific models chosen.
Exists: provider port, model route registry, data-class enforcement, budget
reservation under a lock, quota policies, kill switches, usage ledger,
reconciliation state, output validation with a single repair attempt.
To enable: set `AI_MODE`, provide keys, populate model routes, set quota policies
and budgets.

**Property data** — ATTOM, Regrid, Shovels, AirDNA, RSMeans.
Exists: one port per data kind, provenance wrapper that refuses a value with no
stated limitations, fixture implementations for every port.

**POS or LOS** — vendor selection and evaluation.
Exists: `/apply` explains the boundary and refuses to collect anything while
unconfigured; `SECURE_APPLICATION_URL` is the single switch.
This is the highest-leverage business decision on the list.

## Needs a human

**Every legal page** — counsel review. All eight ship as drafts, labelled as such
on the page itself, and the content linter fails if a label is removed.

**Licensing** — see `docs/compliance/launch-gates.md`. Nothing in code can close
these.

**Information security program and Qualified Individual** — required before real
borrower information enters any system.

**Advertising review process** — required before any paid campaign.

**Email and SMS** — provider selection, A2P 10DLC registration, approved
templates, quiet hours, and workflow review.

## Engineering follow-ups

**CSP nonce.** `unsafe-inline` for scripts is a documented Next.js exception. A
nonce-based policy is the follow-up.

**Shared-store rate limiting.** The in-process store is correct for one instance.
A KV or Durable Object store is required before horizontal scale; the interface
is already abstracted.

**Outbox worker deployment.** `processOutboxRow` is implemented and tested. It
needs a scheduled trigger — a Cloudflare Queue consumer or a cron Worker — which
requires a provisioned binding.

**Accessibility audit.** Contrast is proven by test and keyboard paths are
covered by end-to-end tests. A full axe run against every template, and measured
Lighthouse numbers, should be recorded rather than claimed.
