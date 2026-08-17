import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { ClosingCostCalculator } from "@/components/calculators/closing-cost-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Cash to close calculator",
  description:
    "Down payment, closing costs, prepaid items, and credits — the number buyers are most often surprised by.",
  path: "/calculators/closing-cost"
});

export default function Page() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="How much cash do you actually need?"
        gradientWord="actually need"
        description="The down payment is only part of it. This itemizes everything you bring on closing day and everything credited back to you."
      />
      <ClosingCostCalculator />
    </Section>
  );
}
