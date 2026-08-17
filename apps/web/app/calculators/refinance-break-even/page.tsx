import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { RefinanceCalculator } from "@/components/calculators/refinance-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Refinance break-even calculator",
  description:
    "How many months until a refinance pays for itself, and what a longer term does to the total interest you pay.",
  path: "/calculators/refinance-break-even"
});

export default function Page() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="Is a refinance worth the cost?"
        gradientWord="worth the cost"
        description="Break-even is the honest test. A lower payment achieved by restarting a thirty-year term can cost more overall, so both figures are shown."
      />
      <RefinanceCalculator />
    </Section>
  );
}
