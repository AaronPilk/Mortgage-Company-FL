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

## 2026-08-17 — Key generic lead retries by browser submission UUID

- Decision: persist a service-only submission-to-lead receipt and serialize exact retries with a transaction-scoped advisory lock.
- Reason: a server request ID changes when a browser repeats an ambiguous request and therefore cannot prevent duplicate leads, consent records or CRM events.
- Alternatives: deduplicate all matching contacts; rely only on the outbox unique key.
- Consequences: an unchanged form retry returns the original receipt, while changed contact or consent inputs receive a new submission UUID; intentional later inquiries remain distinct.
- Owner: Codex.

## 2026-08-17 — Keep planning detail first-party and CRM summaries server-owned

- Decision: store bounded scalar input/result snapshots in `lead_plans`, but construct the CRM planning summary on the server from an allow-listed result field.
- Reason: income, debt, credit bands and arbitrary visitor text must not enter general analytics or the marketing CRM.
- Alternatives: send the complete calculator snapshot; omit all planning context.
- Consequences: operations can trace the submitted scenario under RLS, while GoHighLevel receives only the tool name and one bounded planning result.
- Owner: Codex.

## 2026-08-17 — Drain CRM events through locked service-only outbox functions

- Decision: add `SKIP LOCKED` claim and owner-matched completion functions plus a token-protected internal route.
- Reason: the existing row processor had no safe database claim/complete boundary and therefore was not an executable worker path.
- Alternatives: send to CRM inside the lead request; let a browser update outbox rows.
- Consequences: concurrent workers cannot claim one row twice, provider failures become bounded retries/dead letters and the consumer still waits only on the first-party transaction. Scheduling remains unconfigured until production infrastructure is identified.
- Owner: Codex.

## 2026-08-17 — Validate Turnstile action and deployment hostname

- Decision: load the widget only when a public site key exists, assign stable `lead` and `vision_report` actions, validate both action and hostname at Siteverify and reset the single-use token after a visible failure.
- Reason: checking `success` alone does not bind a token to the intended surface or deployment, and replaying a redeemed token cannot support a form retry.
- Alternatives: accept any successful widget token; create a new remote widget during recovery.
- Consequences: live mode now requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` and deployment-specific `TURNSTILE_HOSTNAMES`; no widget or credential was created or changed.
- Owner: Codex.

## 2026-08-17 — Keep one canonical, provenance-tracked media tree

- Decision: consolidate all public product media under `public/images` families governed by one 32-entry manifest, and remove the duplicate `property-demos` runtime tree.
- Reason: every displayed fixture needs one rights/provenance record and a stable optimized delivery path; scattered copies make review and withdrawal unreliable.
- Alternatives: retain JPEG duplicates; reference generation originals directly; use remote stock or listing media.
- Consequences: property adapters now reference canonical WebP assets, social metadata uses local 1200-by-630 images and previous duplicate files remain recoverable from Git history.
- Owner: Codex.

## 2026-08-17 — Keep transformation truth in HTML and source geometry visible

- Decision: use reference-guided generated pairs for Vision and RendProp, place all original/concept/cleanup/staging/enhancement labels in HTML, and render the mortgage dashboard from the actual local UI.
- Reason: generated text is unreliable, an unlabeled visualization can be mistaken for property condition and a generic dashboard illustration would not prove the product works.
- Alternatives: bake labels into pixels; use unrelated before/after images; generate an imaginary interface.
- Consequences: comparison media keeps materially matched viewpoints and permanent context, the kitchen retains its visible scuff, the floor plan carries an explicit non-measurement boundary and every asset remains pending owner/compliance approval.
- Owner: Codex.
