import type { MetadataRoute } from "next";
import { NOINDEX_PREFIXES } from "@tract/seo";
import { ANSWER_CRAWLERS, SEARCH_CRAWLERS, TRAINING_CRAWLERS } from "@/lib/crawlers";
import { SITE_URL } from "@/lib/site";

/**
 * Crawl policy (ADR-013).
 *
 * Every crawler may read every public page; none may read the private,
 * signed-in or API surfaces. The named groups exist because a crawler that
 * finds a group with its own name ignores the `*` group entirely, so each one
 * must repeat the disallows. Naming them also makes the decision explicit for
 * each class of bot rather than implied by a wildcard.
 *
 * Training crawlers are allowed by owner decision (12 Nov 2026). That reverses
 * the earlier GPTBot/CCBot block and is recorded in ADR-013.
 *
 * Cloudflare may prepend its own managed block to this file at the edge; that
 * is configured in the dashboard, not here.
 */
export default function robots(): MetadataRoute.Robots {
  // Assets are never blocked: a crawler that cannot fetch CSS and JS cannot
  // render the page it is judging.
  const disallow = NOINDEX_PREFIXES.map((prefix) => `${prefix}/`);

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: [...SEARCH_CRAWLERS], allow: "/", disallow },
      { userAgent: [...ANSWER_CRAWLERS], allow: "/", disallow },
      { userAgent: [...TRAINING_CRAWLERS], allow: "/", disallow }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
