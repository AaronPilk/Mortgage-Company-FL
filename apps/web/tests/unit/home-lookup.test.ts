import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sourced } from "@tract/domain";
import { FixtureFloodPort, FixturePropertyFactsPort, makeProvenance } from "@tract/integrations";
import { lookupHome, resolveListingLink } from "../../lib/home-lookup";
import { __setFloodForTesting, __setPropertyFactsForTesting } from "../../lib/property";

// A live FLOOD_MODE so lookupHome exercises the flood path; the provider itself
// is always injected below, so no test ever touches the network.
process.env.FLOOD_MODE = "production";

describe("resolveListingLink", () => {
  it("returns a complete address for a full listing slug", () => {
    const resolved = resolveListingLink(
      "https://www.zillow.com/homedetails/1247-Snug-Harbor-Dr-Tampa-FL-33602/1_zpid/"
    );
    expect(resolved.address).toEqual({
      line1: "1247 Snug Harbor Dr",
      city: "Tampa",
      state: "FL",
      postalCode: "33602"
    });
  });

  it("returns a null address (to confirm) when the slug is incomplete", () => {
    const resolved = resolveListingLink("https://www.zillow.com/homedetails/a-listing/1_zpid/");
    expect(resolved.address).toBeNull();
  });
});

describe("lookupHome", () => {
  beforeEach(() => {
    __setPropertyFactsForTesting(new FixturePropertyFactsPort());
    __setFloodForTesting(new FixtureFloodPort());
  });
  afterEach(() => {
    __setPropertyFactsForTesting(undefined);
    __setFloodForTesting(undefined);
  });

  it("builds a labelled, cents-clean result with a baseline anchored on the value estimate", async () => {
    const result = await lookupHome({
      line1: "742 Evergreen Ter",
      city: "Sarasota",
      state: "FL",
      postalCode: "34236"
    });

    expect(result).not.toBeNull();
    expect(result!.sampleData.containsSampleData).toBe(true);
    expect(result!.sampleData.notice).not.toBeNull();
    expect(result!.value?.estimateCents).toBeGreaterThan(0);
    expect(result!.baseline).not.toBeNull();
    expect(result!.baseline!.anchorPriceCents).toBe(result!.value!.estimateCents);
    expect(result!.baseline!.monthlyTotalCents).toBeGreaterThan(
      result!.baseline!.monthlyPrincipalInterestCents
    );
    expect(Number.isInteger(result!.baseline!.monthlyTotalCents)).toBe(true);
    expect(result!.baseline!.usedProviderTax).toBe(true);
    expect(result!.provenance.limitations.length).toBeGreaterThan(0);
    // Flood is wired in and value-aware insurance is seeded (fixture zone X, no SFHA).
    expect(result!.flood).not.toBeNull();
    expect(result!.flood!.inSpecialFloodHazardArea).toBe(false);
    expect(result!.baseline!.annualHomeInsuranceCents).toBeGreaterThan(0);
    expect(result!.baseline!.monthlyFloodInsuranceCents).toBe(0);
  });

  it("adds flood insurance to the baseline inside a Special Flood Hazard Area", async () => {
    __setFloodForTesting({
      key: "test",
      lookup: async () =>
        sourced(
          { floodZone: "AE", mapEffectiveDate: "current", inSpecialFloodHazardArea: true },
          makeProvenance({ provider: "test", licenseClass: "public", limitations: ["test double"] })
        )
    });
    const result = await lookupHome({
      line1: "1 Coast Ave",
      city: "Tampa",
      state: "FL",
      postalCode: "33602"
    });
    expect(result!.flood!.zone).toContain("AE");
    expect(result!.flood!.inSpecialFloodHazardArea).toBe(true);
    expect(result!.baseline!.monthlyFloodInsuranceCents).toBeGreaterThan(0);
  });

  it("returns null when the provider has no record", async () => {
    __setPropertyFactsForTesting({ key: "disabled", lookup: async () => null });
    const result = await lookupHome({
      line1: "1 Nowhere",
      city: "Nowhere",
      state: "FL",
      postalCode: "00000"
    });
    expect(result).toBeNull();
  });
});
