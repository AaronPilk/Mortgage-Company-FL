import { describe, expect, it } from "vitest";
import {
  GLOSSARY_TERMS,
  GLOSSARY_CATEGORY_LABELS,
  glossaryTermBySlug,
  definedTermNode,
  definedTermSetNode,
  type GlossaryTerm
} from "../../lib/glossary-data";
import { ROUTE_REGISTRY } from "../../content/routes";

/**
 * Glossary contract.
 *
 * The glossary is a hub of internal links, so its one hard failure mode is a
 * link to a route that does not exist. This test resolves every related href
 * against the shipped route registry exactly the way the content linter does —
 * an exact registered path, or a descendant of one — so a dead cross-link fails
 * here rather than in a crawler. It also holds the SEO length limits and checks
 * the DefinedTerm(Set) JSON-LD the pages emit.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const registeredPaths = ROUTE_REGISTRY.map((route) => route.path);
const knownPrefixes = registeredPaths.filter((path) => path !== "/");

/** Mirror of the content linter's internal-link check. */
function resolvesToRegisteredRoute(href: string): boolean {
  if (registeredPaths.includes(href)) return true;
  return knownPrefixes.some((prefix) => href.startsWith(`${prefix}/`));
}

describe("glossary collection", () => {
  it("carries a meaningful number of terms", () => {
    expect(GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(30);
  });

  it("has globally unique slugs and terms", () => {
    expect(new Set(GLOSSARY_TERMS.map((t) => t.slug)).size).toBe(GLOSSARY_TERMS.length);
    expect(new Set(GLOSSARY_TERMS.map((t) => t.term)).size).toBe(GLOSSARY_TERMS.length);
  });

  it("resolves each term back through glossaryTermBySlug", () => {
    for (const term of GLOSSARY_TERMS) {
      expect(glossaryTermBySlug(term.slug)).toBe(term);
    }
    expect(glossaryTermBySlug("not-a-real-term")).toBeUndefined();
  });
});

describe.each(GLOSSARY_TERMS.map((term) => [term.slug, term] as const))(
  "term %s",
  (_slug, term: GlossaryTerm) => {
    it("has a well-formed slug", () => {
      expect(term.slug).toMatch(SLUG);
    });

    it('keeps the term at 48 characters or fewer, so "What is <term>?" stays ≤ 60', () => {
      expect(term.term.length).toBeLessThanOrEqual(48);
      expect(`What is ${term.term}?`.length).toBeLessThanOrEqual(60);
    });

    it("keeps the short definition at 165 characters or fewer", () => {
      expect(term.short.length).toBeGreaterThan(0);
      expect(term.short.length).toBeLessThanOrEqual(165);
    });

    it("has a substantive body and a known category", () => {
      expect(term.body.length).toBeGreaterThanOrEqual(2);
      for (const paragraph of term.body) expect(paragraph.length).toBeGreaterThan(0);
      expect(GLOSSARY_CATEGORY_LABELS[term.category]).toBeDefined();
    });

    it("links only to registered routes", () => {
      expect(term.related.length).toBeGreaterThanOrEqual(2);
      for (const link of term.related) {
        expect(link.href.startsWith("/"), `${link.href} is not an absolute path`).toBe(true);
        expect(
          resolvesToRegisteredRoute(link.href),
          `${link.href} does not resolve to a registered route`
        ).toBe(true);
        expect(link.label.length).toBeGreaterThan(0);
      }
    });
  }
);

describe("DefinedTerm JSON-LD builders", () => {
  const base = "https://example.com";

  it("builds a DefinedTerm node for a term", () => {
    const term = GLOSSARY_TERMS[0]!;
    const node = definedTermNode(term, base);
    expect(node["@type"]).toBe("DefinedTerm");
    expect(node.name).toBe(term.term);
    expect(node.description).toBe(term.short);
    expect(node.url).toBe(`${base}/mortgage-glossary/${term.slug}`);
  });

  it("builds a DefinedTermSet node containing every term", () => {
    const node = definedTermSetNode(GLOSSARY_TERMS, base);
    expect(node["@type"]).toBe("DefinedTermSet");
    const members = node.hasDefinedTerm as Record<string, unknown>[];
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBe(GLOSSARY_TERMS.length);
    for (const member of members) {
      expect(member["@type"]).toBe("DefinedTerm");
    }
  });

  it("normalizes a trailing slash on the site URL", () => {
    const node = definedTermNode(GLOSSARY_TERMS[0]!, "https://example.com/");
    expect(node.url).toBe(`https://example.com/mortgage-glossary/${GLOSSARY_TERMS[0]!.slug}`);
  });
});
