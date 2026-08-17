# Compliance matrix

**DRAFT — REQUIRES QUALIFIED REVIEW.**

Maps obligations to the controls that implement them. This is a starting
skeleton: the citations must be verified against current primary sources, and the
applicability determination for each row is a legal judgment, not an engineering
one.

Columns: obligation · authority · applicability · process · **system control** ·
owner · reviewer · evidence · retention · test · review cadence.

The **system control** column is the one this repository can populate, and the
rows below record what actually exists in code today.

## Application boundary

| Obligation                                                                          | System control                                                                                                                                                     | Test                                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Do not collect the elements that constitute an application through a marketing form | `CreateLeadSchema` has no field for a government identifier, date of birth, income, or account number; unknown keys are stripped; no file input exists on any form | `contact.test.ts` strips unknown keys; e2e asserts no such input exists |
| Route real applications to the approved secure system                               | `/apply` links out and refuses to collect anything when `SECURE_APPLICATION_URL` is unset                                                                          | e2e: "does not pretend applications are open"                           |
| Do not let sensitive data reach the marketing CRM                                   | `assertCrmPayloadSafe` throws on any prohibited key at any depth, before transmission                                                                              | `integrations.test.ts`, 3 cases                                         |

## Consent and communications

| Obligation                                                  | System control                                                                                                                                     | Test                                                                |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Separate the request to be contacted from marketing consent | Two independent fields; only `privacyAccepted` and `contactRequested` are required literals                                                        | `contact.test.ts`; e2e asserts the marketing boxes are not required |
| Preserve exact consent evidence                             | `consent_receipts` stores disclosure version, a SHA-256 of the exact text shown, page, form version, request id, coarse UA, and a hashed IP prefix | RLS suite                                                           |
| Honour revocation across systems                            | `suppressions` table keyed by channel with unique indexes; CRM adapter mirrors channel consent into provider DND settings                          | `integrations.test.ts`                                              |

## Advertising and claims

| Obligation                                     | System control                                                                   | Test                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------- |
| No rate or APR without required disclosures    | No rate is published anywhere; program copy is scanned for rate and APR patterns | `site-contract.test.ts` |
| No approval, guarantee, or qualification claim | Promissory phrasing patterns rejected in program copy                            | `site-contract.test.ts` |
| No fabricated trust signals                    | Content linter rejects volume, rating, award, ranking, and tenure claims         | `pnpm content:lint`     |
| Do not describe a broker as a lender           | Linter rejects "Equal Housing Lender"; footer states the broker role             | linter and e2e          |
| Retain advertising samples                     | `content_revisions` and the archive process                                      | Human-owned             |

## Fair lending

| Obligation                                                         | System control                                                                                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No protected characteristic or close proxy in targeting or storage | No such field exists in any schema; the analytics guard blocks race, ethnicity, gender, religion, marital status, familial status, disability, and national origin as parameter names |
| No discouragement in marketing copy                                | Human review; the "may fit / look elsewhere" structure is framed around loan mechanics, never borrower characteristics                                                                |
| Monitor delivery, not just audience selection                      | Human-owned. Platform evidence retained with the ad archive                                                                                                                           |

## Privacy and security

| Obligation                                    | System control                                                                          | Test                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------ |
| Minimum necessary collection                  | Lead schema is deliberately short; calculators compute client-side and transmit nothing | e2e                            |
| No personal data to analytics or ad platforms | `inspectEvent` blocks prohibited keys and personal-data-shaped values                   | `guard.test.ts`, 7 cases       |
| Access control on borrower records            | RLS plus an explicit application check on every admin route                             | `rls-tests.sql`, 39 assertions |
| Audit privileged actions                      | Append-only `audit_events` with no update or delete path                                | `rls-tests.sql`                |
| Redact sensitive values from logs             | `redact` runs over every log field; there is no raw path                                | `domain` package               |

## Third-party data

| Obligation                                         | System control                                              | Test                        |
| -------------------------------------------------- | ----------------------------------------------------------- | --------------------------- |
| Preserve required listing attribution              | `attribution_text` is `not null` and rendered on every card | `integrations.test.ts`, e2e |
| Never publish unlicensed or synthetic listing data | `check (not (is_fixture and published))`                    | `rls-tests.sql`             |
| Unpublish on rights loss                           | `recordsToUnpublish`                                        | `integrations.test.ts`      |
| State the date and limits of every sourced fact    | `sourced()` refuses a value with no stated limitations      | `integrations.test.ts`      |

## What this matrix cannot do

It cannot determine applicability, interpret a rule, or approve a control. Every
row needs a legal owner. The engineering column is evidence that a control
exists and is tested — not that it is sufficient.
