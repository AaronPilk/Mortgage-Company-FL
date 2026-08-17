# Launch gates

**DRAFT — REQUIRES QUALIFIED REVIEW.**

Every gate that must be satisfied before this brokerage conducts regulated
activity or runs paid mortgage advertising. The live version of this board is at
`/admin/readiness`.

States: `BLOCKED` · `IN PROGRESS` · `READY FOR REVIEW` · `APPROVED` · `LIVE` ·
`EXPIRED / REVERIFY`

## Why an engineering repository contains this file

Because the engineering work is finished and the business still cannot launch,
and it is important that both facts are visible in the same place. A green test
suite is not permission to originate.

## Licensing — owner: principal loan originator

Florida distinguishes several things that are easy to conflate. Track them
separately and never let one imply another.

| Gate                                                                                        | State   | Evidence required     |
| ------------------------------------------------------------------------------------------- | ------- | --------------------- |
| Legal entity formed, DBA registered if used                                                 | BLOCKED | Filing records        |
| Company NMLS record created                                                                 | BLOCKED | NMLS record           |
| Florida mortgage broker **company** licence issued                                          | BLOCKED | Issued licence        |
| Principal loan originator designated and accepted by OFR                                    | BLOCKED | OFR acceptance        |
| Individual MLO licence active — Dan                                                         | BLOCKED | NMLS Consumer Access  |
| Individual MLO licence active — technical founder                                           | BLOCKED | Education, test, NMLS |
| Each MLO properly employed / sponsored / associated in NMLS                                 | BLOCKED | NMLS record           |
| Licensed principal place of business established                                            | BLOCKED | Licence record        |
| Branch licences, if any location requires one                                               | BLOCKED | Licence records       |
| Remote-work policy and access controls approved                                             | BLOCKED | Written policy        |
| Lender approvals and executed broker agreements for every product offered                   | BLOCKED | Executed agreements   |
| Renewal, continuing education, Mortgage Call Report, and change-reporting calendar in place | BLOCKED | Calendar with owners  |

**The company licence is not an individual licence. An individual MLO licence is
not authority for the company. A principal loan originator designation is a
separate item the regulator must accept.** Do not describe any person as "getting
the mortgage broker licence" — say which of these is actually in progress.

### While any licensing gate is blocked

- The site stays in its pre-launch state. The banner is driven by
  `licensingStatus` in `apps/web/lib/site.ts`.
- No residential mortgage application may be accepted.
- No credit may be pulled.
- No rate or term may be quoted or negotiated.
- No prequalification or preapproval may be issued.
- No paid mortgage advertising may run.
- No person or system may perform activity requiring an MLO licence.
- No claim that any person or the company is licensed, unless the current public
  record confirms it.

## Legal — owner: counsel

| Gate                                                               | State   |
| ------------------------------------------------------------------ | ------- |
| Ownership, governance, and supervision structure                   | BLOCKED |
| Loan originator compensation plans                                 | BLOCKED |
| Affiliated business relationships — title, real estate, processing | BLOCKED |
| Referral and co-marketing arrangements                             | BLOCKED |
| Website disclosures and every legal page                           | BLOCKED |
| Lead forms, application boundary, consent language, SMS terms      | BLOCKED |
| Advertising templates and rate-advertising procedure               | BLOCKED |
| Fair-lending marketing plan                                        | BLOCKED |
| Telemarketing and call-recording procedures                        | BLOCKED |
| GLBA privacy notice and information security programme             | BLOCKED |
| AML programme and SAR procedures                                   | BLOCKED |
| Complaint handling and record retention schedule                   | BLOCKED |
| Vendor contracts and data processing terms                         | BLOCKED |
| Responsibility matrix between the brokerage and each lender        | BLOCKED |

"The lender handles compliance" is not a responsibility matrix. Document who
performs, reviews, delivers, logs, and retains every required action.

## Security — owner: Qualified Individual

Required before any real borrower information enters any system. The FTC
Safeguards Rule expressly covers mortgage brokers; confirm any small-institution
exception rather than assuming it applies.

| Gate                                                                    | State       |
| ----------------------------------------------------------------------- | ----------- |
| Data inventory and flow map                                             | BLOCKED     |
| Written information security programme                                  | BLOCKED     |
| Qualified Individual designated                                         | BLOCKED     |
| Written risk assessment                                                 | BLOCKED     |
| Access controls, MFA, encryption, logging, device controls, offboarding | IN PROGRESS |
| Vendor due diligence and security contract terms                        | BLOCKED     |
| Vulnerability management and testing                                    | IN PROGRESS |
| Secure disposal and retention                                           | BLOCKED     |
| Incident response plan, tested                                          | IN PROGRESS |
| Breach notification procedures mapping every applicable rule            | BLOCKED     |

## Platform — owner: engineering

These are the ones code can close, and they are visible live at
`/admin/readiness`.

| Gate                                                                         | State                              |
| ---------------------------------------------------------------------------- | ---------------------------------- |
| Monorepo, strict typecheck, production build                                 | APPROVED                           |
| Deterministic mortgage math with tests                                       | APPROVED                           |
| Lead receipt: validation, rate limiting, bot challenge, transaction, outbox  | APPROVED                           |
| Consent ledger and suppression model                                         | APPROVED                           |
| Attribution capture with bounded, allow-listed parameters                    | APPROVED                           |
| Row level security with an executed policy suite                             | APPROVED                           |
| Append-only audit model                                                      | APPROVED                           |
| Security headers and CSP                                                     | APPROVED                           |
| Metadata, canonicals, sitemap, robots, JSON-LD                               | APPROVED                           |
| Analytics guard blocking personal data                                       | APPROVED                           |
| AI budget reservation, quotas, kill switches                                 | APPROVED                           |
| Admin RBAC and readiness board                                               | APPROVED                           |
| CI: format, typecheck, test, content lint, build, database, e2e, secret scan | APPROVED                           |
| Database configured in a deployed environment                                | BLOCKED                            |
| Bot challenge in production mode                                             | BLOCKED                            |
| Secure application handoff configured                                        | BLOCKED — needs a selected POS/LOS |
| Listing data agreement                                                       | BLOCKED — needs an MLS contract    |
| CSP nonce replacing `unsafe-inline` for scripts                              | IN PROGRESS                        |
| Shared-store rate limiting for horizontal scale                              | IN PROGRESS                        |

## Sign-off

No gate is `APPROVED` without a named approver, a date, and a link to evidence.
`EXPIRED / REVERIFY` exists because licences renew and rules change; a gate
approved once is not approved forever.
