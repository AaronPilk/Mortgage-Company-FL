import { describe, expect, it } from "vitest";
import {
  VisionModelError,
  addCentsRanges,
  centsRange,
  rangeFromCases,
  rangeIsFlat,
  rangeWidthBasisPoints,
  ratioFromCases,
  scaleBasisPoints,
  scaleCents,
  subtractCentsRanges
} from "./range";

describe("centsRange", () => {
  it("accepts an ordered band", () => {
    expect(centsRange(100, 200, 300)).toEqual({ lowCents: 100, baseCents: 200, highCents: 300 });
  });

  it("accepts a degenerate band where all three ends are equal", () => {
    expect(rangeIsFlat(centsRange(500, 500, 500))).toBe(true);
  });

  it("refuses an out-of-order band rather than silently sorting it", () => {
    expect(() => centsRange(300, 200, 100)).toThrow(VisionModelError);
    expect(() => centsRange(100, 300, 200)).toThrow(VisionModelError);
  });

  it("refuses a fractional cent", () => {
    expect(() => centsRange(100.5, 200, 300)).toThrow();
  });

  it("allows a negative band, because a loss is a real result", () => {
    expect(() => centsRange(-500, -200, 100)).not.toThrow();
  });
});

describe("rangeFromCases", () => {
  it("puts the base case in the middle and the extremes on the outside", () => {
    expect(rangeFromCases(900, 1_000, 1_200)).toEqual({
      lowCents: 900,
      baseCents: 1_000,
      highCents: 1_200
    });
  });

  it("stays valid when the conservative case lands above the optimistic one", () => {
    // Higher rates amortize faster, so the unfavourable case can produce the
    // smaller loan balance. The band must still be well formed.
    const range = rangeFromCases(1_500, 1_000, 800);
    expect(range).toEqual({ lowCents: 800, baseCents: 1_000, highCents: 1_500 });
  });

  it("collapses to a point when every case agrees", () => {
    expect(rangeIsFlat(rangeFromCases(42, 42, 42))).toBe(true);
  });
});

describe("ratioFromCases", () => {
  it("returns all nulls when the base case is not calculable", () => {
    expect(ratioFromCases(100, null, 200)).toEqual({
      lowBasisPoints: null,
      baseBasisPoints: null,
      highBasisPoints: null
    });
  });

  it("ignores a null end rather than treating it as zero", () => {
    expect(ratioFromCases(null, 5_000, 8_000)).toEqual({
      lowBasisPoints: 5_000,
      baseBasisPoints: 5_000,
      highBasisPoints: 8_000
    });
  });

  it("orders the ends regardless of which case produced them", () => {
    expect(ratioFromCases(9_000, 5_000, 1_000)).toEqual({
      lowBasisPoints: 1_000,
      baseBasisPoints: 5_000,
      highBasisPoints: 9_000
    });
  });
});

describe("scaling", () => {
  it("leaves a value unchanged at 10,000 basis points", () => {
    expect(scaleCents(123_456, 10_000)).toBe(123_456);
    expect(scaleBasisPoints(800, 10_000)).toBe(800);
  });

  it("scales negative cents", () => {
    expect(scaleCents(-1_000, 5_000)).toBe(-500);
  });

  it("rounds to whole cents", () => {
    expect(scaleCents(333, 3_333)).toBe(Math.round((333 * 3_333) / 10_000));
  });

  it("refuses a non-finite factor", () => {
    expect(() => scaleCents(100, Number.NaN)).toThrow(VisionModelError);
    expect(() => scaleBasisPoints(100, Number.POSITIVE_INFINITY)).toThrow(VisionModelError);
  });
});

describe("range arithmetic", () => {
  it("adds ends to matching ends", () => {
    const total = addCentsRanges([centsRange(1, 2, 3), centsRange(10, 20, 30)]);
    expect(total).toEqual({ lowCents: 11, baseCents: 22, highCents: 33 });
  });

  it("returns a zero band for an empty list", () => {
    expect(addCentsRanges([])).toEqual({ lowCents: 0, baseCents: 0, highCents: 0 });
  });

  it("pairs the worst ends when subtracting, so the low end is genuinely the low end", () => {
    const value = centsRange(100, 150, 200);
    const cost = centsRange(50, 80, 120);
    expect(subtractCentsRanges(value, cost)).toEqual({
      lowCents: -20,
      baseCents: 70,
      highCents: 150
    });
  });

  it("reports band width relative to the base", () => {
    expect(rangeWidthBasisPoints(centsRange(900, 1_000, 1_100))).toBe(2_000);
  });

  it("has no width to report when the base is zero", () => {
    expect(rangeWidthBasisPoints(centsRange(0, 0, 0))).toBeNull();
  });

  it("uses the magnitude of the base so a negative band still reports a positive width", () => {
    expect(rangeWidthBasisPoints(centsRange(-1_100, -1_000, -900))).toBe(2_000);
  });
});
