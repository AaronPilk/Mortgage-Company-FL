import { z } from "zod";
import {
  DEFAULT_LISTING_SORT,
  LISTING_SORTS,
  PROPERTY_TYPE_OPTIONS,
  PUBLIC_STATUS_OPTIONS,
  type ListingSort,
  type PropertySearchInput
} from "@tract/integrations";
import { dollarsToCents } from "@tract/mortgage-math";

/**
 * Property search criteria.
 *
 * Search state lives in the URL, not in component state, so a result set is
 * shareable, server-rendered, and reproducible from the address bar alone. That
 * makes the query string an untrusted input on every surface that reads it, so
 * one schema validates it for both the page and the API route — a page that
 * parsed leniently and an endpoint that parsed strictly would eventually
 * disagree about what a link means.
 *
 * Prices travel through the URL in whole dollars because that is what a person
 * types. They are converted to integer cents at the single boundary below, and
 * every comparison downstream is in cents.
 */

export const PAGE_SIZE = 12;

/** A price nobody in this market will exceed. Bounds the input, not the market. */
const MAX_PRICE_DOLLARS = 50_000_000;

function firstValue(raw: unknown): string | undefined {
  const candidate = Array.isArray(raw) ? raw.find((value) => typeof value === "string") : raw;
  if (typeof candidate !== "string") return undefined;
  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function allValues(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [raw];
  return list
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value !== "");
}

export const PropertySearchQuerySchema = z
  .object({
    q: z.preprocess(
      firstValue,
      z.string().max(60, "Keep the search under 60 characters.").optional()
    ),
    minPrice: z.preprocess(
      firstValue,
      z.coerce.number().int().min(0).max(MAX_PRICE_DOLLARS).optional()
    ),
    maxPrice: z.preprocess(
      firstValue,
      z.coerce.number().int().min(0).max(MAX_PRICE_DOLLARS).optional()
    ),
    beds: z.preprocess(firstValue, z.coerce.number().int().min(0).max(6).optional()),
    baths: z.preprocess(firstValue, z.coerce.number().min(0).max(6).optional()),
    type: z.preprocess(allValues, z.array(z.enum(PROPERTY_TYPE_OPTIONS)).max(6)).default([]),
    status: z.preprocess(allValues, z.array(z.enum(PUBLIC_STATUS_OPTIONS)).max(3)).default([]),
    sort: z.preprocess(firstValue, z.enum(LISTING_SORTS)).default(DEFAULT_LISTING_SORT),
    page: z.preprocess(firstValue, z.coerce.number().int().min(1).max(500)).default(1)
  })
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    { message: "The minimum price is above the maximum.", path: ["minPrice"] }
  );

export type PropertySearchCriteria = z.infer<typeof PropertySearchQuerySchema>;

export const EMPTY_CRITERIA: PropertySearchCriteria = {
  type: [],
  status: [],
  sort: DEFAULT_LISTING_SORT,
  page: 1
};

/**
 * Page-side parsing. A malformed link is a bad link, not an error page: the
 * unusable parameters are dropped and the search still renders. The API route
 * uses `safeParse` on the same schema and reports the failure instead, because
 * a programmatic caller benefits from being told which field was wrong.
 */
export function parseCriteria(raw: Record<string, string | string[] | undefined>): {
  criteria: PropertySearchCriteria;
  valid: boolean;
} {
  const parsed = PropertySearchQuerySchema.safeParse(raw);
  if (parsed.success) return { criteria: parsed.data, valid: true };

  // Retry with only the fields that survive on their own, so one bad number
  // does not discard a perfectly good city search.
  const salvaged: Record<string, string | string[] | undefined> = {};
  for (const key of [
    "q",
    "minPrice",
    "maxPrice",
    "beds",
    "baths",
    "type",
    "status",
    "sort",
    "page"
  ]) {
    const attempt = PropertySearchQuerySchema.safeParse({ ...salvaged, [key]: raw[key] });
    if (attempt.success) salvaged[key] = raw[key];
  }
  const fallback = PropertySearchQuerySchema.safeParse(salvaged);
  return { criteria: fallback.success ? fallback.data : EMPTY_CRITERIA, valid: false };
}

export function hasActiveFilters(criteria: PropertySearchCriteria): boolean {
  return (
    criteria.q !== undefined ||
    criteria.minPrice !== undefined ||
    criteria.maxPrice !== undefined ||
    criteria.beds !== undefined ||
    criteria.baths !== undefined ||
    criteria.type.length > 0 ||
    criteria.status.length > 0
  );
}

/** Criteria to the provider port. The one place dollars become cents. */
export function toProviderInput(
  criteria: PropertySearchCriteria,
  options: { pageSize?: number } = {}
): PropertySearchInput {
  const pageSize = options.pageSize ?? PAGE_SIZE;
  const statuses = criteria.status.length > 0 ? criteria.status : PUBLIC_STATUS_OPTIONS;
  const offset = (criteria.page - 1) * pageSize;

  return {
    market: "FL",
    // A status outside the publicly displayable set is never requested, so the
    // total count and the rendered page always describe the same records.
    status: [...statuses],
    sort: criteria.sort,
    limit: pageSize,
    ...(offset > 0 ? { cursor: String(offset) } : {}),
    ...(criteria.q === undefined ? {} : { query: criteria.q }),
    ...(criteria.minPrice === undefined
      ? {}
      : { minPriceCents: dollarsToCents(criteria.minPrice) }),
    ...(criteria.maxPrice === undefined
      ? {}
      : { maxPriceCents: dollarsToCents(criteria.maxPrice) }),
    ...(criteria.beds === undefined ? {} : { minBeds: criteria.beds }),
    ...(criteria.baths === undefined ? {} : { minBaths: criteria.baths }),
    ...(criteria.type.length === 0 ? {} : { propertyTypes: [...criteria.type] })
  };
}

/** Rebuilds the query string. Defaults are omitted so a shared link stays short. */
export function criteriaToQueryString(
  criteria: PropertySearchCriteria,
  overrides: Partial<PropertySearchCriteria> = {}
): string {
  const merged = { ...criteria, ...overrides };
  const params = new URLSearchParams();

  if (merged.q !== undefined) params.set("q", merged.q);
  if (merged.minPrice !== undefined) params.set("minPrice", String(merged.minPrice));
  if (merged.maxPrice !== undefined) params.set("maxPrice", String(merged.maxPrice));
  if (merged.beds !== undefined) params.set("beds", String(merged.beds));
  if (merged.baths !== undefined) params.set("baths", String(merged.baths));
  for (const value of merged.type) params.append("type", value);
  for (const value of merged.status) params.append("status", value);
  if (merged.sort !== DEFAULT_LISTING_SORT) params.set("sort", merged.sort);
  if (merged.page > 1) params.set("page", String(merged.page));

  return params.toString();
}

export function propertiesHref(
  criteria: PropertySearchCriteria,
  overrides: Partial<PropertySearchCriteria> = {}
): string {
  const query = criteriaToQueryString(criteria, overrides);
  return query === "" ? "/properties" : `/properties?${query}`;
}

export const SORT_LABELS: Record<ListingSort, string> = {
  newest: "Most recently updated",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  beds_desc: "Most bedrooms",
  sqft_desc: "Largest living area"
};

export const STATUS_LABELS: Record<(typeof PUBLIC_STATUS_OPTIONS)[number], string> = {
  active: "Active",
  coming_soon: "Coming soon",
  pending: "Pending"
};
