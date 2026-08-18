import { describe, expect, it } from "vitest";

import {
  DEFAULT_LISTING_SORT,
  FIXTURE_DATA_AS_OF,
  FLORIDA_FIXTURES,
  FixtureListingProvider,
  LISTING_SORTS,
  PROPERTY_TYPE_OPTIONS,
  PUBLICLY_DISPLAYABLE,
  filterListings,
  matchesListingFilters,
  matchesListingQuery,
  pageCount,
  paginateListings,
  parseCursor,
  runListingSearch,
  sortListings,
  type ListingSummary
} from "./index";

const base: ListingSummary = {
  provider: "fixture",
  listingKey: "T-0001",
  standardStatus: "active",
  listPriceCents: 400_000_00,
  address: { line1: "1 Example St", city: "Tampa", state: "FL", postalCode: "33602" },
  bedrooms: 3,
  bathrooms: 2,
  livingAreaSqft: 1_800,
  propertyType: "Single Family Residence",
  attributionText: "Sample data. Not sourced from any MLS.",
  modificationTimestamp: "2026-08-10T00:00:00.000Z",
  isFixture: true
};

/**
 * `undefined` in an override removes the field rather than setting it, so a
 * test can express "this record has no price" under exactOptionalPropertyTypes.
 */
type Overrides = { [K in keyof ListingSummary]?: ListingSummary[K] | undefined };

const listing = (overrides: Overrides): ListingSummary => {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete merged[key];
    else merged[key] = value;
  }
  return merged as ListingSummary;
};

describe("fixture corpus", () => {
  it("labels every record as a fixture from the fixture provider", () => {
    for (const record of FLORIDA_FIXTURES) {
      expect(record.isFixture, record.listingKey).toBe(true);
      expect(record.provider, record.listingKey).toBe("fixture");
      expect(record.attributionText.length, record.listingKey).toBeGreaterThan(0);
    }
  });

  it("uses only reserved example street names and never a real address", () => {
    for (const record of FLORIDA_FIXTURES) {
      expect(record.address.line1, record.listingKey).toBeDefined();
      expect(record.address.line1 ?? "", record.listingKey).toContain("Example");
      expect(record.address.state, record.listingKey).toBe("FL");
    }
  });

  /*
   * The original rule here was "no image at all". What it was protecting was
   * never the absence of a picture — it was that a fixture must not point at a
   * listing source's photograph, which is someone else's copyright, someone
   * else's bandwidth, and displayable only under an agreement we do not have.
   * Company-generated illustrations served from this repository do not create
   * that exposure, so the rule is now the one that was actually meant.
   */
  it("references only first-party images, so nothing can hotlink a third-party photograph", () => {
    for (const record of FLORIDA_FIXTURES) {
      const image = record.primaryImage;
      if (image === undefined) continue;
      expect(image.url, record.listingKey).toMatch(/^\/images\/properties\/[\w-]+\.webp$/);
      expect(image.alt ?? "", record.listingKey).not.toHaveLength(0);
      expect(image.attribution ?? "", record.listingKey).not.toHaveLength(0);
      expect(image.width, record.listingKey).toBeGreaterThan(0);
      expect(image.height, record.listingKey).toBeGreaterThan(0);
    }
  });

  it("keeps records without an image, so the placeholder path stays exercised", () => {
    expect(FLORIDA_FIXTURES.some((record) => record.primaryImage === undefined)).toBe(true);
  });

  it("never reuses one image across two records", () => {
    const urls = FLORIDA_FIXTURES.flatMap((record) =>
      record.primaryImage === undefined ? [] : [record.primaryImage.url]
    );
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("issues a unique listing key per record", () => {
    const keys = FLORIDA_FIXTURES.map((record) => record.listingKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("holds prices as integer cents", () => {
    for (const record of FLORIDA_FIXTURES) {
      if (record.listPriceCents === undefined) continue;
      expect(Number.isInteger(record.listPriceCents), record.listingKey).toBe(true);
    }
  });

  it("covers the Florida markets the search page advertises", () => {
    const cities = new Set(FLORIDA_FIXTURES.map((record) => record.address.city));
    for (const city of ["St. Petersburg", "Tampa", "Sarasota", "Orlando", "Jacksonville"]) {
      expect(cities.has(city), city).toBe(true);
    }
  });

  it("includes an investment, a condominium, a lot, and a development parcel", () => {
    const types = new Set(FLORIDA_FIXTURES.map((record) => record.propertyType));
    for (const type of ["Duplex", "Condominium", "Residential Lot", "Land"]) {
      expect(types.has(type), type).toBe(true);
    }
  });

  it("only uses property types the filter offers", () => {
    for (const record of FLORIDA_FIXTURES) {
      expect(PROPERTY_TYPE_OPTIONS as readonly string[], record.listingKey).toContain(
        record.propertyType
      );
    }
  });

  it("gives a lot and a parcel no bedroom, bathroom, or living-area figure", () => {
    const landRecords = FLORIDA_FIXTURES.filter(
      (record) => record.propertyType === "Land" || record.propertyType === "Residential Lot"
    );
    expect(landRecords.length).toBeGreaterThan(0);
    for (const record of landRecords) {
      expect(record.bedrooms, record.listingKey).toBeUndefined();
      expect(record.bathrooms, record.listingKey).toBeUndefined();
      expect(record.livingAreaSqft, record.listingKey).toBeUndefined();
    }
  });
});

describe("matchesListingQuery", () => {
  it("treats an empty query as no constraint", () => {
    expect(matchesListingQuery(base, "")).toBe(true);
    expect(matchesListingQuery(base, "   ")).toBe(true);
  });

  it("matches a city case-insensitively and on a partial", () => {
    expect(matchesListingQuery(base, "tampa")).toBe(true);
    expect(matchesListingQuery(base, "TAM")).toBe(true);
    expect(matchesListingQuery(base, "Orlando")).toBe(false);
  });

  it("matches a ZIP by prefix", () => {
    expect(matchesListingQuery(base, "33602")).toBe(true);
    expect(matchesListingQuery(base, "336")).toBe(true);
    expect(matchesListingQuery(base, "33701")).toBe(false);
  });

  it("matches the state only on a full two-letter code", () => {
    expect(matchesListingQuery(base, "FL")).toBe(true);
    expect(matchesListingQuery(base, "F")).toBe(false);
  });

  it("does not turn a place search into a street lookup", () => {
    expect(matchesListingQuery(base, "Example St")).toBe(false);
  });
});

describe("matchesListingFilters", () => {
  it("excludes a record whose price is unknown when a price bound is set", () => {
    const unpriced = listing({ listPriceCents: undefined });
    expect(matchesListingFilters(unpriced, { market: "FL", minPriceCents: 1 })).toBe(false);
    expect(matchesListingFilters(unpriced, { market: "FL", maxPriceCents: 900_000_00 })).toBe(
      false
    );
    expect(matchesListingFilters(unpriced, { market: "FL" })).toBe(true);
  });

  it("applies price bounds inclusively", () => {
    const input = { market: "FL", minPriceCents: 400_000_00, maxPriceCents: 400_000_00 };
    expect(matchesListingFilters(base, input)).toBe(true);
    expect(matchesListingFilters(listing({ listPriceCents: 399_999_99 }), input)).toBe(false);
    expect(matchesListingFilters(listing({ listPriceCents: 400_000_01 }), input)).toBe(false);
  });

  it("treats a missing bedroom count as failing a bedroom minimum", () => {
    const lot = listing({ bedrooms: undefined, bathrooms: undefined });
    expect(matchesListingFilters(lot, { market: "FL", minBeds: 1 })).toBe(false);
    expect(matchesListingFilters(lot, { market: "FL", minBaths: 1 })).toBe(false);
    expect(matchesListingFilters(lot, { market: "FL" })).toBe(true);
  });

  it("accepts a half bath against a whole-number minimum", () => {
    expect(matchesListingFilters(listing({ bathrooms: 2.5 }), { market: "FL", minBaths: 2 })).toBe(
      true
    );
  });

  it("filters by status set", () => {
    expect(matchesListingFilters(base, { market: "FL", status: ["pending"] })).toBe(false);
    expect(matchesListingFilters(base, { market: "FL", status: ["active", "pending"] })).toBe(true);
  });

  it("ignores an empty property-type list rather than matching nothing", () => {
    expect(matchesListingFilters(base, { market: "FL", propertyTypes: [] })).toBe(true);
    expect(matchesListingFilters(base, { market: "FL", propertyTypes: ["Condominium"] })).toBe(
      false
    );
  });

  it("treats an empty market and FL as the whole market", () => {
    expect(matchesListingFilters(base, { market: "" })).toBe(true);
    expect(matchesListingFilters(base, { market: "fl" })).toBe(true);
    expect(matchesListingFilters(base, { market: "Orlando" })).toBe(false);
  });

  it("keeps a record without coordinates inside a bounded query", () => {
    const bounds = { north: 28, south: 27, east: -82, west: -83 };
    expect(matchesListingFilters(base, { market: "FL", bounds })).toBe(true);
    expect(
      matchesListingFilters(listing({ coordinates: { latitude: 30, longitude: -81 } }), {
        market: "FL",
        bounds
      })
    ).toBe(false);
  });
});

describe("sortListings", () => {
  const corpus = [
    listing({ listingKey: "B", listPriceCents: 300_000_00, bedrooms: 5, livingAreaSqft: 1_000 }),
    listing({ listingKey: "A", listPriceCents: 300_000_00, bedrooms: 2, livingAreaSqft: 3_000 }),
    listing({
      listingKey: "C",
      listPriceCents: 100_000_00,
      bedrooms: 4,
      livingAreaSqft: 2_000,
      modificationTimestamp: "2026-08-16T00:00:00.000Z"
    })
  ];

  it("orders ascending by price and descending by price", () => {
    expect(sortListings(corpus, "price_asc").map((r) => r.listingKey)).toEqual(["C", "A", "B"]);
    expect(sortListings(corpus, "price_desc").map((r) => r.listingKey)).toEqual(["A", "B", "C"]);
  });

  it("breaks a tie on listing key so pagination is stable", () => {
    expect(
      sortListings(corpus, "price_asc")
        .slice(1)
        .map((r) => r.listingKey)
    ).toEqual(["A", "B"]);
  });

  it("orders newest first", () => {
    expect(sortListings(corpus, "newest")[0]?.listingKey).toBe("C");
  });

  it("orders by bedrooms and by living area descending", () => {
    expect(sortListings(corpus, "beds_desc")[0]?.listingKey).toBe("B");
    expect(sortListings(corpus, "sqft_desc")[0]?.listingKey).toBe("A");
  });

  it("sorts a record missing the sorted field last in every order", () => {
    const withGap = [...corpus, listing({ listingKey: "Z", listPriceCents: undefined })];
    expect(sortListings(withGap, "price_asc").at(-1)?.listingKey).toBe("Z");
    expect(sortListings(withGap, "price_desc").at(-1)?.listingKey).toBe("Z");
  });

  it("does not mutate the input array", () => {
    const input = [...corpus];
    sortListings(input, "price_asc");
    expect(input.map((r) => r.listingKey)).toEqual(["B", "A", "C"]);
  });

  it("defaults to the documented sort", () => {
    expect(sortListings(corpus).map((r) => r.listingKey)).toEqual(
      sortListings(corpus, DEFAULT_LISTING_SORT).map((r) => r.listingKey)
    );
  });

  it("has a comparator for every advertised sort", () => {
    for (const sort of LISTING_SORTS) {
      expect(() => sortListings(corpus, sort)).not.toThrow();
    }
  });
});

describe("pagination", () => {
  const corpus = Array.from({ length: 7 }, (_, index) =>
    listing({ listingKey: `K-${index}`, listPriceCents: (index + 1) * 100_00 })
  );

  it("rejects a nonsense cursor rather than throwing", () => {
    expect(parseCursor(undefined)).toBe(0);
    expect(parseCursor("not-a-number")).toBe(0);
    expect(parseCursor("-5")).toBe(0);
    expect(parseCursor("3")).toBe(3);
  });

  it("counts every match, not the page", () => {
    const page = paginateListings(corpus, undefined, 3);
    expect(page.items).toHaveLength(3);
    expect(page.totalCount).toBe(7);
    expect(page.nextCursor).toBe("3");
  });

  it("omits the cursor on the last page", () => {
    expect(paginateListings(corpus, "6", 3).nextCursor).toBeUndefined();
    expect(paginateListings(corpus, "6", 3).items).toHaveLength(1);
  });

  it("returns an empty page past the end without failing", () => {
    const page = paginateListings(corpus, "99", 3);
    expect(page.items).toEqual([]);
    expect(page.totalCount).toBe(7);
  });

  it("walks every record exactly once across pages", () => {
    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const page = paginateListings(corpus, cursor, 2);
      seen.push(...page.items.map((record) => record.listingKey));
      cursor = page.nextCursor;
    } while (cursor !== undefined);
    expect(seen).toEqual(corpus.map((record) => record.listingKey));
  });

  it("computes at least one page for an empty result", () => {
    expect(pageCount(0, 12)).toBe(1);
    expect(pageCount(13, 12)).toBe(2);
    expect(pageCount(24, 12)).toBe(2);
    expect(pageCount(10, 0)).toBe(1);
  });
});

describe("runListingSearch", () => {
  it("filters before it sorts and counts before it paginates", () => {
    const result = runListingSearch(FLORIDA_FIXTURES, {
      market: "FL",
      status: [...PUBLICLY_DISPLAYABLE],
      sort: "price_asc",
      limit: 3
    });
    expect(result.items).toHaveLength(3);
    expect(result.totalCount).toBeGreaterThan(3);
    const prices = result.items.map((record) => record.listPriceCents ?? 0);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("never returns a status outside the requested set", () => {
    const result = runListingSearch(FLORIDA_FIXTURES, {
      market: "FL",
      status: [...PUBLICLY_DISPLAYABLE],
      limit: 100
    });
    for (const record of result.items) {
      expect(PUBLICLY_DISPLAYABLE, record.listingKey).toContain(record.standardStatus);
    }
    expect(result.items.some((record) => record.standardStatus === "closed")).toBe(false);
  });

  it("narrows to a city typed as a query", () => {
    const result = runListingSearch(FLORIDA_FIXTURES, {
      market: "FL",
      query: "st. petersburg",
      limit: 100
    });
    expect(result.totalCount).toBeGreaterThan(0);
    for (const record of result.items) {
      expect(record.address.city).toBe("St. Petersburg");
    }
  });

  it("returns an empty, well-formed result for a query that matches nothing", () => {
    const result = runListingSearch(FLORIDA_FIXTURES, {
      market: "FL",
      query: "Anchorage",
      limit: 12
    });
    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.nextCursor).toBeUndefined();
  });

  it("agrees with filterListings on the match count", () => {
    const input = { market: "FL", minBeds: 3, propertyTypes: ["Single Family Residence"] };
    const expected = filterListings(FLORIDA_FIXTURES, input);
    expect(runListingSearch(FLORIDA_FIXTURES, { ...input, limit: 1 }).totalCount).toBe(
      expected.length
    );
  });
});

describe("FixtureListingProvider", () => {
  const provider = new FixtureListingProvider();

  it("reports a single snapshot time rather than pretending to be live", async () => {
    const page = await provider.search({ market: "FL", limit: 5 });
    expect(page.dataAsOf).toBe(FIXTURE_DATA_AS_OF);
  });

  it("returns a total count alongside the page", async () => {
    const page = await provider.search({ market: "FL", limit: 5 });
    expect(page.items).toHaveLength(5);
    expect(page.totalCount).toBe(FLORIDA_FIXTURES.length);
  });

  it("resolves a record by key and returns null for an unknown one", async () => {
    expect(await provider.getByKey("FX-TPA-0001")).not.toBeNull();
    expect(await provider.getByKey("../../etc/passwd")).toBeNull();
  });
});
