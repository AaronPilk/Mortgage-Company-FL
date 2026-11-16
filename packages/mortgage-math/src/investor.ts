/**
 * Investor snapshot: short-term-rental revenue and the quick-screen ratios.
 *
 * A COMPOSITION layer over the audited engines, not a second one. Cash flow
 * comes from `rentalCashFlow` (scenarios.ts) and coverage from
 * `debtServiceCoverage` (dscr.ts); this file only adds what neither has:
 *
 *   - a nightly-rate × occupancy revenue estimate, so a short-term rental can
 *     feed the same cash-flow engine a long-term rental does;
 *   - gross rent multiplier and rent-to-price, the two screens investors run
 *     before anything else.
 *
 * Every figure is an estimate from inputs the user typed. Nothing here is a
 * rate, a quote, an approval, or a statement of what any lender will lend.
 */

import { type DebtServiceCoverageResult, debtServiceCoverage } from "./dscr";
import { type BasisPoints, type Cents, assertBasisPoints, assertNonNegativeCents } from "./money";
import { CALCULATION_VERSION } from "./payment";
import { type RentalCashFlowInput, type RentalCashFlowResult, rentalCashFlow } from "./scenarios";

export type ShortTermRevenueInput = {
  /** Average nightly rate the owner expects to collect, before platform fees. */
  averageDailyRateCents: Cents;
  /** Share of nights booked, in basis points (6_500 = 65%). */
  occupancyRateBasisPoints: BasisPoints;
  /** Nights the home is available to guests. Defaults to the full year. */
  availableNightsPerYear?: number;
};

export type ShortTermRevenueResult = {
  bookedNightsPerYear: number;
  annualRevenueCents: Cents;
  /** Annual revenue spread evenly; the figure the cash-flow engine takes as "rent". */
  monthlyRevenueCents: Cents;
  calculationVersion: string;
};

/**
 * Nightly rate × nights booked, as a monthly figure. Seasonality is deliberately
 * not modelled: a single annual occupancy is what the user can actually
 * estimate, and spreading it evenly is the honest default. Nights are clamped
 * to a calendar year.
 */
export function estimateShortTermMonthlyRevenue(
  input: ShortTermRevenueInput
): ShortTermRevenueResult {
  const adr = assertNonNegativeCents(input.averageDailyRateCents, "averageDailyRateCents");
  const occupancy = assertBasisPoints(input.occupancyRateBasisPoints, "occupancyRateBasisPoints");
  // An occupancy is a share of nights, so 100% is the ceiling (the generic
  // basis-point guard allows rates above that, which make sense for yields).
  if (occupancy > 10_000) throw new RangeError("occupancyRateBasisPoints must not exceed 10,000");
  const available = Math.min(365, Math.max(0, Math.round(input.availableNightsPerYear ?? 365)));
  const bookedNightsPerYear = Math.round((available * occupancy) / 10_000);
  const annualRevenueCents = adr * bookedNightsPerYear;
  return {
    bookedNightsPerYear,
    annualRevenueCents,
    monthlyRevenueCents: Math.round(annualRevenueCents / 12),
    calculationVersion: CALCULATION_VERSION
  };
}

/** Price ÷ annual gross rent. Null when there is no rent. */
export function grossRentMultiplier(
  purchasePriceCents: Cents,
  grossMonthlyRentCents: Cents
): number | null {
  const annual = assertNonNegativeCents(grossMonthlyRentCents, "grossMonthlyRentCents") * 12;
  if (annual <= 0) return null;
  return Math.round((purchasePriceCents / annual) * 100) / 100;
}

/** Monthly rent as a share of price, in basis points (100 = the "1% rule"). Null when there is no price. */
export function rentToPriceBasisPoints(
  purchasePriceCents: Cents,
  grossMonthlyRentCents: Cents
): BasisPoints | null {
  if (purchasePriceCents <= 0) return null;
  return Math.round(
    (assertNonNegativeCents(grossMonthlyRentCents, "grossMonthlyRentCents") * 10_000) /
      purchasePriceCents
  );
}

export type InvestorSnapshotInput = RentalCashFlowInput;

export type InvestorSnapshotResult = {
  cashFlow: RentalCashFlowResult;
  coverage: DebtServiceCoverageResult;
  grossRentMultiplier: number | null;
  rentToPriceBasisPoints: BasisPoints | null;
  calculationVersion: string;
};

/**
 * One call, every screen: cash flow, coverage, GRM and rent-to-price from the
 * same inputs, so the page cannot drift between two sets of assumptions.
 */
export function investorSnapshot(input: InvestorSnapshotInput): InvestorSnapshotResult {
  const cashFlow = rentalCashFlow(input);
  const coverage = debtServiceCoverage({
    grossMonthlyRentCents: input.grossMonthlyRentCents,
    loanAmountCents: Math.max(0, input.purchasePriceCents - input.downPaymentCents),
    annualRateBasisPoints: input.annualRateBasisPoints,
    termMonths: input.termMonths,
    annualPropertyTaxCents: input.annualPropertyTaxCents,
    annualInsuranceCents: input.annualInsuranceCents,
    ...(input.monthlyHoaCents === undefined ? {} : { monthlyHoaCents: input.monthlyHoaCents })
  });
  return {
    cashFlow,
    coverage,
    grossRentMultiplier: grossRentMultiplier(input.purchasePriceCents, input.grossMonthlyRentCents),
    rentToPriceBasisPoints: rentToPriceBasisPoints(
      input.purchasePriceCents,
      input.grossMonthlyRentCents
    ),
    calculationVersion: CALCULATION_VERSION
  };
}
