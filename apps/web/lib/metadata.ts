import type { Metadata } from "next";
import { createMetadata, shouldNoIndex } from "@tract/seo";
import { SITE_URL } from "./site";

/**
 * Page metadata helper. Routes that match a protected prefix are forced to
 * noindex regardless of what a caller passes, so a single missed flag on a new
 * admin or report route cannot put it in the index.
 */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  noIndex?: boolean;
  publishedAt?: string;
  modifiedAt?: string;
}): Metadata {
  // Every canonical is SITE_URL + path, with no override. The absolute-URL
  // override that let the landing canonicalise to a second domain went away
  // with that domain (ADR-011); a canonical can no longer leave the origin.
  const forced = shouldNoIndex(input.path);
  return createMetadata(SITE_URL, {
    ...input,
    noIndex: forced || (input.noIndex ?? false)
  }) as Metadata;
}
