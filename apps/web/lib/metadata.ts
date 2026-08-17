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
  const forced = shouldNoIndex(input.path);
  const meta = createMetadata(SITE_URL, { ...input, noIndex: forced || (input.noIndex ?? false) });
  return meta as Metadata;
}
