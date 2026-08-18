import { describe, expect, it } from "vitest";
import { PropertyInterpretRequestSchema } from "@tract/schemas";
import {
  EXTRACTION_TOOL,
  describeCriteria,
  extractionToInterpreted,
  interpretedToCriteria,
  interpretedToExtraction,
  parseNaturalQuery
} from "../../components/properties/nl-parser";

describe("rule-based natural-language parser", () => {
  it("reads the canonical example phrase", () => {
    expect(parseNaturalQuery("3 bedrooms in St. Pete under $500K")).toEqual({
      q: "St. Petersburg",
      beds: 3,
      maxPrice: 500_000
    });
  });

  it("understands city aliases and casing", () => {
    expect(parseNaturalQuery("something in SAINT PETERSBURG").q).toBe("St. Petersburg");
    expect(parseNaturalQuery("st petersburg condo").q).toBe("St. Petersburg");
    expect(parseNaturalQuery("a place in Tampa").q).toBe("Tampa");
  });

  it("treats a Florida-shaped ZIP as the place, not a price", () => {
    const result = parseNaturalQuery("anything in 33701");
    expect(result.q).toBe("33701");
    expect(result.maxPrice).toBeUndefined();
  });

  it("parses price ceilings in several spellings", () => {
    expect(parseNaturalQuery("under 500k").maxPrice).toBe(500_000);
    expect(parseNaturalQuery("below $450,000").maxPrice).toBe(450_000);
    expect(parseNaturalQuery("less than 1.2m").maxPrice).toBe(1_200_000);
    expect(parseNaturalQuery("up to 350 thousand").maxPrice).toBe(350_000);
    expect(parseNaturalQuery("no more than $600k").maxPrice).toBe(600_000);
  });

  it("parses price floors", () => {
    expect(parseNaturalQuery("over 300k").minPrice).toBe(300_000);
    expect(parseNaturalQuery("at least $250,000").minPrice).toBe(250_000);
  });

  it("parses a range, applying a trailing suffix to both ends", () => {
    expect(parseNaturalQuery("between 300 and 400k")).toEqual({
      minPrice: 300_000,
      maxPrice: 400_000
    });
    expect(parseNaturalQuery("between $250,000 and $425,000")).toEqual({
      minPrice: 250_000,
      maxPrice: 425_000
    });
  });

  it("treats a lone budget figure as a ceiling", () => {
    expect(parseNaturalQuery("3 bed 2 bath 500k")).toEqual({
      beds: 3,
      baths: 2,
      maxPrice: 500_000
    });
  });

  it("swaps an inverted range instead of producing invalid criteria", () => {
    const result = parseNaturalQuery("between 600k and 400k");
    expect(result.minPrice).toBe(400_000);
    expect(result.maxPrice).toBe(600_000);
  });

  it("reads bed and bath counts, including spoken numbers and plus signs", () => {
    expect(parseNaturalQuery("3 bed 2 bath")).toEqual({ beds: 3, baths: 2 });
    expect(parseNaturalQuery("three bedrooms two bathrooms")).toEqual({ beds: 3, baths: 2 });
    expect(parseNaturalQuery("4+ br")).toEqual({ beds: 4 });
    expect(parseNaturalQuery("2.5 baths")).toEqual({ baths: 2.5 });
  });

  it("clamps counts to the schema's closed range instead of failing validation", () => {
    expect(parseNaturalQuery("9 bedroom mansion").beds).toBe(6);
  });

  it("maps property-type words onto the closed option set", () => {
    expect(parseNaturalQuery("a condo in Miami").type).toEqual(["Condominium"]);
    expect(parseNaturalQuery("townhome or duplex").type).toEqual(["Townhouse", "Duplex"]);
    expect(parseNaturalQuery("single family house").type).toEqual(["Single Family Residence"]);
    expect(parseNaturalQuery("land in Sarasota").type).toEqual(["Land"]);
  });

  it("reads status words", () => {
    expect(parseNaturalQuery("coming soon condos").status).toEqual(["coming_soon"]);
    expect(parseNaturalQuery("pending sales in Tampa").status).toEqual(["pending"]);
  });

  it("ignores concepts the search cannot filter by rather than guessing", () => {
    const result = parseNaturalQuery("3 beds with a pool on the waterfront in Tampa");
    expect(result).toEqual({ beds: 3, q: "Tampa" });
  });

  it("returns empty criteria for garbage instead of crashing", () => {
    expect(parseNaturalQuery("")).toEqual({});
    expect(parseNaturalQuery("%%% ???? !!!!")).toEqual({});
    expect(parseNaturalQuery("qwertyuiop asdfgh")).toEqual({});
    expect(parseNaturalQuery("🏠🏠🏠")).toEqual({});
    expect(parseNaturalQuery("a".repeat(10_000))).toEqual({});
  });

  it("survives adversarial number soup without producing invalid criteria", () => {
    const criteria = interpretedToCriteria(
      parseNaturalQuery("under 99999999999 dollars 55 beds -3 baths")
    );
    // Everything lands inside the schema's closed ranges or is dropped.
    expect(criteria.page).toBe(1);
    expect(criteria.beds === undefined || criteria.beds <= 6).toBe(true);
    expect(criteria.maxPrice === undefined || criteria.maxPrice <= 50_000_000).toBe(true);
  });
});

describe("interpreted criteria to URL criteria", () => {
  it("round-trips through the same schema the URL uses", () => {
    const criteria = interpretedToCriteria(parseNaturalQuery("3 bed condo in Tampa under 500k"));
    expect(criteria).toEqual({
      q: "Tampa",
      beds: 3,
      maxPrice: 500_000,
      type: ["Condominium"],
      status: [],
      sort: "newest",
      page: 1
    });
  });

  it("yields the default criteria for an empty interpretation", () => {
    expect(interpretedToCriteria({})).toEqual({ type: [], status: [], sort: "newest", page: 1 });
  });
});

describe("AI extraction contract", () => {
  it("accepts a well-formed tool answer", () => {
    const interpreted = extractionToInterpreted({
      city: "St. Petersburg",
      minPriceDollars: 300_000,
      maxPriceDollars: 500_000,
      minBeds: 3,
      propertyTypes: ["Condominium"],
      statuses: ["active"]
    });
    expect(interpreted).toEqual({
      q: "St. Petersburg",
      minPrice: 300_000,
      maxPrice: 500_000,
      beds: 3,
      type: ["Condominium"],
      status: ["active"]
    });
  });

  it("drops model inventions that are outside the closed sets", () => {
    const interpreted = extractionToInterpreted({
      city: "Atlantis",
      propertyTypes: ["Houseboat", "Condominium"],
      statuses: ["withdrawn"],
      sort: "cheapest",
      minBeds: 99
    });
    expect(interpreted.q).toBeUndefined();
    expect(interpreted.type).toEqual(["Condominium"]);
    expect(interpreted.status).toBeUndefined();
    expect(interpreted.sort).toBeUndefined();
    expect(interpreted.beds).toBe(6);
  });

  it("treats null and non-object output as an empty interpretation", () => {
    expect(extractionToInterpreted(null)).toEqual({});
    expect(extractionToInterpreted("under 500k")).toEqual({});
    expect(extractionToInterpreted(42)).toEqual({});
  });

  it("keeps the fixture responder's answers inside its own contract", () => {
    const extraction = interpretedToExtraction(
      parseNaturalQuery("3 bed condo in St. Pete under 500k")
    );
    expect(extractionToInterpreted(extraction)).toEqual(
      parseNaturalQuery("3 bed condo in St. Pete under 500k")
    );
  });

  it("constrains the tool schema to the same closed sets as the URL schema", () => {
    const properties = (EXTRACTION_TOOL.inputSchema as Record<string, unknown>)
      .properties as Record<string, { enum?: string[]; items?: { enum?: string[] } }>;
    expect(properties.propertyTypes?.items?.enum).toContain("Condominium");
    expect(properties.propertyTypes?.items?.enum).not.toContain("Houseboat");
    expect(properties.statuses?.items?.enum).toEqual(["active", "coming_soon", "pending"]);
  });
});

describe("echo restatement", () => {
  it("restates criteria, never the raw query", () => {
    const criteria = interpretedToCriteria(
      parseNaturalQuery("3 bed 2 bath condo in St. Pete under $500K")
    );
    expect(describeCriteria(criteria)).toBe(
      "3+ beds, 2+ baths condos in St. Petersburg under $500,000"
    );
  });

  it("describes a range and a floor", () => {
    expect(
      describeCriteria(interpretedToCriteria(parseNaturalQuery("between 300k and 400k in Tampa")))
    ).toBe("Listings in Tampa $300,000–$400,000");
    expect(describeCriteria(interpretedToCriteria(parseNaturalQuery("over 1m")))).toBe(
      "Listings over $1,000,000"
    );
  });

  it("has an honest answer for no criteria at all", () => {
    expect(describeCriteria(interpretedToCriteria({}))).toBe("All sample listings");
  });
});

describe("interpret request schema", () => {
  it("accepts a plain query and trims it", () => {
    const parsed = PropertyInterpretRequestSchema.parse({ query: "  3 beds in Tampa  " });
    expect(parsed.query).toBe("3 beds in Tampa");
  });

  it("rejects an empty, missing, oversized, or non-string query", () => {
    expect(PropertyInterpretRequestSchema.safeParse({ query: "" }).success).toBe(false);
    expect(PropertyInterpretRequestSchema.safeParse({ query: "   " }).success).toBe(false);
    expect(PropertyInterpretRequestSchema.safeParse({}).success).toBe(false);
    expect(PropertyInterpretRequestSchema.safeParse({ query: 42 }).success).toBe(false);
    expect(PropertyInterpretRequestSchema.safeParse({ query: "x".repeat(301) }).success).toBe(
      false
    );
  });

  it("drops unknown fields rather than carrying them forward", () => {
    const parsed = PropertyInterpretRequestSchema.parse({ query: "tampa", admin: true });
    expect(parsed).toEqual({ query: "tampa" });
  });
});
