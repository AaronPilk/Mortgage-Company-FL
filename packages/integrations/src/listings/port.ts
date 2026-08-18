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
  /**
   * `url` must be first-party. A listing source's photograph may only be shown
   * under a display agreement, and hotlinking one is somebody else's bandwidth
   * and somebody else's copyright, so the search fixtures assert this stays a
   * same-origin path. `alt` travels with the image because a caller that has to
   * invent alt text will invent one that describes a property rather than the
   * picture.
   */
  primaryImage?: {
    url: string;
    width?: number;
    height?: number;
    attribution?: string;
    alt?: string;
  };
  /** Required by the MLS display agreement. Never omitted from a rendered card. */
  attributionText: string;
  modificationTimestamp?: string;
  /** True when the record came from local fixtures. Must never render in production. */
  isFixture: boolean;

  /*
   * Detail-page fields. Added additively: every one is optional, because a real
   * feed supplies them inconsistently and a missing value must render as absent
   * rather than as a plausible-looking default.
   */
  yearBuilt?: number;
  lotSizeSqft?: number;
  daysOnMarket?: number;
  description?: string;
  monthlyHoaFeeCents?: number;
  annualTaxAmountCents?: number;
};

/**
 * Sort orders offered to a consumer. The set is closed so an arbitrary field
 * name from a query string can never reach a comparator.
 */
export const LISTING_SORTS = [
  "newest",
  "price_asc",
  "price_desc",
  "beds_desc",
  "sqft_desc"
] as const;

export type ListingSort = (typeof LISTING_SORTS)[number];

export const DEFAULT_LISTING_SORT: ListingSort = "newest";

/**
 * Property types a consumer can filter by. A closed list keeps the filter UI
 * stable and stops a free-text value being echoed back into the page.
 */
export const PROPERTY_TYPE_OPTIONS = [
  "Single Family Residence",
  "Condominium",
  "Townhouse",
  "Duplex",
  "Residential Lot",
  "Land"
] as const;

export type PropertyTypeOption = (typeof PROPERTY_TYPE_OPTIONS)[number];

export type PropertySearchInput = {
  market: string;
  /** Free text matched against city, postal code, and state. Never a SQL fragment. */
  query?: string;
  status?: ListingStatus[];
  minPriceCents?: number;
  maxPriceCents?: number;
  minBeds?: number;
  minBaths?: number;
  propertyTypes?: string[];
  bounds?: { north: number; south: number; east: number; west: number };
  sort?: ListingSort;
  cursor?: string;
  limit: number;
};

export type SearchPage = {
  items: ListingSummary[];
  nextCursor?: string;
  /** Total matches before pagination. Drives the result count and page links. */
  totalCount: number;
  /** Shown to the consumer so nobody treats a cached record as live. */
  dataAsOf: string;
};

export interface ListingProvider {
  readonly key: string;
  search(input: PropertySearchInput): Promise<SearchPage>;
  getByKey(listingKey: string): Promise<ListingSummary | null>;
  /**
   * Snapshot time of the provider's current data. A detail page fetches one
   * record and still has to tell the reader how stale the feed is, which
   * `getByKey` alone cannot answer.
   */
  dataAsOf(): Promise<string>;
  health(): Promise<{ ok: boolean; detail: string }>;
}

/**
 * Statuses that may be displayed publicly. Local MLS rules can narrow this
 * further. The tuple exists separately so a validator can build a closed enum
 * from it; the wider alias is what predicates test membership against.
 */
export const PUBLIC_STATUS_OPTIONS = ["active", "coming_soon", "pending"] as const;

export const PUBLICLY_DISPLAYABLE: readonly ListingStatus[] = PUBLIC_STATUS_OPTIONS;

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
