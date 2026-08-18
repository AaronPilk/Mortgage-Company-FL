import Link from "next/link";
import type { ListingSummary } from "@tract/integrations";
import { formatUsd } from "@tract/mortgage-math";
import { Badge, Card } from "@/components/ui";
import { SampleDataBadge } from "./sample-data-notice";
import { ListingCardImage } from "./listing-gallery";
import {
  STATUS_LABEL,
  cityLine,
  factSummary,
  formatDaysOnMarket,
  formatLotSize,
  formatTimestamp,
  streetLine
} from "./listing-format";

/**
 * A single result.
 *
 * The card carries three things that are not negotiable regardless of layout:
 * the sample-data badge (invariant 6 — a fixture may not be presented as real),
 * the attribution text the display agreement requires, and the record's own
 * modification timestamp. None of them are collapsed behind a disclosure.
 *
 * Some records now carry an illustration. It sits above the badge rather than
 * replacing it: a picture makes an invented record read as real, so the badge
 * matters more once there is one, not less. The image carries its own label too.
 */
export function ListingCard({ listing }: { listing: ListingSummary }) {
  const facts = factSummary(listing);
  const lot = formatLotSize(listing.lotSizeSqft);
  const days = formatDaysOnMarket(listing.daysOnMarket);
  const updated = formatTimestamp(listing.modificationTimestamp);
  const href = `/properties/${encodeURIComponent(listing.listingKey)}`;

  return (
    <Card as="li" interactive className="relative overflow-hidden !p-0">
      <article className="flex h-full flex-col">
        <ListingCardImage listing={listing} />
        <div className="p-5 pb-0">{listing.isFixture && <SampleDataBadge />}</div>

        <div className="flex flex-1 flex-col p-5 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              {listing.listPriceCents === undefined
                ? "Price on request"
                : formatUsd(listing.listPriceCents)}
            </p>
            <Badge tone={listing.standardStatus === "active" ? "success" : "neutral"}>
              {STATUS_LABEL[listing.standardStatus]}
            </Badge>
          </div>

          <h3 className="mt-3 text-base font-semibold leading-snug">
            <Link href={href} className="after:absolute after:inset-0 hover:text-[var(--purple)]">
              {streetLine(listing)}
            </Link>
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {cityLine(listing)}
          </p>

          <p className="mt-3 text-sm font-medium" style={{ color: "var(--text)" }}>
            {facts.length > 0 ? facts.join(" · ") : (lot ?? "Land")}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {[listing.propertyType, facts.length > 0 ? lot : null, days]
              .filter((part): part is string => part !== null && part !== undefined)
              .join(" · ")}
          </p>

          <div className="mt-auto pt-4">
            {/* Required by the display agreement. Never omitted from a rendered card. */}
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {listing.attributionText}
            </p>
            {updated !== null && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Record updated {updated} ET
              </p>
            )}
          </div>
        </div>
      </article>
    </Card>
  );
}
