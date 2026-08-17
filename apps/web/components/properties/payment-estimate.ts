import type { ListingSummary } from "@tract/integrations";
import {
  annualRateOfCents,
  assertNonNegativeCents,
  monthlyHousingCost,
  type HousingCostBreakdown
} from "@tract/mortgage-math";

/**
 * Illustrative payment estimate for a listing.
 *
 * Invariant 1: every figure below comes out of `@tract/mortgage-math`. Nothing
 * here multiplies or divides money itself — the down payment is a basis-point
 * rate applied to the price by `annualRateOfCents`, the loan amount is checked
 * back into integer cents, and the monthly breakdown is `monthlyHousingCost`.
 *
 * Invariant 6: the rate, the down payment, and the insurance premium are
 * assumptions this site chose, not offers, not market rates, and not anything
 * the reader has been quoted. They are exported so the page can print them next
 * to the number rather than bury them in a tooltip.
 */

export const PAYMENT_ASSUMPTIONS = {
  /** 20% of the list price. Chosen because it avoids mortgage insurance entirely. */
  downPaymentBasisPoints: 2_000,
  /**
   * A placeholder rate used only to demonstrate the arithmetic. It is not a
   * quote, not a rate available to anyone, and not tied to any market index.
   */
  annualRateBasisPoints: 650,
  termMonths: 360,
  /** A round Florida figure for illustration. Real premiums vary enormously. */
  annualHomeownersInsuranceCents: 3_600_00
} as const;

export type ListingPaymentEstimate = {
  purchasePriceCents: number;
  downPaymentCents: number;
  loanAmountCents: number;
  breakdown: HousingCostBreakdown;
  /** True when the listing supplied the figure; false when the assumption did. */
  usedListingTaxes: boolean;
  usedListingHoa: boolean;
};

/**
 * Returns `null` when the record has no price. A payment estimate on a
 * price-on-request record would be an invented number wearing a currency sign.
 */
export function estimateListingPayment(listing: ListingSummary): ListingPaymentEstimate | null {
  if (listing.listPriceCents === undefined) return null;

  const purchasePriceCents = assertNonNegativeCents(listing.listPriceCents, "listPriceCents");
  const downPaymentCents = annualRateOfCents(
    purchasePriceCents,
    PAYMENT_ASSUMPTIONS.downPaymentBasisPoints
  );
  const loanAmountCents = assertNonNegativeCents(
    purchasePriceCents - downPaymentCents,
    "loanAmountCents"
  );

  const breakdown = monthlyHousingCost({
    loanAmountCents,
    annualRateBasisPoints: PAYMENT_ASSUMPTIONS.annualRateBasisPoints,
    termMonths: PAYMENT_ASSUMPTIONS.termMonths,
    annualHomeownersInsuranceCents: PAYMENT_ASSUMPTIONS.annualHomeownersInsuranceCents,
    ...(listing.annualTaxAmountCents === undefined
      ? {}
      : { annualPropertyTaxCents: listing.annualTaxAmountCents }),
    ...(listing.monthlyHoaFeeCents === undefined
      ? {}
      : { monthlyHoaCents: listing.monthlyHoaFeeCents })
  });

  return {
    purchasePriceCents,
    downPaymentCents,
    loanAmountCents,
    breakdown,
    usedListingTaxes: listing.annualTaxAmountCents !== undefined,
    usedListingHoa: listing.monthlyHoaFeeCents !== undefined
  };
}
