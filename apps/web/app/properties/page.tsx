import type { Metadata } from "next";
import { ButtonLink, Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { fixturesAllowed, listings } from "@/lib/listings";
import { isDisplayable } from "@tract/integrations";
import { formatUsd } from "@tract/mortgage-math";

export const metadata: Metadata = pageMetadata({
  title: "Property search",
  description: "Search properties and model the financing.",
  path: "/properties",
  noIndex: true
});

export const dynamic = "force-dynamic";

/**
 * Property search.
 *
 * Requires both the feature flag and a configured provider. Fixture records
 * carry `isFixture` and are filtered out unless fixtures are explicitly allowed,
 * which they are not in production — the database enforces the same rule.
 *
 * Filter permutations are noindex. A crawlable URL for every combination of
 * price, beds, and bounds is thin content at scale.
 */
export default async function PropertiesPage() {
  const features = publicFeatures();

  if (!features.propertySearch) {
    return (
      <Section width="narrow">
        <SectionHeading
          as="h1"
          eyebrow="Properties"
          title="Property search is not connected yet"
          description="Listing data requires an executed agreement with the MLS or an approved aggregator."
        />
        <Card>
          <p className="text-[var(--text-muted)]">
            We will not scrape a portal or republish listing data without the rights to do so, so
            this stays switched off until a data agreement is in place. Financing questions do not
            have to wait on it.
          </p>
          <div className="mt-5">
            <ButtonLink href="/contact" variant="secondary">
              Talk about financing a property you have found
            </ButtonLink>
          </div>
        </Card>
      </Section>
    );
  }

  const provider = listings();
  const page = await provider.search({
    market: "FL",
    limit: 12,
    status: ["active", "coming_soon"]
  });
  const visible = page.items.filter((listing) => isDisplayable(listing, fixturesAllowed()));

  return (
    <Section>
      <SectionHeading as="h1" eyebrow="Properties" title="Property search" />
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        Data as of {new Date(page.dataAsOf).toLocaleString("en-US")}.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((listing) => (
          <Card as="li" key={`${listing.provider}:${listing.listingKey}`}>
            <p className="text-lg font-semibold text-[var(--text)]">
              {listing.listPriceCents === undefined
                ? "Price on request"
                : formatUsd(listing.listPriceCents)}
            </p>
            <p className="mt-1 text-sm text-[var(--text)]">
              {listing.address.line1}, {listing.address.city}, {listing.address.state}{" "}
              {listing.address.postalCode}
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {listing.bedrooms} bd · {listing.bathrooms} ba · {listing.livingAreaSqft} sq ft
            </p>
            {/* Attribution is required by the display agreement and is never omitted. */}
            <p className="mt-3 text-xs text-[var(--text-muted)]">{listing.attributionText}</p>
            {listing.modificationTimestamp !== undefined && (
              <p className="text-xs text-[var(--text-muted)]">
                Updated {new Date(listing.modificationTimestamp).toLocaleDateString("en-US")}
              </p>
            )}
          </Card>
        ))}
      </ul>
      {visible.length === 0 && (
        <Card>
          <p className="text-[var(--text-muted)]">
            No listings are available to display right now.
          </p>
        </Card>
      )}
      <Disclosure
        headline="Listing information comes from a third party."
        body="Availability, price, and details are supplied by the listing source and can change or be withdrawn without notice. Confirm anything material with the listing agent."
      />
    </Section>
  );
}
