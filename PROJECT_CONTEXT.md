# Project context

Verified facts and named unknowns. Update this file rather than restating context
in chat.

## The business

A greenfield Florida mortgage brokerage. Working brand: TRACT Mortgage.

A tract is an area or parcel of land; the word also suggests a defined path. The
misspelling "Tracked" must not appear in public copy.

**Not yet licensed.** See `docs/compliance/launch-gates.md`. Everything the site
says and does is shaped by that fact today.

## People

- **Dan** — approximately 20 years of mortgage-industry experience. Expected
  principal loan originator, subject to OFR accepting the designation.
- **Technical founder** — owns technology, AI, web, automation, CRM, analytics,
  SEO, paid media, and systems. Beginning Florida MLO education and testing. Not
  authorized to originate, negotiate, quote, recommend, or take an application
  until that licence is active and associated in NMLS.
- **Family** — approximately 28 years in mortgage lending in North and South
  Carolina, and owners of a title company, a real-estate firm, and a processing
  company.

The family experience is real and valuable. It is **not** this company's
operating history and is never presented as such. `/about` carries the precise
version of the story, and the content linter rejects tenure claims.

## Three separate licensing facts

Conflating these is the most common way a mortgage marketing site becomes
inaccurate:

1. The **company** mortgage broker licence.
2. Each **individual** MLO licence, properly associated in NMLS.
3. The **principal loan originator** designation, which OFR must accept.

None implies another. Tracked separately on `/admin/readiness`.

## Related-company exposure

Family ownership of title, real estate, and processing creates affiliated
business, referral, compensation, disclosure, privacy, and data-sharing
questions under RESPA and Florida law.

**Nothing in this codebase shares data or refers business across entities, and
nothing should until counsel has mapped it.** Building the boundary first is far
cheaper than retrofitting a firewall onto a system that already assumes shared
access.

## System of record

| Domain                                               | Authority                             |
| ---------------------------------------------------- | ------------------------------------- |
| Public content                                       | This repository                       |
| Marketing lead, consent, attribution, communications | Supabase (this platform)              |
| CRM projection                                       | GoHighLevel                           |
| Application, loan file, disclosures, documents       | Approved POS/LOS — **not selected**   |
| Compliance evidence, policies, advertising archive   | Compliance repository                 |
| Code, configuration, schemas, tests                  | This repository — never borrower data |

## Named unknowns

- Which POS/LOS. The largest open architectural dependency.
- Which lenders, and which products each agreement actually covers.
- MLS or aggregator access for the launch market.
- Legal entity structure and the affiliated-business posture.
- Compensation model, pending compliance review.
- Which market segments to pursue first.
