import type { ListingProvider, ListingSummary, PropertySearchInput, SearchPage } from "./port";
import { runListingSearch } from "./search";

/**
 * Synthetic Florida listings.
 *
 * Every record is invented. Street names use the reserved "Example" convention,
 * no photograph is referenced, and nothing here is derived from an MLS, a
 * portal, or a public record. `isFixture` travels with the record so production
 * configuration rejects it and so every surface that renders one can label it.
 */

const SAMPLE_ATTRIBUTION = "Sample data. Not sourced from any MLS.";

/** The single snapshot time these records represent. Rendered as data freshness. */
export const FIXTURE_DATA_AS_OF = "2026-08-16T12:00:00.000Z";

export const FLORIDA_FIXTURES: ListingSummary[] = [
  {
    provider: "fixture",
    listingKey: "FX-TPA-0001",
    standardStatus: "active",
    listPriceCents: 429_000_00,
    address: { line1: "1200 Example Bay Dr", city: "Tampa", state: "FL", postalCode: "33602" },
    coordinates: { latitude: 27.9506, longitude: -82.4572 },
    bedrooms: 3,
    bathrooms: 2,
    livingAreaSqft: 1840,
    propertyType: "Single Family Residence",
    yearBuilt: 2004,
    lotSizeSqft: 6_500,
    daysOnMarket: 21,
    description:
      "A sample single-family record used to demonstrate how a detail page reads. Block construction on a corner parcel, two-car garage, and a fenced rear yard. The figures exist to exercise the payment estimate, not to describe a property you can buy.",
    annualTaxAmountCents: 5_400_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-10T14:02:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-ORL-0002",
    standardStatus: "active",
    listPriceCents: 356_500_00,
    address: { line1: "88 Example Grove Ln", city: "Orlando", state: "FL", postalCode: "32801" },
    coordinates: { latitude: 28.5383, longitude: -81.3792 },
    bedrooms: 4,
    bathrooms: 2.5,
    livingAreaSqft: 2110,
    propertyType: "Single Family Residence",
    yearBuilt: 2016,
    lotSizeSqft: 5_800,
    daysOnMarket: 9,
    description:
      "A sample two-storey record in a platted subdivision, written to show how a four-bedroom layout is summarised. Community amenities carry a monthly association fee, which the payment estimate picks up.",
    monthlyHoaFeeCents: 145_00,
    annualTaxAmountCents: 4_620_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-12T09:40:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-JAX-0003",
    standardStatus: "pending",
    listPriceCents: 289_900_00,
    address: {
      line1: "45 Example Ridge Ct",
      city: "Jacksonville",
      state: "FL",
      postalCode: "32202"
    },
    coordinates: { latitude: 30.3322, longitude: -81.6557 },
    bedrooms: 3,
    bathrooms: 2,
    livingAreaSqft: 1620,
    propertyType: "Townhouse",
    yearBuilt: 2011,
    lotSizeSqft: 2_400,
    daysOnMarket: 38,
    description:
      "A sample attached townhouse record carrying a pending status, so the status filter has something to act on. Association dues cover exterior maintenance in this illustration.",
    monthlyHoaFeeCents: 210_00,
    annualTaxAmountCents: 3_480_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-14T18:15:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-MIA-0004",
    standardStatus: "active",
    listPriceCents: 615_000_00,
    address: {
      line1: "700 Example Shore Ave #12B",
      city: "Miami",
      state: "FL",
      postalCode: "33131"
    },
    coordinates: { latitude: 25.7617, longitude: -80.1918 },
    bedrooms: 2,
    bathrooms: 2,
    livingAreaSqft: 1290,
    propertyType: "Condominium",
    yearBuilt: 2008,
    daysOnMarket: 54,
    description:
      "A sample high-rise condominium record. The association fee is large relative to the price, which is exactly the case where a principal-and-interest-only estimate misleads — the payment estimate on this page includes it.",
    monthlyHoaFeeCents: 985_00,
    annualTaxAmountCents: 8_900_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-15T11:05:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-SRQ-0005",
    standardStatus: "closed",
    listPriceCents: 512_000_00,
    address: { line1: "22 Example Palm Way", city: "Sarasota", state: "FL", postalCode: "34236" },
    coordinates: { latitude: 27.3364, longitude: -82.5307 },
    bedrooms: 4,
    bathrooms: 3,
    livingAreaSqft: 2480,
    propertyType: "Single Family Residence",
    yearBuilt: 1998,
    lotSizeSqft: 9_100,
    daysOnMarket: 0,
    description:
      "A sample closed record. It exists to prove that a status outside the publicly displayable set never reaches a search result page.",
    annualTaxAmountCents: 6_150_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-07-30T16:20:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-STP-0006",
    standardStatus: "active",
    listPriceCents: 398_000_00,
    address: {
      line1: "310 Example Harbor St NE",
      city: "St. Petersburg",
      state: "FL",
      postalCode: "33701"
    },
    coordinates: { latitude: 27.7731, longitude: -82.64 },
    bedrooms: 3,
    bathrooms: 2,
    livingAreaSqft: 1710,
    propertyType: "Single Family Residence",
    yearBuilt: 1952,
    lotSizeSqft: 7_200,
    daysOnMarket: 14,
    description:
      "A sample mid-century bungalow record with an updated kitchen and original terrazzo. Older housing stock is where insurance and roof age move a payment most, which is the point this record is here to make.",
    annualTaxAmountCents: 4_980_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-15T15:30:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-STP-0007",
    standardStatus: "active",
    listPriceCents: 549_500_00,
    address: {
      line1: "1425 Example Beach Blvd S",
      city: "St. Petersburg",
      state: "FL",
      postalCode: "33705"
    },
    coordinates: { latitude: 27.7376, longitude: -82.6412 },
    bedrooms: 4,
    bathrooms: 3,
    livingAreaSqft: 2340,
    propertyType: "Single Family Residence",
    yearBuilt: 2019,
    lotSizeSqft: 6_900,
    daysOnMarket: 6,
    description:
      "A sample newer-construction record with an impact-rated envelope and a metal roof. Written to sit at the upper end of the price filter so a range query has something to exclude.",
    monthlyHoaFeeCents: 85_00,
    annualTaxAmountCents: 7_120_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-16T08:10:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-STP-0008",
    standardStatus: "active",
    listPriceCents: 289_000_00,
    address: {
      line1: "60 Example Pier Ave N #4A",
      city: "St. Petersburg",
      state: "FL",
      postalCode: "33704"
    },
    coordinates: { latitude: 27.7889, longitude: -82.6329 },
    bedrooms: 2,
    bathrooms: 2,
    livingAreaSqft: 1105,
    propertyType: "Condominium",
    yearBuilt: 1985,
    daysOnMarket: 31,
    description:
      "A sample mid-rise condominium record. The association carries a funded reserve in this illustration; on a real unit the reserve study is the document that decides whether the fee is stable.",
    monthlyHoaFeeCents: 640_00,
    annualTaxAmountCents: 3_260_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-13T12:45:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-STP-0009",
    standardStatus: "coming_soon",
    listPriceCents: 465_000_00,
    address: {
      line1: "88 Example Oak Terrace N",
      city: "St. Petersburg",
      state: "FL",
      postalCode: "33713"
    },
    coordinates: { latitude: 27.7889, longitude: -82.6712 },
    bedrooms: 3,
    bathrooms: 2.5,
    livingAreaSqft: 1_960,
    propertyType: "Duplex",
    yearBuilt: 1974,
    lotSizeSqft: 8_400,
    daysOnMarket: 3,
    description:
      "A sample two-unit investment record, both sides two-bed. It carries a coming-soon status and exists so the investment path has something to demonstrate; financing a two-to-four unit property follows different rules to a single-family purchase.",
    annualTaxAmountCents: 6_040_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-16T09:05:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-TPA-0010",
    standardStatus: "active",
    listPriceCents: 319_900_00,
    address: {
      line1: "2400 Example Cypress Ct",
      city: "Tampa",
      state: "FL",
      postalCode: "33610"
    },
    coordinates: { latitude: 27.9989, longitude: -82.4009 },
    bedrooms: 3,
    bathrooms: 2,
    livingAreaSqft: 1_430,
    propertyType: "Single Family Residence",
    yearBuilt: 1988,
    lotSizeSqft: 6_100,
    daysOnMarket: 47,
    description:
      "A sample entry-price record placed near the bottom of the range so the minimum-price filter is exercised. Single storey, carport rather than a garage.",
    annualTaxAmountCents: 3_940_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-09T10:20:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-TPA-0011",
    standardStatus: "active",
    listPriceCents: 725_000_00,
    address: {
      line1: "905 Example Riverwalk Pl",
      city: "Tampa",
      state: "FL",
      postalCode: "33606"
    },
    coordinates: { latitude: 27.9339, longitude: -82.4645 },
    bedrooms: 5,
    bathrooms: 4,
    livingAreaSqft: 3_260,
    propertyType: "Single Family Residence",
    yearBuilt: 2021,
    lotSizeSqft: 7_800,
    daysOnMarket: 12,
    description:
      "A sample larger record used to show the top of the bedroom and square-footage sorts. Elevated construction with a ground-level flex room.",
    monthlyHoaFeeCents: 120_00,
    annualTaxAmountCents: 10_400_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-14T07:55:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-TPA-0012",
    standardStatus: "pending",
    listPriceCents: 172_500_00,
    address: {
      line1: "17 Example Magnolia Rd",
      city: "Tampa",
      state: "FL",
      postalCode: "33619"
    },
    coordinates: { latitude: 27.9245, longitude: -82.3773 },
    propertyType: "Residential Lot",
    lotSizeSqft: 10_450,
    daysOnMarket: 63,
    description:
      "A sample vacant residential lot, cleared, with utilities available at the street in this illustration. A lot has no bedrooms, no bathrooms, and no living area, so the facts grid renders those as absent rather than as zero — and lot purchases are financed differently to a house.",
    annualTaxAmountCents: 1_820_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-11T13:30:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-SRQ-0013",
    standardStatus: "active",
    listPriceCents: 588_000_00,
    address: {
      line1: "410 Example Bayfront Dr",
      city: "Sarasota",
      state: "FL",
      postalCode: "34236"
    },
    coordinates: { latitude: 27.3364, longitude: -82.5432 },
    bedrooms: 3,
    bathrooms: 2.5,
    livingAreaSqft: 2_050,
    propertyType: "Single Family Residence",
    yearBuilt: 2006,
    lotSizeSqft: 8_000,
    daysOnMarket: 25,
    description:
      "A sample record written to sit mid-range in Sarasota. Split floor plan, screened lanai, tile roof.",
    monthlyHoaFeeCents: 175_00,
    annualTaxAmountCents: 7_060_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-12T16:00:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-SRQ-0014",
    standardStatus: "active",
    listPriceCents: 344_000_00,
    address: {
      line1: "77 Example Osprey Walk #203",
      city: "Sarasota",
      state: "FL",
      postalCode: "34239"
    },
    coordinates: { latitude: 27.3134, longitude: -82.5301 },
    bedrooms: 2,
    bathrooms: 2,
    livingAreaSqft: 1_180,
    propertyType: "Condominium",
    yearBuilt: 1996,
    daysOnMarket: 18,
    description:
      "A sample low-rise condominium record with an assigned covered space. Second of three condominium samples, so the property-type filter returns more than one row.",
    monthlyHoaFeeCents: 520_00,
    annualTaxAmountCents: 4_120_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-15T09:15:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-SRQ-0015",
    standardStatus: "active",
    listPriceCents: 1_450_000_00,
    address: {
      line1: "0 Example Ranch Rd (Parcel B)",
      city: "Sarasota",
      state: "FL",
      postalCode: "34240"
    },
    coordinates: { latitude: 27.3421, longitude: -82.3902 },
    propertyType: "Land",
    lotSizeSqft: 1_742_400,
    daysOnMarket: 154,
    description:
      "A sample forty-acre development parcel. Entitlement, access, wetland delineation, and utility capacity are the questions that decide what a parcel like this is worth, and none of them are answered by a listing record — which is why this sample carries no claims about any of them. Acquisition and development lending is a different product to a residential mortgage.",
    annualTaxAmountCents: 14_600_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-08T11:40:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-ORL-0016",
    standardStatus: "active",
    listPriceCents: 412_000_00,
    address: {
      line1: "630 Example Lakeview Cir",
      city: "Orlando",
      state: "FL",
      postalCode: "32806"
    },
    coordinates: { latitude: 28.5127, longitude: -81.3639 },
    bedrooms: 4,
    bathrooms: 3,
    livingAreaSqft: 2_280,
    propertyType: "Single Family Residence",
    yearBuilt: 2013,
    lotSizeSqft: 6_300,
    daysOnMarket: 29,
    description:
      "A sample four-bedroom record with a detached garage and an alley-loaded lot. Sits between the two Orlando price points so a bounded price range returns a partial set.",
    monthlyHoaFeeCents: 98_00,
    annualTaxAmountCents: 5_380_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-13T17:25:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-ORL-0017",
    standardStatus: "coming_soon",
    listPriceCents: 268_000_00,
    address: {
      line1: "12 Example Sandhill Ln",
      city: "Orlando",
      state: "FL",
      postalCode: "32822"
    },
    coordinates: { latitude: 28.4809, longitude: -81.3057 },
    bedrooms: 2,
    bathrooms: 1.5,
    livingAreaSqft: 1_040,
    propertyType: "Townhouse",
    yearBuilt: 1990,
    lotSizeSqft: 1_800,
    daysOnMarket: 2,
    description:
      "A sample small townhouse record, the least expensive of the set, used to anchor the ascending price sort.",
    monthlyHoaFeeCents: 265_00,
    annualTaxAmountCents: 2_980_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-16T06:30:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-JAX-0018",
    standardStatus: "active",
    listPriceCents: 335_000_00,
    address: {
      line1: "2201 Example Marsh Dr",
      city: "Jacksonville",
      state: "FL",
      postalCode: "32207"
    },
    coordinates: { latitude: 30.3072, longitude: -81.6412 },
    bedrooms: 4,
    bathrooms: 2,
    livingAreaSqft: 1_890,
    propertyType: "Single Family Residence",
    yearBuilt: 1967,
    lotSizeSqft: 9_600,
    daysOnMarket: 41,
    description:
      "A sample ranch-style record on a deep lot. Written with an older year built so the year-built fact has variety across the set.",
    annualTaxAmountCents: 4_240_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-10T19:50:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-JAX-0019",
    standardStatus: "active",
    listPriceCents: 379_900_00,
    address: {
      line1: "58 Example Trestle Way",
      city: "Jacksonville",
      state: "FL",
      postalCode: "32204"
    },
    coordinates: { latitude: 30.3243, longitude: -81.6892 },
    bedrooms: 4,
    bathrooms: 3,
    livingAreaSqft: 2_120,
    propertyType: "Duplex",
    yearBuilt: 1981,
    lotSizeSqft: 7_100,
    daysOnMarket: 72,
    description:
      "A sample side-by-side duplex record held as a rental in this illustration. Nothing here states a rent, an occupancy, or a return: a listing record is not evidence of any of them, and a lender will underwrite the actual leases.",
    annualTaxAmountCents: 5_720_00,
    attributionText: SAMPLE_ATTRIBUTION,
    modificationTimestamp: "2026-08-07T14:10:00.000Z",
    isFixture: true
  }
];

export class FixtureListingProvider implements ListingProvider {
  readonly key = "fixture";

  constructor(private readonly listings: ListingSummary[] = FLORIDA_FIXTURES) {}

  async search(input: PropertySearchInput): Promise<SearchPage> {
    const result = runListingSearch(this.listings, input);
    return {
      items: result.items,
      totalCount: result.totalCount,
      ...(result.nextCursor === undefined ? {} : { nextCursor: result.nextCursor }),
      dataAsOf: FIXTURE_DATA_AS_OF
    };
  }

  async getByKey(listingKey: string): Promise<ListingSummary | null> {
    return this.listings.find((listing) => listing.listingKey === listingKey) ?? null;
  }

  async dataAsOf(): Promise<string> {
    return FIXTURE_DATA_AS_OF;
  }

  async health(): Promise<{ ok: boolean; detail: string }> {
    return { ok: true, detail: `${this.listings.length} synthetic records loaded` };
  }
}

/** Used when no MLS agreement exists. Returns nothing rather than fabricating. */
export class DisabledListingProvider implements ListingProvider {
  readonly key = "disabled";

  async search(): Promise<SearchPage> {
    return { items: [], totalCount: 0, dataAsOf: new Date().toISOString() };
  }

  async getByKey(): Promise<ListingSummary | null> {
    return null;
  }

  async dataAsOf(): Promise<string> {
    return new Date().toISOString();
  }

  async health(): Promise<{ ok: boolean; detail: string }> {
    return { ok: true, detail: "No listing agreement configured. Property search is off." };
  }
}
