import {
  DEFAULT_LISTING_SORT,
  type ListingSort,
  type ListingSummary,
  type PropertySearchInput
} from "./port";

/**
 * Filtering, sorting, and pagination for listing records held in memory.
 *
 * These are pure functions rather than provider methods so the behaviour a
 * consumer sees can be tested without a provider, and so a future adapter that
 * pushes the same predicates down to a remote query has an executable
 * specification of what those predicates are supposed to mean.
 */

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Free-text match. A consumer types a city or a ZIP, not a field name, so the
 * needle is checked against the parts of the address that identify a place.
 * The street line is deliberately excluded: matching it turns a place search
 * into an address lookup and surfaces records for reasons the consumer cannot
 * see.
 */
export function matchesListingQuery(listing: ListingSummary, query: string): boolean {
  const needle = normalize(query);
  if (needle === "") return true;

  const city = listing.address.city;
  const postalCode = listing.address.postalCode;
  const state = listing.address.state;

  if (city !== undefined && normalize(city).includes(needle)) return true;
  if (postalCode !== undefined && normalize(postalCode).startsWith(needle)) return true;
  if (state !== undefined && normalize(state) === needle) return true;
  return false;
}

function withinBounds(listing: ListingSummary, bounds: NonNullable<PropertySearchInput["bounds"]>) {
  if (listing.coordinates === undefined) return true;
  const { latitude, longitude } = listing.coordinates;
  return (
    latitude <= bounds.north &&
    latitude >= bounds.south &&
    longitude <= bounds.east &&
    longitude >= bounds.west
  );
}

/**
 * A single record against a single set of criteria. Absent values on the
 * listing fail a filter that constrains them rather than passing silently — a
 * consumer who asked for three bedrooms should not be shown a record whose
 * bedroom count is unknown.
 */
export function matchesListingFilters(
  listing: ListingSummary,
  input: Omit<PropertySearchInput, "limit">
): boolean {
  if (input.status !== undefined && !input.status.includes(listing.standardStatus)) return false;

  if (input.minPriceCents !== undefined) {
    if (listing.listPriceCents === undefined) return false;
    if (listing.listPriceCents < input.minPriceCents) return false;
  }
  if (input.maxPriceCents !== undefined) {
    if (listing.listPriceCents === undefined) return false;
    if (listing.listPriceCents > input.maxPriceCents) return false;
  }
  if (input.minBeds !== undefined && (listing.bedrooms ?? 0) < input.minBeds) return false;
  if (input.minBaths !== undefined && (listing.bathrooms ?? 0) < input.minBaths) return false;

  if (input.propertyTypes !== undefined && input.propertyTypes.length > 0) {
    if (!input.propertyTypes.includes(listing.propertyType ?? "")) return false;
  }

  if (input.bounds !== undefined && !withinBounds(listing, input.bounds)) return false;

  if (input.query !== undefined && !matchesListingQuery(listing, input.query)) return false;

  // `market` is the provider-level scope, not a consumer filter. "FL" and an
  // empty string both mean "the whole configured market".
  const market = normalize(input.market);
  if (market !== "" && market !== "fl") {
    const city = listing.address.city;
    if (city === undefined || normalize(city) !== market) return false;
  }

  return true;
}

export function filterListings(
  listings: readonly ListingSummary[],
  input: Omit<PropertySearchInput, "limit">
): ListingSummary[] {
  return listings.filter((listing) => matchesListingFilters(listing, input));
}

function timestampValue(listing: ListingSummary): number {
  if (listing.modificationTimestamp === undefined) return 0;
  const parsed = Date.parse(listing.modificationTimestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Comparators return a total order. A record missing the sorted field sorts
 * last in every direction rather than jumping to the top of an ascending list,
 * and `listingKey` is the final tiebreak so the same query always produces the
 * same page — pagination over an unstable order silently drops records.
 */
const COMPARATORS: Record<ListingSort, (a: ListingSummary, b: ListingSummary) => number> = {
  newest: (a, b) => timestampValue(b) - timestampValue(a),
  price_asc: (a, b) =>
    (a.listPriceCents ?? Number.MAX_SAFE_INTEGER) - (b.listPriceCents ?? Number.MAX_SAFE_INTEGER),
  price_desc: (a, b) => (b.listPriceCents ?? -1) - (a.listPriceCents ?? -1),
  beds_desc: (a, b) => (b.bedrooms ?? -1) - (a.bedrooms ?? -1),
  sqft_desc: (a, b) => (b.livingAreaSqft ?? -1) - (a.livingAreaSqft ?? -1)
};

export function sortListings(
  listings: readonly ListingSummary[],
  sort: ListingSort = DEFAULT_LISTING_SORT
): ListingSummary[] {
  const compare = COMPARATORS[sort];
  return [...listings].sort(
    (a, b) => compare(a, b) || a.listingKey.localeCompare(b.listingKey, "en")
  );
}

export type PaginatedListings = {
  items: ListingSummary[];
  totalCount: number;
  offset: number;
  nextCursor?: string;
};

/**
 * The cursor is an offset rendered as a string. That is honest about what it
 * is: a fixture provider has a stable in-memory array, and pretending to hand
 * out an opaque token would imply a durability guarantee it does not have.
 */
export function parseCursor(cursor: string | undefined): number {
  if (cursor === undefined) return 0;
  const parsed = Number.parseInt(cursor, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

export function paginateListings(
  listings: readonly ListingSummary[],
  cursor: string | undefined,
  limit: number
): PaginatedListings {
  const offset = parseCursor(cursor);
  const size = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 1;
  const items = listings.slice(offset, offset + size);
  const next = offset + size;
  return {
    items,
    totalCount: listings.length,
    offset,
    ...(next < listings.length ? { nextCursor: String(next) } : {})
  };
}

/** Filter, sort, paginate. The order matters: a count is of matches, not of a page. */
export function runListingSearch(
  listings: readonly ListingSummary[],
  input: PropertySearchInput
): PaginatedListings {
  const matched = filterListings(listings, input);
  const ordered = sortListings(matched, input.sort ?? DEFAULT_LISTING_SORT);
  return paginateListings(ordered, input.cursor, input.limit);
}

/** Total pages for a match count, so a caller never divides by zero. */
export function pageCount(totalCount: number, limit: number): number {
  if (limit <= 0) return 1;
  return Math.max(1, Math.ceil(totalCount / limit));
}
