import { describe, expect, it } from "vitest";
import {
  CITIES,
  CITY_AS_OF,
  CITY_PAGES_INDEXABLE,
  cityByCountyAndSlug,
  cityBySlug,
  citiesByCounty
} from "../../lib/city-data";
import { countyBySlug } from "../../lib/county-data";
import { ROUTE_REGISTRY } from "../../content/routes";

/**
 * City reference-data contract.
 *
 * City pages must clear the county bar or they do not ship: real, per-city
 * material — not a county paragraph with a name swapped in — coupled to a real
 * parent county, with no fabricated figure (invariant 6). This test enforces the
 * structure that makes them publishable and the rules that keep them honest, the
 * same way county-data.test.ts and glossary-data.test.ts do for their data.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const registeredPaths = ROUTE_REGISTRY.map((route) => route.path);
const knownPrefixes = registeredPaths.filter((path) => path !== "/");

/** Mirror of the content linter's / glossary test's internal-link check. */
function resolvesToRegisteredRoute(href: string): boolean {
  if (registeredPaths.includes(href)) return true;
  return knownPrefixes.some((prefix) => href.startsWith(`${prefix}/`));
}

/** The title the page renders, so length and uniqueness are checked on the real string. */
function renderedTitle(city: (typeof CITIES)[number]): string {
  return city.metaTitle ?? `${city.city}, FL Mortgages & Home Buying`;
}

/** Every authored field a reviewer reads, joined for scanning. */
function authoredCopy(city: (typeof CITIES)[number]): string {
  return [city.localIntro, city.floodContext, ...city.researchQuestions, city.metaDescription].join(
    "\n"
  );
}

/** City routes are 3-segment: /florida-mortgage/<county>/<city>. */
function cityRouteSegments(path: string): [string, string] | undefined {
  const segments = path.split("/").filter((segment) => segment.length > 0);
  if (segments.length !== 3) return undefined;
  const prefix = segments[0];
  const countySlug = segments[1];
  const citySlug = segments[2];
  if (prefix !== "florida-mortgage" || countySlug === undefined || citySlug === undefined) {
    return undefined;
  }
  return [countySlug, citySlug];
}

describe("city collection", () => {
  it("keeps the as-of stamp", () => {
    expect(CITY_AS_OF).toBe("August 2026");
  });

  it("ships noindex until a named reviewer verifies sources", () => {
    // The pages are built but must stay out of the index (and the sitemap) until a
    // human verifies each city's sources — docs/compliance/city-pages.md. One flip
    // of this constant turns both the registry and the page meta indexable.
    expect(CITY_PAGES_INDEXABLE).toBe(false);
  });

  it("carries a meaningful number of cities", () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(8);
  });

  it("has globally unique slugs", () => {
    expect(new Set(CITIES.map((c) => c.slug)).size).toBe(CITIES.length);
  });

  it("has globally unique county/city pairs, so every nested path is distinct", () => {
    const pairs = CITIES.map((c) => `${c.countySlug}/${c.slug}`);
    expect(new Set(pairs).size).toBe(CITIES.length);
  });

  it("has unique meta descriptions", () => {
    expect(new Set(CITIES.map((c) => c.metaDescription)).size).toBe(CITIES.length);
  });

  it("has unique rendered titles", () => {
    expect(new Set(CITIES.map(renderedTitle)).size).toBe(CITIES.length);
  });

  it("couples every city to a real parent county", () => {
    for (const city of CITIES) {
      expect(countyBySlug(city.countySlug), `${city.slug} -> ${city.countySlug}`).toBeDefined();
    }
  });

  it("agrees with every 3-segment /florida-mortgage route in the registry", () => {
    for (const route of ROUTE_REGISTRY) {
      if (!route.path.startsWith("/florida-mortgage/")) continue;
      const segments = cityRouteSegments(route.path);
      if (segments === undefined) continue; // 2-segment county routes are not our concern here
      const [countySlug, citySlug] = segments;
      expect(
        cityByCountyAndSlug(countySlug, citySlug),
        `${route.path} is registered but has no city data`
      ).toBeDefined();
      // Ships noindex: the registry entry must match the single indexation switch.
      expect(route.indexable, `${route.path} indexable must equal CITY_PAGES_INDEXABLE`).toBe(
        CITY_PAGES_INDEXABLE
      );
    }
  });

  it("resolves each city back through its finders", () => {
    for (const city of CITIES) {
      expect(cityBySlug(city.slug)).toBe(city);
      expect(cityByCountyAndSlug(city.countySlug, city.slug)).toBe(city);
    }
    expect(cityBySlug("not-a-real-city")).toBeUndefined();
    // A real city slug under the wrong county must not resolve — the guard that
    // makes /florida-mortgage/orange-county/miami a 404 rather than serving Miami.
    expect(cityByCountyAndSlug("orange-county", "miami")).toBeUndefined();
  });

  it("groups cities under their county", () => {
    for (const county of new Set(CITIES.map((c) => c.countySlug))) {
      const grouped = citiesByCounty(county);
      expect(grouped.length).toBeGreaterThan(0);
      for (const city of grouped) expect(city.countySlug).toBe(county);
    }
  });
});

describe.each(CITIES.map((city) => [city.slug, city] as const))("city %s", (_slug, city) => {
  it("has a well-formed slug and a registrable nested path", () => {
    expect(city.slug).toMatch(SLUG);
    const path = `/florida-mortgage/${city.countySlug}/${city.slug}`;
    expect(path).toMatch(/^\/florida-mortgage\/[a-z0-9-]+\/[a-z0-9-]+$/);
  });

  it("keeps the meta description within 165 characters", () => {
    expect(city.metaDescription.length).toBeGreaterThan(0);
    expect(city.metaDescription.length).toBeLessThanOrEqual(165);
  });

  it("keeps the rendered title within 60 characters", () => {
    expect(renderedTitle(city).length).toBeLessThanOrEqual(60);
  });

  it("writes substantive, city-specific geography and flood copy", () => {
    expect(city.localIntro.length).toBeGreaterThan(120);
    expect(city.floodContext.length).toBeGreaterThan(120);
    expect(city.researchQuestions.length).toBeGreaterThanOrEqual(3);
    for (const question of city.researchQuestions) expect(question.length).toBeGreaterThan(0);
  });

  it("does not restate its parent county's flood note (anti-template)", () => {
    const parent = countyBySlug(city.countySlug);
    expect(parent).toBeDefined();
    if (parent !== undefined) {
      // The load-bearing rule under the recorded "no city pages" decision: a city
      // page is not the county page with a name swapped in.
      expect(city.floodContext).not.toBe(parent.floodNote);
      expect(city.localIntro).not.toBe(parent.floodNote);
    }
  });

  it("asserts no market figure or tax rate (invariant 6)", () => {
    const copy = authoredCopy(city);
    // No live/fabricated market number and no tax rate ever appears as text; the
    // widget (dark) and the county appraiser carry those instead.
    expect(copy).not.toContain("$");
    expect(copy).not.toContain("%");
    expect(copy).not.toMatch(/\btax rate of\s+\d/i);
    expect(copy).not.toMatch(/millage rate of\s+\d/i);
    expect(copy).not.toMatch(/\d+(?:\.\d+)?\s*(?:percent|mills?)\b/i);
    expect(copy).not.toMatch(/median\s+(?:home\s+|sale\s+)?price[^.]{0,24}\d/i);
    expect(copy).not.toMatch(/\d+\s*days on market/i);
  });

  it("keeps any resource cross-link pointed at a registered route", () => {
    if (city.resourceSlug !== undefined) {
      const href = `/resources/${city.resourceSlug}`;
      expect(resolvesToRegisteredRoute(href), `${href} does not resolve`).toBe(true);
    }
    // The parent county route the page links up to must resolve too.
    expect(resolvesToRegisteredRoute(`/florida-mortgage/${city.countySlug}`)).toBe(true);
  });

  it("keeps any neighborhood list well-formed", () => {
    if (city.neighborhoods !== undefined) {
      expect(city.neighborhoods.length).toBeGreaterThan(0);
      for (const name of city.neighborhoods) expect(name.length).toBeGreaterThan(0);
    }
  });
});
