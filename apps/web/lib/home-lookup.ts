import "server-only";
import { parseListingLink } from "@tract/integrations";
import {
  annualRateOfCents,
  estimateAnnualFloodInsuranceCents,
  estimateAnnualHomeInsuranceCents,
  monthlyHousingCost
} from "@tract/mortgage-math";
import { PAYMENT_ASSUMPTIONS } from "@/components/properties/payment-estimate";
import { floodLookupAllowed, floodProvider, propertyFacts } from "./property";
import type {
  HomeLookupAddress,
  HomeLookupBaseline,
  HomeLookupFlood,
  HomeLookupResult
} from "./home-lookup-types";

/**
 * Home-lookup orchestration.
 *
 * The address is the key. A pasted listing link is only parsed for the address
 * it already contains (never fetched), and the licensed provider answers the
 * address. The monthly estimate anchors on the automated value and is built
 * entirely from `@tract/mortgage-math` (invariant 1); the client re-runs the
 * same functions as the visitor edits the price, the down payment, and income.
 */

export const HOME_LOOKUP_SAMPLE_NOTICE =
  "These figures are illustrative sample data, not a real property record. Details are invented and must not be presented as facts about an actual home.";

function nonEmpty(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== "";
}

/**
 * Turn a pasted link into a confirmed address when the slug carries all four
 * parts; otherwise return the partial so the visitor can complete it. Parsing
 * is pure string work over text the visitor supplied — it never touches the
 * listing site.
 */
export function resolveListingLink(link: string): {
  address: HomeLookupAddress | null;
  parsed: Partial<HomeLookupAddress>;
  host: string;
} {
  const result = parseListingLink(link);
  if (result === null) return { address: null, parsed: {}, host: "other" };

  const { line1, city, state, postalCode } = result.address;
  const parsed: Partial<HomeLookupAddress> = {};
  if (nonEmpty(line1)) parsed.line1 = line1;
  if (nonEmpty(city)) parsed.city = city;
  if (nonEmpty(state)) parsed.state = state;
  if (nonEmpty(postalCode)) parsed.postalCode = postalCode;

  const complete =
    nonEmpty(line1) && nonEmpty(city) && nonEmpty(state) && nonEmpty(postalCode)
      ? { line1, city, state, postalCode }
      : null;

  return { address: complete, parsed, host: result.host };
}

function buildBaseline(
  anchorPriceCents: number,
  annualTaxAmountCents: number | undefined,
  inSpecialFloodHazardArea: boolean
): HomeLookupBaseline {
  const downPaymentCents = annualRateOfCents(
    anchorPriceCents,
    PAYMENT_ASSUMPTIONS.downPaymentBasisPoints
  );
  const loanAmountCents = Math.max(0, anchorPriceCents - downPaymentCents);
  // The "true Florida cost" upgrade: insurance scales with value and a flood
  // premium is added in a Special Flood Hazard Area, instead of one flat number.
  const annualHomeInsuranceCents = estimateAnnualHomeInsuranceCents(anchorPriceCents);
  const annualFloodInsuranceCents = estimateAnnualFloodInsuranceCents(inSpecialFloodHazardArea);
  const breakdown = monthlyHousingCost({
    loanAmountCents,
    annualRateBasisPoints: PAYMENT_ASSUMPTIONS.annualRateBasisPoints,
    termMonths: PAYMENT_ASSUMPTIONS.termMonths,
    annualHomeownersInsuranceCents: annualHomeInsuranceCents,
    annualFloodInsuranceCents,
    ...(annualTaxAmountCents === undefined ? {} : { annualPropertyTaxCents: annualTaxAmountCents })
  });

  return {
    anchorPriceCents,
    downPaymentBasisPoints: PAYMENT_ASSUMPTIONS.downPaymentBasisPoints,
    downPaymentCents,
    loanAmountCents,
    annualRateBasisPoints: PAYMENT_ASSUMPTIONS.annualRateBasisPoints,
    termMonths: PAYMENT_ASSUMPTIONS.termMonths,
    monthlyTotalCents: breakdown.totalMonthlyCents,
    monthlyPrincipalInterestCents: breakdown.principalAndInterestCents,
    monthlyTaxCents: breakdown.propertyTaxCents,
    monthlyInsuranceCents: breakdown.homeownersInsuranceCents,
    monthlyFloodInsuranceCents: breakdown.floodInsuranceCents,
    monthlyHoaCents: breakdown.hoaCents,
    annualHomeInsuranceCents,
    annualFloodInsuranceCents,
    usedProviderTax: annualTaxAmountCents !== undefined
  };
}

export async function lookupHome(address: HomeLookupAddress): Promise<HomeLookupResult | null> {
  const sourced = await propertyFacts().lookup(address);
  if (sourced === null) return null;

  const facts = sourced.value;
  const provenance = sourced.provenance;
  const isSample = provenance.provider === "fixture";

  // Flood is a separate, best-effort call keyed on the property's coordinates;
  // a flood miss never sinks the lookup, and it flows into the cost estimate.
  let flood: HomeLookupFlood | null = null;
  const coords = facts.coordinates;
  if (coords !== undefined && floodLookupAllowed()) {
    try {
      const floodSourced = await floodProvider().lookup(coords);
      if (floodSourced !== null) {
        flood = {
          zone: floodSourced.value.floodZone,
          inSpecialFloodHazardArea: floodSourced.value.inSpecialFloodHazardArea,
          note: "Per FEMA's current effective flood map — not a flood determination. Confirm the panel at FEMA's Map Service Center."
        };
      }
    } catch {
      flood = null;
    }
  }
  const inSpecialFloodHazardArea = flood?.inSpecialFloodHazardArea ?? false;

  const anchorPriceCents =
    facts.marketValueCents ?? facts.assessedValueCents ?? facts.lastSalePriceCents;

  return {
    address: {
      line1: facts.normalizedAddress.line1,
      city: facts.normalizedAddress.city,
      state: facts.normalizedAddress.state,
      postalCode: facts.normalizedAddress.postalCode
    },
    facts: {
      propertyType: facts.propertyType ?? null,
      bedrooms: facts.bedrooms ?? null,
      bathrooms: facts.bathrooms ?? null,
      livingAreaSqft: facts.livingAreaSqft ?? null,
      lotAreaSqft: facts.lotAreaSqft ?? null,
      yearBuilt: facts.yearBuilt ?? null
    },
    value:
      facts.marketValueCents === undefined
        ? null
        : {
            estimateCents: facts.marketValueCents,
            lowCents: facts.marketValueLowCents ?? null,
            highCents: facts.marketValueHighCents ?? null
          },
    assessedValueCents: facts.assessedValueCents ?? null,
    annualTaxAmountCents: facts.annualTaxAmountCents ?? null,
    lastSale:
      facts.lastSalePriceCents === undefined
        ? null
        : { priceCents: facts.lastSalePriceCents, date: facts.lastSaleDate ?? null },
    flood,
    baseline:
      anchorPriceCents === undefined
        ? null
        : buildBaseline(anchorPriceCents, facts.annualTaxAmountCents, inSpecialFloodHazardArea),
    provenance: {
      provider: provenance.provider,
      limitations: provenance.limitations,
      observedAt: provenance.observedAt ?? null
    },
    sampleData: {
      containsSampleData: isSample,
      notice: isSample ? HOME_LOOKUP_SAMPLE_NOTICE : null
    }
  };
}
