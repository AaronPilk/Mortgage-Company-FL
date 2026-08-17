import { describe, expect, it } from "vitest";
import { FLORIDA_FIXTURES, runListingSearch } from "@tract/integrations";
import {
  PAGE_SIZE,
  PropertySearchQuerySchema,
  criteriaToQueryString,
  hasActiveFilters,
  parseCriteria,
  propertiesHref,
  toProviderInput
} from "../../components/properties/criteria";
import {
  PAYMENT_ASSUMPTIONS,
  estimateListingPayment
} from "../../components/properties/payment-estimate";
import {
  cityLine,
  factSummary,
  formatLotSize,
  streetLine
} from "../../components/properties/listing-format";

const criteriaFrom = (raw: Record<string, string | string[] | undefined>) =>
  parseCriteria(raw).criteria;

describe("property search criteria", () => {
  it("applies defaults for an empty query string", () => {
    const { criteria, valid } = parseCriteria({});
    expect(valid).toBe(true);
    expect(criteria).toEqual({ type: [], status: [], sort: "newest", page: 1 });
  });

  it("treats an empty parameter as absent rather than as a filter", () => {
    const criteria = criteriaFrom({ q: "", minPrice: "", beds: "" });
    expect(criteria.q).toBeUndefined();
    expect(criteria.minPrice).toBeUndefined();
    expect(criteria.beds).toBeUndefined();
  });

  it("trims the free-text query", () => {
    expect(criteriaFrom({ q: "  Tampa  " }).q).toBe("Tampa");
  });

  it("accepts repeated and comma-joined multi-value parameters", () => {
    expect(criteriaFrom({ type: ["Condominium", "Duplex"] }).type).toEqual([
      "Condominium",
      "Duplex"
    ]);
    expect(criteriaFrom({ status: "active,pending" }).status).toEqual(["active", "pending"]);
  });

  it("rejects a value outside the closed sets", () => {
    expect(PropertySearchQuerySchema.safeParse({ sort: "cheapest" }).success).toBe(false);
    expect(PropertySearchQuerySchema.safeParse({ type: "Houseboat" }).success).toBe(false);
    expect(PropertySearchQuerySchema.safeParse({ status: "withdrawn" }).success).toBe(false);
  });

  it("rejects a price range that is inverted", () => {
    expect(
      PropertySearchQuerySchema.safeParse({ minPrice: "500000", maxPrice: "400000" }).success
    ).toBe(false);
  });

  it("salvages the readable parts of a broken link instead of failing the page", () => {
    const { criteria, valid } = parseCriteria({ q: "Sarasota", minPrice: "cheap", sort: "nope" });
    expect(valid).toBe(false);
    expect(criteria.q).toBe("Sarasota");
    expect(criteria.minPrice).toBeUndefined();
    expect(criteria.sort).toBe("newest");
  });

  it("reports whether any filter is active", () => {
    expect(hasActiveFilters(criteriaFrom({}))).toBe(false);
    expect(hasActiveFilters(criteriaFrom({ sort: "price_asc", page: "3" }))).toBe(false);
    expect(hasActiveFilters(criteriaFrom({ q: "Tampa" }))).toBe(true);
    expect(hasActiveFilters(criteriaFrom({ type: "Land" }))).toBe(true);
  });
});

describe("criteria to provider input", () => {
  it("converts dollars in the URL to integer cents at the boundary", () => {
    const input = toProviderInput(criteriaFrom({ minPrice: "300000", maxPrice: "450000" }));
    expect(input.minPriceCents).toBe(300_000_00);
    expect(input.maxPriceCents).toBe(450_000_00);
    expect(Number.isInteger(input.minPriceCents ?? 0)).toBe(true);
  });

  it("never requests a status outside the publicly displayable set", () => {
    expect(toProviderInput(criteriaFrom({})).status).toEqual(["active", "coming_soon", "pending"]);
    expect(toProviderInput(criteriaFrom({ status: "pending" })).status).toEqual(["pending"]);
  });

  it("turns a page number into an offset cursor", () => {
    expect(toProviderInput(criteriaFrom({})).cursor).toBeUndefined();
    expect(toProviderInput(criteriaFrom({ page: "3" }), { pageSize: 12 }).cursor).toBe("24");
  });

  it("omits a filter the reader did not set", () => {
    const input = toProviderInput(criteriaFrom({}));
    expect(input.query).toBeUndefined();
    expect(input.minBeds).toBeUndefined();
    expect(input.propertyTypes).toBeUndefined();
  });
});

describe("criteria round trip", () => {
  it("reparses to the same criteria", () => {
    const original = criteriaFrom({
      q: "St. Petersburg",
      minPrice: "250000",
      maxPrice: "600000",
      beds: "3",
      baths: "2",
      type: ["Condominium", "Duplex"],
      status: "active",
      sort: "price_asc",
      page: "2"
    });
    const query = criteriaToQueryString(original);
    const params = new URLSearchParams(query);
    const raw: Record<string, string[]> = {};
    for (const key of new Set(params.keys())) raw[key] = params.getAll(key);
    expect(criteriaFrom(raw)).toEqual(original);
  });

  it("omits defaults so a shared link stays short", () => {
    expect(propertiesHref(criteriaFrom({}))).toBe("/properties");
    expect(propertiesHref(criteriaFrom({ sort: "newest", page: "1" }))).toBe("/properties");
    expect(propertiesHref(criteriaFrom({ q: "Tampa" }))).toBe("/properties?q=Tampa");
  });

  it("applies an override without disturbing the rest of the query", () => {
    const criteria = criteriaFrom({ q: "Tampa", sort: "price_asc" });
    expect(propertiesHref(criteria, { page: 2 })).toBe("/properties?q=Tampa&sort=price_asc&page=2");
  });
});

describe("end-to-end over the fixture corpus", () => {
  it("pages through every publicly displayable record without repeats or gaps", () => {
    const seen: string[] = [];
    let page = 1;
    let total: number;
    for (;;) {
      const result = runListingSearch(
        FLORIDA_FIXTURES,
        toProviderInput(criteriaFrom({ page: String(page) }), { pageSize: PAGE_SIZE })
      );
      total = result.totalCount;
      seen.push(...result.items.map((item) => item.listingKey));
      if (result.nextCursor === undefined) break;
      page += 1;
    }
    expect(seen).toHaveLength(total);
    expect(new Set(seen).size).toBe(total);
    expect(total).toBeGreaterThan(PAGE_SIZE);
  });

  it("returns only the requested city for a typed query", () => {
    const result = runListingSearch(
      FLORIDA_FIXTURES,
      toProviderInput(criteriaFrom({ q: "33701" }))
    );
    expect(result.totalCount).toBeGreaterThan(0);
    for (const item of result.items) expect(item.address.postalCode).toBe("33701");
  });

  it("honours a combined price, beds, and type filter", () => {
    const result = runListingSearch(
      FLORIDA_FIXTURES,
      toProviderInput(criteriaFrom({ minPrice: "300000", beds: "4", type: "Duplex" }))
    );
    for (const item of result.items) {
      expect(item.propertyType).toBe("Duplex");
      expect(item.listPriceCents ?? 0).toBeGreaterThanOrEqual(300_000_00);
      expect(item.bedrooms ?? 0).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("listing presentation", () => {
  it("never invents an address", () => {
    for (const record of FLORIDA_FIXTURES) {
      expect(streetLine(record)).toContain("Example");
      expect(cityLine(record)).toContain("FL");
    }
  });

  it("summarises a land record without fabricating a bedroom count", () => {
    const parcel = FLORIDA_FIXTURES.find((record) => record.propertyType === "Land");
    expect(parcel).toBeDefined();
    expect(factSummary(parcel!)).toEqual([]);
  });

  it("reads a large lot in acres and a small one in square feet", () => {
    expect(formatLotSize(1_742_400)).toBe("40 acres");
    expect(formatLotSize(6_500)).toBe("6,500 sq ft");
    expect(formatLotSize(undefined)).toBeNull();
  });
});

describe("listing payment estimate", () => {
  const priced = FLORIDA_FIXTURES.find((record) => record.listingKey === "FX-TPA-0001");

  it("derives the loan amount from the stated down payment assumption", () => {
    const estimate = estimateListingPayment(priced!);
    expect(estimate).not.toBeNull();
    expect(estimate!.purchasePriceCents).toBe(429_000_00);
    expect(estimate!.downPaymentCents).toBe(85_800_00);
    expect(estimate!.loanAmountCents).toBe(343_200_00);
    expect(PAYMENT_ASSUMPTIONS.downPaymentBasisPoints).toBe(2_000);
  });

  it("keeps every figure in whole cents", () => {
    const { breakdown } = estimateListingPayment(priced!)!;
    for (const value of Object.values(breakdown)) {
      if (typeof value !== "number") continue;
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("includes association dues in the total when the record carries them", () => {
    const condo = FLORIDA_FIXTURES.find((record) => record.listingKey === "FX-MIA-0004")!;
    const estimate = estimateListingPayment(condo)!;
    expect(estimate.breakdown.hoaCents).toBe(985_00);
    expect(estimate.breakdown.totalMonthlyCents).toBeGreaterThan(
      estimate.breakdown.principalAndInterestCents
    );
    expect(estimate.usedListingHoa).toBe(true);
  });

  it("refuses to estimate a payment for a record with no price", () => {
    const unpriced = { ...priced! };
    delete (unpriced as { listPriceCents?: number }).listPriceCents;
    expect(estimateListingPayment(unpriced)).toBeNull();
  });
});
