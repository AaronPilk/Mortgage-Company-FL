import { describe, expect, it } from "vitest";
import { ALL_ARTICLES } from "../../content/articles";
import { ARTICLE_CATEGORY_LABELS } from "../../content/articles/types";

/**
 * The editorial contract, enforced mechanically.
 *
 * One thin article on a mortgage site is a quality problem; a hundred is a
 * ranking and compliance problem. Publishing at this volume is only defensible
 * because every entry provably carries the structure that makes it useful —
 * so the structure is asserted, not hoped for.
 */

/**
 * Phrasings that state a mutable figure or a promise as fact. Content stays
 * true over time by pointing at the primary source for anything that changes.
 */
const PROHIBITED = [
  /guaranteed approval/i,
  /lowest rate/i,
  /best rate/i,
  /we (?:will )?approve/i,
  /you (?:will|'ll) qualify/i,
  /rates? (?:are|is) (?:currently|now|today)/i,
  /current(?:ly)? .{0,20}\d+(?:\.\d+)?\s?%/i,
  /equal housing lender/i
];

const PRIMARY_SOURCE_HOSTS = [
  "hud.gov",
  "consumerfinance.gov",
  "va.gov",
  "usda.gov",
  "rd.usda.gov",
  "fanniemae.com",
  "freddiemac.com",
  "ecfr.gov",
  "irs.gov",
  "fema.gov",
  "floridarevenue.com",
  "myfloridacfo.com",
  "floridadisaster.org",
  "citizensfla.com",
  "myflorida.com",
  "flsenate.gov",
  "leg.state.fl.us",
  "flofr.gov",
  "fhfa.gov",
  "ginniemae.gov",
  "sbafla.com",
  "floir.com",
  "nmlsconsumeraccess.org",
  "census.gov",
  "bls.gov",
  "fdic.gov",
  "occ.gov",
  "federalreserve.gov",
  "sec.gov",
  "nfipservices.floodsmart.gov",
  "floodsmart.gov"
];

function words(text: string): number {
  return text.trim().split(/\s+/).length;
}

function bodyOf(article: (typeof ALL_ARTICLES)[number]): string {
  return [
    article.answerSummary,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets ?? [])
    ]),
    ...article.faqs.flatMap((faq) => [faq.question, faq.answer])
  ].join("\n");
}

describe("article collection", () => {
  it("has the expected volume", () => {
    expect(ALL_ARTICLES.length).toBeGreaterThanOrEqual(100);
  });

  it("has globally unique slugs and titles", () => {
    expect(new Set(ALL_ARTICLES.map((a) => a.slug)).size).toBe(ALL_ARTICLES.length);
    expect(new Set(ALL_ARTICLES.map((a) => a.title)).size).toBe(ALL_ARTICLES.length);
  });
});

describe.each(ALL_ARTICLES.map((article) => [article.slug, article] as const))(
  "article %s",
  (_slug, article) => {
    it("keeps metadata within limits", () => {
      expect(article.title.length).toBeLessThanOrEqual(60);
      expect(article.description.length).toBeLessThanOrEqual(165);
      expect(article.slug).toMatch(/^[a-z0-9-]+$/);
      expect(ARTICLE_CATEGORY_LABELS[article.category]).toBeDefined();
    });

    it("answers first: a standalone 30–80 word summary", () => {
      const count = words(article.answerSummary);
      expect(count).toBeGreaterThanOrEqual(30);
      expect(count).toBeLessThanOrEqual(80);
      expect(article.answerSummary).not.toMatch(/below|as we'll see|this article/i);
    });

    it("is substantive, not thin", () => {
      expect(article.sections.length).toBeGreaterThanOrEqual(4);
      expect(words(bodyOf(article))).toBeGreaterThanOrEqual(700);
      expect(article.faqs.length).toBeGreaterThanOrEqual(3);
    });

    it("cites at least two primary sources", () => {
      expect(article.sources.length).toBeGreaterThanOrEqual(2);
      for (const source of article.sources) {
        const host = new URL(source.url).hostname.replace(/^www\./, "");
        expect(
          PRIMARY_SOURCE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)),
          `${source.url} is not a recognised primary source host`
        ).toBe(true);
      }
    });

    it("links back into the product", () => {
      expect(article.related.length).toBeGreaterThanOrEqual(2);
      for (const item of article.related) {
        expect(item.href.startsWith("/")).toBe(true);
      }
    });

    it("makes no claim the compliance rules prohibit", () => {
      const body = bodyOf(article);
      for (const pattern of PROHIBITED) {
        expect(body).not.toMatch(pattern);
      }
    });

    it("carries valid dates", () => {
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  }
);
