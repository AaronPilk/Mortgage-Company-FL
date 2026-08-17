/**
 * Debt-to-income ratios.
 *
 * Two numbers: housing cost over income (front end) and all monthly obligations
 * over income (back end). The reference points this module carries are the
 * conventional 28 and 43 figures, and they are reference points only. They are
 * not thresholds for approval, and nothing here evaluates credit or eligibility.
 */

import {
  type BasisPoints,
  type Cents,
  assertBasisPoints,
  assertNonNegativeCents,
  roundCents,
  sumCents
} from "./money";
import { CALCULATION_VERSION } from "./payment";

/** Conventional housing-ratio reference point, 28.00%. Not an approval limit. */
export const REFERENCE_FRONT_END_RATIO_BP = 2_800;
/** Conventional total-debt reference point, 43.00%. Not an approval limit. */
export const REFERENCE_BACK_END_RATIO_BP = 4_300;

export type DebtToIncomeInput = {
  /** Every income source, summed here rather than in a component. */
  monthlyIncomeSourcesCents: readonly Cents[];
  /** Principal, interest, taxes, insurance, association dues, mortgage insurance. */
  housingPaymentComponentsCents: readonly Cents[];
  /** Recurring non-housing obligations. An empty list is a valid zero. */
  monthlyDebtPaymentsCents: readonly Cents[];
  frontEndReferenceBasisPoints?: BasisPoints;
  backEndReferenceBasisPoints?: BasisPoints;
};

export type DebtToIncomeResult = {
  grossMonthlyIncomeCents: Cents;
  housingPaymentCents: Cents;
  otherDebtPaymentsCents: Cents;
  totalObligationsCents: Cents;
  /** Basis points of gross monthly income. Null when there is no income to divide by. */
  frontEndRatioBasisPoints: number | null;
  backEndRatioBasisPoints: number | null;
  frontEndReferenceBasisPoints: BasisPoints;
  backEndReferenceBasisPoints: BasisPoints;
  /** Housing payment the reference point allows, and how much of it is unused. */
  frontEndReferenceHousingCents: Cents;
  backEndReferenceHousingCents: Cents;
  frontEndHeadroomCents: Cents;
  backEndHeadroomCents: Cents;
  withinFrontEndReference: boolean;
  withinBackEndReference: boolean;
  /** Which reference point leaves less room. "none" when income is zero. */
  bindingRatio: "front_end" | "back_end" | "none";
  calculationVersion: string;
};

function total(values: readonly Cents[], label: string): Cents {
  for (const value of values) assertNonNegativeCents(value, label);
  return sumCents(values);
}

export function debtToIncome(input: DebtToIncomeInput): DebtToIncomeResult {
  const grossMonthlyIncomeCents = total(input.monthlyIncomeSourcesCents, "monthlyIncomeSource");
  const housingPaymentCents = total(input.housingPaymentComponentsCents, "housingPaymentComponent");
  const otherDebtPaymentsCents = total(input.monthlyDebtPaymentsCents, "monthlyDebtPayment");
  const totalObligationsCents = housingPaymentCents + otherDebtPaymentsCents;

  const frontEndReferenceBasisPoints = assertBasisPoints(
    input.frontEndReferenceBasisPoints ?? REFERENCE_FRONT_END_RATIO_BP,
    "frontEndReferenceBasisPoints"
  );
  const backEndReferenceBasisPoints = assertBasisPoints(
    input.backEndReferenceBasisPoints ?? REFERENCE_BACK_END_RATIO_BP,
    "backEndReferenceBasisPoints"
  );

  const ratio = (numeratorCents: Cents): number | null =>
    grossMonthlyIncomeCents === 0
      ? null
      : Math.round((numeratorCents * 10_000) / grossMonthlyIncomeCents);

  const frontEndReferenceHousingCents = roundCents(
    (grossMonthlyIncomeCents * frontEndReferenceBasisPoints) / 10_000
  );
  const backEndReferenceHousingCents = Math.max(
    0,
    roundCents((grossMonthlyIncomeCents * backEndReferenceBasisPoints) / 10_000) -
      otherDebtPaymentsCents
  );

  const frontEndHeadroomCents = frontEndReferenceHousingCents - housingPaymentCents;
  const backEndHeadroomCents = backEndReferenceHousingCents - housingPaymentCents;

  return {
    grossMonthlyIncomeCents,
    housingPaymentCents,
    otherDebtPaymentsCents,
    totalObligationsCents,
    frontEndRatioBasisPoints: ratio(housingPaymentCents),
    backEndRatioBasisPoints: ratio(totalObligationsCents),
    frontEndReferenceBasisPoints,
    backEndReferenceBasisPoints,
    frontEndReferenceHousingCents,
    backEndReferenceHousingCents,
    frontEndHeadroomCents,
    backEndHeadroomCents,
    withinFrontEndReference: frontEndHeadroomCents >= 0,
    withinBackEndReference: backEndHeadroomCents >= 0,
    bindingRatio:
      grossMonthlyIncomeCents === 0
        ? "none"
        : backEndHeadroomCents < frontEndHeadroomCents
          ? "back_end"
          : "front_end",
    calculationVersion: CALCULATION_VERSION
  };
}

/** Renders a ratio in basis points as a percentage, or a dash when undefined. */
export function formatRatioPercent(basisPoints: number | null): string {
  if (basisPoints === null) return "—";
  return `${(basisPoints / 100).toFixed(1)}%`;
}
