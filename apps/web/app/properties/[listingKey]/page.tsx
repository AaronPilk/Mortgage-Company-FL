import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetImage } from "@/components/asset-image";
import { SavePropertyButton } from "@/components/account/save-property-button";
import { Badge, ButtonLink, Card, Disclosure, Section } from "@/components/ui";
import { propertyMedia } from "@/content/property-media";
import { demoListings } from "@/lib/listings";
import { pageMetadata } from "@/lib/metadata";
import { formatRate, formatUsd, visionPlanningPreview } from "@tract/mortgage-math";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ listingKey: string }>;
}): Promise<Metadata> {
  const { listingKey } = await params;
  const listing = await demoListings().getByKey(listingKey);
  if (listing === null) return {};
  return pageMetadata({
    title: `${listing.address.city ?? "Florida"} property planning demo`,
    description: "Review a synthetic property example and send its assumptions into TRACT Vision.",
    path: `/properties/${listing.listingKey}`,
    noIndex: true
  });
}

export default async function PropertyDemoPage({
  params
}: {
  params: Promise<{ listingKey: string }>;
}) {
  const { listingKey } = await params;
  const listing = await demoListings().getByKey(listingKey);
  if (listing === null || !listing.isFixture || listing.demoPlanningSeed === undefined) notFound();

  const seed = listing.demoPlanningSeed;
  const media = propertyMedia(listing.listingKey);
  const price = listing.listPriceCents ?? 0;
  const preview = visionPlanningPreview({
    purchasePriceCents: price,
    downPaymentCents: Math.round(price * 0.2),
    annualRateBasisPoints: 650,
    termMonths: 360,
    annualPropertyTaxCents: seed.annualPropertyTaxCents,
    annualInsuranceCents: seed.annualInsuranceCents,
    monthlyHoaCents: seed.monthlyHoaCents,
    acquisitionCostsCents: Math.round(price * 0.03),
    improvementBudgetCents: seed.improvementBudgetCents,
    contingencyRateBasisPoints: 1_000,
    expectedAfterImprovementValueCents: seed.expectedAfterImprovementValueCents,
    costRangeBasisPoints: 1_500,
    valueRangeBasisPoints: 500
  });
  const address = [
    listing.address.line1,
    listing.address.city,
    listing.address.state,
    listing.address.postalCode
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Section pad="tight" width="wide">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div data-testid="property-gallery">
            <div className="relative aspect-[8/5] overflow-hidden rounded-3xl bg-[var(--surface-2)] shadow-[var(--shadow-card)]">
              {media[0] !== undefined && (
                <AssetImage
                  src={media[0].src}
                  alt={media[0].alt}
                  width={media[0].width}
                  height={media[0].height}
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  fallbackLabel="Synthetic property preview unavailable"
                />
              )}
            </div>
            {media.length > 1 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {media.slice(1).map((item) => (
                  <div
                    key={item.src}
                    className="aspect-[6/5] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]"
                  >
                    <AssetImage
                      src={item.src}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      sizes="(max-width: 640px) 50vw, 28vw"
                      fallbackLabel="Gallery view unavailable"
                    />
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {media.length} generated {media.length === 1 ? "view" : "views"} · Synthetic fixture
              media
            </p>
          </div>
          <div>
            <Badge tone="warning">Synthetic planning example · not for sale</Badge>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">{address}</h1>
            <p className="mt-4 text-3xl font-bold text-[var(--purple)]">{formatUsd(price)}</p>
            <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">{listing.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {listing.bedrooms !== undefined && (
                <div>
                  <dt className="text-[var(--text-muted)]">Bedrooms</dt>
                  <dd className="mt-1 font-semibold">{listing.bedrooms}</dd>
                </div>
              )}
              {listing.bathrooms !== undefined && (
                <div>
                  <dt className="text-[var(--text-muted)]">Bathrooms</dt>
                  <dd className="mt-1 font-semibold">{listing.bathrooms}</dd>
                </div>
              )}
              {listing.livingAreaSqft !== undefined && (
                <div>
                  <dt className="text-[var(--text-muted)]">Living area</dt>
                  <dd className="mt-1 font-semibold">
                    {listing.livingAreaSqft.toLocaleString("en-US")} sq ft
                  </dd>
                </div>
              )}
              {listing.lotSizeAcres !== undefined && (
                <div>
                  <dt className="text-[var(--text-muted)]">Lot assumption</dt>
                  <dd className="mt-1 font-semibold">{listing.lotSizeAcres} acres</dd>
                </div>
              )}
              {listing.yearBuilt !== undefined && (
                <div>
                  <dt className="text-[var(--text-muted)]">Year-built assumption</dt>
                  <dd className="mt-1 font-semibold">{listing.yearBuilt}</dd>
                </div>
              )}
            </dl>
            <div className="mt-8 flex flex-wrap items-start gap-3">
              <ButtonLink href={`/vision?property=${encodeURIComponent(listing.listingKey)}`}>
                Model this example in Vision
              </ButtonLink>
              <SavePropertyButton listingKey={listing.listingKey} sourceMode="fixture" />
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface" pad="tight">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <p className="text-sm font-semibold text-[var(--purple)]">Illustrative payment</p>
            <p className="mt-3 text-3xl font-bold">
              {formatUsd(preview.monthlyHousing.totalMonthlyCents)}
              <span className="text-base font-normal text-[var(--text-muted)]"> / month</span>
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Uses 20% down, a 30-year term, and an editable {formatRate(650)} planning-rate input.
              It is not a current rate or quote.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-[var(--purple)]">Improvement assumption</p>
            <p className="mt-3 text-3xl font-bold">{formatUsd(seed.improvementBudgetCents)}</p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Before contingency and range analysis. Change this in Vision to match your own early
              planning.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-[var(--purple)]">Value assumption</p>
            <p className="mt-3 text-3xl font-bold">
              {formatUsd(seed.expectedAfterImprovementValueCents)}
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              A synthetic input for exercising the tool—not an appraisal, comparable sale, or
              predicted outcome.
            </p>
          </Card>
        </div>
      </Section>

      <Section width="narrow" pad="tight">
        <h2 className="text-3xl font-bold">Planning prompts</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {listing.highlights?.map((highlight) => (
            <li key={highlight} className="rounded-xl border border-[var(--border)] p-4 text-sm">
              {highlight}
            </li>
          ))}
        </ul>
        <Disclosure
          headline="Everything on this page is synthetic."
          body={`${listing.attributionText} The image is ${listing.primaryImage?.attribution ?? "a local planning illustration"} Values are editable assumptions used only to demonstrate deterministic calculations.`}
          excludes={[
            "Availability, ownership, or seller intent",
            "Actual tax, insurance, HOA, construction, rent, or value data",
            "Appraisal, inspection, permit, zoning, or financing conclusions"
          ]}
        />
      </Section>
    </>
  );
}
