# City pages — source verification

**Status: PENDING HUMAN SOURCE-VERIFICATION.** Reviewer not yet assigned. Review
has **not** occurred. Do **not** flip the city pages to indexable until a named
human reviewer verifies each city's sources and records their name and the date
below.

The pages are built and linked internally but ship **noindex** and off the
sitemap. A single switch controls this: `CITY_PAGES_INDEXABLE` in
`apps/web/lib/city-data.ts` (currently `false`). It drives both the route
registry's `indexable` flag and each page's `noIndex` meta, so the two cannot
drift. Flipping it to `true` is the deliberate, privileged publish action — taken
only after the verification below is complete, per the editorial publishing
sequence in `docs/content/editorial-policy.md`.

## What these pages assert, and do not

Each city page carries city-specific geography and a flood/wind framing, the
questions a buyer there should research, and links up to its parent county. By
design it asserts **no** market figure, **no** tax rate, and **no** municipal
program name or amount:

- Live market figures (median price, days on market, inventory) render only
  through the flag-gated `MarketDataWidget`, which is dark today
  (`FEATURE_MARKET_DATA` off). No fabricated stat can publish (invariant 6).
- The exact tax number is deferred to the parent county's Property Appraiser,
  linked on the page.
- Down-payment help falls back to the parent county's already-sourced assistance
  (`apps/web/lib/county-data.ts`); no city-level program is claimed.

So the city-specific claims a reviewer must verify are the geography, the flood
framing, and the neighborhood names — not tax, insurance, or program numbers.

## Per-city verification

For each city confirm: the geography in `localIntro` is accurate and current; the
`floodContext` framing is fair and not overstated; the `neighborhoods` are real,
correctly named areas of that city; the parent county coupling is correct; and,
where set, the `resourceSlug` article still exists. The parent county's appraiser
and assistance links are verified separately in the county-page review.

| City            | County       | resourceSlug              | Reviewer | Verified (date) |
| --------------- | ------------ | ------------------------- | -------- | --------------- |
| Miami           | Miami-Dade   | buying-home-miami         | —        | pending         |
| Hialeah         | Miami-Dade   | —                         | —        | pending         |
| Fort Lauderdale | Broward      | —                         | —        | pending         |
| Hollywood       | Broward      | —                         | —        | pending         |
| West Palm Beach | Palm Beach   | —                         | —        | pending         |
| Tampa           | Hillsborough | buying-home-tampa         | —        | pending         |
| St. Petersburg  | Pinellas     | buying-home-st-petersburg | —        | pending         |
| Orlando         | Orange       | buying-home-orlando       | —        | pending         |
| Jacksonville    | Duval        | buying-home-jacksonville  | —        | pending         |
| Cape Coral      | Lee          | buying-home-cape-coral    | —        | pending         |
| Lakeland        | Polk         | —                         | —        | pending         |
| Sarasota        | Sarasota     | buying-home-sarasota      | —        | pending         |

## Flip-to-index checklist

1. A named reviewer completes every row above (name + date).
2. Set the next review date (city material is time-sensitive; geography is stable
   but flood maps and programs change).
3. Set `CITY_PAGES_INDEXABLE = true` in `apps/web/lib/city-data.ts`.
4. `pnpm content:lint` and the unit tests pass; the pages then enter the sitemap.

Until step 1 is done and recorded here, the pages stay noindex.
