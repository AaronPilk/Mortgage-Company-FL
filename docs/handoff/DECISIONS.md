# Decisions

## 2026-08-17 — Isolate autonomous work from canonical `main`

- Decision: preserve `f903d60` as local branch `baseline/tract-recovery-20260817` and work in `agent/tract-autonomous-build-20260817` at a separate worktree.
- Reason: another agent may inspect the canonical checkout; the master protocol forbids concurrent edits to one working tree.
- Alternatives: edit `main` directly; create only a branch in the canonical checkout.
- Consequences: all implementation and verification occur without disturbing the clean `main` checkout; integration remains explicit.
- Owner: Codex.

## 2026-08-17 — Keep Cloudflare as the only application-hosting architecture

- Decision: treat the current Vercel deployment as a connected, protected secondary record only; do not migrate to it or configure it.
- Reason: the public application and established GitHub deployment workflow are Cloudflare-based, and the user expressly prohibited a second architecture.
- Alternatives: promote Vercel or run dual production hosts.
- Consequences: Vercel remains read-only during this recovery; all performance and stability work targets OpenNext on Cloudflare.
- Owner: Codex.

## 2026-08-17 — Do not associate the visible Supabase project with TRACT without evidence

- Decision: record the visible project as unverified and make no remote database changes.
- Reason: its name and migration state do not establish TRACT ownership, and the deployed application reports database configuration absent.
- Alternatives: link the repo by inference or apply local migrations.
- Consequences: implementation can continue against migrations and local fixtures, but live persistence cannot be claimed until project identity and configuration are proven.
- Owner: Codex.

## 2026-08-17 — User authorization supersedes the default stop-before-push convention

- Decision: after the full recovery is implemented and all integration/deployment gates are satisfied, Codex may commit, push, open/review/merge the PR and verify the established Cloudflare deployment.
- Reason: the attached autonomous request explicitly grants those actions while retaining safety constraints.
- Alternatives: stop at copy-and-paste commands.
- Consequences: no push or deployment occurs at Phase 0 setup; later release actions still require passing tests, a rollback target and a reviewed diff.
- Owner: Aaron (authorization) and Codex (execution).

## 2026-08-17 — Close Phase 0 on bounded operational evidence

- Decision: mark the current Error 1102 condition resolved and advance to Phase 1, while retaining the 50-route smoke as a mandatory gate.
- Reason: clean install, full checks, OpenNext build, dry run, startup profile, 50 local Worker requests, 50 production requests and live error-only tailing all passed. The active production version was deployed after the historical audit failure.
- Alternatives: block all product work indefinitely on unavailable historical Ray IDs or increase Worker CPU limits without evidence.
- Consequences: no limit is raised and no production setting changes. A recurrence immediately reopens Phase 0 and stops feature work.
- Owner: Codex.

## 2026-08-17 — Separate the public planning demo from the live listing provider

- Decision: expose seven explicitly synthetic property examples through a dedicated demo provider while changing the live MLS provider default to `disabled`.
- Reason: Phase 1 needs a useful no-credential loop, but fixture rows must never enter the publishable listing feed or be represented as active inventory.
- Alternatives: hide the entire workflow until MLS approval; serve fixtures through the production MLS mode.
- Consequences: every demo address, image and assumption is labeled synthetic; the database still rejects fixture publication; production readiness no longer defaults to a fixture MLS provider.
- Owner: Codex.

## 2026-08-17 — Persist anonymous Vision requests through one idempotent transaction

- Decision: add a service-role-only `create_vision_report_request` RPC keyed by a client-stable submission UUID.
- Reason: lead, consent, distinct attribution, project, scenario, report and outbox state must agree, including after an ambiguous network retry.
- Alternatives: chain client table writes; call the existing lead RPC and write Vision records afterward.
- Consequences: exact retries return the first receipt, concurrent retries serialize on that submission only, and no public role can call the function or read the request mapping.
- Owner: Codex.

## 2026-08-17 — Render fixture detail routes dynamically on OpenNext

- Decision: use dynamic server rendering for `/properties/[listingKey]` rather than `generateStaticParams` with `dynamicParams = false`.
- Reason: the Next production server served the static paths, but OpenNext preview returned 404 and `NoFallbackError` for a generated path.
- Alternatives: accept an adapter-specific 404; change the public URL shape.
- Consequences: stable URLs work on the canonical Cloudflare runtime, known keys return 200 and unknown keys return 404; the lookup remains local and bounded.
- Owner: Codex.
