/**
 * Fix and flip.
 *
 * The resale figure is the whole scenario, and it is the figure this model has
 * no right to assert. So the headline output here is deliberately the
 * break-even resale price — the number at which the project returns exactly
 * nothing — rather than a profit figure resting on an invented after-repair
 * value. Break-even is arithmetic on costs the user can check. Profit is not.
 */

import { type Cents, flipScenario, roundCents } from "@tract/mortgage-math";
import type { AssumptionKey, ResolvedAssumptions } from "./assumptions";
import {
  type CaseFactors,
  caseRateBasisPoints,
  carryingCosts,
  nonNegativeCents,
  positiveCount
} from "./cases";
import { improvementSpendBasis, modelledAfterValueCents } from "./improvement";
import { scaleCents } from "./range";
import type { VisionInput } from "./types";

export type FlipCaseFigures = {
  purchasePriceCents: Cents;
  acquisitionCostsCents: Cents;
  rehabBudgetCents: Cents;
  contingencyCents: Cents;
  totalRehabCents: Cents;
  financingCostCents: Cents;
  holdingCostCents: Cents;
  sellingCostCents: Cents;
  totalProjectCostCents: Cents;
  totalCashInvestedCents: Cents;
  modelledResaleValueCents: Cents;
  grossMarginCents: Cents;
  /** Resale price at which the project returns exactly zero. Null if selling costs consume everything. */
  breakEvenResaleCents: Cents | null;
  returnOnCostBasisPoints: number | null;
};

export const FLIP_ASSUMPTION_KEYS: readonly AssumptionKey[] = [
  "renovationCostPerSquareFootCents",
  "contingencyRateBasisPoints",
  "acquisitionCostRateBasisPoints",
  "sellingCostRateBasisPoints",
  "financingPointsBasisPoints",
  "valueUpliftShareOfSpendBasisPoints",
  "annualPropertyTaxRateBasisPoints",
  "annualInsuranceRateBasisPoints",
  "monthlyUtilitiesCents",
  "flipHoldMonths",
  "costSpreadDownBasisPoints",
  "costSpreadUpBasisPoints",
  "valueSpreadDownBasisPoints",
  "valueSpreadUpBasisPoints",
  "rateSpreadBasisPoints"
];

export function computeFlipCase(
  input: VisionInput,
  assumptions: ResolvedAssumptions,
  factors: CaseFactors
): FlipCaseFigures {
  const purchasePriceCents = nonNegativeCents(input.purchasePriceCents);
  const acquisitionCostsCents = scaleCents(
    purchasePriceCents,
    assumptions.acquisitionCostRateBasisPoints.value
  );

  const spend = improvementSpendBasis(input, assumptions);
  const rehabBudgetCents = scaleCents(spend.cents, factors.costMultiplierBasisPoints);

  const carry = carryingCosts(input, assumptions, purchasePriceCents);
  const holdingMonths = positiveCount(input.holdMonths) ?? assumptions.flipHoldMonths.value;
  const monthlyHoldingCostsCents = scaleCents(
    carry.monthlyNonDebtCarryCents,
    factors.costMultiplierBasisPoints
  );

  const downPaymentCents = Math.min(purchasePriceCents, nonNegativeCents(input.downPaymentCents));
  const financedAmountCents = Math.max(0, purchasePriceCents - downPaymentCents);

  const contingencyRate = assumptions.contingencyRateBasisPoints.value;
  const sellingCostRate = assumptions.sellingCostRateBasisPoints.value;

  const modelledResaleValueCents = scaleCents(
    modelledAfterValueCents(
      input,
      assumptions,
      rehabBudgetCents + scaleCents(rehabBudgetCents, contingencyRate)
    ),
    factors.valueMultiplierBasisPoints
  );

  const flip = flipScenario({
    purchasePriceCents,
    acquisitionCostsCents,
    rehabBudgetCents,
    contingencyRateBasisPoints: contingencyRate,
    holdingMonths,
    monthlyHoldingCostsCents,
    financedAmountCents,
    financingAnnualRateBasisPoints: caseRateBasisPoints(input, factors),
    financingPointsBasisPoints: assumptions.financingPointsBasisPoints.value,
    afterRepairValueCents: modelledResaleValueCents,
    sellingCostRateBasisPoints: sellingCostRate
  });

  const costExcludingSaleCents =
    purchasePriceCents +
    acquisitionCostsCents +
    flip.totalRehabCents +
    flip.financingCostCents +
    flip.holdingCostCents;

  const breakEvenResaleCents =
    sellingCostRate >= 10_000
      ? null
      : roundCents(costExcludingSaleCents / (1 - sellingCostRate / 10_000));

  return {
    purchasePriceCents,
    acquisitionCostsCents,
    rehabBudgetCents,
    contingencyCents: flip.contingencyCents,
    totalRehabCents: flip.totalRehabCents,
    financingCostCents: flip.financingCostCents,
    holdingCostCents: flip.holdingCostCents,
    sellingCostCents: flip.sellingCostCents,
    totalProjectCostCents: flip.totalProjectCostCents,
    totalCashInvestedCents:
      downPaymentCents + acquisitionCostsCents + flip.totalRehabCents + flip.holdingCostCents,
    modelledResaleValueCents,
    grossMarginCents: flip.estimatedGrossProfitCents,
    breakEvenResaleCents,
    returnOnCostBasisPoints: flip.returnOnCostBasisPoints
  };
}
