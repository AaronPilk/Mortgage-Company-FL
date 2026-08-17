import { describe, expect, it } from "vitest";
import {
  ASSUMPTION_CATALOGUE,
  ASSUMPTION_KEYS,
  NOT_MARKET_DATA,
  resolveAssumptions,
  usedAssumptions
} from "./assumptions";

describe("assumption catalogue", () => {
  it("describes every declared key exactly once", () => {
    expect(new Set(ASSUMPTION_KEYS).size).toBe(ASSUMPTION_KEYS.length);
    for (const key of ASSUMPTION_KEYS) {
      expect(ASSUMPTION_CATALOGUE[key].key, key).toBe(key);
    }
  });

  it("keeps every default inside its own declared bounds", () => {
    for (const key of ASSUMPTION_KEYS) {
      const spec = ASSUMPTION_CATALOGUE[key];
      expect(spec.defaultValue, key).toBeGreaterThanOrEqual(spec.min);
      expect(spec.defaultValue, key).toBeLessThanOrEqual(spec.max);
      expect(spec.min, key).toBeLessThan(spec.max);
    }
  });

  it("explains every placeholder in words a reader can act on", () => {
    for (const key of ASSUMPTION_KEYS) {
      expect(ASSUMPTION_CATALOGUE[key].note.length, key).toBeGreaterThan(40);
      expect(ASSUMPTION_CATALOGUE[key].label.length, key).toBeGreaterThan(3);
    }
  });
});

describe("resolveAssumptions", () => {
  it("marks an untouched value as a company default", () => {
    const resolved = resolveAssumptions();
    expect(resolved.contingencyRateBasisPoints.source).toBe("company_default");
    expect(resolved.contingencyRateBasisPoints.value).toBe(
      ASSUMPTION_CATALOGUE.contingencyRateBasisPoints.defaultValue
    );
  });

  it("marks an overridden value as the user's", () => {
    const resolved = resolveAssumptions({ contingencyRateBasisPoints: 2_500 });
    expect(resolved.contingencyRateBasisPoints.source).toBe("user");
    expect(resolved.contingencyRateBasisPoints.value).toBe(2_500);
  });

  it("never claims any value is market data, whoever supplied it", () => {
    const resolved = resolveAssumptions({ monthlyRentToValueBasisPoints: 120 });
    for (const key of ASSUMPTION_KEYS) {
      expect(resolved[key].marketDataBacked, key).toBe(false);
      expect(resolved[key].note, key).toContain(NOT_MARKET_DATA);
    }
  });

  it("clamps an override to the declared bounds instead of trusting it", () => {
    const high = resolveAssumptions({ contingencyRateBasisPoints: 9_999_999 });
    expect(high.contingencyRateBasisPoints.value).toBe(
      ASSUMPTION_CATALOGUE.contingencyRateBasisPoints.max
    );
    const low = resolveAssumptions({ contingencyRateBasisPoints: -500 });
    expect(low.contingencyRateBasisPoints.value).toBe(
      ASSUMPTION_CATALOGUE.contingencyRateBasisPoints.min
    );
  });

  it("ignores a non-finite override rather than propagating NaN through the model", () => {
    const resolved = resolveAssumptions({ contingencyRateBasisPoints: Number.NaN });
    expect(resolved.contingencyRateBasisPoints.source).toBe("company_default");
    expect(Number.isFinite(resolved.contingencyRateBasisPoints.value)).toBe(true);
  });

  it("rounds a fractional override to a whole basis point", () => {
    expect(
      resolveAssumptions({ contingencyRateBasisPoints: 1_234.6 }).contingencyRateBasisPoints.value
    ).toBe(1_235);
  });

  it("allows a negative default where the catalogue permits one", () => {
    const resolved = resolveAssumptions({ annualAppreciationBasisPoints: -800 });
    expect(resolved.annualAppreciationBasisPoints.value).toBe(-800);
  });
});

describe("usedAssumptions", () => {
  it("returns the requested keys in order, without duplicates", () => {
    const resolved = resolveAssumptions();
    const used = usedAssumptions(resolved, [
      "contingencyRateBasisPoints",
      "contingencyRateBasisPoints",
      "sellingCostRateBasisPoints"
    ]);
    expect(used.map((item) => item.key)).toEqual([
      "contingencyRateBasisPoints",
      "sellingCostRateBasisPoints"
    ]);
  });

  it("returns nothing when nothing was asked for", () => {
    expect(usedAssumptions(resolveAssumptions(), [])).toEqual([]);
  });
});
