import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { DebtToIncomeCalculator } from "@/components/calculators/debt-to-income-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Debt-to-income ratio calculator",
  description:
    "Work out your front-end and back-end debt-to-income ratios, see which one leaves less room, and read the 28 and 43 figures for what they are: reference points.",
  path: "/calculators/debt-to-income"
});

export default function Page() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="Both of your debt-to-income ratios"
        gradientWord="debt-to-income ratios"
        description="Front-end is housing over income. Back-end is everything over income. This shows both and which one is tighter. It runs entirely in your browser, with no credit inquiry of any kind."
      />
      <DebtToIncomeCalculator />
    </Section>
  );
}
