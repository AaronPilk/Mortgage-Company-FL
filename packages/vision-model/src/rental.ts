/**
 * Long-term rental, short-term rental, and buy-and-hold.
 *
 * The cash-flow arithmetic is delegated to `@tract/mortgage-math` so there is
 * exactly one implementation of it on this site. What lives here is the part
 * that is specific to Vision: choosing the income figure honestly when the user
 * did not supply one, splitting short-term operating costs out of the long-term
 * shape, and solving the break-even rent rather than presenting cash flow as if
 * the rent assumption were settled.
 */

import {
  type BasisPoints,
  type Cents,
  debtServiceCoverage,
  monthlyPrincipalAndInterest,
  remainingBalance,
  rentalCashFlow,
  roundCents
} from "@tract/mortgage-math";
import type { AssumptionKey, ResolvedAssumptions } from "./assumptions";
import {
  type CaseFactors,
  caseRateBasisPoints,
  caseTermMonths,
  carryingCosts,
  nonNegativeCents,
  positiveCount
} from "./cases";
import { scaleBasisPoints, scaleCents } from "./range";
import type { VisionInput } from "./types";

/** Average days in a month. Used only to turn a nightly rate into a monthly figure. */
const DAYS_PER_MONTH = 30.4;

export type IncomeBasis = {
  grossMonthlyCents: Cents;
  suppliedByUser: boolean;
  basis: string;
};

/**
 * The gross income figure before vacancy. When the user supplied a rent this is
 * simply that rent. When they did not, it is a placeholder share of value, and
 * the wording says so — a rent-to-value share is not a rent estimate and the
 * unverified list carries it as blocking.
 */
export function incomeBasis(input: VisionInput, assumptions: ResolvedAssumptions): IncomeBasis {
  const priceCents = nonNegativeCents(input.purchasePriceCents);

  if (input.analysisType === "short_term_rental") {
    const nightly = input.nightlyRateCents;
    if (nightly !== undefined && Number.isFinite(nightly) && nightly > 0) {
      return {
        grossMonthlyCents: roundCents(Math.round(nightly) * DAYS_PER_MONTH),
        suppliedByUser: true,
        basis:
          "The nightly rate you entered, at full occupancy before the unbooked-nights assumption."
      };
    }
    const monthlyPlaceholder = scaleCents(
      priceCents,
      assumptions.monthlyRentToValueBasisPoints.value
    );
    const nightlyPlaceholder = scaleCents(
      roundCents(monthlyPlaceholder / DAYS_PER_MONTH),
      assumptions.shortTermNightlyPremiumBasisPoints.value
    );
    return {
      grossMonthlyCents: roundCents(nightlyPlaceholder * DAYS_PER_MONTH),
      suppliedByUser: false,
      basis:
        "A placeholder nightly rate derived from a placeholder long-term rent. Neither is market data. Enter a real nightly rate."
    };
  }

  const rent = input.grossMonthlyRentCents;
  if (rent !== undefined && Number.isFinite(rent) && rent > 0) {
    return {
      grossMonthlyCents: Math.round(rent),
      suppliedByUser: true,
      basis: "The gross monthly rent you entered."
    };
  }
  return {
    grossMonthlyCents: scaleCents(priceCents, assumptions.monthlyRentToValueBasisPoints.value),
    suppliedByUser: false,
    basis:
      "A placeholder share of value. It is not a rent estimate and not rent data. Enter a rent supported by comparable listings or an appraiser's rent schedule."
  };
}

export type RentalCaseFigures = {
  loanAmountCents: Cents;
  totalCashInvestedCents: Cents;
  grossMonthlyIncomeCents: Cents;
  effectiveGrossIncomeCents: Cents;
  operatingExpensesCents: Cents;
  netOperatingIncomeCents: Cents;
  debtServiceCents: Cents;
  monthlyCashFlowCents: Cents;
  annualCashFlowCents: Cents;
  /** Gross income at which monthly cash flow is exactly zero. Null when no income covers the costs. */
  breakEvenGrossIncomeCents: Cents | null;
  cashOnCashBasisPoints: number | null;
  capRateBasisPoints: number | null;
  dscrBasisPoints: number | null;
  /** Buy-and-hold only. Zero elsewhere so the shape stays uniform. */
  projectedValueCents: Cents;
  projectedLoanBalanceCents: Cents;
  projectedEquityCents: Cents;
};

export const LONG_TERM_ASSUMPTION_KEYS: readonly AssumptionKey[] = [
  "monthlyRentToValueBasisPoints",
  "longTermVacancyRateBasisPoints",
  "longTermManagementRateBasisPoints",
  "maintenanceRateBasisPoints",
  "capitalReserveRateBasisPoints",
  "acquisitionCostRateBasisPoints",
  "annualPropertyTaxRateBasisPoints",
  "annualInsuranceRateBasisPoints",
  "incomeSpreadDownBasisPoints",
  "incomeSpreadUpBasisPoints",
  "vacancySpreadBasisPoints",
  "rateSpreadBasisPoints"
];

export const SHORT_TERM_ASSUMPTION_KEYS: readonly AssumptionKey[] = [
  "monthlyRentToValueBasisPoints",
  "shortTermNightlyPremiumBasisPoints",
  "shortTermVacancyRateBasisPoints",
  "shortTermManagementRateBasisPoints",
  "shortTermPlatformFeeRateBasisPoints",
  "shortTermTurnoverCostRateBasisPoints",
  "maintenanceRateBasisPoints",
  "capitalReserveRateBasisPoints",
  "acquisitionCostRateBasisPoints",
  "annualPropertyTaxRateBasisPoints",
  "annualInsuranceRateBasisPoints",
  "monthlyUtilitiesCents",
  "incomeSpreadDownBasisPoints",
  "incomeSpreadUpBasisPoints",
  "vacancySpreadBasisPoints",
  "rateSpreadBasisPoints"
];

export const BUY_AND_HOLD_ASSUMPTION_KEYS: readonly AssumptionKey[] = [
  ...LONG_TERM_ASSUMPTION_KEYS,
  "annualAppreciationBasisPoints",
  "buyAndHoldMonths",
  "sellingCostRateBasisPoints",
  "valueSpreadDownBasisPoints",
  "valueSpreadUpBasisPoints"
];

type OperatingShape = {
  vacancyRateBasisPoints: BasisPoints;
  managementRateBasisPoints: BasisPoints;
  /** Costs charged against effective gross income beyond management. Short-term only. */
  extraVariableRateBasisPoints: BasisPoints;
  monthlyUtilitiesCents: Cents;
};

function operatingShape(
  input: VisionInput,
  assumptions: ResolvedAssumptions,
  factors: CaseFactors
): OperatingShape {
  if (input.analysisType === "short_term_rental") {
    return {
      vacancyRateBasisPoints: Math.min(
        9_500,
        scaleBasisPoints(
          assumptions.shortTermVacancyRateBasisPoints.value,
          factors.vacancyMultiplierBasisPoints
        )
      ),
      managementRateBasisPoints: assumptions.shortTermManagementRateBasisPoints.value,
      extraVariableRateBasisPoints:
        assumptions.shortTermPlatformFeeRateBasisPoints.value +
        assumptions.shortTermTurnoverCostRateBasisPoints.value,
      monthlyUtilitiesCents: assumptions.monthlyUtilitiesCents.value
    };
  }
  return {
    vacancyRateBasisPoints: Math.min(
      9_500,
      scaleBasisPoints(
        assumptions.longTermVacancyRateBasisPoints.value,
        factors.vacancyMultiplierBasisPoints
      )
    ),
    managementRateBasisPoints: assumptions.longTermManagementRateBasisPoints.value,
    extraVariableRateBasisPoints: 0,
    // A long-term tenant is assumed to pay utilities. The unverified list says so.
    monthlyUtilitiesCents: 0
  };
}

export function computeRentalCase(
  input: VisionInput,
  assumptions: ResolvedAssumptions,
  factors: CaseFactors
): RentalCaseFigures {
  const priceCents = nonNegativeCents(input.purchasePriceCents);
  const downPaymentCents = Math.min(priceCents, nonNegativeCents(input.downPaymentCents));
  const loanAmountCents = Math.max(0, priceCents - downPaymentCents);
  const rateBasisPoints = caseRateBasisPoints(input, factors);
  const termMonths = caseTermMonths(input);

  const income = incomeBasis(input, assumptions);
  const grossMonthlyIncomeCents = scaleCents(
    income.grossMonthlyCents,
    factors.incomeMultiplierBasisPoints
  );

  const shape = operatingShape(input, assumptions, factors);
  const carry = carryingCosts(input, assumptions, priceCents);

  const effectiveGrossBeforeExtras =
    grossMonthlyIncomeCents - scaleCents(grossMonthlyIncomeCents, shape.vacancyRateBasisPoints);
  const extraVariableCents = scaleCents(
    effectiveGrossBeforeExtras,
    shape.extraVariableRateBasisPoints
  );

  const cash = rentalCashFlow({
    purchasePriceCents: priceCents,
    downPaymentCents,
    annualRateBasisPoints: rateBasisPoints,
    termMonths,
    grossMonthlyRentCents: grossMonthlyIncomeCents,
    vacancyRateBasisPoints: shape.vacancyRateBasisPoints,
    managementRateBasisPoints: shape.managementRateBasisPoints,
    maintenanceRateBasisPoints: assumptions.maintenanceRateBasisPoints.value,
    capitalReserveRateBasisPoints: assumptions.capitalReserveRateBasisPoints.value,
    annualPropertyTaxCents: carry.annualPropertyTaxCents,
    annualInsuranceCents: carry.annualInsuranceCents,
    monthlyHoaCents: carry.monthlyHoaCents,
    monthlyUtilitiesCents: shape.monthlyUtilitiesCents + extraVariableCents,
    closingCostsCents: scaleCents(priceCents, assumptions.acquisitionCostRateBasisPoints.value),
    rehabCents: nonNegativeCents(input.improvementBudgetCents)
  });

  // A short-term listing never collects its full-occupancy gross, so coverage is
  // measured against income after unbooked nights. Using the headline nightly
  // figure would flatter the ratio by exactly the vacancy assumption.
  const coverageIncomeCents =
    input.analysisType === "short_term_rental"
      ? cash.effectiveGrossIncomeCents
      : grossMonthlyIncomeCents;

  const coverage = debtServiceCoverage({
    grossMonthlyRentCents: coverageIncomeCents,
    loanAmountCents,
    annualRateBasisPoints: rateBasisPoints,
    termMonths,
    annualPropertyTaxCents: carry.annualPropertyTaxCents,
    annualInsuranceCents: carry.annualInsuranceCents,
    monthlyHoaCents: carry.monthlyHoaCents
  });

  // Solve gross income G where NOI equals debt service. Management and the
  // short-term extras scale with effective gross income; maintenance and
  // reserves scale with gross; everything else is fixed.
  const fixedMonthlyCents =
    roundCents(carry.annualPropertyTaxCents / 12) +
    roundCents(carry.annualInsuranceCents / 12) +
    carry.monthlyHoaCents +
    shape.monthlyUtilitiesCents;
  const occupancy = 1 - shape.vacancyRateBasisPoints / 10_000;
  const variableShare =
    occupancy *
      (1 - shape.managementRateBasisPoints / 10_000 - shape.extraVariableRateBasisPoints / 10_000) -
    (assumptions.maintenanceRateBasisPoints.value +
      assumptions.capitalReserveRateBasisPoints.value) /
      10_000;
  const breakEvenGrossIncomeCents =
    variableShare <= 0
      ? null
      : roundCents((fixedMonthlyCents + cash.debtServiceCents) / variableShare);

  const holdMonths =
    input.analysisType === "buy_and_hold"
      ? (positiveCount(input.holdMonths) ?? assumptions.buyAndHoldMonths.value)
      : 0;

  let projectedValueCents = 0;
  let projectedLoanBalanceCents = 0;
  if (holdMonths > 0) {
    const monthlyGrowth = assumptions.annualAppreciationBasisPoints.value / 10_000 / 12;
    projectedValueCents = scaleCents(
      roundCents(priceCents * Math.pow(1 + monthlyGrowth, holdMonths)),
      factors.valueMultiplierBasisPoints
    );
    projectedLoanBalanceCents =
      loanAmountCents === 0
        ? 0
        : remainingBalance({
            principalCents: loanAmountCents,
            annualRateBasisPoints: rateBasisPoints,
            termMonths,
            afterMonths: Math.min(holdMonths, termMonths)
          });
  }

  return {
    loanAmountCents,
    totalCashInvestedCents: cash.totalCashInvestedCents,
    grossMonthlyIncomeCents,
    effectiveGrossIncomeCents: cash.effectiveGrossIncomeCents,
    operatingExpensesCents: cash.operatingExpensesCents,
    netOperatingIncomeCents: cash.netOperatingIncomeCents,
    debtServiceCents: cash.debtServiceCents,
    monthlyCashFlowCents: cash.monthlyCashFlowCents,
    annualCashFlowCents: cash.annualCashFlowCents,
    breakEvenGrossIncomeCents,
    cashOnCashBasisPoints: cash.cashOnCashReturnBasisPoints,
    capRateBasisPoints: cash.capRateBasisPoints,
    dscrBasisPoints: coverage.ratioBasisPoints,
    projectedValueCents,
    projectedLoanBalanceCents,
    projectedEquityCents: Math.max(0, projectedValueCents - projectedLoanBalanceCents)
  };
}

/** Exposed for tests that need the same payment the rental model uses. */
export function rentalDebtServiceCents(
  input: VisionInput,
  factors: CaseFactors,
  loanAmountCents: Cents
): Cents {
  if (loanAmountCents === 0) return 0;
  return monthlyPrincipalAndInterest({
    principalCents: loanAmountCents,
    annualRateBasisPoints: caseRateBasisPoints(input, factors),
    termMonths: caseTermMonths(input)
  });
}
