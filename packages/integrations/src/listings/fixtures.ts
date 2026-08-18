import type { ListingProvider, ListingSummary, PropertySearchInput, SearchPage } from "./port";

/**
 * Synthetic Florida planning examples. Every address contains the word
 * "Example", every image is locally generated, and every record is flagged
 * `isFixture` so it can never enter the publishable listing path.
 */
export const FLORIDA_FIXTURES: ListingSummary[] = [
  {
    provider: "fixture",
    listingKey: "FX-STP-0001",
    standardStatus: "active",
    listPriceCents: 389_000_00,
    address: {
      line1: "1200 Example Banyan Ave",
      city: "St. Petersburg",
      state: "FL",
      postalCode: "33701"
    },
    coordinates: { latitude: 27.7676, longitude: -82.6403 },
    bedrooms: 3,
    bathrooms: 2,
    livingAreaSqft: 1470,
    propertyType: "Single Family Residence",
    yearBuilt: 1956,
    lotSizeAcres: 0.16,
    primaryImage: {
      url: "/images/properties/fixture-st-pete-bungalow-01.webp",
      width: 1600,
      height: 1000,
      attribution: "AI-generated planning illustration created for TRACT."
    },
    description:
      "A compact bungalow example for testing a kitchen refresh, storm-hardening allowance, and first-floor reconfiguration.",
    highlights: ["Bungalow layout", "Covered front porch", "Compact urban lot"],
    demoPlanningSeed: {
      goal: "renovate",
      improvementBudgetCents: 72_000_00,
      expectedAfterImprovementValueCents: 485_000_00,
      annualPropertyTaxCents: 5_200_00,
      annualInsuranceCents: 4_800_00,
      monthlyHoaCents: 0
    },
    attributionText: "Synthetic planning example. Not a real property or MLS listing.",
    modificationTimestamp: "2026-08-17T12:00:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-TPA-0002",
    standardStatus: "active",
    listPriceCents: 635_000_00,
    address: { line1: "88 Example Channel Dr", city: "Tampa", state: "FL", postalCode: "33606" },
    coordinates: { latitude: 27.9448, longitude: -82.4668 },
    bedrooms: 4,
    bathrooms: 3,
    livingAreaSqft: 2380,
    propertyType: "Single Family Residence",
    yearBuilt: 2004,
    lotSizeAcres: 0.19,
    primaryImage: {
      url: "/images/properties/fixture-tampa-contemporary-01.webp",
      width: 1600,
      height: 1000,
      attribution: "AI-generated planning illustration created for TRACT."
    },
    description:
      "A contemporary home example for modeling a primary-suite update and an indoor-outdoor living project.",
    highlights: ["Contemporary exterior", "Two-story plan", "Outdoor living potential"],
    demoPlanningSeed: {
      goal: "expand",
      improvementBudgetCents: 118_000_00,
      expectedAfterImprovementValueCents: 805_000_00,
      annualPropertyTaxCents: 9_100_00,
      annualInsuranceCents: 6_200_00,
      monthlyHoaCents: 0
    },
    attributionText: "Synthetic planning example. Not a real property or MLS listing.",
    modificationTimestamp: "2026-08-17T12:00:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-SRQ-0003",
    standardStatus: "active",
    listPriceCents: 548_000_00,
    address: {
      line1: "45 Example Gulf Breeze Way",
      city: "Sarasota",
      state: "FL",
      postalCode: "34236"
    },
    coordinates: { latitude: 27.3364, longitude: -82.5307 },
    bedrooms: 3,
    bathrooms: 2,
    livingAreaSqft: 1730,
    propertyType: "Single Family Residence",
    yearBuilt: 1978,
    lotSizeAcres: 0.21,
    primaryImage: {
      url: "/images/properties/fixture-sarasota-coastal-01.webp",
      width: 1600,
      height: 1000,
      attribution: "AI-generated planning illustration created for TRACT."
    },
    description:
      "A coastal-home example for exploring resilient materials, an updated floor plan, and insurance-sensitive holding costs.",
    highlights: ["Coastal character", "Single-level plan", "Resilience planning example"],
    demoPlanningSeed: {
      goal: "renovate",
      improvementBudgetCents: 96_000_00,
      expectedAfterImprovementValueCents: 685_000_00,
      annualPropertyTaxCents: 7_800_00,
      annualInsuranceCents: 7_200_00,
      monthlyHoaCents: 0
    },
    attributionText: "Synthetic planning example. Not a real property or MLS listing.",
    modificationTimestamp: "2026-08-17T12:00:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-ORL-0004",
    standardStatus: "active",
    listPriceCents: 412_000_00,
    address: {
      line1: "700 Example Citrus Grove Ln",
      city: "Orlando",
      state: "FL",
      postalCode: "32801"
    },
    coordinates: { latitude: 28.5383, longitude: -81.3792 },
    bedrooms: 4,
    bathrooms: 2.5,
    livingAreaSqft: 2140,
    propertyType: "Single Family Residence",
    yearBuilt: 1992,
    lotSizeAcres: 0.24,
    primaryImage: {
      url: "/images/properties/fixture-orlando-suburban-01.webp",
      width: 1600,
      height: 1000,
      attribution: "AI-generated planning illustration created for TRACT."
    },
    description:
      "A suburban-home example for comparing a phased interior update with a larger one-time renovation budget.",
    highlights: ["Four-bedroom plan", "Attached garage", "Phased renovation example"],
    demoPlanningSeed: {
      goal: "renovate",
      improvementBudgetCents: 84_000_00,
      expectedAfterImprovementValueCents: 535_000_00,
      annualPropertyTaxCents: 5_900_00,
      annualInsuranceCents: 4_600_00,
      monthlyHoaCents: 68_00
    },
    attributionText: "Synthetic planning example. Not a real property or MLS listing.",
    modificationTimestamp: "2026-08-17T12:00:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-JAX-0005",
    standardStatus: "active",
    listPriceCents: 329_000_00,
    address: {
      line1: "22 Example Riverside Ct",
      city: "Jacksonville",
      state: "FL",
      postalCode: "32202"
    },
    coordinates: { latitude: 30.3322, longitude: -81.6557 },
    bedrooms: 4,
    bathrooms: 2,
    livingAreaSqft: 2240,
    propertyType: "Duplex",
    yearBuilt: 1968,
    lotSizeAcres: 0.18,
    primaryImage: {
      url: "/images/properties/fixture-jacksonville-duplex-01.webp",
      width: 1600,
      height: 1000,
      attribution: "AI-generated planning illustration created for TRACT."
    },
    description:
      "A duplex example for testing renovation allowances and a long-term rental scenario without implying actual rent or occupancy.",
    highlights: ["Two-unit concept", "Separate entries", "Rental planning example"],
    demoPlanningSeed: {
      goal: "long_term_rental",
      improvementBudgetCents: 64_000_00,
      expectedAfterImprovementValueCents: 430_000_00,
      annualPropertyTaxCents: 4_700_00,
      annualInsuranceCents: 5_400_00,
      monthlyHoaCents: 0
    },
    attributionText: "Synthetic planning example. Not a real property or MLS listing.",
    modificationTimestamp: "2026-08-17T12:00:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-LOT-0006",
    standardStatus: "active",
    listPriceCents: 118_000_00,
    address: {
      line1: "1600 Example Palmetto Lot",
      city: "Lakeland",
      state: "FL",
      postalCode: "33801"
    },
    coordinates: { latitude: 28.0395, longitude: -81.9498 },
    propertyType: "Residential Lot",
    lotSizeAcres: 0.31,
    primaryImage: {
      url: "/images/properties/fixture-florida-lot-01.webp",
      width: 1600,
      height: 1000,
      attribution: "AI-generated planning illustration created for TRACT."
    },
    description:
      "A vacant residential-lot example for organizing land, construction, utility, and due-diligence assumptions.",
    highlights: ["Vacant land", "Residential-scale lot", "Construction planning example"],
    demoPlanningSeed: {
      goal: "build",
      improvementBudgetCents: 385_000_00,
      expectedAfterImprovementValueCents: 565_000_00,
      annualPropertyTaxCents: 1_900_00,
      annualInsuranceCents: 0,
      monthlyHoaCents: 0
    },
    attributionText: "Synthetic planning example. Not a real property or MLS listing.",
    modificationTimestamp: "2026-08-17T12:00:00.000Z",
    isFixture: true
  },
  {
    provider: "fixture",
    listingKey: "FX-LND-0007",
    standardStatus: "active",
    listPriceCents: 295_000_00,
    address: {
      line1: "2800 Example Hammock Tract",
      city: "Ocala",
      state: "FL",
      postalCode: "34470"
    },
    coordinates: { latitude: 29.1872, longitude: -82.1401 },
    propertyType: "Land",
    lotSizeAcres: 8.4,
    primaryImage: {
      url: "/images/properties/fixture-florida-land-01.webp",
      width: 1600,
      height: 1000,
      attribution: "AI-generated planning illustration created for TRACT."
    },
    description:
      "A larger land-parcel example for separating acquisition financing from site-work and future-build assumptions.",
    highlights: ["Larger parcel", "Site-work planning", "Land financing example"],
    demoPlanningSeed: {
      goal: "explore",
      improvementBudgetCents: 125_000_00,
      expectedAfterImprovementValueCents: 470_000_00,
      annualPropertyTaxCents: 3_100_00,
      annualInsuranceCents: 0,
      monthlyHoaCents: 0
    },
    attributionText: "Synthetic planning example. Not a real property or MLS listing.",
    modificationTimestamp: "2026-08-17T12:00:00.000Z",
    isFixture: true
  }
];

export class FixtureListingProvider implements ListingProvider {
  readonly key = "fixture";

  constructor(private readonly listings: ListingSummary[] = FLORIDA_FIXTURES) {}

  async search(input: PropertySearchInput): Promise<SearchPage> {
    const filtered = this.listings.filter((listing) => {
      if (input.status !== undefined && !input.status.includes(listing.standardStatus))
        return false;
      if (input.minPriceCents !== undefined && (listing.listPriceCents ?? 0) < input.minPriceCents)
        return false;
      if (
        input.maxPriceCents !== undefined &&
        (listing.listPriceCents ?? Number.MAX_SAFE_INTEGER) > input.maxPriceCents
      )
        return false;
      if (input.minBeds !== undefined && (listing.bedrooms ?? 0) < input.minBeds) return false;
      if (input.minBaths !== undefined && (listing.bathrooms ?? 0) < input.minBaths) return false;
      if (
        input.propertyTypes !== undefined &&
        input.propertyTypes.length > 0 &&
        !input.propertyTypes.includes(listing.propertyType ?? "")
      )
        return false;
      if (input.bounds !== undefined && listing.coordinates !== undefined) {
        const { latitude, longitude } = listing.coordinates;
        if (
          latitude > input.bounds.north ||
          latitude < input.bounds.south ||
          longitude > input.bounds.east ||
          longitude < input.bounds.west
        )
          return false;
      }
      if (
        input.market !== "" &&
        input.market.toLowerCase() !== "fl" &&
        (listing.address.city ?? "").toLowerCase() !== input.market.toLowerCase()
      )
        return false;
      return true;
    });

    const offset = input.cursor === undefined ? 0 : Number.parseInt(input.cursor, 10);
    const start = Number.isFinite(offset) && offset > 0 ? offset : 0;
    const items = filtered.slice(start, start + input.limit);
    const next = start + input.limit;

    return {
      items,
      ...(next < filtered.length ? { nextCursor: String(next) } : {}),
      dataAsOf: "2026-08-17T12:00:00.000Z"
    };
  }

  async getByKey(listingKey: string): Promise<ListingSummary | null> {
    return this.listings.find((listing) => listing.listingKey === listingKey) ?? null;
  }

  async health(): Promise<{ ok: boolean; detail: string }> {
    return { ok: true, detail: `${this.listings.length} synthetic records loaded` };
  }
}

/** Used when no MLS agreement exists. Returns nothing rather than fabricating. */
export class DisabledListingProvider implements ListingProvider {
  readonly key = "disabled";

  async search(): Promise<SearchPage> {
    return { items: [], dataAsOf: new Date().toISOString() };
  }

  async getByKey(): Promise<ListingSummary | null> {
    return null;
  }

  async health(): Promise<{ ok: boolean; detail: string }> {
    return { ok: true, detail: "No listing agreement configured. Property search is off." };
  }
}
