# Market rates (rate watch)

The rate-watch surface shows one thing: a published **national market average**,
and which way it is moving. It is never a quote, an offer, an APR, or "your
rate" — the software makes no credit decision and advertises no rate of its own.

## Source

The live adapter reads the **Freddie Mac Primary Mortgage Market Survey (PMMS)**
weekly 30- and 15-year fixed averages from **FRED** (Federal Reserve Economic
Data), series `MORTGAGE30US` and `MORTGAGE15US`. This is an authoritative,
citable public source, published weekly (typically Thursday). A proprietary
daily feed (e.g. a lender pricing engine) can replace it behind the same
`RateFeedPort` once it is licensed and reviewed — no call site changes.

Rates are handled as integer **basis points** end to end (invariant 1); a display
converts to a percentage. Week-over-week movement is `basisPointChange` in
`@tract/mortgage-math`, not computed inline in a component.

## Modes (`RATE_FEED_MODE`, mirroring the other integrations)

- `disabled` (default) — no feed; the rate-watch surface is dark.
- `fixture` — deterministic sample average for development and tests. It never
  renders in production (there is no production sample switch — a fabricated
  market rate is worse than none), and every surface labels it as sample data.
- `sandbox` / `production` — the real FRED adapter; requires `FRED_API_KEY`, so
  the environment fails to parse in a live mode without it.

The derived public flag (`rateWatch`) also requires a non-disabled mode, so the
fixture average cannot publish just because `FEATURE_RATE_WATCH` was left on.

## Compliance posture

Displaying market rates is an advertising-adjacent surface for a mortgage broker.
It ships **dark by default and noindex**: `/mortgage-rates` renders only where
`rateWatchAvailable()` permits and stays off the sitemap until a live feed is set
and advertising review has cleared the public display (tracked as a gate on the
readiness board). The copy everywhere states it is a national survey average, not
an APR, not an advertisement of our own rates, and not a commitment to lend.

## What ships now vs. later

- **Now:** the feed integration, the noindex `/mortgage-rates` page, and the
  `rate_watches` account table + RLS + API + card (a signed-in visitor picks a
  term, an optional target they'd like to see, and an email toggle).
- **Later:** the scheduled job that reads the feed and emails a watcher when the
  average moves. FRED is free, so this needs no spend reservation — but it does
  need the Worker cron branch and the email path, so it is a separate pass.
