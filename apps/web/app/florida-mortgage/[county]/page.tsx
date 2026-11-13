import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { COUNTIES, COUNTY_AS_OF, countyBySlug } from "@/lib/county-data";
import { citiesByCounty } from "@/lib/city-data";
import { DPA_AS_OF, DPA_PROGRAMS } from "@/lib/dpa-programs";
import { buildAreaTemplate } from "@/lib/area-report";
import { AreaReport } from "@/components/properties/area-report";
import { publicFeatures } from "@/lib/env";
import { pageMetadata } from "@/lib/metadata";

/**
 * County mortgage pages.
 *
 * One page per Florida county we serve, carrying real county-specific material —
 * the flood and insurance reality, the statutory homestead mechanics, and the
 * county's own assistance office — never a city name dropped into a template. No
 * page asserts a precise tax rate: those change yearly, so each points to the
 * county Property Appraiser (the primary source) for the exact number instead
 * (invariant 6). Only the slugs in the registry render; anything else is a 404.
 */

export function generateStaticParams() {
  return COUNTIES.map((entry) => ({ county: entry.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params
}: {
  params: Promise<{ county: string }>;
}): Promise<Metadata> {
  const { county } = await params;
  const data = countyBySlug(county);
  if (data === undefined) return {};
  return pageMetadata({
    title: `${data.county} Mortgages`,
    description: data.metaDescription,
    path: `/florida-mortgage/${data.slug}`
  });
}

export default async function CountyMortgagePage({
  params
}: {
  params: Promise<{ county: string }>;
}) {
  const { county } = await params;
  const data = countyBySlug(county);
  if (data === undefined) notFound();

  return (
    <Section width="narrow" orbs>
      <SectionHeading
        as="h1"
        eyebrow={data.region}
        title={`Buying a home in ${data.county}`}
        gradientWord={data.seat}
        description={`What actually shapes the cost of owning in ${data.county} — the insurance reality, how the tax bill really works, and the local help most buyers miss.`}
      />

      <Prose>
        <p>
          The loan is usually the ordinary part of buying in {data.seat} and the rest of{" "}
          {data.county}. What varies — and what moves the monthly payment more than the rate often
          does — is the carrying cost: insurance, flood exposure, and how the property tax resets
          after a sale. Here is what to check before you're under contract, and the local help worth
          asking about.
        </p>
      </Prose>

      <Card className="mt-8">
        <h2 className="text-xl font-bold text-[var(--text)]">Flood and insurance</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{data.floodNote}</p>
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
          Florida&apos;s homestead exemption takes up to $50,000 off the assessed value of a primary
          residence, and the Save Our Homes cap then limits how fast that assessed value can rise
          each year. The catch for buyers: when a home sells, the assessment resets toward market
          value, so the seller&apos;s current tax bill is usually a poor guide to yours. Budget from
          the reset, not the old bill.
        </p>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Millage rates are set by the county and its taxing districts and change year to year, so
          for the exact number confirm with the{" "}
          {data.appraiserUrl !== undefined ? (
            <a
              href={data.appraiserUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {data.appraiserName}
            </a>
          ) : (
            data.appraiserName
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
        <h2 className="text-xl font-bold text-[var(--text)]">Down-payment help in {data.county}</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{data.localAssistanceNote}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {data.localAssistanceUrl !== undefined && (
            <a
              href={data.localAssistanceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold underline"
              style={{ color: "var(--purple)" }}
            >
              {data.county} assistance (official) ↗
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

      {publicFeatures().aiSearch && (
        <AreaReport
          countySlug={data.slug}
          countyName={data.county}
          template={buildAreaTemplate(data)}
          figures={{
            floodExposure: data.floodExposure,
            cities: data.cities,
            appraiserName: data.appraiserName,
            appraiserUrl: data.appraiserUrl,
            dpa: DPA_PROGRAMS.map((program) => ({
              name: program.name,
              assistance: program.assistance,
              sourceLabel: program.sourceLabel,
              sourceUrl: program.sourceUrl
            })),
            dpaAsOf: DPA_AS_OF
          }}
        />
      )}

      {citiesByCounty(data.slug).length > 0 && (
        <Card className="mt-6">
          <h2 className="text-xl font-bold text-[var(--text)]">Cities in {data.county}</h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Where a city carries its own real material — its geography and flood reality, and the
            questions a buyer there should research — we publish a city page under the county.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {citiesByCounty(data.slug).map((city) => (
              <li key={city.slug}>
                <Link
                  href={`/florida-mortgage/${data.slug}/${city.slug}`}
                  className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--purple)] hover:text-[var(--purple)]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  {city.city}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div
        className="mt-8 rounded-2xl border p-6"
        style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
      >
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Want the real numbers for {data.seat}?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          A licensed loan officer who works {data.county} can pull the insurance and tax picture for
          a specific home and tell you what the monthly payment really looks like — before you make
          an offer.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/talk" variant="primary">
            Talk to a {data.seat} officer
          </ButtonLink>
          {/*
            Only counties with a matching /resources/buying-home-* article carry a
            city-guide link. Most do not, so the link renders only when the slug is
            set — otherwise it would resolve to a route that does not exist.
          */}
          {data.cityResourceSlug !== undefined && (
            <Link
              href={`/resources/${data.cityResourceSlug}`}
              className="self-center text-sm font-semibold underline"
              style={{ color: "var(--purple)" }}
            >
              Our {data.seat} buying guide
            </Link>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">Current as of {COUNTY_AS_OF}.</p>

      <Disclosure
        headline="General local education, not advice about a specific property or an offer of credit."
        body="Tax, insurance, flood, and program details are property-specific and change. Confirm anything here against the responsible county office, the current FEMA map, your insurance carrier, and the program's official source. Nothing here is a commitment to lend or a determination that you qualify; a licensed loan officer confirms your options."
      />
    </Section>
  );
}
