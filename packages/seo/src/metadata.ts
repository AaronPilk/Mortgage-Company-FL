/**
 * Canonical URL and metadata construction.
 *
 * The site URL comes from configuration, never from a request header. Building a
 * canonical from an untrusted Host header lets an attacker mint canonical tags
 * pointing at their own domain.
 */

export type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  noIndex?: boolean;
  publishedAt?: string;
  modifiedAt?: string;
};

export type PageMetadata = {
  title: string;
  description: string;
  alternates: { canonical: string };
  robots: { index: boolean; follow: boolean; nocache?: boolean };
  openGraph: {
    type: "website" | "article";
    url: string;
    title: string;
    description: string;
    images: { url: string; width: number; height: number }[];
    publishedTime?: string;
    modifiedTime?: string;
  };
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    images: string[];
  };
};

export class CanonicalError extends Error {}

/** Reject anything that is not a same-origin absolute path. */
export function safePath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new CanonicalError(`canonical path must be a same-origin absolute path: ${path}`);
  }
  if (path.includes("\\") || path.includes("\n") || path.includes("\r")) {
    throw new CanonicalError("canonical path contains illegal characters");
  }
  return path;
}

export function absoluteUrl(siteUrl: string, path: string): string {
  const base = new URL(siteUrl);
  const url = new URL(safePath(path), base);
  if (url.origin !== base.origin) {
    throw new CanonicalError("resolved URL escaped the configured origin");
  }
  // Canonicals are stable: no query string, no trailing slash except at root.
  url.search = "";
  url.hash = "";
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

export function createMetadata(siteUrl: string, input: PageMetaInput): PageMetadata {
  const canonical = absoluteUrl(siteUrl, input.path);
  const image = absoluteUrl(siteUrl, input.imagePath ?? "/og/default.png");
  const noIndex = input.noIndex ?? false;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      type: input.publishedAt === undefined ? "website" : "article",
      url: canonical,
      title: input.title,
      description: input.description,
      images: [{ url: image, width: 1200, height: 630 }],
      ...(input.publishedAt === undefined ? {} : { publishedTime: input.publishedAt }),
      ...(input.modifiedAt === undefined ? {} : { modifiedTime: input.modifiedAt })
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image]
    }
  };
}

/**
 * Routes that must never be indexed. Authenticated surfaces, admin, tokenized
 * reports, previews, and filter permutations produce no useful search result and
 * can leak. Checked in a unit test against the shipped route table.
 */
export const NOINDEX_PREFIXES = [
  "/admin",
  "/account",
  "/api",
  "/preview",
  "/vision/report",
  "/vision/project",
  "/tour",
  "/properties/search",
  "/offline"
] as const;

export function shouldNoIndex(path: string): boolean {
  return NOINDEX_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
