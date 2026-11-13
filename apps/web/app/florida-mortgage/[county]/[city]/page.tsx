import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { MarketDataWidget } from "@/components/market-data-widget";
import { CITIES, CITY_AS_OF, CITY_PAGES_INDEXABLE, cityByCountyAndSlug } from "@/lib/city-data";
import { countyBySlug } from "@/lib/county-data";
import { pageMetadata } from "@/lib/metadata";

/**
 * City mortgage pages.
 *
 * One page per Florida city we serve, nested under its county so the URL encodes
 * the parent relationship (/florida-mortgage/[county]/[city]) and never collides
 * with the 2-segment county route. Each page carries real, city-specific material
 * — the settlement's geography and its flood and wind reality, and the questions a
 * buyer there must research — never a county paragraph with a name swapped in. It
 * mirrors the county page deliberately, reusing its sourced homestead framing and
 * the parent county's appraiser and assistance rather than restating a figure.
 *
 * No page asserts a tax rate or a market figure: the exact tax number is deferred
 * to the parent county's Property Appraiser, and live market figures render only
 * through the flag-gated MarketDataWidget, which is dark today (invariant 6). The
 * pages ship noindex (CITY_PAGES_INDEXABLE) until a named reviewer verifies each
 * city's sources — docs/compliance/city-pages.md. Only the {county, city} pairs
 * in the data render; anything else is a 404 (dynamicParams = false).
 */

export function generateStaticParams() {
  // The full set of valid 3-segment pairs. With dynamicParams = false this makes
  // any other pair — including a real city under the wrong county — a 404.
  return CITIES.map((entry) => ({ county: entry.countySlug, city: entry.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params
}: {
  params: Promise<{ county: string; city: string }>;
}): Promise<Metadata> {
  const { county, city } = await params;
  const data = cityByCountyAndSlug(county, city);
  if (data === undefined) return {};
  return pageMetadata({
    title: data.metaTitle ?? `${data.city}, FL Mortgages & Home Buying`,
    description: data.metaDescription,
    path: `/florida-mortgage/${data.countySlug}/${data.slug}`,
    // Ships noindex; flips to indexable with the registry via one shared constant,
    // so the sitemap and the page meta can never disagree.
    noIndex: !CITY_PAGES_INDEXABLE
  });
}

export default async function CityMortgagePage({
  params
}: {
  params: Promise<{ county: string; city: string }>;
}) {
  const { county, city } = await params;
  const data = cityByCountyAndSlug(county, city);
  if (data === undefined) notFound();

  // The parent county carries the sourced tax and assistance material the city
  // page reuses. It is guaranteed to resolve by the unit test, but noUnchecked-
  // IndexedAccess types the lookup County | undefined, so it is guarded here too.
  const parent = countyBySlug(data.countySlug);
  if (parent === undefined) notFound();

  return (
    <Section width="narrow" orbs>
      <SectionHeading
        as="h1"
        eyebrow={parent.region}
        title={`Buying a home in ${data.city}`}
        gradientWord={data.city}
        description={`What actually shapes the cost of owning in ${data.city} — the insurance and flood reality, how the tax bill really works, and the local help most buyers miss.`}
      />

      <Prose>
        <p>{data.localIntro}</p>
        <p>
          The loan is usually the ordinary part of buying in {data.city}. What varies — and what
          moves the monthly payment more than the rate often does — is the carrying cost: insurance,
          flood exposure, and how the property tax resets after a sale. The seller&apos;s current
          tax bill is often a poor guide to yours, because the assessed value resets toward market
          value once the home changes hands. Budget from the reset, and price insurance on the
          specific home before you&apos;re under contract.
        </p>
        {data.neighborhoods !== undefined && (
          <p>Neighborhoods here include {data.neighborhoods.join(", ")}.</p>
        )}
      </Prose>

      <Card className="mt-8">
        <h2 className="text-xl font-bold text-[var(--text)]">Flood and insurance in {data.city}</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{data.floodContext}</p>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Flood is a separate policy from homeowners, and whether a lender requires it comes down to
          a determination against FEMA&apos;s current map for the exact property. More on both:{" "}
          <Link href="/resources/flood-zones-flood-insurance">flood zones and flood insurance</Link>{" "}
          and{" "}
          <Link href="/resources/florida-homeowners-insurance-mortgage">
            Florida homeowners insurance
          </Link>
          .
        </p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-bold text-[var(--text)]">Property taxes and homestead</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Florida&apos;s homestead exemption lowers the taxable value of a primary residence, and
          the Save Our Homes cap then limits how fast that assessed value can rise each year. The
          catch for buyers in {data.city}: when a home sells, the assessment resets toward market
          value, so the seller&apos;s current tax bill is usually a poor guide to yours. Budget from
          the reset, not the old bill.
        </p>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Millage rates are set by the county and its taxing districts and change year to year, so
          for the exact number confirm with the{" "}
          {parent.appraiserUrl !== undefined ? (
            <a
              href={parent.appraiserUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {parent.appraiserName}
            </a>
          ) : (
            parent.appraiserName
          )}
          . More on the mechanics:{" "}
          <Link href="/resources/homestead-exemption-florida">the homestead exemption</Link> and{" "}
          <Link href="/resources/florida-property-taxes-reset">
            how the tax bill resets after a sale
          </Link>
          .
        </p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-bold text-[var(--text)]">
          Questions to research before you buy in {data.city}
        </h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          These are property-specific and change, so the answer comes from the responsible source —
          a FEMA determination, an actual insurance quote, the county appraiser — not a rule of
          thumb. Ask them early.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--text-muted)]">
          {data.researchQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </Card>

      <MarketDataWidget cityName={data.city} />

      <Card className="mt-6">
        <h2 className="text-xl font-bold text-[var(--text)]">
          Down-payment help in {parent.county}
        </h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{parent.localAssistanceNote}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {parent.localAssistanceUrl !== undefined && (
            <a
              href={parent.localAssistanceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold underline"
              style={{ color: "var(--purple)" }}
            >
              {parent.county} assistance (official) ↗
            </a>
          )}
          <Link
            href="/florida-down-payment-assistance"
            className="text-sm font-semibold underline"
            style={{ color: "var(--purple)" }}
          >
            Statewide down-payment programs
          </Link>
        </div>
      </Card>

      <div
        className="mt-8 rounded-2xl border p-6"
        style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
      >
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Want the real numbers for {data.city}?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          A licensed loan officer who works {parent.county} can pull the insurance and tax picture
          for a specific home and tell you what the monthly payment really looks like — before you
          make an offer.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/talk" variant="primary">
            Talk to a {data.city} officer
          </ButtonLink>
          <Link
            href={`/florida-mortgage/${parent.slug}`}
            className="self-center text-sm font-semibold underline"
            style={{ color: "var(--purple)" }}
          >
            Buying in {parent.county}
          </Link>
          {/*
            Only cities with a matching /resources/buying-home-* article carry a
            guide link. The slug is set only where the article exists, so the link
            renders only then — it can never resolve to a route that does not exist.
          */}
          {data.resourceSlug !== undefined && (
            <Link
              href={`/resources/${data.resourceSlug}`}
              className="self-center text-sm font-semibold underline"
              style={{ color: "var(--purple)" }}
            >
              Our {data.city} buying guide
            </Link>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">Current as of {CITY_AS_OF}.</p>

      <Disclosure
        headline="General local education, not advice about a specific property or an offer of credit."
        body="Tax, insurance, flood, and program details are property-specific and change. Confirm anything here against the responsible county office, the current FEMA map, your insurance carrier, and the program's official source. Nothing here is a commitment to lend or a determination that you qualify; a licensed loan officer confirms your options. Wholesale Mortgage Lending arranges, but does not make, mortgage loans."
      />
    </Section>
  );
}
