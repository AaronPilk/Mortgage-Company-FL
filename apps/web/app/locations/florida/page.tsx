import type { Metadata } from "next";
import Link from "next/link";
import { Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
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
 * This is the only location page that exists. Per-city pages are deliberately
 * not generated from a template — a city-name substitution page has no local
 * value and is a scaled-content problem. County-level pages ship only when they
 * carry real county data and a named reviewer.
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

        <h2>Where to get the real numbers</h2>
        <ul>
          <li>Your county property appraiser, for assessed value and millage</li>
          <li>The Florida Department of Revenue, for homestead and portability rules</li>
          <li>FEMA&rsquo;s flood map service, for the current effective map and its date</li>
          <li>An insurance agent, for an actual premium quote on the specific property</li>
        </ul>
      </Prose>

      <Card className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Why there are no city pages here
        </h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          A page that swaps a city name into the same paragraphs helps nobody. When we publish
          county-level material it will carry that county&rsquo;s actual millage, insurance context,
          flood exposure, and program availability, with sources and a named reviewer — or it will
          not exist.
        </p>
      </Card>

      <Disclosure
        headline="This is general education about Florida, not advice about your property."
        body="Tax, insurance, flood, and association matters are property-specific and change. Confirm anything here against the responsible county office, the current FEMA map, your insurance carrier, and the association itself."
      />
    </Section>
  );
}
