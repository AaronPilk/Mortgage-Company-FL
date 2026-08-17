import { describe, expect, it } from "vitest";
import { CanonicalError, absoluteUrl, createMetadata, shouldNoIndex } from "./metadata";
import {
  type BusinessIdentity,
  articleNode,
  breadcrumbNode,
  faqNode,
  graph,
  mortgageLoanNode,
  organizationNode,
  serializeJsonLd,
  webPageNode,
  webSiteNode
} from "./jsonld";

const SITE = "https://tract.example";

const unlicensedIdentity: BusinessIdentity = {
  legalName: "TRACT Mortgage LLC",
  brandName: "TRACT Mortgage",
  siteUrl: SITE,
  logoPath: "/brand/wordmark.svg",
  nmlsId: null,
  companyLicenseId: null,
  telephone: null,
  address: null,
  areaServed: ["Florida"],
  sameAs: []
};

describe("canonical construction", () => {
  it("builds an absolute canonical from the configured origin", () => {
    expect(absoluteUrl(SITE, "/mortgage/fha")).toBe("https://tract.example/mortgage/fha");
  });

  it("strips query, fragment, and a trailing slash", () => {
    expect(absoluteUrl(SITE, "/mortgage/fha/")).toBe("https://tract.example/mortgage/fha");
    expect(absoluteUrl(SITE, "/blog")).toBe("https://tract.example/blog");
  });

  it("refuses a protocol-relative or absolute foreign path", () => {
    expect(() => absoluteUrl(SITE, "//evil.example/phish")).toThrow(CanonicalError);
    expect(() => absoluteUrl(SITE, "https://evil.example/phish")).toThrow(CanonicalError);
    expect(() => absoluteUrl(SITE, "mortgage/fha")).toThrow(CanonicalError);
  });

  it("refuses header injection characters", () => {
    expect(() => absoluteUrl(SITE, "/a\nb")).toThrow(CanonicalError);
  });
});

describe("createMetadata", () => {
  it("marks a page indexable by default", () => {
    const meta = createMetadata(SITE, {
      title: "FHA Loans in Florida",
      description: "How FHA financing works and who it may fit.",
      path: "/mortgage/fha"
    });
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates.canonical).toBe("https://tract.example/mortgage/fha");
    expect(meta.openGraph.type).toBe("website");
  });

  it("switches to an article when publication dates are present", () => {
    const meta = createMetadata(SITE, {
      title: "Cash to Close",
      description: "The parts buyers commonly miss.",
      path: "/resources/cash-to-close-explained",
      publishedAt: "2026-08-01T00:00:00.000Z",
      modifiedAt: "2026-08-15T00:00:00.000Z"
    });
    expect(meta.openGraph.type).toBe("article");
    expect(meta.openGraph.publishedTime).toBe("2026-08-01T00:00:00.000Z");
  });

  it("emits nofollow and nocache for a noindex page", () => {
    const meta = createMetadata(SITE, {
      title: "Draft",
      description: "Not ready.",
      path: "/blog/draft",
      noIndex: true
    });
    expect(meta.robots).toEqual({ index: false, follow: false, nocache: true });
  });
});

describe("shouldNoIndex", () => {
  it("blocks admin, account, tokenized reports, tours, and previews", () => {
    for (const path of [
      "/admin",
      "/admin/leads/123",
      "/account/saved",
      "/api/v1/leads",
      "/vision/report/abc",
      "/tour/xyz",
      "/preview/post",
      "/offline"
    ]) {
      expect(shouldNoIndex(path), path).toBe(true);
    }
  });

  it("allows public marketing routes", () => {
    for (const path of ["/", "/mortgage/fha", "/calculators/affordability", "/blog/some-post"]) {
      expect(shouldNoIndex(path), path).toBe(false);
    }
  });

  it("does not treat a lookalike prefix as protected", () => {
    expect(shouldNoIndex("/accounts-payable-guide")).toBe(false);
  });
});

describe("JSON-LD", () => {
  it("omits license and address facts that are not yet verified", () => {
    const node = organizationNode(unlicensedIdentity);
    const json = JSON.stringify(node);
    expect(json).not.toContain("NMLS");
    expect(node).not.toHaveProperty("address");
    expect(node).not.toHaveProperty("telephone");
    // Without a public office it must not claim to be a local financial service.
    expect(node["@type"]).toBe("Organization");
  });

  it("upgrades the type only once a real office exists", () => {
    const node = organizationNode({
      ...unlicensedIdentity,
      nmlsId: "1234567",
      telephone: "+18135550147",
      address: {
        streetAddress: "100 Example Way",
        addressLocality: "Tampa",
        addressRegion: "FL",
        postalCode: "33602"
      }
    });
    expect(node["@type"]).toEqual(["Organization", "FinancialService"]);
    expect(JSON.stringify(node)).toContain("NMLS #1234567");
  });

  it("suppresses FAQ markup when the questions are not rendered on the page", () => {
    const items = [{ question: "What is PMI?", answer: "Mortgage insurance." }];
    expect(faqNode(items, false)).toBeNull();
    expect(faqNode([], true)).toBeNull();
    expect(faqNode(items, true)).not.toBeNull();
  });

  it("never carries a rate or an offer on a MortgageLoan node", () => {
    const node = mortgageLoanNode({
      name: "FHA Loan",
      description: "A government-insured mortgage option.",
      loanType: "FHA",
      url: `${SITE}/mortgage/fha`,
      identity: unlicensedIdentity
    });
    for (const key of ["interestRate", "annualPercentageRate", "amount", "offers"]) {
      expect(node).not.toHaveProperty(key);
    }
  });

  it("builds a connected graph without empty nodes", () => {
    const url = `${SITE}/resources/cash-to-close-explained`;
    const value = graph(
      [
        organizationNode(unlicensedIdentity),
        webSiteNode(unlicensedIdentity),
        webPageNode({
          identity: unlicensedIdentity,
          url,
          name: "Cash to Close",
          description: "The parts buyers commonly miss."
        }),
        breadcrumbNode([
          { name: "Resources", url: `${SITE}/resources` },
          { name: "Cash to Close", url }
        ]),
        articleNode({
          url,
          headline: "Cash to Close: The Parts Buyers Commonly Miss",
          description: "An itemized example.",
          datePublished: "2026-08-01",
          dateModified: "2026-08-15",
          authorName: "Dan",
          identity: unlicensedIdentity
        }),
        faqNode([], true)
      ],
      unlicensedIdentity
    );
    const nodes = value["@graph"] as unknown[];
    expect(nodes).toHaveLength(5);
    expect(value["@context"]).toBe("https://schema.org");
  });

  it("escapes a closing script tag so markup cannot break out", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script");
    expect(JSON.parse(serialized).name).toBe("</script><script>alert(1)</script>");
  });
});
