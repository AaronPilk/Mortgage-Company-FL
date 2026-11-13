/**
 * Copy and metric labels for the city market-data widget.
 *
 * Kept as pure data (no imports) so the node-only test runner can assert the dark
 * state carries no figure — invariant 6 — without a DOM. The widget component
 * reads these strings; the future live branch reads the metric labels. Nothing
 * here is a value: a placeholder must never read like a number, so the body and
 * the labels contain no digit, currency, or percent, and the test enforces it.
 */

/** The figures the LIVE widget will show once a licensed feed is connected. Labels only. */
export const MARKET_DATA_METRICS = [
  "Median sale price",
  "Median days on market",
  "Active inventory"
] as const;

export function marketDataPendingHeading(cityName: string): string {
  return `${cityName} market data`;
}

/**
 * The dark-state body. Names the metrics that will appear but states no value —
 * "coming soon", never a fabricated figure. The unit test asserts it holds no
 * digit, dollar sign, or percent.
 */
export function marketDataPendingBody(cityName: string): string {
  return (
    `Live figures for ${cityName} — median sale price, days on market, and active ` +
    "inventory — will appear here once our licensed market-data feed is connected. " +
    "We don't show estimated or sample market numbers, so until the feed is live this " +
    "stays a placeholder."
  );
}
