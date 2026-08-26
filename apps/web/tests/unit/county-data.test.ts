import { describe, expect, it } from "vitest";
import { COUNTIES, COUNTY_AS_OF, countyBySlug, type FloodExposure } from "../../lib/county-data";
import { ROUTE_REGISTRY } from "../../content/routes";

/**
 * County reference-data contract.
 *
 * County pages carry real, county-specific material and — the load-bearing part
 * under invariant 6 — never assert a precise tax figure. This test enforces the
 * structure that makes the pages publishable and the compliance rule that keeps
 * them honest: unique, well-formed slugs; a primary-source appraiser link; and
 * no fabricated millage or percentage anywhere in the copy.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_EXPOSURE: FloodExposure[] = ["high-coastal", "mixed", "inland"];

/** Counties added in this feature — each was provided with a sourced appraiser URL. */
const NEW_COUNTY_SLUGS = [
  "broward-county",
  "palm-beach-county",
  "polk-county",
  "brevard-county",
  "volusia-county",
  "pasco-county",
  "seminole-county",
  "sarasota-county",
  "collier-county",
  "manatee-county"
];

/** Every text field a reviewer would read on the page, joined for scanning. */
function copyOf(county: (typeof COUNTIES)[number]): string {
  return [county.floodNote, county.localAssistanceNote, county.metaDescription].join("\n");
}

describe("county collection", () => {
  it("keeps the as-of stamp", () => {
    expect(COUNTY_AS_OF).toBe("August 2026");
  });

  it("has globally unique slugs", () => {
    expect(new Set(COUNTIES.map((c) => c.slug)).size).toBe(COUNTIES.length);
  });

  it("has unique meta descriptions", () => {
    expect(new Set(COUNTIES.map((c) => c.metaDescription)).size).toBe(COUNTIES.length);
  });

  it("includes every newly sourced county", () => {
    for (const slug of NEW_COUNTY_SLUGS) {
      expect(countyBySlug(slug), `${slug} is missing`).toBeDefined();
    }
  });

  it("every newly sourced county carries an https appraiser URL", () => {
    for (const slug of NEW_COUNTY_SLUGS) {
      const county = countyBySlug(slug);
      expect(county?.appraiserUrl, `${slug} has no appraiser URL`).toBeDefined();
      expect(county?.appraiserUrl?.startsWith("https://")).toBe(true);
    }
  });

  it("agrees with every /florida-mortgage route already in the registry", () => {
    const registeredCounties = ROUTE_REGISTRY.filter(
      (route) =>
        route.path.startsWith("/florida-mortgage/") &&
        // County routes are the two-segment ones; the nested
        // /florida-mortgage/[county]/[city] pages are a different family with
        // their own registry-agreement check in city-data.test.ts.
        !route.path.slice("/florida-mortgage/".length).includes("/")
    ).map((route) => route.path.replace("/florida-mortgage/", ""));
    for (const slug of registeredCounties) {
      expect(countyBySlug(slug), `${slug} is registered but has no data`).toBeDefined();
    }
  });
});

describe.each(COUNTIES.map((county) => [county.slug, county] as const))(
  "county %s",
  (_slug, county) => {
    it("has a well-formed, registrable slug", () => {
      expect(county.slug).toMatch(SLUG);
      // "Registrable" means the page path it would take is a clean same-origin
      // route segment the integrator can add to the registry verbatim.
      const path = `/florida-mortgage/${county.slug}`;
      expect(path).toMatch(/^\/florida-mortgage\/[a-z0-9-]+$/);
    });

    it("has the required identifying fields", () => {
      expect(county.county.length).toBeGreaterThan(0);
      expect(county.seat.length).toBeGreaterThan(0);
      expect(county.region.length).toBeGreaterThan(0);
      expect(county.cities.length).toBeGreaterThan(0);
      expect(VALID_EXPOSURE).toContain(county.floodExposure);
    });

    it("keeps the meta description within 165 characters", () => {
      expect(county.metaDescription.length).toBeLessThanOrEqual(165);
      expect(county.metaDescription.length).toBeGreaterThan(0);
    });

    it("names a Property Appraiser, and any URL it carries is https", () => {
      expect(county.appraiserName.length).toBeGreaterThan(0);
      if (county.appraiserUrl !== undefined) {
        expect(county.appraiserUrl.startsWith("https://")).toBe(true);
      }
    });

    it("keeps any assistance URL https", () => {
      if (county.localAssistanceUrl !== undefined) {
        expect(county.localAssistanceUrl.startsWith("https://")).toBe(true);
      }
    });

    it("writes a substantive flood and assistance note", () => {
      expect(county.floodNote.length).toBeGreaterThan(120);
      expect(county.localAssistanceNote.length).toBeGreaterThan(80);
    });

    it("asserts no precise tax figure (invariant 6)", () => {
      const copy = copyOf(county);
      // A precise millage or property-tax percentage is never stated as fact —
      // the page defers the number to the county Property Appraiser. These
      // patterns catch every shape of that fabrication, in every county.
      expect(copy).not.toMatch(/millage rate of\s+\d/i);
      expect(copy).not.toMatch(/\btax rate of\s+\d/i);
      expect(copy).not.toMatch(/\d+(?:\.\d+)?\s*(?:percent|mills?)\b/i);
      // A percentage attached to a tax or millage claim, in either order.
      expect(copy).not.toMatch(/\d+(?:\.\d+)?\s*%\s*(?:property\s+)?(?:tax|millage)/i);
      expect(copy).not.toMatch(/(?:property\s+)?(?:tax|millage)[^.]{0,30}\d+(?:\.\d+)?\s*%/i);
      // The counties this feature authored are held to the stricter bar: no
      // percent sign at all. (Pre-existing entries legitimately describe a "0%"
      // interest second mortgage — a loan-structure fact, not a tax rate.)
      if (NEW_COUNTY_SLUGS.includes(county.slug)) {
        expect(copy).not.toContain("%");
      }
    });
  }
);
