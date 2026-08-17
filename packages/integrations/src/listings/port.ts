/**
 * Listing provider port.
 *
 * RESO defines a standard; it does not grant listing rights. Every field that a
 * local MLS agreement requires to be displayed — attribution, modification
 * timestamp, status — travels with the record and is never stripped for layout.
 */

export type ListingStatus =
  "active" | "coming_soon" | "pending" | "closed" | "expired" | "withdrawn" | "deleted" | "unknown";

export type ListingSummary = {
  provider: string;
  listingKey: string;
  standardStatus: ListingStatus;
  listPriceCents?: number;
  address: {
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  coordinates?: { latitude: number; longitude: number };
  bedrooms?: number;
  bathrooms?: number;
  livingAreaSqft?: number;
  propertyType?: string;
  primaryImage?: { url: string; width?: number; height?: number; attribution?: string };
  /** Additional licensed images, or locally generated images on explicit demo records. */
  images?: { url: string; width?: number; height?: number; attribution?: string }[];
  /** Plain-language context supplied by the provider. Never generated from a listing photo. */
  description?: string;
  highlights?: string[];
  lotSizeAcres?: number;
  yearBuilt?: number;
  /**
   * Synthetic seed values used only by the clearly-labelled planning demo.
   * A live provider must not populate these without a documented source.
   */
  demoPlanningSeed?: {
    goal: "renovate" | "expand" | "build" | "flip" | "long_term_rental" | "explore";
    improvementBudgetCents: number;
    expectedAfterImprovementValueCents: number;
    annualPropertyTaxCents: number;
    annualInsuranceCents: number;
    monthlyHoaCents: number;
  };
  /** Required by the MLS display agreement. Never omitted from a rendered card. */
  attributionText: string;
  modificationTimestamp?: string;
  /**
   * True when the record came from local fixtures. It must never enter a
   * publishable listing feed. A separately-labelled planning demo may render it.
   */
  isFixture: boolean;
};

export type PropertySearchInput = {
  market: string;
  status?: ListingStatus[];
  minPriceCents?: number;
  maxPriceCents?: number;
  minBeds?: number;
  minBaths?: number;
  propertyTypes?: string[];
  bounds?: { north: number; south: number; east: number; west: number };
  cursor?: string;
  limit: number;
};

export type SearchPage = {
  items: ListingSummary[];
  nextCursor?: string;
  /** Shown to the consumer so nobody treats a cached record as live. */
  dataAsOf: string;
};

export interface ListingProvider {
  readonly key: string;
  search(input: PropertySearchInput): Promise<SearchPage>;
  getByKey(listingKey: string): Promise<ListingSummary | null>;
  health(): Promise<{ ok: boolean; detail: string }>;
}

/** Statuses that may be displayed publicly. Local MLS rules can narrow this further. */
export const PUBLICLY_DISPLAYABLE: readonly ListingStatus[] = ["active", "coming_soon", "pending"];

export function isDisplayable(listing: ListingSummary, allowFixtures: boolean): boolean {
  if (listing.isFixture && !allowFixtures) return false;
  return PUBLICLY_DISPLAYABLE.includes(listing.standardStatus);
}

/**
 * A record whose rights were withdrawn must be unpublished promptly. This returns
 * the records that should disappear from public surfaces given a fresh provider
 * snapshot.
 */
export function recordsToUnpublish(
  known: readonly ListingSummary[],
  currentKeys: ReadonlySet<string>
): ListingSummary[] {
  return known.filter(
    (listing) =>
      !currentKeys.has(listing.listingKey) || !PUBLICLY_DISPLAYABLE.includes(listing.standardStatus)
  );
}

export class ListingRightsError extends Error {}

/**
 * Paste-a-link handling. We parse the host and ask the consumer to confirm an
 * address; we never fetch an arbitrary URL server-side and never treat a portal
 * page as a licence to copy its content.
 */
export type LinkResolution =
  | { kind: "address_confirmation_required"; hostname: string }
  | { kind: "rejected"; reason: "unsupported_scheme" | "private_host" | "malformed" };

const PRIVATE_HOST_PATTERN =
  /^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|\[?fc|\[?fd|0\.0\.0\.0$)/i;

export function resolvePastedLink(raw: string): LinkResolution {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { kind: "rejected", reason: "malformed" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { kind: "rejected", reason: "unsupported_scheme" };
  }
  if (PRIVATE_HOST_PATTERN.test(url.hostname)) {
    return { kind: "rejected", reason: "private_host" };
  }
  return { kind: "address_confirmation_required", hostname: url.hostname };
}
