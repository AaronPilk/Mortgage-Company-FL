# Decisions

Business and operating decisions. Architecture decisions live in
`docs/architecture/decisions.md`.

## 2026-08-17

**Do not publish rates.** Pricing depends on credit profile, loan-to-value,
property type, occupancy, loan amount, and lock period. A single number without
those is an advertisement, and publishing one triggers disclosure obligations a
static page cannot satisfy. The site explains this rather than quietly omitting
the topic — which is also better positioning than a rate table nobody trusts.

**No payment in either direction for referrals.** Stated plainly on the agent
partner page, before the first conversation rather than after. Any co-marketing
arrangement must be for actual services at documented fair market value, reviewed
by counsel, and never priced by referral or production volume.

**Ship legal pages as labelled drafts.** The alternative is shipping no legal
pages, or shipping unreviewed text that reads as final. A visible draft label is
honest and the content linter fails if one is removed.

**Publish nothing rather than publish thin.** `/resources` shows an honest empty
state explaining that guides are in review. A resource index padded with
templated articles is worse than one that is briefly empty.

**No city pages.** A template with a city name substituted has no local value and
is a scaled-content risk. County material ships when it carries real county data
and a named reviewer.

**Family experience is described precisely.** `/about` states that TRACT is new
and that the family's decades belong to the family. The content linter rejects
tenure claims. This costs a line of marketing copy and buys the ability to
substantiate everything on the page.

**Vision and RendProp ship switched off rather than on fixtures.** A workspace
presenting synthetic figures as analysis is worse than one that is honestly
unavailable.

**GPTBot disallowed, OAI-SearchBot allowed.** Search discovery and model training
are separate decisions and are configured separately in `robots.ts`. Revisit
training access as a deliberate choice.
