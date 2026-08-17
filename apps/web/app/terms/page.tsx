import type { Metadata } from "next";
import { Prose, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Website terms",
  description: "The terms that govern use of this website.",
  path: "/terms"
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
      <p className="mb-4 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
        Draft. This page requires review by qualified counsel before launch.
      </p>
      <h1 className="text-4xl font-bold">Website terms</h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">Last updated 17 August 2026.</p>
      <div className="mt-8">
        <Prose>
          <h2>Nothing here is an offer of credit</h2>
          <p>
            TRACT Mortgage is a mortgage brokerage. We arrange, but do not make, mortgage loans.
            Nothing on this website is an offer of credit, a rate quote, a preapproval, a commitment
            to lend, or a statement that you qualify for any loan program.
          </p>
          <h2>Estimates are estimates</h2>
          <p>
            Calculators produce illustrations based on values you enter and assumptions you control.
            Actual terms depend on the lender, the loan program, the property, and a complete review
            of an application. Binding figures come from a lender in a Loan Estimate and Closing
            Disclosure.
          </p>
          <h2>Third-party information</h2>
          <p>
            Where we present property, hazard, zoning, permit, school, or market information from a
            third party, we show the source and the date. Such information can be incomplete or out
            of date and must be confirmed with the responsible authority.
          </p>
        </Prose>
      </div>
    </Section>
  );
}
