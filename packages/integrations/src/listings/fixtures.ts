import type { ListingProvider, ListingSummary, PropertySearchInput, SearchPage } from "./port";

/**
 * Synthetic Florida listings. Addresses use reserved example ranges and the
 * records are flagged `isFixture` so production configuration rejects them.
 */
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
    attributionText: "Sample data. Not sourced from any MLS.",
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
    attributionText: "Sample data. Not sourced from any MLS.",
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
    attributionText: "Sample data. Not sourced from any MLS.",
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
    attributionText: "Sample data. Not sourced from any MLS.",
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
    attributionText: "Sample data. Not sourced from any MLS.",
    modificationTimestamp: "2026-07-30T16:20:00.000Z",
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
      dataAsOf: "2026-08-15T11:05:00.000Z"
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
