/**
 * Rate impact comparison.
 *
 * The same loan priced at several rates, so the payment and lifetime interest
 * difference is visible side by side. The rates are values a reader supplies for
 * comparison. None of them is quoted, offered, or available by virtue of
 * appearing here.
 */

import { type BasisPoints, type Cents, assertBasisPoints } from "./money";
import { CALCULATION_VERSION, amortizationSchedule } from "./payment";

export const MAX_COMPARED_RATES = 4;

export type RateImpactInput = {
  principalCents: Cents;
  termMonths: number;
  /** One to four rates in basis points. */
  annualRatesBasisPoints: readonly BasisPoints[];
  /** Index of the rate every delta is measured against. Defaults to the first. */
  baseIndex?: number;
};

export type RateImpactRow = {
  annualRateBasisPoints: BasisPoints;
  monthlyPaymentCents: Cents;
  totalInterestCents: Cents;
  totalPaidCents: Cents;
  /** Positive means this rate costs more per month than the base rate. */
  monthlyPaymentDeltaCents: Cents;
  totalInterestDeltaCents: Cents;
  isBase: boolean;
};

export type RateImpactResult = {
  principalCents: Cents;
  termMonths: number;
  baseIndex: number;
  baseAnnualRateBasisPoints: BasisPoints;
  rows: RateImpactRow[];
  calculationVersion: string;
};

export function rateImpact(input: RateImpactInput): RateImpactResult {
  const rates = input.annualRatesBasisPoints;
  if (rates.length === 0) throw new RangeError("at least one rate is required");
  if (rates.length > MAX_COMPARED_RATES) {
    throw new RangeError(`at most ${MAX_COMPARED_RATES} rates can be compared`);
  }
  for (const rate of rates) assertBasisPoints(rate, "annualRateBasisPoints");

  const baseIndex = input.baseIndex ?? 0;
  if (!Number.isInteger(baseIndex) || baseIndex < 0 || baseIndex >= rates.length) {
    throw new RangeError("baseIndex must point at one of the supplied rates");
  }

  const priced = rates.map((annualRateBasisPoints) => {
    const schedule = amortizationSchedule({
      principalCents: input.principalCents,
      annualRateBasisPoints,
      termMonths: input.termMonths
    });
    return {
      annualRateBasisPoints,
      monthlyPaymentCents: schedule.scheduledPaymentCents,
      totalInterestCents: schedule.totalInterestCents,
      totalPaidCents: schedule.totalPaidCents
    };
  });

  const base = priced[baseIndex];
  if (base === undefined) throw new RangeError("baseIndex must point at one of the supplied rates");

  return {
    principalCents: input.principalCents,
    termMonths: input.termMonths,
    baseIndex,
    baseAnnualRateBasisPoints: base.annualRateBasisPoints,
    rows: priced.map((row, index) => ({
      ...row,
      monthlyPaymentDeltaCents: row.monthlyPaymentCents - base.monthlyPaymentCents,
      totalInterestDeltaCents: row.totalInterestCents - base.totalInterestCents,
      isBase: index === baseIndex
    })),
    calculationVersion: CALCULATION_VERSION
  };
}

/** Signed money for a delta column: "+$142", "-$142", or "—" at zero. */
export function formatSignedUsd(cents: Cents, format: (value: Cents) => string): string {
  if (cents === 0) return "—";
  return cents > 0 ? `+${format(cents)}` : `-${format(Math.abs(cents))}`;
}
