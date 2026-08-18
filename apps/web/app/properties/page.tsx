import type { Metadata } from "next";
import Link from "next/link";
import { AssetImage } from "@/components/asset-image";
import { Badge, ButtonLink, Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { propertyMedia } from "@/content/property-media";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { demoListings } from "@/lib/listings";
import { formatUsd } from "@tract/mortgage-math";

export const metadata: Metadata = pageMetadata({
  title: "Property planning lab",
  description: "Explore synthetic Florida property examples and model the financing.",
  path: "/properties",
  imagePath: "/images/og/properties.png",
  noIndex: true
});

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const demoPage = await demoListings().search({
    market: "FL",
    limit: 20,
    status: ["active", "coming_soon", "pending"]
  });
  const liveSearchEnabled = publicFeatures().propertySearch;

  return (
    <>
      <Section pad="head" orbs>
        <SectionHeading
          as="h1"
          eyebrow="Property planning lab"
          title="Start with a property. Make every assumption visible."
          gradientWord="every assumption visible."
          description="These synthetic examples let you try the property-to-Vision workflow without an MLS account, a paid AI call, or a claim that the example is for sale."
        />
        <div className="flex flex-wrap gap-3">
          <Badge tone="warning">Demo catalog · not live listings</Badge>
          <Badge tone={liveSearchEnabled ? "success" : "neutral"}>
            Live search {liveSearchEnabled ? "configured" : "not connected"}
          </Badge>
        </div>
      </Section>

      <Section pad="tight">
        {!liveSearchEnabled && (
          <Card className="mb-8 border-[var(--purple)] bg-[var(--purple-subtle)]">
            <h2 className="text-lg font-semibold">Live property search remains off</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              TRACT will connect a live feed only after an executed data agreement defines display
              rights, attribution, refresh, and withdrawal rules. The cards below are a separate
              planning demo and are not stored or published as listings.
            </p>
          </Card>
        )}

        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {demoPage.items.map((listing) => {
            const primaryMedia = propertyMedia(listing.listingKey)[0];
            const address = [
              listing.address.line1,
              listing.address.city,
              listing.address.state,
              listing.address.postalCode
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <li key={listing.listingKey}>
                <Link
                  href={`/properties/${encodeURIComponent(listing.listingKey)}`}
                  className="group block h-full rounded-2xl focus-visible:outline-offset-4"
                  aria-label={`Open planning demo for ${address}`}
                >
                  <Card interactive className="h-full overflow-hidden p-0">
                    <div className="relative aspect-[8/5] overflow-hidden bg-[var(--surface-2)]">
                      {primaryMedia !== undefined && (
                        <AssetImage
                          src={primaryMedia.src}
                          alt={primaryMedia.alt}
                          width={primaryMedia.width}
                          height={primaryMedia.height}
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          fallbackLabel="Synthetic property preview unavailable"
                        />
                      )}
                      <div className="absolute left-4 top-4">
                        <Badge tone="warning">Synthetic example</Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-2xl font-bold text-[var(--text)]">
                        {listing.listPriceCents === undefined
                          ? "Price assumption needed"
                          : formatUsd(listing.listPriceCents)}
                      </p>
                      <h2 className="mt-2 text-base font-semibold text-[var(--text)]">{address}</h2>
                      <p className="mt-3 text-sm text-[var(--text-muted)]">
                        {[
                          listing.bedrooms === undefined ? null : `${listing.bedrooms} bd`,
                          listing.bathrooms === undefined ? null : `${listing.bathrooms} ba`,
                          listing.livingAreaSqft === undefined
                            ? null
                            : `${listing.livingAreaSqft.toLocaleString("en-US")} sq ft`,
                          listing.lotSizeAcres === undefined
                            ? null
                            : `${listing.lotSizeAcres} acres`
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
                        {listing.description}
                      </p>
                      <p className="mt-5 text-sm font-semibold text-[var(--purple)]">
                        Open planning details <span aria-hidden="true">→</span>
                      </p>
                      <p className="mt-4 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-muted)]">
                        {listing.attributionText}
                      </p>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section pad="tight" width="narrow">
        <Disclosure
          headline="A demo catalog, not a property feed."
          body="Every address, price, characteristic, image, renovation allowance, and value assumption on these cards is synthetic. Nothing is represented as available, accurate for a real parcel, or sourced from an MLS."
          excludes={[
            "Property availability or seller intent",
            "MLS status or broker attribution",
            "Appraisal, inspection, zoning, insurance, or construction conclusions"
          ]}
        />
        <div className="mt-8 text-center">
          <ButtonLink href="/contact" variant="secondary">
            Discuss a real property you found
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
