import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { DscrCalculator } from "@/components/calculators/dscr-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "DSCR calculator",
  description:
    "Compare gross rent against full PITIA to get a debt service coverage ratio, alongside how the ratio is commonly described in the market.",
  path: "/calculators/dscr"
});

export default function Page() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="Does the rent cover the payment?"
        gradientWord="cover the payment"
        description="Debt service coverage is gross rent divided by principal, interest, taxes, insurance, and association dues. The reference bands shown are general market description, not TRACT underwriting. It runs entirely in your browser."
      />
      <DscrCalculator />
    </Section>
  );
}
