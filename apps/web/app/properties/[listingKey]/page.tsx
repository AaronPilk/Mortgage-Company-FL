import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isDisplayable } from "@tract/integrations";
import { formatUsd } from "@tract/mortgage-math";
import { Badge, ButtonLink, Card, CtaPanel, Disclosure, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { fixturesAllowed, listings } from "@/lib/listings";
import { ListingGallery } from "@/components/properties/listing-gallery";
import { SavePropertyButton } from "@/components/account/save-property-button";
import { createRequestClient } from "@/lib/supabase";
import { PaymentEstimatePanel } from "@/components/properties/payment-estimate-panel";
import { SampleDataBadge, SampleDataBanner } from "@/components/properties/sample-data-notice";
import {
  STATUS_LABEL,
  cityLine,
  formatCount,
  formatDaysOnMarket,
  formatLotSize,
  formatSqft,
  formatTimestamp,
  streetLine
} from "@/components/properties/listing-format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ listingKey: string }>;
}): Promise<Metadata> {
  const { listingKey } = await params;
  const listing = await listings().getByKey(decodeURIComponent(listingKey));

  // Every property detail path is noindex while the provider is a fixture. A
  // sample property must not become a search result.
  if (listing === null) {
    return pageMetadata({
      title: "Property not found",
      description: "",
      path: "/properties",
      noIndex: true
    });
  }

  return pageMetadata({
    title: `Sample property — ${streetLine(listing)}, ${cityLine(listing)}`,
    description:
      "An illustrative sample property used to demonstrate the property detail page and the payment estimate. Not an active listing.",
    path: `/properties/${listing.listingKey}`,
    noIndex: true
  });
}

/**
 * Property detail.
 *
 * NO STRUCTURED DATA IS EMITTED HERE, DELIBERATELY.
 * ------------------------------------------------
 * This is where a `RealEstateListing`, `Offer`, `Residence`, or `Product` node
 * would normally live, and it is exactly where it must not. The record is a
 * fixture: emitting listing markup would assert to a search engine that this
 * property exists, is for sale, and costs the stated amount. A crawler never
 * sees the sample-data banner a person reads, so the markup would be an
 * unqualified false claim — invariant 6, and a misrepresentation to third
 * parties besides.
 *
 * The illustration this page now renders changes nothing about that. An `image`
 * property on a listing node would make the false claim worse, not better: it
 * would attach a generated picture to an assertion that a specific building
 * exists and is for sale. The gate stays where it is.
 *
 * When a contracted provider replaces the fixture adapter, listing structured
 * data may be added, gated on `provider.key !== "fixture"` and on the display
 * agreement permitting syndication of those fields. `BreadcrumbList` is also
 * withheld for now because the page it describes is noindex.
 */
export default async function PropertyDetailPage({
  params
}: {
  params: Promise<{ listingKey: string }>;
}) {
  const features = publicFeatures();
  const provider = listings();

  if (!features.propertySearch || provider.key === "disabled" || !fixturesAllowed()) notFound();

  const { listingKey } = await params;
  const listing = await provider.getByKey(decodeURIComponent(listingKey));

  // A record outside the publicly displayable statuses is not "not found" by
  // accident — a withdrawn or closed record must disappear from public surfaces
  // promptly, and 404 is how that is enforced here.
  if (listing === null || !isDisplayable(listing, fixturesAllowed())) notFound();

  // Same account gating as the search grid, so a signed-in visitor can save the
  // home they're actually looking at — not only from the results list.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const accountsConfigured =
    features.accounts && supabaseUrl !== undefined && anonKey !== undefined;

  // Read the session so this listing connects to the signed-in borrower's world:
  // reflect whether they've already saved it, and offer a path to their loan.
  const supabase = accountsConfigured ? await createRequestClient() : null;
  const userResult = supabase === null ? null : await supabase.auth.getUser();
  const signedInUser = userResult?.error === null ? userResult.data.user : null;
  let alreadySaved = false;
  if (supabase !== null && signedInUser !== null) {
    const { data: savedRow } = await supabase
      .from("saved_properties")
      .select("id")
      .eq("owner_user_id", signedInUser.id)
      .eq("listing_key", listing.listingKey)
      .maybeSingle();
    alreadySaved = savedRow !== null;
  }

  const dataAsOf = formatTimestamp(await provider.dataAsOf());
  const updated = formatTimestamp(listing.modificationTimestamp);

  const facts: { label: string; value: string }[] = [
    { label: "Property type", value: listing.propertyType ?? "Not stated" },
    { label: "Status", value: STATUS_LABEL[listing.standardStatus] },
    { label: "Bedrooms", value: formatCount(listing.bedrooms, "bedroom", "bedrooms") ?? "—" },
    { label: "Bathrooms", value: formatCount(listing.bathrooms, "bathroom", "bathrooms") ?? "—" },
    { label: "Living area", value: formatSqft(listing.livingAreaSqft) ?? "—" },
    { label: "Lot size", value: formatLotSize(listing.lotSizeSqft) ?? "—" },
    {
      label: "Year built",
      value: listing.yearBuilt === undefined ? "—" : String(listing.yearBuilt)
    },
    { label: "Days on market", value: formatDaysOnMarket(listing.daysOnMarket) ?? "—" },
    {
      label: "Association dues",
      value:
        listing.monthlyHoaFeeCents === undefined
          ? "None stated"
          : `${formatUsd(listing.monthlyHoaFeeCents)} per month`
    },
    {
      label: "Annual property tax",
      value:
        listing.annualTaxAmountCents === undefined
          ? "Not stated"
          : formatUsd(listing.annualTaxAmountCents)
    },
    { label: "Listing key", value: listing.listingKey }
  ];

  // The hero's quiet meta row. Absent values are simply absent — the full facts
  // grid below is where an unknown is rendered as a dash and explained.
  const heroFacts = [
    formatCount(listing.bedrooms, "bed", "beds"),
    formatCount(listing.bathrooms, "bath", "baths"),
    formatSqft(listing.livingAreaSqft)
  ].filter((part): part is string => part !== null);

  return (
    <>
      <Section pad="head">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--purple)]">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/properties" className="hover:text-[var(--purple)]">
            Properties
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{streetLine(listing)}</span>
        </nav>

        <SampleDataBanner scope="detail" />

        <div className="mt-10 flex flex-wrap items-center gap-2">
          {listing.isFixture && <SampleDataBadge />}
          <Badge tone={listing.standardStatus === "active" ? "success" : "neutral"}>
            {STATUS_LABEL[listing.standardStatus]}
          </Badge>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div>
            <h1 className="text-3xl tracking-[-0.02em] sm:text-4xl">{streetLine(listing)}</h1>
            <p className="mt-2 text-lg" style={{ color: "var(--text-muted)" }}>
              {cityLine(listing)}
            </p>
            {heroFacts.length > 0 && (
              <p className="mt-3 text-sm font-medium" style={{ color: "var(--text)" }}>
                {heroFacts.join("  ·  ")}
              </p>
            )}
          </div>
          <p
            className="text-[2.75rem] font-semibold leading-none tracking-[-0.02em]"
            style={{ color: "var(--text)" }}
          >
            {listing.listPriceCents === undefined
              ? "Price on request"
              : formatUsd(listing.listPriceCents)}
          </p>
        </div>
      </Section>

      <Section pad="tight">
        <ListingGallery listing={listing} />
      </Section>

      <Section pad="tight">
        {/* On a phone the payment estimate and the primary calls to action are
            what the visitor came for; the full facts grid is reference they read
            after. `order` flips the two columns on mobile so the estimate and CTA
            sit right under the gallery, then restores facts-left / rail-right at
            lg. It is CSS only — the DOM order (facts first) is unchanged. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="order-2 space-y-8 lg:order-1">
            <Card>
              <h2 className="text-xl font-semibold">Property facts</h2>
              <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="border-b pb-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <dt
                      className="text-xs tracking-[0.06em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {fact.label}
                    </dt>
                    <dd className="mt-1.5 font-medium" style={{ color: "var(--text)" }}>
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
                A dash means the sample record does not carry that figure. It is shown as absent
                rather than as a zero, because an unknown value and a zero value are not the same
                thing.
              </p>
            </Card>

            {listing.description !== undefined && (
              <Card>
                <h2 className="text-xl font-semibold">Description</h2>
                <p className="mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {listing.description}
                </p>
              </Card>
            )}

            <Card>
              <h2 className="text-xl font-semibold">Source and freshness</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  {/* Attribution travels with the record and is never stripped for layout. */}
                  <dt className="font-semibold" style={{ color: "var(--text)" }}>
                    Attribution
                  </dt>
                  <dd style={{ color: "var(--text-muted)" }}>{listing.attributionText}</dd>
                </div>
                <div>
                  <dt className="font-semibold" style={{ color: "var(--text)" }}>
                    Provider
                  </dt>
                  <dd style={{ color: "var(--text-muted)" }}>
                    {listing.provider} ({listing.isFixture ? "sample records" : "licensed feed"})
                  </dd>
                </div>
                {updated !== null && (
                  <div>
                    <dt className="font-semibold" style={{ color: "var(--text)" }}>
                      Record last modified
                    </dt>
                    <dd style={{ color: "var(--text-muted)" }}>{updated} ET</dd>
                  </div>
                )}
                {dataAsOf !== null && (
                  <div>
                    <dt className="font-semibold" style={{ color: "var(--text)" }}>
                      Data as of
                    </dt>
                    <dd style={{ color: "var(--text-muted)" }}>{dataAsOf} ET</dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>

          {/* Sticky on desktop so the estimate and CTA follow the eye down the
              long facts column; static and first in the flow on mobile. */}
          <div className="order-1 space-y-6 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <PaymentEstimatePanel listing={listing} />

            <Card>
              <h2 className="text-lg font-semibold">Talk it through</h2>
              <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                The estimate above uses assumptions we picked. What you would actually pay depends
                on the rate you can get, the down payment you make, the insurance quote on the
                specific building, and the program you use. That takes a conversation.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {accountsConfigured && (
                  <SavePropertyButton
                    listingKey={listing.listingKey}
                    sourceMode={listing.isFixture ? "fixture" : "live"}
                    accountsConfigured={accountsConfigured}
                    supabaseUrl={supabaseUrl}
                    anonKey={anonKey}
                    initiallySaved={alreadySaved}
                  />
                )}
                {signedInUser !== null && features.tract && (
                  <ButtonLink href="/loan" variant="secondary">
                    Go to your loan
                  </ButtonLink>
                )}
                <ButtonLink href="/contact" data-cta={`property-detail-${listing.listingKey}`}>
                  Talk to a mortgage professional
                </ButtonLink>
                <ButtonLink href="/calculators/mortgage-payment" variant="secondary">
                  Estimate my payment
                </ButtonLink>
                <ButtonLink href="/properties" variant="ghost">
                  Back to search
                </ButtonLink>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      <Section pad="tight">
        <CtaPanel
          title="Financing questions do not need a listing"
          body="Whether it is this sample, a property you found elsewhere, or something not on the market yet, we will work through what financing it looks like before you write an offer."
          primary={{
            href: "/contact",
            label: "Talk to a mortgage professional",
            cta: "property-detail"
          }}
          secondary={{ href: "/calculators/mortgage-payment", label: "Estimate my payment" }}
        />
        <Disclosure
          headline="This property is an illustrative sample, not a listing."
          body="This record was invented to demonstrate how a property detail page works. The address uses a reserved example street name, and the price, facts, and description are made up. It is not for sale, it does not exist, and none of it comes from an MLS, a public record, or a listing portal. Wholesale Mortgage Lending is a mortgage brokerage and arranges, but does not make, mortgage loans. Nothing here is a rate quote, a preapproval, or a commitment to lend."
        />
      </Section>
    </>
  );
}
