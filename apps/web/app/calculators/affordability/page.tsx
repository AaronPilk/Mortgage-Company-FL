import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { AffordabilityCalculator } from "@/components/calculators/affordability-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Affordability calculator",
  description:
    "See what debt-to-income ratios imply about a purchase price, with both ratio limits visible and adjustable.",
  path: "/calculators/affordability"
});

export default function Page() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="What could you comfortably carry?"
        gradientWord="comfortably carry"
        description="This shows what a set of ratios implies. It is an illustration of arithmetic, not a preapproval, and it does not evaluate your credit."
      />
      <AffordabilityCalculator />
    </Section>
  );
}
