import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { shouldNoIndex } from "@tract/seo";

/**
 * The crawl-facing outputs, rendered with the production origin (ADR-011,
 * ADR-012, ADR-013). The modules read NEXT_PUBLIC_SITE_URL when they load, so
 * each is imported after the variable is stubbed.
 */

const ORIGIN = "https://wsmlending.com";

type Modules = {
  robots: typeof import("../../app/robots").default;
  sitemap: typeof import("../../app/sitemap").default;
  llms: typeof import("../../app/llms.txt/route").GET;
  routes: typeof import("../../content/routes");
  lastmod: typeof import("../../content/route-lastmod.generated").ROUTE_LASTMOD;
  site: typeof import("../../lib/site");
  crawlers: typeof import("../../lib/crawlers");
  seo: typeof import("@tract/seo");
};

let m: Modules;

beforeAll(async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGIN);
  vi.stubEnv("NEXT_PUBLIC_COMPANY_URL", ORIGIN);
  m = {
    robots: (await import("../../app/robots")).default,
    sitemap: (await import("../../app/sitemap")).default,
    llms: (await import("../../app/llms.txt/route")).GET,
    routes: await import("../../content/routes"),
    lastmod: (await import("../../content/route-lastmod.generated")).ROUTE_LASTMOD,
    site: await import("../../lib/site"),
    crawlers: await import("../../lib/crawlers"),
    seo: await import("@tract/seo")
  };
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function sitemapPaths(): string[] {
  return m.routes
    .indexableRoutes()
    .filter((route) => !shouldNoIndex(route.path))
    .map((route) => route.path);
}

describe("robots.txt", () => {
  it("points at the wsmlending.com sitemap", () => {
    const robots = m.robots();
    expect(robots.sitemap).toBe(`${ORIGIN}/sitemap.xml`);
    expect(robots.host).toBe(ORIGIN);
  });

  it("allows every named crawler class while keeping the private surfaces out", () => {
    const rules = [m.robots().rules].flat();
    const named = [
      ...m.crawlers.SEARCH_CRAWLERS,
      ...m.crawlers.ANSWER_CRAWLERS,
      ...m.crawlers.TRAINING_CRAWLERS
    ];
    for (const agent of ["*", ...named]) {
      const group = rules.filter((rule) => [rule.userAgent].flat().includes(agent));
      expect(group, agent).toHaveLength(1);
      const [rule] = group;
      expect(rule?.allow, agent).toBe("/");
      const disallow = [rule?.disallow ?? []].flat();
      // A named group replaces the * group for that bot, so it must carry the
      // same disallows or the bot could read the account and API surfaces.
      for (const prefix of ["/api/", "/account/", "/admin/", "/auth/"]) {
        expect(disallow, `${agent} ${prefix}`).toContain(prefix);
      }
      expect(disallow, agent).not.toContain("/");
    }
  });

  it("names the search, answer and training crawlers the owner listed", () => {
    expect(m.crawlers.SEARCH_CRAWLERS).toEqual(
      expect.arrayContaining(["Googlebot", "Bingbot", "Applebot"])
    );
    expect(m.crawlers.ANSWER_CRAWLERS).toEqual(
      expect.arrayContaining([
        "OAI-SearchBot",
        "ChatGPT-User",
        "Claude-SearchBot",
        "Claude-User",
        "PerplexityBot",
        "Perplexity-User"
      ])
    );
    expect(m.crawlers.TRAINING_CRAWLERS).toEqual(
      expect.arrayContaining(["GPTBot", "ClaudeBot", "CCBot"])
    );
  });
});

describe("sitemap.xml", () => {
  it("lists only wsmlending.com URLs", () => {
    for (const entry of m.sitemap()) {
      expect(new URL(entry.url).origin, entry.url).toBe(ORIGIN);
    }
  });

  it("lists exactly the indexable registry routes, once each", () => {
    const urls = m.sitemap().map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.sort()).toEqual(
      sitemapPaths()
        .map((path) => m.seo.absoluteUrl(ORIGIN, path))
        .sort()
    );
    expect(urls).toContain(`${ORIGIN}/`);
  });

  it("never lists a redirecting or noindex URL", () => {
    const urls = new Set(m.sitemap().map((entry) => entry.url));
    for (const path of [
      "/wml",
      "/tract",
      "/talk",
      "/properties",
      "/get-started/purchase",
      "/account",
      "/loan",
      "/admin",
      "/vision",
      "/mortgage-rates"
    ]) {
      expect(urls.has(m.seo.absoluteUrl(ORIGIN, path)), path).toBe(false);
    }
  });

  it("dates every URL with a real calendar day, never in the future", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const entry of m.sitemap()) {
      expect(entry.lastModified, entry.url).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(String(entry.lastModified) <= today, entry.url).toBe(true);
    }
  });

  it("has a lastmod for every sitemap route and none for anything else", () => {
    const paths = sitemapPaths();
    const missing = paths.filter((path) => m.lastmod[path] === undefined);
    expect(missing, "run `pnpm seo:lastmod` and commit the result").toEqual([]);
    const stale = Object.keys(m.lastmod).filter((path) => !paths.includes(path));
    expect(stale, "run `pnpm seo:lastmod` and commit the result").toEqual([]);
  });
});

describe("llms.txt", () => {
  async function text(): Promise<string> {
    return m.llms().text();
  }

  it("names the company and carries the licensing facts from lib/site.ts", async () => {
    const body = await text();
    expect(body.startsWith("# Wholesale Mortgage Lending\n")).toBe(true);
    expect(body).toContain("Wholesale Mortgage Lending LLC");
    expect(body).toContain("Company NMLS ID: 2898263");
    expect(body).toContain("Daniel Michael Cuesta, NMLS ID 132852");
    expect(body).toContain("https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/2898263");
    // Owner-confirmed 12 Nov 2026 (ADR-012).
    expect(body).toContain("Florida mortgage broker license: MBR8794");
    // Not pre-launch any more, so no status line claims otherwise.
    expect(body).not.toMatch(/pre-launch/i);
  });

  it("links only to wsmlending.com and the public NMLS record", async () => {
    const urls = [...(await text()).matchAll(/https?:\/\/[^\s)]+/g)].map((match) => match[0]);
    expect(urls.length).toBeGreaterThan(20);
    for (const url of urls) {
      expect(["wsmlending.com", "www.nmlsconsumeraccess.org"], url).toContain(new URL(url).host);
    }
    expect(await text()).not.toContain("tractrealestate");
  });

  it("states no rate", async () => {
    expect(await text()).not.toMatch(/\d+(?:\.\d+)?\s?%/);
  });
});

describe("organization structured data", () => {
  it("describes Wholesale Mortgage Lending on wsmlending.com", () => {
    const node = m.seo.organizationNode(m.site.businessIdentity);
    expect(node["@id"]).toBe(`${ORIGIN}#organization`);
    expect(node["url"]).toBe(ORIGIN);
    expect(node["name"]).toBe("Wholesale Mortgage Lending");
    expect(node["legalName"]).toBe("Wholesale Mortgage Lending LLC");
    expect(node["identifier"]).toEqual({
      "@type": "PropertyValue",
      propertyID: "NMLS ID",
      value: "2898263"
    });
    expect(node["logo"]).toEqual({ "@type": "ImageObject", url: `${ORIGIN}/brand/wml-logo.png` });
    expect(node["areaServed"]).toEqual([{ "@type": "AdministrativeArea", name: "Florida" }]);
  });

  it("asserts no unconfirmed address or phone, and only real profiles", () => {
    const node = m.seo.organizationNode(m.site.businessIdentity);
    expect(node).not.toHaveProperty("address");
    expect(node).not.toHaveProperty("telephone");
    // A licensed broker with no public office is still not a LocalBusiness.
    expect(node["@type"]).toBe("Organization");
    expect(JSON.stringify(node)).not.toContain("tractrealestate");
    // The only profile is the public NMLS record, confirmed by the owner.
    expect(node["sameAs"]).toEqual([
      "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/2898263"
    ]);
  });

  it("names the website after the company", () => {
    const node = m.seo.webSiteNode(m.site.businessIdentity);
    expect(node["name"]).toBe("Wholesale Mortgage Lending");
    expect(node["url"]).toBe(ORIGIN);
  });
});

describe("licensing state", () => {
  it("records what the owner confirmed and nothing more", () => {
    expect(m.site.businessIdentity.nmlsId).toBe("2898263");
    expect(m.site.loanOriginator).toEqual({ name: "Daniel Michael Cuesta", nmlsId: "132852" });
    expect(m.site.businessIdentity.companyLicenseId).toBe("MBR8794");
    // Neither is confirmed, so neither is asserted anywhere.
    expect(m.site.businessIdentity.address).toBeNull();
    expect(m.site.businessIdentity.telephone).toBeNull();
  });

  it("is out of pre-launch once all three licensing facts are confirmed", () => {
    expect(m.site.licensingStatus).toEqual({
      companyLicensed: true,
      principalLoanOriginatorNamed: true,
      nmlsRecordPublic: true
    });
    expect(m.site.isPreLaunch()).toBe(false);
  });

  it("does not call a licence 'pending issuance' once the company is licensed", () => {
    expect(m.site.LICENSE_PENDING_LABEL).not.toMatch(/issuance/);
  });

  it("deep-links Consumer Access to the company and the originator", () => {
    expect(m.site.nmlsCompanyUrl("2898263")).toBe(
      "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/2898263"
    );
    expect(m.site.nmlsIndividualUrl("132852")).toBe(
      "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/INDIVIDUAL/132852"
    );
  });
});
