import { dollarsToCents } from "@tract/mortgage-math";
import {
  PROPERTY_TYPE_OPTIONS,
  PUBLIC_STATUS_OPTIONS,
  PUBLICLY_DISPLAYABLE,
  type ListingStatus,
  type ListingSummary,
  type PropertySearchInput,
  type PropertyTypeOption
} from "./port";

/**
 * Saved-search → provider query, plus the watermark math that decides which of a
 * provider's results are genuinely new.
 *
 * These live in the listings package, not `apps/web`, because the Cloudflare
 * Worker cron runs the alert loop and cannot import a Next module. They are the
 * inverse of `criteriaToQueryString` (apps/web/components/properties/criteria.ts)
 * restricted to the canonical, charset-bounded string the `saved_searches` CHECK
 * already guarantees — a round-trip test in the app pins the two against drift.
 * Both functions are pure, so the cap, cold-start, and watermark behaviour is
 * proven without a provider or a database.
 */

/** Mirrors MAX_PRICE_DOLLARS in criteria.ts: bounds the input, not the market. */
const MAX_PRICE_DOLLARS = 50_000_000;

/**
 * How many results the alert loop fetches per saved search per run — deliberately
 * far larger than the per-email match cap. The two are different jobs: the fetch
 * must surface the WHOLE new-since-watermark set so `selectNewMatches` can drain
 * it oldest-first, while the cap only bounds how many appear in one email. Coupling
 * them (fetching only `cap`, sorted newest) silently discards the oldest overflow —
 * the watermark then advances past listings that were never fetched. This bound
 * makes the loop loss-free for any realistic per-search burst between two cron
 * ticks (≤ this many new matches). A live MLS adapter that can exceed it must add a
 * modified-since filter or cursor pagination from the watermark to stay loss-free —
 * tracked in docs/compliance/ as a pre-flip requirement for the feature.
 */
export const SAVED_SEARCH_FETCH_LIMIT = 100;

function boundedInt(raw: string | null, lo: number, hi: number): number | undefined {
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value >= lo && value <= hi ? value : undefined;
}

function boundedNumber(raw: string | null, lo: number, hi: number): number | undefined {
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= lo && value <= hi ? value : undefined;
}

/** Split repeated and comma-joined values — the shape URLSearchParams round-trips. */
function multiValues(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value !== "");
}

/**
 * Turn a stored saved-search record into a provider query. Unknown or
 * out-of-range parameters are dropped rather than echoed. The sort is FORCED to
 * "newest": the watermark lives on `modificationTimestamp`, so the loop always
 * wants the most-recently-modified page regardless of the sort the visitor saved.
 */
export function parseSavedSearchQuery(
  record: { searchParams: string },
  options: { limit?: number } = {}
): PropertySearchInput {
  const raw = record.searchParams.startsWith("?")
    ? record.searchParams.slice(1)
    : record.searchParams;
  const params = new URLSearchParams(raw);

  const query = (params.get("q") ?? "").trim().slice(0, 60);
  const minPrice = boundedInt(params.get("minPrice"), 0, MAX_PRICE_DOLLARS);
  const maxPrice = boundedInt(params.get("maxPrice"), 0, MAX_PRICE_DOLLARS);
  const beds = boundedInt(params.get("beds"), 0, 6);
  const baths = boundedNumber(params.get("baths"), 0, 6);
  const propertyTypes = multiValues(params, "type")
    .filter((value): value is PropertyTypeOption =>
      (PROPERTY_TYPE_OPTIONS as readonly string[]).includes(value)
    )
    .slice(0, 6);
  const statuses = multiValues(params, "status")
    .filter((value): value is (typeof PUBLIC_STATUS_OPTIONS)[number] =>
      (PUBLIC_STATUS_OPTIONS as readonly string[]).includes(value)
    )
    .slice(0, 3);

  // An inverted range is nonsense (criteria.ts refuses it too): drop the minimum
  // so the search still runs against the maximum rather than returning nothing.
  const rangeInverted = minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice;
  const status: ListingStatus[] = statuses.length > 0 ? [...statuses] : [...PUBLIC_STATUS_OPTIONS];

  return {
    market: "FL",
    status,
    sort: "newest",
    limit: options.limit ?? 20,
    ...(query === "" ? {} : { query }),
    ...(minPrice === undefined || rangeInverted ? {} : { minPriceCents: dollarsToCents(minPrice) }),
    ...(maxPrice === undefined ? {} : { maxPriceCents: dollarsToCents(maxPrice) }),
    ...(beds === undefined ? {} : { minBeds: beds }),
    ...(baths === undefined ? {} : { minBaths: baths }),
    ...(propertyTypes.length === 0 ? {} : { propertyTypes: [...propertyTypes] })
  };
}

export type NewMatchesResult = {
  matches: ListingSummary[];
  /** The newest modificationTimestamp accounted for, to persist as the watermark. */
  newWatermark: string | null;
};

/** modificationTimestamp as epoch ms, or NaN when absent/unparseable (never "new"). */
function timestampMs(listing: ListingSummary): number {
  if (listing.modificationTimestamp === undefined) return Number.NaN;
  const parsed = Date.parse(listing.modificationTimestamp);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/**
 * Given a provider page and a watermark, return only the listings strictly newer
 * than the watermark — drained OLDEST-first and capped — plus the watermark to
 * persist (the newest modificationTimestamp in the emitted batch).
 *
 * Oldest-first draining means a burst larger than the cap is delivered across
 * successive runs with nothing skipped, and keeps a stuck batch's watermark (and
 * therefore its dedupe key) stable between runs. Fixtures and non-displayable
 * statuses are dropped here as well, so a misconfigured provider can never turn a
 * sample record into an email (invariant 6). A null watermark is the cold-start
 * signal: no matches, and the loop seeds the baseline to now().
 */
export function selectNewMatches(
  results: readonly ListingSummary[],
  watermark: string | null,
  cap: number
): NewMatchesResult {
  if (watermark === null) return { matches: [], newWatermark: null };
  const watermarkMs = Date.parse(watermark);
  if (!Number.isFinite(watermarkMs)) return { matches: [], newWatermark: watermark };
  const size = Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : 1;

  const candidates = results
    .filter(
      (listing) =>
        !listing.isFixture &&
        PUBLICLY_DISPLAYABLE.includes(listing.standardStatus) &&
        Number.isFinite(timestampMs(listing)) &&
        timestampMs(listing) > watermarkMs
    )
    .sort(
      (a, b) => timestampMs(a) - timestampMs(b) || a.listingKey.localeCompare(b.listingKey, "en")
    );

  let batch = candidates.slice(0, size);
  const nextExcluded = candidates[size];
  const lastIncluded = batch[batch.length - 1];
  if (candidates.length > size && nextExcluded !== undefined && lastIncluded !== undefined) {
    const boundary = timestampMs(lastIncluded);
    // Never split an equal-timestamp group across the watermark: a sibling left
    // just below the mark would be filtered out (strict >) next run and lost.
    // Trim the trailing equal-ts group; if the whole cap is a single timestamp
    // shared by still more records, take the entire group to guarantee progress.
    if (timestampMs(nextExcluded) === boundary) {
      const trimmed = batch.filter((listing) => timestampMs(listing) !== boundary);
      batch =
        trimmed.length > 0
          ? trimmed
          : candidates.filter((listing) => timestampMs(listing) === boundary);
    }
  }

  if (batch.length === 0) return { matches: [], newWatermark: watermark };
  const newestMs = Math.max(...batch.map(timestampMs));
  return { matches: batch, newWatermark: new Date(newestMs).toISOString() };
}
