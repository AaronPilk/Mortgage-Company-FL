import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink, Card, CtaPanel, Disclosure, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { fixturesAllowed, listings } from "@/lib/listings";
import { createRequestClient } from "@/lib/supabase";
import {
  PAGE_SIZE,
  criteriaToQueryString,
  parseCriteria,
  propertiesHref
} from "@/components/properties/criteria";
import { toProviderInput } from "@/components/properties/criteria";
import { AccountNudgeBanner } from "@/components/properties/account-nudge";
import { AiSearch } from "@/components/properties/ai-search";
import { SaveSearchButton } from "@/components/properties/save-search-button";
import { GalleryPlaceholder } from "@/components/properties/gallery-placeholder";
import { ListingCard } from "@/components/properties/listing-card";
import { ListingPagination } from "@/components/properties/pagination";
import { SampleDataBanner } from "@/components/properties/sample-data-notice";
import { SearchFilters } from "@/components/properties/search-filters";
import { formatTimestamp } from "@/components/properties/listing-format";

export const metadata: Metadata = pageMetadata({
  title: "Property planning lab",
  description: "Explore synthetic Florida property examples and model the financing.",
  path: "/properties",
  imagePath: "/images/og/properties.png",
  noIndex: true
});

export const dynamic = "force-dynamic";

/**
 * Property search.
 *
 * The hero is one sentence and one field: describe the home, typed or spoken,
 * and the interpretation endpoint turns it into the same query string the
 * structured filters produce. Search state lives entirely in that query
 * string, so every result set is a URL somebody can send to a co-buyer or an
 * agent and get the same page back. The page is server-rendered from the URL;
 * there is no client-side search state to diverge from it, and the structured
 * filters remain a plain GET form behind a disclosure for anyone who wants
 * the dials.
 *
 * NO STRUCTURED DATA IS EMITTED HERE, DELIBERATELY.
 * ------------------------------------------------
 * The records on this page are fixtures. Real-estate structured data
 * (`RealEstateListing`, `Offer`, `Residence`, `Product`) is a machine-readable
 * assertion to a search engine that a thing exists, is for sale, and costs a
 * stated amount. Emitting it over invented records would be a false claim made
 * at scale to a party that cannot see the "sample data" banner a human reads —
 * invariant 6, and a straightforward misrepresentation besides.
 *
 * When a contracted provider replaces the fixture adapter, listing structured
 * data may be added here, gated on `provider.key !== "fixture"` and on the
 * display agreement actually permitting syndication of that field set. Until
 * then the correct amount of markup is none. The same rule governs the detail
 * page, which is where a listing node would normally live.
 *
 * Filter permutations are noindex for a second reason: a crawlable URL for every
 * combination of price, beds, and status is thin content at scale.
 */
export default async function PropertiesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const features = publicFeatures();
  const provider = listings();

  // A fixture provider outside development is the same situation as no provider
  // at all: there is nothing publishable to show. Invariant 6.
  const providerUnavailable =
    !features.propertySearch || provider.key === "disabled" || !fixturesAllowed();

  if (providerUnavailable) {
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

  // Accounts are an invitation on this page, never a gate: search, results,
  // and filters are identical signed in or out. The session read exists only
  // to decide which invitation to show.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const accountsConfigured =
    features.accounts && supabaseUrl !== undefined && anonKey !== undefined;
  const supabase = accountsConfigured ? await createRequestClient() : null;
  const userResult = supabase === null ? null : await supabase.auth.getUser();
  const signedIn = userResult?.error === null && userResult.data.user !== null;

  const { criteria, valid } = parseCriteria(await searchParams);
  const page = await provider.search(toProviderInput(criteria, { pageSize: PAGE_SIZE }));

  const firstIndex = (criteria.page - 1) * PAGE_SIZE;
  const rangeStart = page.items.length === 0 ? 0 : firstIndex + 1;
  const rangeEnd = firstIndex + page.items.length;
  const dataAsOf = formatTimestamp(page.dataAsOf);
  const anyFixture = page.items.some((listing) => listing.isFixture);

  return (
    <>
      <Section pad="head" orbs>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl tracking-[-0.02em] sm:text-6xl">
            Tell us what you&rsquo;re <span className="text-gradient">looking for</span>.
          </h1>
          <p
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Describe the home in your own words — place, price, beds. We turn it into a search, and
            every result links to the financing behind it.
          </p>
          <AiSearch
            signedIn={signedIn}
            accountsConfigured={accountsConfigured}
            supabaseUrl={supabaseUrl}
            anonKey={anonKey}
          />
        </div>
        <div className="mx-auto mt-12 max-w-3xl">
          <SampleDataBanner scope="search" />
        </div>
      </Section>

      <Section pad="tight">
        <SearchFilters criteria={criteria} />

        {!valid && (
          <p
            role="status"
            className="mt-4 text-sm font-medium"
            style={{ color: "var(--color-warning)" }}
          >
            Part of that link could not be read, so the filters it could not parse were ignored.
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3">
          <p aria-live="polite" className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            {page.totalCount === 0
              ? "No sample properties match"
              : `${page.totalCount} sample ${page.totalCount === 1 ? "property" : "properties"} match`}
            {page.totalCount > 0 && (
              <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-muted)" }}>
                showing {rangeStart}–{rangeEnd}
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {dataAsOf !== null && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Sample data as of {dataAsOf} ET
              </p>
            )}
            <SaveSearchButton
              // Keyed on the canonical search string so a filter change remounts
              // the button: "saved" describes one exact set of criteria, and it
              // must not survive client-side navigation to a different set.
              key={criteriaToQueryString(criteria)}
              signedIn={signedIn}
              search={criteriaToQueryString(criteria)}
              accountsConfigured={accountsConfigured}
              supabaseUrl={supabaseUrl}
              anonKey={anonKey}
            />
          </div>
        </div>

        {accountsConfigured && !signedIn && (
          <AccountNudgeBanner supabaseUrl={supabaseUrl} anonKey={anonKey} />
        )}

        {page.items.length > 0 ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.items.map((listing) => (
              <ListingCard
                key={`${listing.provider}:${listing.listingKey}`}
                listing={listing}
                showSave={accountsConfigured}
                supabaseUrl={supabaseUrl}
                anonKey={anonKey}
              />
            ))}
          </ul>
        ) : (
          <Card className="mt-6">
            <h2 className="text-xl font-semibold">Nothing matched those filters</h2>
            <p className="mt-3 text-[var(--text-muted)]">
              This is a small set of illustrative sample properties, so a narrow filter empties it
              quickly. Widening the price range or clearing the property type usually brings results
              back.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/properties" variant="secondary">
                Clear all filters
              </ButtonLink>
              <ButtonLink
                href={propertiesHref(criteria, {
                  minPrice: undefined,
                  maxPrice: undefined,
                  page: 1
                })}
                variant="ghost"
              >
                Keep the filters, drop the price range
              </ButtonLink>
            </div>
          </Card>
        )}

        <ListingPagination criteria={criteria} totalCount={page.totalCount} pageSize={PAGE_SIZE} />
      </Section>

      {page.items.length > 0 && (
        <Section pad="tight" tone="surface">
          <h2 className="text-2xl">About the images on these cards</h2>
          <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
            No photograph on this page is a listing photograph. These records are invented, so there
            is nothing to photograph. Some cards carry an image we generated ourselves to show what
            the layout looks like with one — it does not depict a building that exists, and it is
            labelled on the image itself as well as on the card. The rest carry a drawn placeholder.
          </p>
          <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
            Real listing photographs belong to the listing source and may only be shown under a data
            agreement, which is why no image is ever hotlinked from a portal here.
          </p>
          <div className="mt-8 grid max-w-4xl gap-8 sm:grid-cols-2">
            <figure className="m-0">
              <div className="relative">
                <Image
                  src="/images/properties/fixture-st-pete-bungalow-02.webp"
                  alt="Illustrative photograph of a bungalow porch and landscaping, generated for sample data"
                  width={1200}
                  height={1000}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="aspect-[6/5] w-full rounded-xl object-cover"
                />
                <span
                  className="absolute left-3 top-3 rounded-md border px-2 py-1 text-[0.7rem] font-bold uppercase tracking-wide"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--color-warning)",
                    color: "var(--text)"
                  }}
                >
                  Illustrative image — not a real property
                </span>
              </div>
              <figcaption className="mt-3 text-sm font-medium text-[var(--text-muted)]">
                A generated illustration, labelled where a reader will see it.
              </figcaption>
            </figure>
            <GalleryPlaceholder listingKey="search-example" />
          </div>
        </Section>
      )}

      <Section pad="tight">
        <CtaPanel
          title="Found something? Let's talk about the financing"
          body="Bring us a property you are looking at anywhere — these samples, a portal listing, or an off-market deal — and we will work through what financing it actually looks like. No credit pull, no application, no obligation."
          primary={{
            href: "/contact",
            label: "Talk to a mortgage professional",
            cta: "properties-search"
          }}
          secondary={{ href: "/calculators/mortgage-payment", label: "Estimate my payment" }}
        />
        {anyFixture && (
          <Disclosure
            headline="These properties are illustrative samples, not listings."
            body="Every record shown on this page was invented to demonstrate the search and the payment estimate. The addresses use reserved example street names, the prices and details are made up, and nothing here is available to buy. When a licensed listing feed is connected, this page will show real records with the attribution, status, and update timestamp that feed requires, and this notice will be replaced."
          />
        )}
      </Section>
    </>
  );
}
