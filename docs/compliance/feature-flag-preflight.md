# Feature-flag pre-flight — the four "compete with Zillow" waves

Five feature flags shipped **dark** (all default `false`, and the derived public
flags collapse to `false` while no licensed MLS/ATTOM feed exists). The code is
built, gated, RLS-covered, and passes every gate — but each flag has conditions
that must be true before it is flipped `true` in production. This file is the
gate. Do not enable a flag until its section is satisfied.

Status legend: **[blocker]** must be done before the flag goes live · **[watch]**
known limitation, acceptable while dark, resolve before heavy use.

## FEATURE_SAVED_SEARCH_ALERTS (Wave 1 — saved-search listing alerts)

The loop is dark-gated on the listing provider key, so it sends nothing until a
licensed MLS feed exists. Before enabling:

- **[blocker] A licensed MLS/listing feed must be live.** The `stellar/bridge/
  mlsgrid` adapters are unimplemented (require an executed display agreement).
  Emailing a person about a fixture listing is an invariant-6 violation; the loop
  refuses to, but there is nothing to send regardless.
- **[blocker] Burst coverage beyond `SAVED_SEARCH_FETCH_LIMIT` (100).** The loop
  fetches up to 100 newest matches per search per run and drains them oldest-first,
  which is loss-free for any realistic per-search burst between two cron ticks. A
  feed that can produce >100 new matches for a single saved search between ticks
  needs a modified-since query filter or cursor pagination from the watermark
  added to `parseSavedSearchQuery`/the loop, or the oldest overflow is skipped.
- **[watch] Re-enable replays the gap.** Cold-start suppression only fires on the
  first-ever enable (`alert_watermark IS NULL`). Disabling then re-enabling a
  search later emails everything modified since it was disabled, not since
  re-enable. Fix by re-seeding the watermark on enable (needs a definer RPC or a
  service-role write; the column-grant toggle cannot touch the watermark).
- **[watch] Cross-page equal-timestamp edge.** A new listing whose
  `modificationTimestamp` exactly equals a prior batch's max, arriving in a later
  page, is excluded by the strict `>` filter. Very low probability; the in-page
  equal-timestamp group is already handled.

## FEATURE_AI_SEARCH (Wave 2 — NL search + AI area reports)

- **[blocker] A live AI provider + a funded budget.** `AI_MODE` must be a live
  vendor and the AI budget must be non-zero, or every county renders the
  deterministic template (safe, but not the feature). The area narrative is
  produced via `structured_extraction` with a zero-numeric schema; `scrubReport`
  is the second defense; a fixture provider in production falls back to the
  template (no canned "AI overview").
- **[watch] Spelled-out figures.** `scrubReport` rejects numeric figures and
  rating tokens; it does not catch spelled-out magnitudes ("half a million"). The
  system prompt forbids figures and the schema carries none, so this is defence in
  depth, not a live gap. Extend the pattern if a model is observed smuggling one.

## FEATURE_MARKET_DATA (Wave 3 — live market widget on city pages)

- **[blocker] A licensed market-statistics feed (ATTOM sales-trend or equiv).**
  The widget renders a figure-free "coming soon" state on both branches today; the
  live branch must be implemented against a real feed and render each figure dated
  and attributed. It never renders a fixture number.

## City pages themselves (Wave 3 — noindex, independent of the flag)

- **[blocker] Named human source-verification before flipping to indexable.** All
  city routes ship `indexable: false` via the single `CITY_PAGES_INDEXABLE`
  switch (shared by the route registry and the page's `noIndex` so they cannot
  disagree). See `docs/compliance/city-pages.md`; the editorial policy requires a
  named reviewer + review date. This reverses the recorded "No city pages"
  decision only for substantive, sourced pages — see the dated entry in
  `DECISIONS.md`.

## FEATURE_SELLER_TOOLS (Wave 4 — seller funnel)

- **[watch] The AVM figure inherits ATTOM gating.** `sellerAvmAvailable()` shows a
  value only when ATTOM is live; with ATTOM dark the funnel still captures the
  seller lead but shows no number (no fabricated value). The lead itself works on
  the flag alone.
- Counsel review of the "what's my home worth" surface (same posture as
  `/home-lookup`) before it is made indexable.

## FEATURE_AGENT_MARKETPLACE (Wave 4 — ZIP coverage + routing foundation)

- **[blocker] Atomic coverage replace before heavy use.** `replaceCoverageZips`
  inserts-before-deletes so a mid-write failure fails safe to a *superset* (never
  strips an agent's coverage), but it is not transactional. Add a single
  SECURITY DEFINER replace RPC (delete+insert in one tx, owner-scoped) before the
  marketplace carries real routing weight.
- **[watch] Lead routing is foundation-only.** `agent_coverage_for_zip` +
  `coveringAgentForZip` exist and are tested, but nothing sets
  `leads.referring_agent_id` from coverage yet. Before wiring auto-assignment,
  decide the tie-break policy when multiple approved agents cover one ZIP (v1
  allows overlap, no exclusivity) and persist the lead's property ZIP.

## Two migrations to apply to production

Both are dark (empty table / additive columns / functions behind the flags) and
verified locally against Postgres (`pnpm db:verify`, all RLS asserts pass). Apply
when ready:

- `20260826000100_saved_search_alerts.sql`
- `20260826000200_agent_zip_coverage.sql`
