import type { MetadataRoute } from "next";
import { absoluteUrl, shouldNoIndex } from "@tract/seo";
import { indexableRoutes } from "@/content/routes";
import { SITE_URL } from "@/lib/site";

/**
 * The sitemap is generated from the route registry, and every entry is checked
 * against the noindex prefix list a second time. A route can only appear here by
 * being deliberately registered as indexable.
 *
 * lastModified reflects a content change, not a build. A deploy that changes no
 * copy must not re-date every URL.
 */
const CONTENT_LAST_MODIFIED = new Date("2026-08-17T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes()
    .filter((route) => !shouldNoIndex(route.path))
    .map((route) => ({
      url: absoluteUrl(SITE_URL, route.path),
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: route.changeFrequency,
      priority: route.priority
    }));
}
