import type { MetadataRoute } from "next";
import { absoluteUrl, shouldNoIndex } from "@tract/seo";
import { indexableRoutes } from "@/content/routes";
import { ROUTE_LASTMOD } from "@/content/route-lastmod.generated";
import { SITE_URL } from "@/lib/site";

/**
 * The sitemap is generated from the route registry, and every entry is checked
 * against the noindex prefix list a second time. A route can only appear here by
 * being deliberately registered as indexable. Every URL is on the one canonical
 * origin (ADR-011), because absoluteUrl refuses to leave SITE_URL.
 *
 * lastModified is the day the route's own page or content last changed in Git
 * (content/route-lastmod.generated.ts, written by `pnpm seo:lastmod`), never the
 * build time: a deploy that changes no copy must not re-date every URL. A route
 * missing from the map gets no lastmod rather than an invented one, and a unit
 * test fails until the map is regenerated.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes()
    .filter((route) => !shouldNoIndex(route.path))
    .map((route) => {
      const lastModified = ROUTE_LASTMOD[route.path];
      return {
        url: absoluteUrl(SITE_URL, route.path),
        ...(lastModified === undefined ? {} : { lastModified }),
        changeFrequency: route.changeFrequency,
        priority: route.priority
      };
    });
}
