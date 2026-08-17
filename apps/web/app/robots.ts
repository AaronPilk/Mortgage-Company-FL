import type { MetadataRoute } from "next";
import { NOINDEX_PREFIXES } from "@tract/seo";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const disallow = NOINDEX_PREFIXES.map((prefix) => `${prefix}/`);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Assets are never blocked: a crawler that cannot fetch CSS and JS
        // cannot render the page it is judging.
        disallow
      },
      // Allowed so pages can surface in ChatGPT search. This is a separate
      // decision from model training, which GPTBot governs.
      { userAgent: "OAI-SearchBot", allow: "/", disallow },
      // Training preference. Flip to allow only as a documented decision.
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
