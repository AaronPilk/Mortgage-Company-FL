import { describe, expect, it } from "vitest";
import { ALL_ARTICLES } from "../../content/articles";
import { PROGRAMS } from "../../content/programs";
import { ROUTE_REGISTRY } from "../../content/routes";
import { GLOSSARY_TERMS } from "../../lib/glossary-data";
import { inlineLinks, parseInlineLinks, stripInlineLinks } from "../../lib/inline-links";

/**
 * In-sentence links in content strings (lib/inline-links.ts).
 *
 * Three things are held here. The grammar only ever produces on-site links. The
 * links that exist point at real routes with anchors that say where they go,
 * never at "/" (the landing has its own chrome) and never at the page itself.
 * And the strings that feed metadata, JSON-LD or the FAQ schema carry no
 * markup at all, because a crawler would read the brackets literally there.
 *
 * The per-page cap is a guard against link dumps, not a target: the editorial
 * rule is one or two links where a sentence is genuinely about the page linked.
 */

const REGISTERED = new Set(ROUTE_REGISTRY.map((route) => route.path));
const MAX_INLINE_LINKS_PER_PAGE = 4;
const GENERIC_ANCHORS = /^(here|click here|this|this page|read more|learn more|link|more)$/i;

type Page = { path: string; linked: string[]; plain: string[] };

const pages: Page[] = [
  ...ALL_ARTICLES.map((article) => ({
    path: `/resources/${article.slug}`,
    linked: article.sections.flatMap((section) => [
      ...section.paragraphs,
      ...(section.bullets ?? [])
    ]),
    plain: [
      article.title,
      article.description,
      article.h1,
      article.answerSummary,
      ...article.sections.map((section) => section.heading),
      ...article.faqs.flatMap((faq) => [faq.question, faq.answer]),
      ...article.related.map((item) => item.label)
    ]
  })),
  ...GLOSSARY_TERMS.map((term) => ({
    path: `/mortgage-glossary/${term.slug}`,
    linked: term.body,
    plain: [term.term, term.short, ...term.related.map((item) => item.label)]
  })),
  ...PROGRAMS.map((program) => ({
    path: `/mortgage/${program.slug}`,
    linked: [
      ...program.howItWorks.map((step) => step.body),
      ...program.variables.map((variable) => variable.body)
    ],
    plain: [
      program.title,
      program.h1,
      program.description,
      program.summary,
      ...program.mayFit,
      ...program.exploreAlternativesIf,
      ...program.faqs.flatMap((faq) => [faq.question, faq.answer])
    ]
  }))
];

describe("inline link grammar", () => {
  it("leaves plain text alone", () => {
    expect(parseInlineLinks("No links here.")).toEqual([{ kind: "text", text: "No links here." }]);
  });

  it("parses an on-site link inside a sentence", () => {
    expect(parseInlineLinks("See [today's rates](/mortgage-rates) first.")).toEqual([
      { kind: "text", text: "See " },
      { kind: "link", text: "today's rates", href: "/mortgage-rates" },
      { kind: "text", text: " first." }
    ]);
  });

  it("never turns an external or relative URL into a link", () => {
    for (const text of [
      "[CFPB](https://www.consumerfinance.gov/)",
      "[other site](//example.com)",
      "[relative](resources/x)",
      "[spaced](/a b)"
    ]) {
      expect(inlineLinks(text), text).toEqual([]);
      expect(stripInlineLinks(text)).toBe(text);
    }
  });

  it("strips markup to what a reader sees", () => {
    expect(stripInlineLinks("Use [the calculator](/calculators/dscr) twice.")).toBe(
      "Use the calculator twice."
    );
  });
});

describe.each(pages.map((page) => [page.path, page] as const))("page %s", (_path, page) => {
  const links = page.linked.flatMap((text) => inlineLinks(text));

  it("links only to registered routes, never to the homepage or itself", () => {
    for (const link of links) {
      expect(REGISTERED.has(link.href), `${link.href} is not registered`).toBe(true);
      expect(link.href).not.toBe("/");
      expect(link.href).not.toBe(page.path);
    }
  });

  it("uses descriptive anchors and no link dumps", () => {
    for (const link of links) {
      expect(link.text.trim()).toBe(link.text);
      expect(link.text.length).toBeGreaterThanOrEqual(3);
      expect(link.text).not.toMatch(GENERIC_ANCHORS);
    }
    expect(links.length).toBeLessThanOrEqual(MAX_INLINE_LINKS_PER_PAGE);
    const targets = links.map((link) => link.href);
    expect(new Set(targets).size, "the same page is linked twice").toBe(targets.length);
  });

  it("keeps link markup out of metadata, schema and FAQ strings", () => {
    for (const text of page.plain) {
      expect(text).not.toMatch(/\]\(\//);
    }
  });
});
