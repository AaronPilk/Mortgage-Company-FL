/**
 * Debt service coverage ratio.
 *
 * Gross rent divided by the full housing obligation on the property — principal,
 * interest, taxes, insurance, and association dues. The reference bands below
 * describe how the ratio is commonly discussed in the market. They are general
 * reference only. They are not TRACT underwriting, not any lender's guideline,
 * and not a statement that a scenario will be approved.
 */

import {
  type BasisPoints,
  type Cents,
  assertNonNegativeCents,
  roundCents,
  sumCents
} from "./money";
import { CALCULATION_VERSION, monthlyPrincipalAndInterest } from "./payment";

export type DebtServiceCoverageInput = {
  grossMonthlyRentCents: Cents;
  loanAmountCents: Cents;
  annualRateBasisPoints: BasisPoints;
  termMonths: number;
  annualPropertyTaxCents?: Cents;
  annualInsuranceCents?: Cents;
  monthlyHoaCents?: Cents;
  monthlyMortgageInsuranceCents?: Cents;
};

export type DebtServiceCoverageResult = {
  grossMonthlyRentCents: Cents;
  principalAndInterestCents: Cents;
  propertyTaxCents: Cents;
  insuranceCents: Cents;
  hoaCents: Cents;
  mortgageInsuranceCents: Cents;
  pitiaCents: Cents;
  /** Rent minus PITIA. Negative means the payment exceeds the rent. */
  monthlyCoverageCents: Cents;
  /** Ratio scaled by 10,000, so 12,500 reads as 1.25x. Null when PITIA is zero. */
  ratioBasisPoints: number | null;
  /** Rent that would put the ratio exactly at 1.00x. */
  breakEvenRentCents: Cents;
  calculationVersion: string;
};

export function debtServiceCoverage(input: DebtServiceCoverageInput): DebtServiceCoverageResult {
  const grossMonthlyRentCents = assertNonNegativeCents(
    input.grossMonthlyRentCents,
    "grossMonthlyRentCents"
  );

  const principalAndInterestCents = monthlyPrincipalAndInterest({
    principalCents: input.loanAmountCents,
    annualRateBasisPoints: input.annualRateBasisPoints,
    termMonths: input.termMonths
  });

  const perMonth = (annualCents: Cents | undefined, label: string): Cents =>
    annualCents === undefined ? 0 : roundCents(assertNonNegativeCents(annualCents, label) / 12);

  const propertyTaxCents = perMonth(input.annualPropertyTaxCents, "annualPropertyTaxCents");
  const insuranceCents = perMonth(input.annualInsuranceCents, "annualInsuranceCents");
  const hoaCents = assertNonNegativeCents(input.monthlyHoaCents ?? 0, "monthlyHoaCents");
  const mortgageInsuranceCents = assertNonNegativeCents(
    input.monthlyMortgageInsuranceCents ?? 0,
    "monthlyMortgageInsuranceCents"
  );

  const pitiaCents = sumCents([
    principalAndInterestCents,
    propertyTaxCents,
    insuranceCents,
    hoaCents,
    mortgageInsuranceCents
  ]);

  return {
    grossMonthlyRentCents,
    principalAndInterestCents,
    propertyTaxCents,
    insuranceCents,
    hoaCents,
    mortgageInsuranceCents,
    pitiaCents,
    monthlyCoverageCents: grossMonthlyRentCents - pitiaCents,
    ratioBasisPoints:
      pitiaCents === 0 ? null : Math.round((grossMonthlyRentCents * 10_000) / pitiaCents),
    breakEvenRentCents: pitiaCents,
    calculationVersion: CALCULATION_VERSION
  };
}

export type DscrReferenceBand = {
  /** Inclusive lower bound of the band, scaled by 10,000. */
  minRatioBasisPoints: number;
  label: string;
  note: string;
};

/**
 * How the ratio is commonly described in the market. General reference only —
 * every lender sets its own guidelines, and this is not one of them.
 */
export const DSCR_REFERENCE_BANDS: readonly DscrReferenceBand[] = [
  {
    minRatioBasisPoints: 12_500,
    label: "1.25x and above",
    note: "Rent covers the payment with a wide margin under these inputs."
  },
  {
    minRatioBasisPoints: 12_000,
    label: "1.20x to 1.24x",
    note: "Rent covers the payment with a margin under these inputs."
  },
  {
    minRatioBasisPoints: 10_000,
    label: "1.00x to 1.19x",
    note: "Rent covers the payment, with little room for vacancy or repairs."
  },
  {
    minRatioBasisPoints: 0,
    label: "Below 1.00x",
    note: "Rent does not cover the payment under these inputs."
  }
];

export function dscrReferenceBand(ratioBasisPoints: number | null): DscrReferenceBand | null {
  if (ratioBasisPoints === null) return null;
  return DSCR_REFERENCE_BANDS.find((band) => ratioBasisPoints >= band.minRatioBasisPoints) ?? null;
}

/** Renders a coverage ratio as "1.25x". */
export function formatCoverageRatio(ratioBasisPoints: number | null): string {
  if (ratioBasisPoints === null) return "—";
  return `${(ratioBasisPoints / 10_000).toFixed(2)}x`;
}
