import type { Metadata } from "next";
import Link from "next/link";
import { Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { COUNTIES } from "@/lib/county-data";
import { CITIES } from "@/lib/city-data";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Mortgages in Florida",
  description:
    "What makes financing a Florida home different: insurance, flood exposure, property taxes, homestead, and condo project review.",
  path: "/locations/florida"
});

/**
 * Florida overview.
 *
 * The county and city pages branch off from here. A city page exists only where
 * it carries its own real material — the settlement's geography and flood reality
 * and the questions a buyer there must research — never a county paragraph with a
 * city name swapped in; a name-substitution page still does not qualify, which is
 * the earlier "no city pages" decision honoured rather than reversed. City pages
 * ship noindex until a named reviewer verifies each city's sources (see
 * docs/compliance/city-pages.md), so they are linked here but not yet in the
 * sitemap.
 */
export default function FloridaPage() {
  return (
    <Section width="narrow" orbs>
      <SectionHeading
        as="h1"
        eyebrow="Florida"
        title="What makes a Florida mortgage different"
        gradientWord="different"
        description="The loan is usually the ordinary part. The carrying cost is where Florida diverges."
      />
      <Prose>
        <h2>Insurance is frequently the deciding variable</h2>
        <p>
          Homeowners and wind premiums vary enormously by county, construction type, roof age, and
          carrier. A premium assumption that is off by a few thousand dollars a year moves the
          qualifying payment by hundreds of dollars a month. Get an actual quote early — before you
          are under contract, if you can — rather than working from a rule of thumb.
        </p>

        <h2>Flood exposure is a separate question</h2>
        <p>
          Flood is not covered by a standard homeowners policy. Whether a lender requires flood
          insurance depends on a determination against FEMA&rsquo;s current map for the specific
          property. Maps have effective dates and are revised; a neighbour&rsquo;s answer is not
          your answer.
        </p>

        <h2>Property taxes, homestead, and portability</h2>
        <p>
          Millage varies by county and taxing district. A homestead exemption and the assessment cap
          that comes with it change the ongoing cost meaningfully for a primary residence, and
          portability can carry a benefit from a prior Florida homestead. Note that the
          seller&rsquo;s current tax bill is often a poor predictor of yours, because the assessment
          can reset after a sale.
        </p>

        <h2>Condo financing depends on the building</h2>
        <p>
          For a condo, the lender underwrites the association as well as you: reserves, budget,
          insurance, delinquencies, litigation, and the status of any required structural
          inspection. A perfectly qualified buyer can be declined because of the project. Ask for
          the association documents at the start of your inspection period, not the end.{" "}
          <Link href="/mortgage/condo">More on condo financing</Link>.
        </p>

        <h2>Help with the down payment</h2>
        <p>
          The down payment is the wall most first-time buyers hit, and Florida runs real programs
          that help — Hometown Heroes, Florida Assist, and FL HLP statewide, plus county and city
          programs on top. See{" "}
          <Link href="/florida-down-payment-assistance">Florida down payment assistance</Link> for
          what each offers, who it&rsquo;s for, and a quick finder for which ones are worth asking
          about.
        </p>

        <h2>Where to get the real numbers</h2>
        <ul>
          <li>Your county property appraiser, for assessed value and millage</li>
          <li>The Florida Department of Revenue, for homestead and portability rules</li>
          <li>FEMA&rsquo;s flood map service, for the current effective map and its date</li>
          <li>An insurance agent, for an actual premium quote on the specific property</li>
        </ul>
      </Prose>

      <Card className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--text)]">By county</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Where it carries real, county-specific material — the flood and insurance reality, how the
          tax bill resets, and the county&rsquo;s own assistance — we publish it. A page that only
          swaps a city name into the same paragraphs still does not qualify.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {COUNTIES.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/florida-mortgage/${entry.slug}`}
                className="text-sm font-semibold underline"
                style={{ color: "var(--purple)" }}
              >
                {entry.county} ({entry.seat})
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-[var(--text)]">By city</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          City pages sit under their county and carry the settlement&rsquo;s own geography and flood
          reality, plus the questions a buyer there should research. They ship noindex until a named
          reviewer verifies each city&rsquo;s sources, so they are linked here but not yet in the
          sitemap.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {CITIES.map((entry) => {
            const county = COUNTIES.find((item) => item.slug === entry.countySlug);
            return (
              <li key={`${entry.countySlug}/${entry.slug}`}>
                <Link
                  href={`/florida-mortgage/${entry.countySlug}/${entry.slug}`}
                  className="text-sm font-semibold underline"
                  style={{ color: "var(--purple)" }}
                >
                  {entry.city}
                </Link>
                {county !== undefined && (
                  <span className="text-sm text-[var(--text-muted)]"> — {county.county}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Disclosure
        headline="This is general education about Florida, not advice about your property."
        body="Tax, insurance, flood, and association matters are property-specific and change. Confirm anything here against the responsible county office, the current FEMA map, your insurance carrier, and the association itself."
      />
    </Section>
  );
}
