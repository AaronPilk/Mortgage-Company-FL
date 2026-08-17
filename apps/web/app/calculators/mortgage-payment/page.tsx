import type { Metadata } from "next";
import { Prose, Section, SectionHeading } from "@/components/ui";
import { PaymentCalculator } from "@/components/calculators/payment-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Mortgage payment calculator",
  description:
    "Estimate a full monthly housing payment including taxes, insurance, HOA, and mortgage insurance. Runs entirely in your browser.",
  path: "/calculators/mortgage-payment"
});

export default function PaymentCalculatorPage() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="Estimate a monthly payment"
        gradientWord="monthly payment"
        description="Most calculators show principal and interest and stop there. In Florida that can understate the real payment by a third or more."
      />
      <PaymentCalculator />
      <div className="mt-14">
        <Prose>
          <h2>How this is calculated</h2>
          <p>
            Principal and interest use the standard amortization formula on the loan amount, the
            rate you entered, and the term you selected. Taxes and insurance are annual figures
            divided by twelve. HOA is taken as entered. Mortgage insurance, when it applies, is the
            annual rate you supplied applied to the loan amount and divided by twelve.
          </p>
          <p>
            Every amount is computed in whole cents and rounded once, at presentation. That sounds
            pedantic, but accumulating floating-point dollars across a 360-month schedule produces
            visible drift, and a payment figure that does not reconcile is not worth showing.
          </p>
          <h2>What this does not include</h2>
          <ul>
            <li>Utilities, maintenance, and reserves for future repairs</li>
            <li>Flood insurance, unless you added it into the insurance figure</li>
            <li>Any lender fee that is not expressed as a rate on the loan amount</li>
            <li>Income tax treatment, which is individual</li>
          </ul>
          <h2>Where to get real numbers</h2>
          <p>
            For property tax, your county property appraiser publishes the assessed value and
            millage. For insurance, get an actual quote early — Florida premiums vary sharply by
            county, construction type, roof age, and carrier, and an assumed premium can move your
            qualifying payment materially. For the rate and mortgage insurance, those come from a
            lender after a review of your situation.
          </p>
        </Prose>
      </div>
    </Section>
  );
}
