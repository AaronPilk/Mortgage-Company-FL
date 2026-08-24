# TRACT Loan-Origination System — Architecture & Phase 0

Status: proposed (24 Aug 2026). This is the plan for building TRACT — the
authenticated loan-origination system (borrower application, document intake,
loan-status tracking, loan-officer workspace) that this repo's constitution has
always assumed would be a separate "approved POS/LOS."

## 1. What we're building, and the naming

- **Wholesale Mortgage Lending (WML)** is the company and the public marketing
  site — lead generation only. It stays exactly as it is: no SSN, no income
  documents, no uploads (invariant #2 holds for the public site, unchanged).
- **TRACT** is the software: the authenticated system behind the login where a
  loan actually happens. Model: Quicken Loans is the company, Rocket Mortgage is
  the software — WML is the company, TRACT is the software.

TRACT is the *experience and orchestration* layer. It owns intake, the borrower
portal, and the loan-officer workspace. It does **not** replace the regulated
engines (credit pull, AUS findings, pricing, disclosures) — it integrates them
as they come online (see §5).

## 2. The security boundary (the crux)

Application-grade PII has no permitted home on the current platform by written
policy. TRACT changes that deliberately, in an isolated compartment — it does
not loosen the marketing site's rules.

**Decision (default, pending Dan's compliance read): an isolated `loan` Postgres
schema inside the existing Supabase project.**
- The `loan` schema is **not** added to `config.toml` `api.schemas`, so it is
  never exposed on the public PostgREST/REST surface.
- It is reached only through `security definer` RPCs called by authenticated
  TRACT server routes (the `createServiceClient` path), never by the browser.
- Its own RLS is keyed to the borrower (`auth.uid()`) and the assigned
  `loan_officer` (the role already exists in `public.app_role`).
- Document **contents** live in encrypted object storage; only metadata
  (storage key, type, upload status) is in the database.
- An append-only `loan.access_log` records every staff read/write of a file.

Why this and not a fully separate Supabase project: it reuses the existing
Supabase Auth (borrowers already have WML accounts; the `loan_officer` role
exists), ships fastest, and is a strong posture for the broker phase — with a
clean migration path to a separate project when we reach correspondent scale and
hold loans/data longer. **If Dan wants full physical separation now** (a distinct
project/datastore), we do that instead; it is heavier (a second project and
cross-project identity linking) and I'd otherwise defer it. Default is the
isolated schema unless he says otherwise.

This boundary change is recorded in `docs/architecture/decisions.md` and the
`docs/security/data-classification.md` matrix and invariant #2 get an explicit
carve-out: *application/restricted data is permitted only inside the `loan`
compartment, never in `public`, the CRM, git, email, or any public web form.*

## 3. Data model (Phase 0)

All in schema `loan`, all RLS-on, all default grants revoked, all functions'
EXECUTE revoked from `anon`/`authenticated` (invariant #5), all covered in
`scripts/rls-tests.sql` in the same change (invariant #4).

- `loan.loan_files` — one row per loan. `borrower_user_id`, `loan_officer_user_id`
  (nullable until assigned), `purpose` (purchase | refinance | heloc | …),
  `stage` (intake | pre_approval | processing | underwriting | conditions |
  final_approval | withdrawn | denied), high-level **banded** summary only (price
  band, loan-amount band) — no raw figures here.
- `loan.loan_stage_events` — append-only stage history (who moved it, when).
- `loan.loan_conditions` — underwriting/pre-app conditions: label, description,
  status (open | submitted | cleared), the borrower-visible flag.
- `loan.loan_documents` — metadata only: `storage_key`, `doc_type` (w2 | paystub
  | bank_statement | id | other), `upload_status` (pending | uploaded | verified
  | rejected), `byte_size`, `content_type`. Contents never touch the DB or the
  Worker — browser uploads direct to storage via a server-minted signed URL
  (the exact RendProp upload shape).
- `loan.access_log` — append-only audit of staff access.

**Deferred to the integration phase (not Phase 0):** the raw 1003 financial
detail (exact income, SSN, DOB, account numbers). Those are only needed when we
pull credit / submit to AUS, they demand column-level encryption (pgsodium /
Supabase Vault), and they should land coupled to that integration — not sitting
in a table months early. Phase 0's intake collects the *structured, banded*
pre-application (the same band approach the planner already uses), which is all a
broker needs to pre-qualify and hand to a wholesale lender.

## 4. Phase 0 scope — what ships, in order

1. **Migration 1 — the `loan` compartment + backbone** (files, stage events,
   conditions, documents, access log) with RLS, revoked grants, service-role
   RPCs, and rls-tests. *(Drafted now — see the delivered migration.)*
2. **`FEATURE_TRACT` flag** + env wiring, so the whole surface is dark until we
   turn it on.
3. **Borrower portal** — the color-coded stage tracker, conditions list, and
   document upload (signed-URL storage). This is the piece that wows clients.
4. **Intake engine** — the pre-application wizard with Dan's detective
   question-tree (income type, employment, self-employed/1099, overtime/bonus
   history…). Logic *guides which questions to ask*; it never decides approval.
5. **Loan-officer workspace** — a `loan_officer`-gated section (the existing
   admin-layout pattern): pipeline, per-file view, condition management, notes,
   and pushing marketing context to GoHighLevel.
6. **Document storage** — provision the bucket (R2 or Supabase Storage) and the
   signing adapter behind a port (none exists today).

## 5. What TRACT integrates later (not now), matching Dan's broker→correspondent path

- **Broker phase (now):** real loans are submitted through your wholesale
  lenders' portals; TRACT is intake + portal + workspace around that.
- **Broker + integrations:** credit pull (tri-merge via a reseller, credentialed
  + encrypted), pricing (a PPE or lender rate sheets), e-sign disclosures.
- **Correspondent phase (Dan's couple-year vision):** your own AUS findings
  (Fannie DU / Freddie LPA), your own pricing engine wiring investor rate sheets,
  selling each loan to the best-paying investor.

Each is a port → disabled → fixture → real adapter (the repo's integration
convention), gated by a mode flag that requires its credential when live.

## 6. Compliance guardrails (non-negotiable)

- **ECOA / Reg B:** no AI or automated logic ever makes or influences an approval
  decision. TRACT's logic decides *which questions to ask*, never *who qualifies*.
- **GLBA / FTC Safeguards Rule:** the `loan` compartment is access-controlled,
  audited, encrypted where sensitive, minimally retained. (The readiness board
  already flags Safeguards as required before real borrower data enters.)
- **TRID:** disclosure timing (LE/CD) is handled in the disclosures integration,
  not improvised.
- **RESPA:** keep WML's data cleanly separate from any affiliated real-estate
  entity's data.

## 7. Gaps to close before the borrower portal ships

- **Session refresh:** `middleware.ts` does host canonicalization only and does
  not refresh Supabase sessions. A logged-in borrower portal needs a real
  `@supabase/ssr` `updateSession` middleware.
- **Object storage:** nothing is provisioned (no R2 binding, no Supabase Storage
  bucket). Phase 0 step 6 provisions it.

## 8. Immediate next step

Migration 1 (the `loan` compartment) is drafted and delivered alongside this doc.
On your go — and Dan's nod on the isolation choice in §2 — I apply it (via your
migration flow or the Supabase connection), then build the borrower portal and
the intake engine on top.
