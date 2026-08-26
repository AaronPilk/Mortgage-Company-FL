import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { basisPointChange } from "@tract/mortgage-math";
import { readMarketRates } from "../../lib/rates";
import { readRateWatch } from "../../lib/rate-watch";

// A live rate-feed mode (fixture) so readMarketRates serves the sample view; the
// feed is deterministic, so no test touches the network.
process.env.RATE_FEED_MODE = "fixture";
process.env.FEATURE_RATE_WATCH = "true";

const USER = "00000000-0000-4000-8000-000000000002";

function fakeSupabase(row: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) })
      })
    })
  } as unknown as SupabaseClient;
}

describe("basisPointChange", () => {
  it("is the signed delta between two basis-point readings", () => {
    expect(basisPointChange(681, 693)).toBe(-12);
    expect(basisPointChange(700, 690)).toBe(10);
  });
});

describe("readMarketRates", () => {
  it("returns a labelled view with week-over-week movement from the fixture feed", async () => {
    const view = await readMarketRates();
    expect(view).not.toBeNull();
    expect(view!.thirtyYearBp).toBe(681);
    expect(view!.thirtyYearChangeBp).toBe(-12);
    expect(view!.sampleData).toBe(true);
    expect(view!.thirtyYearHistoryBp.at(-1)).toBe(681);
  });
});

describe("readRateWatch", () => {
  it("maps a stored basis-point target back to a percentage", async () => {
    const view = await readRateWatch(
      fakeSupabase({ term: "thirtyYearFixed", target_rate_bp: 600, notify_email: true }),
      USER
    );
    expect(view).toEqual({ term: "thirtyYearFixed", targetRatePercent: 6, notifyEmail: true });
  });

  it("keeps a null target null", async () => {
    const view = await readRateWatch(
      fakeSupabase({ term: "fifteenYearFixed", target_rate_bp: null, notify_email: false }),
      USER
    );
    expect(view).toEqual({ term: "fifteenYearFixed", targetRatePercent: null, notifyEmail: false });
  });

  it("returns null when the visitor has no watch", async () => {
    expect(await readRateWatch(fakeSupabase(null), USER)).toBeNull();
  });
});
