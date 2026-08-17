import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { AmortizationCalculator } from "@/components/calculators/amortization-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Amortization schedule calculator",
  description:
    "See how each payment splits between interest and principal, what the payoff month is, and what an extra principal payment removes from the loan.",
  path: "/calculators/amortization"
});

export default function Page() {
  return (
    <Section orbs width="wide">
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="Where every payment actually goes"
        gradientWord="actually goes"
        description="A full schedule from the numbers you enter, summarised by year and expandable to the month. It runs entirely in your browser — nothing you type is sent anywhere."
      />
      <AmortizationCalculator />
    </Section>
  );
}
