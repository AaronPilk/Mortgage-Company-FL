# Incident runbook

## Severity

- **S1** — Borrower personal information exposed, or the service-role key leaked.
- **S2** — Lead capture down, or messages sent without valid consent.
- **S3** — CRM sync backlog, elevated errors, provider degradation.
- **S4** — Cosmetic or single-page defect.

## First fifteen minutes

1. Write down the time you were notified and what you observed. Do this before
   you start fixing; you will not reconstruct it accurately afterwards.
2. Stop the bleeding: engage the relevant kill switch, disable the affected
   integration mode, or roll back the deployment.
3. Preserve evidence. Do not delete logs, rows, or deployments.
4. Notify the Qualified Individual and, for anything at S2 or above, counsel.

## Credential exposure

1. Rotate at the provider first. Updating the binding without rotating leaves the
   exposed value valid.
2. Update the secret binding, then redeploy.
3. For `SUPABASE_SERVICE_ROLE_KEY`, treat it as a data incident: that key
   bypasses row-level security entirely.
4. Review `audit_events` for the exposure window. The table is append-only.
5. Determine what was reachable with the credential and for how long.

## Suspected data exposure

1. Scope it: which records, which fields, which time window, which channel.
2. Consult counsel on notification obligations. Florida has its own breach
   notification requirements and they are not satisfied by meeting a federal
   rule. Map every potentially applicable rule and deadline; do not assume one
   covers another.
3. Preserve the audit trail and the relevant logs before remediation changes them.
4. Do not notify anyone externally before counsel has approved the wording.

## Consent or messaging failure

1. Stop the affected workflow at the source.
2. Query `consent_receipts` and `suppressions` to establish who received what and
   on what basis.
3. Honour every revocation across all systems immediately, whether or not a
   narrower technical reading would permit continuing.
4. Preserve the evidence and escalate to compliance.

## Afterwards

Within five business days, write up: timeline, root cause, what detection caught
it and what it missed, what was affected, what changed, and the specific control
that would have prevented it. File under `docs/compliance/`.

An incident with no control change is an incident that will recur.
