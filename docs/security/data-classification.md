# Data classification

What each class is, where it may live, and where it may never go.

| Class             | Examples                                                                                | Permitted stores                                                   | Never                                                            |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Public            | Marketing copy, program pages, calculator logic                                         | Repository, CDN                                                    | —                                                                |
| Internal          | Route config, feature flags, model routes, prompt registry                              | Repository, server config                                          | Client bundle                                                    |
| Marketing contact | Name, email, phone, intent, timeline, consent, attribution                              | `leads`, `consent_receipts`, `attribution_touches`, CRM projection | Analytics, ad platforms, git, URLs, logs                         |
| Consumer property | Address, parcel, permit, flood, zoning, comparable sales                                | `property_entities`, `property_facts`, `vision_*`                  | CRM, analytics, ad platforms                                     |
| Application data  | Income, assets, employment, documents                                                   | Approved POS/LOS **only**                                          | This platform, CRM, git, email, any web form                     |
| Restricted        | Government identifiers, credit reports, bank and card numbers, AUS findings, appraisals | Approved POS/LOS **only**                                          | Everywhere else, including any AI provider                       |
| Credentials       | API keys, service-role key, webhook keys, pepper                                        | Secret bindings, secret manager                                    | Repository, `NEXT_PUBLIC_*`, logs, errors, fixtures, screenshots |

## Enforcement, not policy

Each of the following is a mechanism in the codebase, not a rule someone has to
remember:

- `CreateLeadSchema` strips unknown keys, so a field an attacker adds to a
  request body cannot reach storage. There is no file input on any form.
- `assertCrmPayloadSafe` throws on any prohibited key, at any nesting depth, in
  any casing, before a CRM request is sent.
- `inspectEvent` blocks prohibited parameters and personal-data-shaped values
  from reaching any analytics destination.
- `redact` runs over every log field and every audit snapshot. There is no raw
  logging path.
- `assertRouteAccepts` refuses to send `restricted` data to any AI provider and
  refuses any data class a model route has not been explicitly cleared for.
- `import "server-only"` in every module that reads a secret makes importing it
  from a client component a build error.

## Retention

| Data                          | Retention                      | Reason                                                                                                        |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Attribution click identifiers | 90 days                        | Attribution window. `expires_at` is set on insert.                                                            |
| Consent receipts              | Longest applicable requirement | Evidence of what was agreed and when.                                                                         |
| Advertising archive           | Longest applicable requirement | Florida requires ad samples retained; core mortgage records longer. Use the longest of the overlapping rules. |
| Audit events                  | Longest applicable requirement | Append-only. No update or delete path.                                                                        |
| Raw provider payloads         | Per contract                   | `raw_payload_expires_at` on `listing_records`; not indefinite.                                                |
| Job artifacts                 | Short, with lifecycle expiry   | Transient by nature.                                                                                          |

Actual periods are set by counsel against the longest overlapping federal,
Florida, and lender requirement. The columns and the enforcement points exist;
the numbers are a compliance decision.

## Hashing is not anonymization

`ip_prefix_hash` and `dedupe_hash` are one-way and peppered. They reduce risk;
they do not make the underlying value anonymous, and they are treated as personal
data for access-control purposes.
