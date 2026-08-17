/**
 * Land plus new construction.
 *
 * Completed value is the number everyone wants and the one this model is least
 * entitled to produce. Absent an expected value from the user it is modelled as
 * a ratio of delivered cost, which is transparently circular — and saying so is
 * more useful than a fabricated dollar-per-square-foot value that reads like a
 * comp.
 */

import { type Cents, roundCents } from "@tract/mortgage-math";
import { monthlyPrincipalAndInterest } from "@tract/mortgage-math";
import type { AssumptionKey, ResolvedAssumptions } from "./assumptions";
import {
  type CaseFactors,
  caseRateBasisPoints,
  caseTermMonths,
  carryingCosts,
  nonNegativeCents,
  positiveCount
} from "./cases";
import { scaleCents } from "./range";
import type { VisionInput } from "./types";
import type { SpendBasis } from "./improvement";

export function hardCostBasis(input: VisionInput, assumptions: ResolvedAssumptions): SpendBasis {
  const budget = input.improvementBudgetCents;
  if (budget !== undefined && Number.isFinite(budget) && budget >= 0) {
    return {
      cents: Math.round(budget),
      suppliedByUser: true,
      basis: "The construction budget you entered."
    };
  }
  const size = positiveCount(input.buildSquareFeet);
  if (size === null) {
    return {
      cents: 0,
      suppliedByUser: false,
      basis: "No budget and no planned square footage were entered, so there is nothing to cost."
    };
  }
  return {
    cents: size * assumptions.newConstructionCostPerSquareFootCents.value,
    suppliedByUser: false,
    basis: `${size} planned square feet at the placeholder hard cost rate.`
  };
}

export type ConstructionCaseFigures = {
  landCostCents: Cents;
  hardCostCents: Cents;
  softCostCents: Cents;
  contingencyCents: Cents;
  monthlyCarryCents: Cents;
  holdingCostCents: Cents;
  totalDeliveredCostCents: Cents;
  completedValueCents: Cents;
  valueNetOfCostCents: Cents;
  deliveredCostPerSquareFootCents: number | null;
};

export const CONSTRUCTION_ASSUMPTION_KEYS: readonly AssumptionKey[] = [
  "newConstructionCostPerSquareFootCents",
  "softCostRateBasisPoints",
  "contingencyRateBasisPoints",
  "acquisitionCostRateBasisPoints",
  "completedValueToCostRatioBasisPoints",
  "annualPropertyTaxRateBasisPoints",
  "annualInsuranceRateBasisPoints",
  "monthlyUtilitiesCents",
  "constructionMonths",
  "costSpreadDownBasisPoints",
  "costSpreadUpBasisPoints",
  "valueSpreadDownBasisPoints",
  "valueSpreadUpBasisPoints",
  "rateSpreadBasisPoints"
];

export function computeConstructionCase(
  input: VisionInput,
  assumptions: ResolvedAssumptions,
  factors: CaseFactors
): ConstructionCaseFigures {
  const landPriceCents = nonNegativeCents(input.purchasePriceCents);
  const purchasing = input.ownership === "purchasing";
  const landCostCents = purchasing
    ? landPriceCents + scaleCents(landPriceCents, assumptions.acquisitionCostRateBasisPoints.value)
    : landPriceCents;

  const hard = hardCostBasis(input, assumptions);
  const hardCostCents = scaleCents(hard.cents, factors.costMultiplierBasisPoints);
  const softCostCents = scaleCents(hardCostCents, assumptions.softCostRateBasisPoints.value);
  const contingencyCents = scaleCents(
    hardCostCents + softCostCents,
    assumptions.contingencyRateBasisPoints.value
  );

  const carry = carryingCosts(input, assumptions, landPriceCents);
  const financedCents = purchasing
    ? Math.max(0, landPriceCents - nonNegativeCents(input.downPaymentCents))
    : 0;
  const debtServiceCents =
    financedCents === 0
      ? 0
      : monthlyPrincipalAndInterest({
          principalCents: financedCents,
          annualRateBasisPoints: caseRateBasisPoints(input, factors),
          termMonths: caseTermMonths(input)
        });
  const monthlyCarryCents = carry.monthlyNonDebtCarryCents + debtServiceCents;

  const months = positiveCount(input.holdMonths) ?? assumptions.constructionMonths.value;
  const holdingCostCents = scaleCents(
    monthlyCarryCents * months,
    factors.costMultiplierBasisPoints
  );

  const totalDeliveredCostCents =
    landCostCents + hardCostCents + softCostCents + contingencyCents + holdingCostCents;

  const expected = input.expectedAfterValueCents;
  const completedValueBeforeCase =
    expected !== undefined && Number.isFinite(expected)
      ? Math.max(0, Math.round(expected))
      : scaleCents(totalDeliveredCostCents, assumptions.completedValueToCostRatioBasisPoints.value);
  const completedValueCents = scaleCents(
    completedValueBeforeCase,
    factors.valueMultiplierBasisPoints
  );

  const size = positiveCount(input.buildSquareFeet);

  return {
    landCostCents,
    hardCostCents,
    softCostCents,
    contingencyCents,
    monthlyCarryCents,
    holdingCostCents,
    totalDeliveredCostCents,
    completedValueCents,
    valueNetOfCostCents: completedValueCents - totalDeliveredCostCents,
    deliveredCostPerSquareFootCents:
      size === null ? null : roundCents(totalDeliveredCostCents / size)
  };
}
