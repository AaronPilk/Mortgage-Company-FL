/**
 * Renovation, addition, and interior upgrade.
 *
 * The hard part of this family is not the arithmetic — it is refusing to invent
 * the after-improvement value. There is no comparable-sales feed here, so the
 * value figure is derived from spend times a share the user can see and change,
 * and it is labelled as exactly that everywhere it appears.
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

export type SpendBasis = {
  cents: Cents;
  suppliedByUser: boolean;
  /** How the figure was arrived at, in words the reader can check. */
  basis: string;
};

export function improvementSpendBasis(
  input: VisionInput,
  assumptions: ResolvedAssumptions
): SpendBasis {
  const budget = input.improvementBudgetCents;
  if (budget !== undefined && Number.isFinite(budget) && budget >= 0) {
    return { cents: Math.round(budget), suppliedByUser: true, basis: "The budget you entered." };
  }

  if (input.analysisType === "addition") {
    const added = positiveCount(input.addedSquareFeet);
    if (added === null) {
      return {
        cents: 0,
        suppliedByUser: false,
        basis: "No budget and no added square footage were entered, so there is no scope to cost."
      };
    }
    const rate = assumptions.additionCostPerSquareFootCents.value;
    return {
      cents: added * rate,
      suppliedByUser: false,
      basis: `${added} added square feet at the placeholder addition rate.`
    };
  }

  if (input.analysisType === "interior_upgrade") {
    return {
      cents: assumptions.interiorUpgradeBudgetCents.value,
      suppliedByUser: false,
      basis: "The placeholder interior upgrade budget, because you did not enter one."
    };
  }

  const squareFeet = positiveCount(input.squareFeet);
  if (squareFeet === null) {
    return {
      cents: 0,
      suppliedByUser: false,
      basis: "No budget and no square footage were entered, so there is no scope to cost."
    };
  }
  const rate = assumptions.renovationCostPerSquareFootCents.value;
  return {
    cents: squareFeet * rate,
    suppliedByUser: false,
    basis: `${squareFeet} square feet at the placeholder renovation rate.`
  };
}

export type AfterValueBasis = {
  suppliedByUser: boolean;
  basis: string;
};

export function afterValueBasis(input: VisionInput): AfterValueBasis {
  if (input.expectedAfterValueCents !== undefined) {
    return {
      suppliedByUser: true,
      basis: "The after-improvement value you entered. Nothing here verifies it."
    };
  }
  return {
    suppliedByUser: false,
    basis:
      "Purchase price or current value, plus a modelled share of what you spend. It is not derived from comparable sales and it is not an appraisal."
  };
}

/**
 * After-improvement value, before the case value multiplier is applied.
 * Shared with the flip model, which needs the same number under a different name.
 */
export function modelledAfterValueCents(
  input: VisionInput,
  assumptions: ResolvedAssumptions,
  totalSpendCents: Cents
): Cents {
  const expected = input.expectedAfterValueCents;
  if (expected !== undefined && Number.isFinite(expected)) return Math.max(0, Math.round(expected));
  const uplift = scaleCents(totalSpendCents, assumptions.valueUpliftShareOfSpendBasisPoints.value);
  return Math.max(0, nonNegativeCents(input.purchasePriceCents) + uplift);
}

export type ImprovementCaseFigures = {
  acquisitionCostCents: Cents;
  improvementBudgetCents: Cents;
  contingencyCents: Cents;
  totalImprovementCents: Cents;
  monthlyCarryCents: Cents;
  holdingCostCents: Cents;
  totalProjectCostCents: Cents;
  afterImprovementValueCents: Cents;
  modelledValueUpliftCents: Cents;
  valueNetOfSpendCents: Cents;
  costPerSquareFootCents: number | null;
};

export const IMPROVEMENT_ASSUMPTION_KEYS: readonly AssumptionKey[] = [
  "renovationCostPerSquareFootCents",
  "additionCostPerSquareFootCents",
  "interiorUpgradeBudgetCents",
  "contingencyRateBasisPoints",
  "acquisitionCostRateBasisPoints",
  "valueUpliftShareOfSpendBasisPoints",
  "annualPropertyTaxRateBasisPoints",
  "annualInsuranceRateBasisPoints",
  "monthlyUtilitiesCents",
  "improvementHoldMonths",
  "costSpreadDownBasisPoints",
  "costSpreadUpBasisPoints",
  "valueSpreadDownBasisPoints",
  "valueSpreadUpBasisPoints",
  "rateSpreadBasisPoints"
];

export function computeImprovementCase(
  input: VisionInput,
  assumptions: ResolvedAssumptions,
  factors: CaseFactors
): ImprovementCaseFigures {
  const priceCents = nonNegativeCents(input.purchasePriceCents);
  const purchasing = input.ownership === "purchasing";

  const acquisitionCostCents = purchasing
    ? priceCents + scaleCents(priceCents, assumptions.acquisitionCostRateBasisPoints.value)
    : 0;

  const spend = improvementSpendBasis(input, assumptions);
  const improvementBudgetCents = scaleCents(spend.cents, factors.costMultiplierBasisPoints);
  const contingencyCents = scaleCents(
    improvementBudgetCents,
    assumptions.contingencyRateBasisPoints.value
  );
  const totalImprovementCents = improvementBudgetCents + contingencyCents;

  const carry = carryingCosts(input, assumptions, priceCents);
  const financedCents = purchasing
    ? Math.max(0, priceCents - nonNegativeCents(input.downPaymentCents))
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

  const holdMonths = positiveCount(input.holdMonths) ?? assumptions.improvementHoldMonths.value;
  const holdingCostCents = scaleCents(
    monthlyCarryCents * holdMonths,
    factors.costMultiplierBasisPoints
  );

  const totalProjectCostCents = acquisitionCostCents + totalImprovementCents + holdingCostCents;

  const afterImprovementValueCents = scaleCents(
    modelledAfterValueCents(input, assumptions, totalImprovementCents),
    factors.valueMultiplierBasisPoints
  );
  const modelledValueUpliftCents = afterImprovementValueCents - priceCents;
  const valueNetOfSpendCents =
    modelledValueUpliftCents - (totalImprovementCents + holdingCostCents);

  const sizeForRate =
    input.analysisType === "addition"
      ? positiveCount(input.addedSquareFeet)
      : positiveCount(input.squareFeet);

  return {
    acquisitionCostCents,
    improvementBudgetCents,
    contingencyCents,
    totalImprovementCents,
    monthlyCarryCents,
    holdingCostCents,
    totalProjectCostCents,
    afterImprovementValueCents,
    modelledValueUpliftCents,
    valueNetOfSpendCents,
    costPerSquareFootCents:
      sizeForRate === null ? null : roundCents(totalImprovementCents / sizeForRate)
  };
}
