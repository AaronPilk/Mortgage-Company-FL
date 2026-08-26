# Decisions

Business and operating decisions. Architecture decisions live in
`docs/architecture/decisions.md`.

## 2026-08-26

**City pages ship, on the county bar (supersedes "No city pages", 2026-08-17).**
The earlier decision was against a _templated_ city page — a county paragraph with
a city name swapped in — not against a substantive local page. City pages now ship
where each carries its own real, city-specific material: the settlement's geography
and its flood and wind reality, and the questions a buyer there must research,
coupled to a real parent county and asserting no market figure or tax rate. A
name-substitution page still does not qualify, and the unit test enforces that a
city's flood copy is not its county's. They ship **noindex** and off the sitemap
until a named human reviewer verifies each city's sources
(`docs/compliance/city-pages.md`); flipping the single `CITY_PAGES_INDEXABLE`
switch turns both the registry entry and the page meta indexable together. Live
market figures (median price, days on market, inventory) stay behind the dark
`marketData` flag, so no fabricated stat can publish (invariant 6).

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
and a named reviewer. _(Superseded 2026-08-26: substantive per-city pages ship on
the same bar as counties — real local material and a named reviewer; a templated
name-substitution page is still prohibited.)_

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
