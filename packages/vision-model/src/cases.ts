/**
 * Case construction.
 *
 * Each of the three runs is one internally coherent world: in the unfavourable
 * case costs run over *and* value comes in soft *and* rent disappoints *and* the
 * rate is higher, all at once. That is deliberately not the same as taking the
 * worst arithmetic corner of each input independently, and it is also not a
 * probability — it is one plausible story per end of the band.
 */

import { type BasisPoints, type Cents, roundCents } from "@tract/mortgage-math";
import type { ResolvedAssumptions } from "./assumptions";
import type { ScenarioCase, VisionInput } from "./types";
import { scaleCents } from "./range";

export type CaseFactors = {
  scenarioCase: ScenarioCase;
  costMultiplierBasisPoints: number;
  valueMultiplierBasisPoints: number;
  incomeMultiplierBasisPoints: number;
  vacancyMultiplierBasisPoints: number;
  rateDeltaBasisPoints: number;
};

export function caseFactors(
  scenarioCase: ScenarioCase,
  assumptions: ResolvedAssumptions
): CaseFactors {
  const costDown = assumptions.costSpreadDownBasisPoints.value;
  const costUp = assumptions.costSpreadUpBasisPoints.value;
  const valueDown = assumptions.valueSpreadDownBasisPoints.value;
  const valueUp = assumptions.valueSpreadUpBasisPoints.value;
  const incomeDown = assumptions.incomeSpreadDownBasisPoints.value;
  const incomeUp = assumptions.incomeSpreadUpBasisPoints.value;
  const rateSpread = assumptions.rateSpreadBasisPoints.value;
  const vacancySpread = assumptions.vacancySpreadBasisPoints.value;

  if (scenarioCase === "base") {
    return {
      scenarioCase,
      costMultiplierBasisPoints: 10_000,
      valueMultiplierBasisPoints: 10_000,
      incomeMultiplierBasisPoints: 10_000,
      vacancyMultiplierBasisPoints: 10_000,
      rateDeltaBasisPoints: 0
    };
  }

  if (scenarioCase === "conservative") {
    return {
      scenarioCase,
      costMultiplierBasisPoints: 10_000 + costUp,
      valueMultiplierBasisPoints: 10_000 - valueDown,
      incomeMultiplierBasisPoints: 10_000 - incomeDown,
      vacancyMultiplierBasisPoints: 10_000 + vacancySpread,
      rateDeltaBasisPoints: rateSpread
    };
  }

  return {
    scenarioCase,
    costMultiplierBasisPoints: 10_000 - costDown,
    valueMultiplierBasisPoints: 10_000 + valueUp,
    incomeMultiplierBasisPoints: 10_000 + incomeUp,
    vacancyMultiplierBasisPoints: Math.max(0, 10_000 - vacancySpread),
    rateDeltaBasisPoints: -rateSpread
  };
}

/** Rates are unsigned in mortgage-math, so the optimistic case cannot push below zero. */
export function caseRateBasisPoints(input: VisionInput, factors: CaseFactors): BasisPoints {
  const base = input.annualRateBasisPoints ?? DEFAULT_RATE_BASIS_POINTS;
  return Math.max(0, Math.min(20_000, base + factors.rateDeltaBasisPoints));
}

/**
 * Used only when nobody entered a rate. It is a round placeholder chosen to be
 * obviously a placeholder, and the UI shows it as an input the user must set.
 * No rate anywhere in this package is quoted, offered, or available.
 */
export const DEFAULT_RATE_BASIS_POINTS = 700;
export const DEFAULT_TERM_MONTHS = 360;

export function caseTermMonths(input: VisionInput): number {
  const term = input.termMonths ?? DEFAULT_TERM_MONTHS;
  return Math.min(600, Math.max(1, Math.round(term)));
}

export function nonNegativeCents(value: number | undefined, fallback: Cents = 0): Cents {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value));
}

export function positiveCount(value: number | undefined): number | null {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return null;
  return Math.round(value);
}

export type CarryingCosts = {
  annualPropertyTaxCents: Cents;
  annualInsuranceCents: Cents;
  monthlyHoaCents: Cents;
  monthlyUtilitiesCents: Cents;
  /** Taxes, insurance, association dues, and utilities. Excludes debt service. */
  monthlyNonDebtCarryCents: Cents;
  taxesSuppliedByUser: boolean;
  insuranceSuppliedByUser: boolean;
};

/**
 * Taxes and insurance fall back to a rate on value. Both placeholders are poor
 * in Florida specifically — millage resets on sale and insurance is driven by
 * wind, roof age, and flood exposure — which is why both are flagged as
 * unverified whenever the model had to supply them.
 */
export function carryingCosts(
  input: VisionInput,
  assumptions: ResolvedAssumptions,
  valueCents: Cents
): CarryingCosts {
  const taxesSuppliedByUser = input.annualPropertyTaxCents !== undefined;
  const insuranceSuppliedByUser = input.annualInsuranceCents !== undefined;

  const annualPropertyTaxCents = taxesSuppliedByUser
    ? nonNegativeCents(input.annualPropertyTaxCents)
    : scaleCents(valueCents, assumptions.annualPropertyTaxRateBasisPoints.value);
  const annualInsuranceCents = insuranceSuppliedByUser
    ? nonNegativeCents(input.annualInsuranceCents)
    : scaleCents(valueCents, assumptions.annualInsuranceRateBasisPoints.value);
  const monthlyHoaCents = nonNegativeCents(input.monthlyHoaCents);
  const monthlyUtilitiesCents = assumptions.monthlyUtilitiesCents.value;

  return {
    annualPropertyTaxCents,
    annualInsuranceCents,
    monthlyHoaCents,
    monthlyUtilitiesCents,
    monthlyNonDebtCarryCents:
      roundCents(annualPropertyTaxCents / 12) +
      roundCents(annualInsuranceCents / 12) +
      monthlyHoaCents +
      monthlyUtilitiesCents,
    taxesSuppliedByUser,
    insuranceSuppliedByUser
  };
}
