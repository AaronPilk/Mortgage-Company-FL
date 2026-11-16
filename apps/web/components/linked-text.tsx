import { Fragment } from "react";
import Link from "next/link";
import { shouldNoIndex } from "@tract/seo";
import { indexableRoutes } from "@/content/routes";
import { parseInlineLinks } from "@/lib/inline-links";
import { rateWatchAvailable } from "@/lib/rates";

/**
 * Renders a content string, turning `[anchor](/path)` into an in-sentence link.
 *
 * A link only renders when its target is a page a visitor can actually reach:
 * in the sitemap (registered, indexable, outside the noindex prefixes) and, for
 * a page that only exists behind a runtime flag, with that flag on. Anything
 * else renders as its anchor text, so the sentence still reads and nobody is
 * sent to a 404. /mortgage-rates is the case in point: it 404s whenever the rate
 * feed is off (ADR-015), and every sentence that links to it falls back to plain
 * text on its own. Typos are caught earlier, by tests/unit/inline-links.test.ts
 * and the content linter, which both require every target to be registered.
 *
 * "/" is left out on purpose: the homepage is the landing with its own chrome,
 * and a client-side <Link> to it would keep the wrong header (ADR-011).
 */

const LINKABLE = new Set(
  indexableRoutes()
    .filter((route) => route.path !== "/" && !shouldNoIndex(route.path))
    .map((route) => route.path)
);

/** Pages that render only while a runtime flag is on. */
const FLAG_GATED: Record<string, () => boolean> = {
  "/mortgage-rates": rateWatchAvailable
};

function reachable(href: string): boolean {
  if (!LINKABLE.has(href)) return false;
  const gate = FLAG_GATED[href];
  return gate === undefined || gate();
}

export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {parseInlineLinks(text).map((segment, index) =>
        segment.kind === "link" && reachable(segment.href) ? (
          <Link
            key={index}
            href={segment.href}
            className="font-medium text-[var(--purple)] underline underline-offset-4"
          >
            {segment.text}
          </Link>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        )
      )}
    </>
  );
}
