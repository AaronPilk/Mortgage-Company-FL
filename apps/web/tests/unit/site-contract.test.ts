import { describe, expect, it } from "vitest";
import { NOINDEX_PREFIXES, absoluteUrl, shouldNoIndex } from "@tract/seo";
import { ROUTE_REGISTRY, contentGroupFor, indexableRoutes } from "../../content/routes";
import { PROGRAMS, programBySlug } from "../../content/programs";
import { ipPrefix, hashIp, isSameOrigin } from "../../lib/request-context";
import { MemoryRateLimitStore, LEAD_RATE_LIMITS } from "../../lib/rate-limit";
import { CRM_PROHIBITED_KEYS, assertCrmPayloadSafe } from "@tract/integrations";

const SITE = "https://tract.example";

describe("route registry", () => {
  it("registers every loan program page as indexable", () => {
    for (const program of PROGRAMS) {
      const entry = ROUTE_REGISTRY.find((route) => route.path === `/mortgage/${program.slug}`);
      expect(entry, `/mortgage/${program.slug} is not registered`).toBeDefined();
      expect(entry?.indexable).toBe(true);
    }
  });

  it("never marks a protected prefix as indexable", () => {
    for (const route of indexableRoutes()) {
      expect(shouldNoIndex(route.path), `${route.path} is indexable but protected`).toBe(false);
    }
  });

  it("keeps every noindex prefix out of the indexable set", () => {
    const indexablePaths = indexableRoutes().map((route) => route.path);
    for (const prefix of NOINDEX_PREFIXES) {
      expect(indexablePaths).not.toContain(prefix);
    }
  });

  it("registers no duplicate paths", () => {
    const paths = ROUTE_REGISTRY.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("builds a valid canonical for every indexable route", () => {
    for (const route of indexableRoutes()) {
      expect(() => absoluteUrl(SITE, route.path)).not.toThrow();
    }
  });

  it("groups a nested path under its closest registered prefix", () => {
    expect(contentGroupFor("/mortgage/fha")).toBe("mortgage");
    expect(contentGroupFor("/calculators/affordability")).toBe("calculators");
    expect(contentGroupFor("/admin/leads/123")).toBe("system");
    expect(contentGroupFor("/nothing/here")).toBe("other");
  });

  it("keeps unlaunched feature surfaces out of the sitemap", () => {
    for (const path of ["/vision", "/rendprop", "/properties"]) {
      const entry = ROUTE_REGISTRY.find((route) => route.path === path);
      expect(entry?.indexable, `${path} must not be indexable before it ships`).toBe(false);
    }
  });
});

describe("program content contract", () => {
  it("gives every program a substantive body, not a hero and a form", () => {
    for (const program of PROGRAMS) {
      expect(program.summary.length, program.slug).toBeGreaterThan(120);
      expect(program.mayFit.length, program.slug).toBeGreaterThan(0);
      expect(program.exploreAlternativesIf.length, program.slug).toBeGreaterThan(0);
      expect(program.howItWorks.length, program.slug).toBeGreaterThanOrEqual(2);
      expect(program.variables.length, program.slug).toBeGreaterThanOrEqual(3);
      expect(program.faqs.length, program.slug).toBeGreaterThan(0);
      expect(program.sources.length, program.slug).toBeGreaterThan(0);
    }
  });

  it("cites a real primary source with an absolute URL on every page", () => {
    for (const program of PROGRAMS) {
      for (const source of program.sources) {
        expect(() => new URL(source.url), `${program.slug}: ${source.url}`).not.toThrow();
        expect(source.url.startsWith("https://"), program.slug).toBe(true);
        expect(source.publisher.length).toBeGreaterThan(0);
      }
    }
  });

  it("states no rate, APR, or approval guarantee anywhere in program copy", () => {
    // The rule this enforces: a static page cannot carry a live rate and cannot
    // promise an outcome to the reader.
    //
    // Note the shape of the "guarantee" patterns. Describing that a VA loan is
    // guaranteed by the VA, or that a conventional loan is not guaranteed by a
    // government agency, is a factual statement about how the program works.
    // Promising the reader a guaranteed rate, approval, or saving is the thing
    // that must never appear. The patterns target the promise, not the word.
    const forbidden = [
      /\bwe guarantee\b/i,
      /\bguarantee[sd]? (?:you|your|approval|the (?:lowest|best)|a (?:lower|better))/i,
      /\bguaranteed (?:approval|rate|savings|lowest)/i,
      /\b(?:lowest|best) rates? (?:in|on|available|guaranteed|anywhere)/i,
      /\binstant (?:approval|preapproval|decision)\b/i,
      /\byou (?:will|are guaranteed to) qualify\b/i,
      /\byou qualify for\b/i,
      /\bno[- ](?:cost|fee) (?:loan|refinance|mortgage|closing)\b/i,
      /\byou are pre-?approved\b/i,
      /\bcurrent rates? (?:are|start)\b/i,
      /\brates? as low as\b/i,
      /\b\d+(?:\.\d+)? ?% (?:interest )?rate\b/i,
      /\bAPR of \d/i
    ];
    for (const program of PROGRAMS) {
      const prose = [
        program.summary,
        ...program.mayFit,
        ...program.exploreAlternativesIf,
        ...program.howItWorks.flatMap((step) => [step.heading, step.body]),
        ...program.variables.flatMap((variable) => [variable.label, variable.body]),
        ...program.faqs.flatMap((faq) => [faq.question, faq.answer])
      ].join(" \n ");

      for (const pattern of forbidden) {
        const match = prose.match(pattern);
        expect(match, `${program.slug} contains prohibited phrasing: ${match?.[0]}`).toBeNull();
      }
    }
  });

  it("points every related-program link at a program that exists", () => {
    for (const program of PROGRAMS) {
      for (const slug of program.relatedPrograms) {
        expect(programBySlug(slug), `${program.slug} -> ${slug}`).toBeDefined();
      }
    }
  });

  it("points every related calculator at a registered route", () => {
    const paths = new Set(ROUTE_REGISTRY.map((route) => route.path));
    for (const program of PROGRAMS) {
      for (const calculator of program.relatedCalculators) {
        expect(paths.has(calculator.href), `${program.slug} -> ${calculator.href}`).toBe(true);
      }
    }
  });

  it("marks every program as requiring an approved lender path", () => {
    // No product page may describe an available product without an executed
    // broker agreement covering it.
    for (const program of PROGRAMS) {
      expect(program.requiresLenderPath, program.slug).toBe(true);
    }
  });
});

describe("request context", () => {
  it("truncates IPv4 to a /24 and IPv6 to a /48 before hashing", () => {
    expect(ipPrefix("203.0.113.47")).toBe("203.0.113.0");
    expect(ipPrefix("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:0db8:85a3");
  });

  it("never stores the address itself", () => {
    const hash = hashIp("203.0.113.47", "pepper");
    expect(hash).not.toBeNull();
    expect(hash).not.toContain("203");
    expect(hash).toHaveLength(32);
  });

  it("produces a different hash under a different pepper, so rotation works", () => {
    expect(hashIp("203.0.113.47", "pepper-a")).not.toBe(hashIp("203.0.113.47", "pepper-b"));
  });

  it("buckets a whole /24 together for rate limiting", () => {
    expect(hashIp("203.0.113.47", "p")).toBe(hashIp("203.0.113.200", "p"));
  });

  it("rejects a cross-site or absent origin", () => {
    expect(isSameOrigin("https://tract.example", SITE)).toBe(true);
    expect(isSameOrigin("https://evil.example", SITE)).toBe(false);
    expect(isSameOrigin("http://tract.example", SITE)).toBe(false);
    expect(isSameOrigin(null, SITE)).toBe(false);
    expect(isSameOrigin("not a url", SITE)).toBe(false);
  });
});

describe("rate limiting", () => {
  it("allows up to the limit then refuses with a retry hint", async () => {
    const store = new MemoryRateLimitStore();
    const { limit, windowMs } = LEAD_RATE_LIMITS.perContact;

    for (let attempt = 0; attempt < limit; attempt += 1) {
      const decision = await store.hit("key", windowMs, limit);
      expect(decision.allowed, `attempt ${attempt}`).toBe(true);
    }
    const blocked = await store.hit("key", windowMs, limit);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps separate buckets independent", async () => {
    const store = new MemoryRateLimitStore();
    for (let attempt = 0; attempt < 3; attempt += 1) await store.hit("a", 60_000, 3);
    expect((await store.hit("a", 60_000, 3)).allowed).toBe(false);
    expect((await store.hit("b", 60_000, 3)).allowed).toBe(true);
  });

  it("applies a tighter ceiling per contact than per network", () => {
    expect(LEAD_RATE_LIMITS.perContact.limit).toBeLessThan(LEAD_RATE_LIMITS.perNetwork.limit);
  });

  it("leaves the planner's two-post completion room for a retry and a contact form", () => {
    // Gate lead + full planner lead + one failed-submission retry + a
    // same-hour contact-form use must all fit under the per-contact ceiling.
    expect(LEAD_RATE_LIMITS.perContact.limit).toBeGreaterThanOrEqual(5);
  });
});

describe("CRM payload boundary as used by the lead route", () => {
  it("blocks the full prohibited list", () => {
    for (const key of CRM_PROHIBITED_KEYS) {
      expect(() => assertCrmPayloadSafe({ [key]: "value" }), key).toThrow();
    }
  });

  it("permits the exact payload shape the lead route builds", () => {
    expect(() =>
      assertCrmPayloadSafe({
        externalId: "receipt",
        firstName: "Dana",
        lastName: "Reyes",
        email: "dana@example.com",
        phoneE164: "+18135550147",
        intent: "purchase",
        timeline: "now",
        sourcePath: "/contact",
        tags: ["web-lead"],
        consent: {
          smsMarketing: false,
          emailMarketing: true,
          disclosureVersion: "v1",
          receivedAtIso: "2026-08-17T00:00:00.000Z"
        },
        attribution: { utmSource: "google", utmMedium: "cpc", utmCampaign: "brand", gclid: "abc" }
      })
    ).not.toThrow();
  });
});
