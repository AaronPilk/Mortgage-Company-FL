import type { Metadata } from "next";
import { Prose, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Disclosures",
  description: "Required disclosures about our role, our estimates, and our relationships.",
  path: "/disclosures"
});

/**
 * DRAFT — REQUIRES QUALIFIED REVIEW.
 *
 * This page states how the system is built, which is factual and useful. It is
 * NOT a substitute for the reviewed legal text that counsel must supply before
 * launch. See docs/compliance/launch-gates.md.
 */
export default function Page() {
  return (
    <Section width="narrow">
      <p className="mb-4 rounded-[--radius-sm] border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
        Draft. This page requires review by qualified counsel before launch.
      </p>
      <h1 className="text-4xl font-bold">Disclosures</h1>
      <p className="mt-3 text-sm text-muted">Last updated 17 August 2026.</p>
      <div className="mt-8">
        <Prose>
          <h2>We are a broker, not a lender</h2>
          <p>
            We arrange financing with lenders. We do not make the loan, we do not fund it, and we do
            not make the credit decision. The lender does.
          </p>
          <h2>Equal Housing Opportunity</h2>
          <p>
            We do not discriminate on the basis of race, colour, religion, sex, familial status,
            national origin, disability, or any other protected characteristic in any aspect of a
            credit transaction or in our marketing.
          </p>
          <h2>Affiliated business relationships</h2>
          <p>
            Where any affiliated business relationship exists, it will be disclosed to you in
            writing before you are referred, along with the estimated charges. You are never
            required to use an affiliated provider, and you will always be told when a relationship
            exists.
          </p>
          <h2>Rates</h2>
          <p>
            We do not publish rates on this website. Pricing depends on your credit profile,
            loan-to-value, property type, occupancy, loan amount, and lock period. Any advertised
            rate that omits those inputs is an advertisement, not a quote.
          </p>
        </Prose>
      </div>
    </Section>
  );
}
