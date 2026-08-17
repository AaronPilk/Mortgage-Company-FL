/**
 * Range primitives.
 *
 * Every monetary output of this package is a low/base/high band, never a single
 * number. A single number implies a precision this model does not have: nothing
 * here is backed by market data, so a point estimate would read as a fact.
 *
 * The three ends are not a mix-and-match of best and worst individual terms.
 * Each end comes from running the whole scenario under one internally coherent
 * case, so the low end is a scenario that could actually happen rather than an
 * arithmetic floor no combination of events produces.
 */

import { type Cents, assertCents, roundCents } from "@tract/mortgage-math";

export class VisionModelError extends RangeError {}

export type CentsRange = {
  lowCents: Cents;
  baseCents: Cents;
  highCents: Cents;
};

/** A ratio scaled by 10,000, so 12,500 reads as 1.25x or 125%. Null where undefined. */
export type RatioRange = {
  lowBasisPoints: number | null;
  baseBasisPoints: number | null;
  highBasisPoints: number | null;
};

export function centsRange(lowCents: number, baseCents: number, highCents: number): CentsRange {
  assertCents(lowCents, "lowCents");
  assertCents(baseCents, "baseCents");
  assertCents(highCents, "highCents");
  if (lowCents > baseCents || baseCents > highCents) {
    throw new VisionModelError("a range must satisfy low <= base <= high");
  }
  return { lowCents, baseCents, highCents };
}

/**
 * Builds a band from three whole-scenario runs. The base case always supplies
 * the middle, and the outer ends are the extremes across all three, so a case
 * that lands outside its expected side still produces a valid, honest band.
 */
export function rangeFromCases(conservative: number, base: number, optimistic: number): CentsRange {
  return centsRange(
    Math.min(conservative, base, optimistic),
    base,
    Math.max(conservative, base, optimistic)
  );
}

export function ratioFromCases(
  conservative: number | null,
  base: number | null,
  optimistic: number | null
): RatioRange {
  if (base === null) {
    return { lowBasisPoints: null, baseBasisPoints: null, highBasisPoints: null };
  }
  const present = [conservative, base, optimistic].filter(
    (value): value is number => value !== null
  );
  return {
    lowBasisPoints: Math.min(...present),
    baseBasisPoints: base,
    highBasisPoints: Math.max(...present)
  };
}

/** Multiplies cents by a basis-point factor. 10,000 is unchanged. Accepts negatives. */
export function scaleCents(cents: Cents, multiplierBasisPoints: number): Cents {
  assertCents(cents, "cents");
  if (!Number.isFinite(multiplierBasisPoints)) {
    throw new VisionModelError("multiplierBasisPoints must be finite");
  }
  return roundCents((cents * multiplierBasisPoints) / 10_000);
}

/** Scales a basis-point quantity by a basis-point factor. 10,000 leaves it unchanged. */
export function scaleBasisPoints(value: number, multiplierBasisPoints: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(multiplierBasisPoints)) {
    throw new VisionModelError("basis-point scaling requires finite operands");
  }
  return Math.round((value * multiplierBasisPoints) / 10_000);
}

export function addCentsRanges(ranges: readonly CentsRange[]): CentsRange {
  return ranges.reduce<CentsRange>(
    (total, range) =>
      centsRange(
        total.lowCents + range.lowCents,
        total.baseCents + range.baseCents,
        total.highCents + range.highCents
      ),
    { lowCents: 0, baseCents: 0, highCents: 0 }
  );
}

/** Worst-case pairing: the low end of a difference pairs the low left with the high right. */
export function subtractCentsRanges(left: CentsRange, right: CentsRange): CentsRange {
  return centsRange(
    left.lowCents - right.highCents,
    left.baseCents - right.baseCents,
    left.highCents - right.lowCents
  );
}

export function rangeIsFlat(range: CentsRange): boolean {
  return range.lowCents === range.baseCents && range.baseCents === range.highCents;
}

/** Width of the band as a share of the base, in basis points. Null when the base is zero. */
export function rangeWidthBasisPoints(range: CentsRange): number | null {
  if (range.baseCents === 0) return null;
  return Math.round(((range.highCents - range.lowCents) * 10_000) / Math.abs(range.baseCents));
}
