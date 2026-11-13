import { describe, expect, it } from "vitest";
import { dollarsToCents } from "@tract/mortgage-math";
import type { ListingStatus, ListingSummary } from "./port";
import { parseSavedSearchQuery, selectNewMatches } from "./saved-search";

/**
 * Unit spec for the saved-search alert primitives. Both functions are pure, so
 * the query mapping, the cold-start signal, the strict-newer filter, the cap, and
 * the equal-timestamp boundary rule are all proven here without a provider.
 */

function listing(
  key: string,
  modificationTimestamp: string | undefined,
  overrides: Partial<ListingSummary> = {}
): ListingSummary {
  return {
    provider: "stellar",
    listingKey: key,
    standardStatus: "active",
    address: { city: "Tampa", state: "FL" },
    attributionText: "Test MLS",
    isFixture: false,
    ...(modificationTimestamp === undefined ? {} : { modificationTimestamp }),
    ...overrides
  };
}

describe("parseSavedSearchQuery", () => {
  it("maps the canonical query string to a provider input, forcing sort to newest", () => {
    const input = parseSavedSearchQuery({ searchParams: "q=Tampa&beds=3" });
    expect(input.market).toBe("FL");
    expect(input.sort).toBe("newest");
    expect(input.query).toBe("Tampa");
    expect(input.minBeds).toBe(3);
    // No status stored → the full publicly displayable set.
    expect(input.status).toEqual(["active", "coming_soon", "pending"]);
  });

  it("converts whole-dollar prices to integer cents at the one boundary", () => {
    const input = parseSavedSearchQuery({ searchParams: "minPrice=400000&maxPrice=500000" });
    expect(input.minPriceCents).toBe(dollarsToCents(400_000));
    expect(input.maxPriceCents).toBe(dollarsToCents(500_000));
  });

  it("drops an inverted price range's minimum rather than returning nothing", () => {
    const input = parseSavedSearchQuery({ searchParams: "minPrice=500000&maxPrice=400000" });
    expect(input.minPriceCents).toBeUndefined();
    expect(input.maxPriceCents).toBe(dollarsToCents(400_000));
  });

  it("keeps only known enum values for type and status", () => {
    const input = parseSavedSearchQuery({
      searchParams: "type=Condominium,NotAType&status=active,bogus"
    });
    expect(input.propertyTypes).toEqual(["Condominium"]);
    expect(input.status).toEqual(["active"]);
  });

  it("honors the caller's limit and defaults to a bounded page", () => {
    expect(parseSavedSearchQuery({ searchParams: "" }, { limit: 5 }).limit).toBe(5);
    expect(parseSavedSearchQuery({ searchParams: "" }).limit).toBe(20);
  });
});

describe("selectNewMatches", () => {
  const WM = "2026-08-10T00:00:00.000Z";

  it("returns nothing and no watermark on cold start (null watermark)", () => {
    const result = selectNewMatches([listing("A", "2026-08-25T00:00:00.000Z")], null, 10);
    expect(result.matches).toEqual([]);
    expect(result.newWatermark).toBeNull();
  });

  it("returns only listings strictly newer than the watermark", () => {
    const results = [
      listing("OLD", "2026-08-01T00:00:00.000Z"),
      listing("AT-WM", WM), // equal to the watermark → already seen
      listing("NEW", "2026-08-20T00:00:00.000Z")
    ];
    const { matches, newWatermark } = selectNewMatches(results, WM, 10);
    expect(matches.map((m) => m.listingKey)).toEqual(["NEW"]);
    expect(newWatermark).toBe("2026-08-20T00:00:00.000Z");
  });

  it("drains oldest-first and caps, leaving the rest for the next run", () => {
    const results = [
      listing("N3", "2026-08-24T00:00:00.000Z"),
      listing("N1", "2026-08-12T00:00:00.000Z"),
      listing("N2", "2026-08-18T00:00:00.000Z")
    ];
    const { matches, newWatermark } = selectNewMatches(results, WM, 2);
    expect(matches.map((m) => m.listingKey)).toEqual(["N1", "N2"]);
    // Watermark advances only to the newest of the emitted batch, so N3 survives.
    expect(newWatermark).toBe("2026-08-18T00:00:00.000Z");
  });

  it("never splits an equal-timestamp group across the watermark", () => {
    const shared = "2026-08-18T00:00:00.000Z";
    const results = [
      listing("A", "2026-08-12T00:00:00.000Z"),
      listing("B", shared),
      listing("C", shared)
    ];
    // Cap 2 would take A and one of the shared-ts pair; the boundary rule trims
    // the shared group so the batch ends on a clean timestamp.
    const { matches, newWatermark } = selectNewMatches(results, WM, 2);
    expect(matches.map((m) => m.listingKey)).toEqual(["A"]);
    expect(newWatermark).toBe("2026-08-12T00:00:00.000Z");
  });

  it("takes the whole group when the cap is a single shared timestamp (progress guarantee)", () => {
    const shared = "2026-08-18T00:00:00.000Z";
    const results = [listing("A", shared), listing("B", shared), listing("C", shared)];
    const { matches, newWatermark } = selectNewMatches(results, WM, 2);
    expect(matches.map((m) => m.listingKey)).toEqual(["A", "B", "C"]);
    expect(newWatermark).toBe(shared);
  });

  it("drops fixtures and non-displayable statuses (invariant 6)", () => {
    const results = [
      listing("FIX", "2026-08-20T00:00:00.000Z", { isFixture: true }),
      listing("CLOSED", "2026-08-21T00:00:00.000Z", { standardStatus: "closed" as ListingStatus }),
      listing("LIVE", "2026-08-22T00:00:00.000Z")
    ];
    const { matches } = selectNewMatches(results, WM, 10);
    expect(matches.map((m) => m.listingKey)).toEqual(["LIVE"]);
  });

  it("ignores listings with no parseable modificationTimestamp", () => {
    const results = [listing("NOTS", undefined), listing("NEW", "2026-08-20T00:00:00.000Z")];
    const { matches } = selectNewMatches(results, WM, 10);
    expect(matches.map((m) => m.listingKey)).toEqual(["NEW"]);
  });
});
