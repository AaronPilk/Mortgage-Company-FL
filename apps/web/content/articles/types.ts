/**
 * Article content model.
 *
 * Articles are typed data, not markdown, for the same reason programs are: the
 * template can then guarantee structure — an answer summary at the top, visible
 * FAQs matching the FAQ schema, a sources section — and the content linter and
 * site-contract tests can assert it. A folder of markdown can drift; a typed
 * array cannot drift silently.
 *
 * Editorial rules every entry must satisfy (enforced by review and by
 * tests/content-lint where mechanically checkable):
 *
 * - `answerSummary` answers the title's question directly in 40–70 words.
 *   This is the passage an AI answer engine or featured snippet lifts, so it
 *   must stand alone: no "as we'll see below", no dangling references.
 * - No rate, price threshold, premium figure, or program limit is stated as a
 *   current fact. Figures that change get "check the current figure" language
 *   and a primary source. This is how content stays true without a maintenance
 *   treadmill.
 * - Every checkable claim traces to one of `sources`. A source is a primary
 *   authority (HUD, CFPB, VA, USDA, Fannie, Freddie, a Florida agency), not a
 *   competitor's blog.
 * - Educational voice, broker-accurate: TRACT arranges loans and does not make
 *   them, approve them, or set their prices.
 */

export type ArticleCategory =
  | "programs"
  | "first-time"
  | "florida-costs"
  | "condo"
  | "investor"
  | "refinance"
  | "local"
  | "qualification"
  | "construction"
  | "basics";

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  programs: "Loan programs",
  "first-time": "First-time buying",
  "florida-costs": "Florida carrying costs",
  condo: "Condos",
  investor: "Investing",
  refinance: "Refinancing",
  local: "Florida places",
  qualification: "Qualifying",
  construction: "Land & construction",
  basics: "Mortgage basics"
};

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  /** Optional scannable list rendered after the paragraphs. */
  bullets?: string[];
};

export type ArticleSource = { publisher: string; title: string; url: string };

export type Article = {
  /** URL segment under /resources/. Kebab-case, stable once published. */
  slug: string;
  category: ArticleCategory;
  /** SEO title, 60 characters or fewer. */
  title: string;
  /** Meta description, 165 characters or fewer. */
  description: string;
  /** On-page H1. May be longer and more natural than the SEO title. */
  h1: string;
  /** Direct 40–70 word answer to the question the page exists to answer. */
  answerSummary: string;
  sections: ArticleSection[];
  /** Rendered on the page; also emitted as FAQPage schema because visible. */
  faqs: { question: string; answer: string }[];
  sources: ArticleSource[];
  /** Internal links. Every article links to at least one tool or program. */
  related: { href: string; label: string }[];
  publishedAt: string;
  lastReviewed: string;
};
