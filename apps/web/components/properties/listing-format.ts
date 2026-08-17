import type { ListingStatus, ListingSummary } from "@tract/integrations";

/**
 * Presentation helpers for listing records.
 *
 * Nothing here computes a financial figure — money formatting comes from
 * `@tract/mortgage-math` and payment arithmetic from its calculators. These
 * functions only decide how an already-known value reads, and they return
 * `null` rather than a placeholder when a value is absent, so a caller has to
 * decide what an unknown looks like instead of inheriting a fabricated zero.
 */

const SQFT_PER_ACRE = 43_560;

export const STATUS_LABEL: Record<ListingStatus, string> = {
  active: "Active",
  coming_soon: "Coming soon",
  pending: "Pending",
  closed: "Closed",
  expired: "Expired",
  withdrawn: "Withdrawn",
  deleted: "Removed",
  unknown: "Status unknown"
};

export function streetLine(listing: ListingSummary): string {
  return listing.address.line1 ?? "Address withheld";
}

export function cityLine(listing: ListingSummary): string {
  const { city, state, postalCode } = listing.address;
  const region = [state, postalCode].filter((part): part is string => part !== undefined).join(" ");
  return [city, region]
    .filter((part): part is string => part !== undefined && part !== "")
    .join(", ");
}

export function formatCount(
  value: number | undefined,
  singular: string,
  plural: string
): string | null {
  if (value === undefined) return null;
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatSqft(value: number | undefined): string | null {
  if (value === undefined) return null;
  return `${new Intl.NumberFormat("en-US").format(value)} sq ft`;
}

/** Acres above a full acre, square feet below it. A 40-acre parcel in sq ft is unreadable. */
export function formatLotSize(sqft: number | undefined): string | null {
  if (sqft === undefined) return null;
  if (sqft < SQFT_PER_ACRE) return formatSqft(sqft);
  const acres = sqft / SQFT_PER_ACRE;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(acres)} acres`;
}

export function formatDaysOnMarket(days: number | undefined): string | null {
  if (days === undefined) return null;
  if (days === 0) return "Listed today";
  return `${days} ${days === 1 ? "day" : "days"} on market`;
}

/** Summary line under a card. Land records legitimately produce an empty list. */
export function factSummary(listing: ListingSummary): string[] {
  return [
    formatCount(listing.bedrooms, "bd", "bd"),
    formatCount(listing.bathrooms, "ba", "ba"),
    formatSqft(listing.livingAreaSqft)
  ].filter((part): part is string => part !== null);
}

export function formatTimestamp(iso: string | undefined): string | null {
  if (iso === undefined) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(parsed);
}
