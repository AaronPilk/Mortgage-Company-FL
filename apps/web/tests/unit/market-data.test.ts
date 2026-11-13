import { describe, expect, it } from "vitest";
import {
  MARKET_DATA_METRICS,
  marketDataPendingBody,
  marketDataPendingHeading
} from "../../lib/market-data";

/**
 * Market-data widget dark state.
 *
 * The widget is flag-gated and dark today (FEATURE_MARKET_DATA is off). Its
 * pending copy must never read like a market number — invariant 6. The copy lives
 * in a pure module precisely so this node test can assert that without a DOM.
 */

describe("market-data widget dark state", () => {
  it("names the city in the heading", () => {
    expect(marketDataPendingHeading("Miami")).toContain("Miami");
  });

  it("renders no figure in the pending body (invariant 6)", () => {
    const body = marketDataPendingBody("Miami");
    expect(body).toContain("Miami");
    // A placeholder must never contain a digit, dollar sign, or percent.
    expect(body).not.toMatch(/[\d$%]/);
  });

  it("lists metric labels only, never values", () => {
    expect(MARKET_DATA_METRICS.length).toBeGreaterThan(0);
    for (const metric of MARKET_DATA_METRICS) {
      expect(metric.length).toBeGreaterThan(0);
      expect(metric).not.toMatch(/[\d$%]/);
    }
  });
});
