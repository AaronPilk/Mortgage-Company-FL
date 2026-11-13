/**
 * Shared shapes for the home-lookup response.
 *
 * A types-only module so both the server orchestration and the client component
 * can import it without the client pulling in any `server-only` code.
 */

export type HomeLookupAddress = {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
};

export type HomeLookupFacts = {
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  livingAreaSqft: number | null;
  lotAreaSqft: number | null;
  yearBuilt: number | null;
};

/** Automated valuation — a starting point for the numbers, never an appraisal or a loan amount. */
export type HomeLookupValue = {
  estimateCents: number;
  lowCents: number | null;
  highCents: number | null;
};

/**
 * A first-glance monthly estimate anchored on the automated value. The client
 * recomputes as the visitor sets the real list price, their down payment, and
 * their income — this is only the view before they touch anything.
 */
export type HomeLookupBaseline = {
  anchorPriceCents: number;
  downPaymentBasisPoints: number;
  downPaymentCents: number;
  loanAmountCents: number;
  annualRateBasisPoints: number;
  termMonths: number;
  monthlyTotalCents: number;
  monthlyPrincipalInterestCents: number;
  monthlyTaxCents: number;
  monthlyInsuranceCents: number;
  monthlyFloodInsuranceCents: number;
  monthlyHoaCents: number;
  /** Annual figures behind the monthly lines, so the client can seed its editable fields. */
  annualHomeInsuranceCents: number;
  annualFloodInsuranceCents: number;
  /** True when property tax came from the provider record; false when it fell back to an assumption. */
  usedProviderTax: boolean;
};

/** FEMA flood-zone context for the home. A factual public record, heavily caveated. */
export type HomeLookupFlood = {
  zone: string;
  inSpecialFloodHazardArea: boolean;
  note: string;
};

export type HomeLookupResult = {
  address: HomeLookupAddress;
  facts: HomeLookupFacts;
  value: HomeLookupValue | null;
  assessedValueCents: number | null;
  annualTaxAmountCents: number | null;
  lastSale: { priceCents: number; date: string | null } | null;
  flood: HomeLookupFlood | null;
  baseline: HomeLookupBaseline | null;
  provenance: { provider: string; limitations: string[]; observedAt: string | null };
  sampleData: { containsSampleData: boolean; notice: string | null };
};

/** What the lookup endpoint returns: a record, a request to confirm the address, or a clean miss. */
export type PropertyLookupResponse =
  | { status: "found"; result: HomeLookupResult }
  | { status: "needs_address"; parsed: Partial<HomeLookupAddress>; host: string }
  | { status: "not_found"; address: HomeLookupAddress };
