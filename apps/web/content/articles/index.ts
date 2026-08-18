import type { Article } from "./types";
import { PROGRAMS_ARTICLES } from "./programs";
import { FIRST_TIME_ARTICLES } from "./first-time";
import { FLORIDA_COSTS_ARTICLES } from "./florida-costs";
import { CONDO_ARTICLES } from "./condo";
import { INVESTOR_ARTICLES } from "./investor";
import { REFINANCE_ARTICLES } from "./refinance";
import { LOCAL_ARTICLES } from "./local";
import { QUALIFICATION_ARTICLES } from "./qualification";
import { CONSTRUCTION_ARTICLES } from "./construction";
import { BASICS_ARTICLES } from "./basics";

/**
 * One flat, ordered list. Cluster files keep authorship reviewable — a change
 * to condo content is a condo-file diff — while every consumer (template,
 * index page, sitemap registration, tests) sees a single collection.
 */
export const ALL_ARTICLES: Article[] = [
  ...PROGRAMS_ARTICLES,
  ...FIRST_TIME_ARTICLES,
  ...FLORIDA_COSTS_ARTICLES,
  ...CONDO_ARTICLES,
  ...INVESTOR_ARTICLES,
  ...REFINANCE_ARTICLES,
  ...LOCAL_ARTICLES,
  ...QUALIFICATION_ARTICLES,
  ...CONSTRUCTION_ARTICLES,
  ...BASICS_ARTICLES
];

const BY_SLUG = new Map(ALL_ARTICLES.map((article) => [article.slug, article]));

export function articleBySlug(slug: string): Article | undefined {
  return BY_SLUG.get(slug);
}
