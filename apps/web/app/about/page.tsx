import type { Metadata } from "next";
import { Card, LicenseFact, Prose, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { businessIdentity } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About TRACT Mortgage",
  description: "Who we are, what we do, and the precise version of our story.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <Section width="narrow">
      <SectionHeading
        as="h1"
        eyebrow="About"
        title="A Florida mortgage brokerage, built deliberately"
        description="We would rather explain the tradeoff than win on a number."
      />
      <Prose>
        <h2>What we are</h2>
        <p>
          TRACT Mortgage is a mortgage brokerage serving Florida. We arrange financing with lenders;
          we do not make loans ourselves. In practice that means we compare options across lenders
          rather than fitting you to a single institution&rsquo;s product set.
        </p>

        <h2>Why the tools look like this</h2>
        <p>
          Most mortgage calculators show principal and interest and stop. In Florida that can
          understate the real payment by a third once taxes, homeowners insurance, wind coverage,
          and association dues are included. Ours break every component out, expose the assumptions,
          and run entirely in your browser so nothing you type is transmitted anywhere.
        </p>
        <p>
          We also do not publish a rate on this site. Pricing depends on credit profile,
          loan-to-value, property type, occupancy, loan amount, and lock period. A single number on
          a web page is an advertisement, not your rate, and we would rather show you real figures
          for your situation.
        </p>

        <h2>Our experience</h2>
        {/*
          The precise version of the story. Family experience is real and
          valuable, and it belongs to the people who earned it — it is not this
          company's track record and is never presented as such.
        */}
        <p>
          Dan brings roughly two decades in the mortgage industry. The technology, systems,
          automation, and measurement side of the business is built in-house rather than assembled
          from off-the-shelf parts.
        </p>
        <p>
          Between us we also have family with long careers in mortgage lending in North and South
          Carolina, and in title, real estate, and loan processing. That experience informs how we
          think. It is not this company&rsquo;s operating history, and we will not present it as
          though TRACT has been doing this for decades. TRACT is new. We would rather tell you that
          than pad a number.
        </p>

        <h2>What we will not do</h2>
        <ul>
          <li>Tell you that you are approved before a lender has said so</li>
          <li>Quote a rate before understanding your situation</li>
          <li>Pay for referrals or accept payment for sending business elsewhere</li>
          <li>
            Put your Social Security number, documents, or account details in a marketing system
          </li>
          <li>Publish a review, an award, or a statistic we cannot substantiate</li>
        </ul>
      </Prose>

      <Card className="mt-10">
        <h2 className="text-lg font-semibold text-purple-900">Licensing</h2>
        <div className="mt-4 space-y-2">
          <LicenseFact label="Company NMLS ID" value={businessIdentity.nmlsId} />
          <LicenseFact
            label="Florida mortgage broker license"
            value={businessIdentity.companyLicenseId}
          />
          <LicenseFact label="Principal loan originator" value={null} />
        </div>
        <p className="mt-4 text-sm text-muted">
          Where a value shows as pending, it has not yet been issued and confirmed on the public
          record. We do not display a licence number before it exists. Verify anything you see here
          on NMLS Consumer Access.
        </p>
      </Card>
    </Section>
  );
}
