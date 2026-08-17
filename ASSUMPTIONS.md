# Assumptions

Temporary positions taken so work could proceed. Each needs validation by a named
owner. An assumption that is never revisited becomes an unexamined fact.

| #   | Assumption                                                            | Basis                                     | Owner                     | Validate by                                   |
| --- | --------------------------------------------------------------------- | ----------------------------------------- | ------------------------- | --------------------------------------------- |
| 1   | GoHighLevel is the marketing CRM                                      | Stated in project instructions            | Founders                  | Before CRM build-out                          |
| 2   | Supabase is the application database                                  | Chosen for RLS plus managed Postgres      | Engineering               | Before production                             |
| 3   | Cloudflare Workers is the host                                        | Chosen for edge security and cost         | Engineering               | Before production                             |
| 4   | Stellar MLS is the primary Florida listing path                       | Market coverage                           | Founders                  | Before property search                        |
| 5   | 28% front-end and 43% back-end are reasonable **illustrative** ratios | Common convention                         | Principal loan originator | Before publishing the affordability page      |
| 6   | 90-day attribution retention                                          | Typical ad-platform window                | Compliance                | Before paid media                             |
| 7   | 6 outbox retry attempts before dead-letter                            | Balances transient recovery against noise | Engineering               | After observing real failure rates            |
| 8   | 12 leads per /24 per 10 minutes, 3 per contact per hour               | Estimate; no traffic data exists yet      | Engineering               | After two weeks of real traffic               |
| 9   | 1% of purchase price per year for maintenance in rent-vs-buy          | Common starting figure, shown as editable | Engineering               | Reviewer to confirm the default is defensible |
| 10  | 7% cost to sell in rent-vs-buy                                        | Common estimate, shown as editable        | Reviewer                  | Before publishing                             |
| 11  | TypeScript 7 is stable for this stack                                 | Verified against Next 16 in this build    | Engineering               | On each major upgrade                         |
| 12  | The pre-launch banner satisfies the prelaunch requirement             | Reasonable interpretation                 | Counsel                   | Before any public traffic                     |

Items 5, 9, and 10 matter most: they are numbers a consumer sees. All three are
exposed as editable inputs with the assumption stated, which is the mitigation —
but the defaults still need a reviewer's name against them.
