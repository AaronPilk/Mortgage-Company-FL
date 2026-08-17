import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { InvestmentCashFlowCalculator } from "@/components/calculators/investment-cash-flow-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Investment property cash flow",
  description:
    "Rent less vacancy, operating expenses, and debt service — with monthly and annual cash flow, cash-on-cash return, and cap rate from the figures you enter.",
  path: "/calculators/investment-property-cash-flow"
});

export default function Page() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="What a rental actually clears"
        gradientWord="actually clears"
        description="Vacancy, management, maintenance, and a capital reserve are separate lines here, because leaving them out is what makes a property look better on paper than it is. It runs entirely in your browser."
      />
      <InvestmentCashFlowCalculator />
    </Section>
  );
}
