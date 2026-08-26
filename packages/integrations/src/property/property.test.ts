import { describe, expect, it } from "vitest";
import { FemaFloodPort } from "./adapters";
import { FixturePropertyFactsPort } from "./fixtures";
import { looksLikeUrl, parseListingLink } from "./listing-link";

function stubFetch(body: unknown, ok = true): typeof fetch {
  return (async () =>
    ({ ok, json: async () => body }) as unknown as Response) as unknown as typeof fetch;
}

describe("parseListingLink", () => {
  it("reads a Zillow slug into its four parts", () => {
    const result = parseListingLink(
      "https://www.zillow.com/homedetails/1247-Snug-Harbor-Dr-Tampa-FL-33602/12345678_zpid/"
    );
    expect(result).not.toBeNull();
    expect(result!.host).toBe("zillow");
    expect(result!.address).toEqual({
      line1: "1247 Snug Harbor Dr",
      city: "Tampa",
      state: "FL",
      postalCode: "33602"
    });
  });

  it("keeps a directional with the street and a two-word city intact", () => {
    const result = parseListingLink(
      "https://www.zillow.com/homedetails/500-4th-Ave-N-St-Petersburg-FL-33701/9_zpid/"
    );
    expect(result!.address).toEqual({
      line1: "500 4th Ave N",
      city: "St Petersburg",
      state: "FL",
      postalCode: "33701"
    });
  });

  it("reads Realtor's underscore-delimited detail slug", () => {
    const result = parseListingLink(
      "https://www.realtor.com/realestateandhomes-detail/88-Bayshore-Blvd_Tampa_FL_33606_M12345-67890"
    );
    expect(result!.host).toBe("realtor");
    expect(result!.address).toEqual({
      line1: "88 Bayshore Blvd",
      city: "Tampa",
      state: "FL",
      postalCode: "33606"
    });
  });

  it("reads Redfin's path-segment layout", () => {
    const result = parseListingLink("https://www.redfin.com/FL/Tampa/123-Main-St-33602/home/12345");
    expect(result!.host).toBe("redfin");
    expect(result!.address).toEqual({
      line1: "123 Main St",
      city: "Tampa",
      state: "FL",
      postalCode: "33602"
    });
  });

  it("still extracts an address from an unrecognised host", () => {
    const result = parseListingLink("https://example.com/listing/77-Palm-Way-Naples-FL-34102");
    expect(result!.host).toBe("other");
    expect(result!.address.state).toBe("FL");
    expect(result!.address.postalCode).toBe("34102");
  });

  it("returns null for text that is not a URL", () => {
    expect(parseListingLink("123 Main St, Tampa FL")).toBeNull();
    expect(parseListingLink("")).toBeNull();
    expect(looksLikeUrl("https://zillow.com/x")).toBe(true);
    expect(looksLikeUrl("123 Main St")).toBe(false);
  });
});

describe("FixturePropertyFactsPort", () => {
  it("echoes the requested address and carries non-empty limitations", async () => {
    const sourced = await new FixturePropertyFactsPort().lookup({
      line1: "742 Evergreen Ter",
      city: "Sarasota",
      state: "FL",
      postalCode: "34236"
    });
    expect(sourced).not.toBeNull();
    expect(sourced!.value.normalizedAddress.line1).toBe("742 Evergreen Ter");
    expect(sourced!.value.marketValueCents).toBeGreaterThan(0);
    expect(Number.isInteger(sourced!.value.marketValueCents ?? 0)).toBe(true);
    expect(sourced!.provenance.provider).toBe("fixture");
    expect(sourced!.provenance.limitations.length).toBeGreaterThan(0);
  });

  it("fills a blank address with a labelled example so the shape is always valid", async () => {
    const sourced = await new FixturePropertyFactsPort().lookup({
      line1: "",
      city: "",
      state: "",
      postalCode: ""
    });
    expect(sourced!.value.normalizedAddress.city).toBe("Tampa");
  });
});

describe("FemaFloodPort", () => {
  it("maps a high-risk zone from a FEMA feature", async () => {
    const port = new FemaFloodPort({
      fetchImpl: stubFetch({ features: [{ attributes: { FLD_ZONE: "AE", SFHA_TF: "T" } }] })
    });
    const sourced = await port.lookup({ latitude: 27.9, longitude: -82.4 });
    expect(sourced).not.toBeNull();
    expect(sourced!.value.floodZone).toContain("AE");
    expect(sourced!.value.inSpecialFloodHazardArea).toBe(true);
    expect(sourced!.provenance.limitations.length).toBeGreaterThan(0);
  });

  it("treats zone X as not high-risk", async () => {
    const port = new FemaFloodPort({
      fetchImpl: stubFetch({ features: [{ attributes: { FLD_ZONE: "X", SFHA_TF: "F" } }] })
    });
    const sourced = await port.lookup({ latitude: 27.9, longitude: -82.4 });
    expect(sourced!.value.inSpecialFloodHazardArea).toBe(false);
  });

  it("returns null when FEMA has no feature at the point", async () => {
    const port = new FemaFloodPort({ fetchImpl: stubFetch({ features: [] }) });
    expect(await port.lookup({ latitude: 0, longitude: 0 })).toBeNull();
  });

  it("returns null instead of throwing on a network error", async () => {
    const port = new FemaFloodPort({
      fetchImpl: (async () => {
        throw new Error("network down");
      }) as unknown as typeof fetch
    });
    expect(await port.lookup({ latitude: 27.9, longitude: -82.4 })).toBeNull();
  });
});
