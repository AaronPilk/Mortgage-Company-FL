import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { shouldNoIndex } from "@tract/seo";
import { HOME_COUNTY_GUIDES, HOME_EXPLORE, HOME_TOOLS } from "../../content/home-hub";
import { ROUTE_REGISTRY, indexableRoutes } from "../../content/routes";
import { COUNTIES } from "../../lib/county-data";

/**
 * The homepage's hub links (content/home-hub.ts). The homepage is the
 * strongest page on the domain, so every link it spends must reach a page the
 * sitemap lists: registered, indexable, and not caught by the noindex prefixes.
 */

const sitemapPaths = new Set(
  indexableRoutes()
    .filter((route) => !shouldNoIndex(route.path))
    .map((route) => route.path)
);

const allLinks = [
  ...HOME_TOOLS,
  ...HOME_EXPLORE.flatMap((group) => group.links),
  ...HOME_COUNTY_GUIDES.links
];

describe("homepage hub links", () => {
  it("only link to pages the sitemap lists", () => {
    const outside = allLinks.map((link) => link.href).filter((href) => !sitemapPaths.has(href));
    expect(outside).toEqual([]);
  });

  it("never list the same page twice", () => {
    const hrefs = allLinks.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("leave out tools that are noindex or can 404 behind a feature flag", () => {
    const hrefs = new Set(allLinks.map((link) => link.href));
    for (const path of ["/what-is-my-home-worth", "/properties", "/mortgage-rates", "/vision"]) {
      expect(hrefs.has(path), path).toBe(false);
    }
  });

  it("cover every hub the sitemap has", () => {
    const hrefs = new Set(allLinks.map((link) => link.href));
    for (const hub of [
      "/mortgage",
      "/resources",
      "/mortgage-glossary",
      "/calculators",
      "/florida-down-payment-assistance",
      "/florida-buyers-guide",
      "/locations/florida"
    ]) {
      expect(hrefs.has(hub), hub).toBe(true);
    }
  });

  it("link every county guide the registry publishes", () => {
    const registered = ROUTE_REGISTRY.filter(
      (route) => route.path.startsWith("/florida-mortgage/") && route.indexable
    ).map((route) => route.path);
    expect(HOME_COUNTY_GUIDES.links.map((link) => link.href).sort()).toEqual(registered.sort());
    expect(HOME_COUNTY_GUIDES.links).toHaveLength(COUNTIES.length);
  });

  it("are rendered by the landing as plain anchors, after the form", () => {
    const page = readFileSync(
      fileURLToPath(new URL("../../app/wml/page.tsx", import.meta.url)),
      "utf8"
    );
    for (const name of ["HOME_TOOLS", "HOME_EXPLORE", "HOME_COUNTY_GUIDES"]) {
      expect(page, name).toContain(`${name}.`);
    }
    // The landing's purpose is the lead form; the hubs come after it.
    expect(page.indexOf('id="lead"')).toBeLessThan(page.indexOf("HOME_TOOLS.map"));
    expect(page).not.toContain("<Link");
    expect(page).not.toMatch(/href="\/tract"/);
  });
});
