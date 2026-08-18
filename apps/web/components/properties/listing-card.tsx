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

  // Hierarchy, top to bottom: price loudest, address second, everything else a
  // quiet meta row. One surface, no boxes inside boxes.
  return (
    <Card as="li" interactive className="relative overflow-hidden !p-0">
      <article className="flex h-full flex-col">
        <ListingCardImage listing={listing} />

        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-2">
            {listing.isFixture && <SampleDataBadge />}
            <Badge tone={listing.standardStatus === "active" ? "success" : "neutral"}>
              {STATUS_LABEL[listing.standardStatus]}
            </Badge>
          </div>

          <p
            className="mt-4 text-[1.6rem] font-semibold leading-none tracking-[-0.02em]"
            style={{ color: "var(--text)" }}
          >
            {listing.listPriceCents === undefined
              ? "Price on request"
              : formatUsd(listing.listPriceCents)}
          </p>

          <h3 className="mt-2.5 text-base font-medium leading-snug">
            <Link href={href} className="after:absolute after:inset-0 hover:text-[var(--purple)]">
              {streetLine(listing)}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
            {cityLine(listing)}
          </p>

          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="font-medium" style={{ color: "var(--text)" }}>
              {facts.length > 0 ? facts.join(" · ") : (lot ?? "Land")}
            </span>
            {[listing.propertyType, facts.length > 0 ? lot : null, days]
              .filter((part): part is string => part !== null && part !== undefined)
              .map((part) => (
                <span key={part}> · {part}</span>
              ))}
          </p>

          <div className="mt-auto border-t pt-3.5" style={{ borderColor: "var(--border)" }}>
            {/* Required by the display agreement. Never omitted from a rendered card. */}
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {listing.attributionText}
              {updated !== null && <> · Record updated {updated} ET</>}
            </p>
          </div>
        </div>
      </article>
    </Card>
  );
}
