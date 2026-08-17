import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { RentVsBuyCalculator } from "@/components/calculators/rent-vs-buy-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Rent versus buy calculator",
  description:
    "A cash-flow comparison over your horizon, with rent growth, appreciation, maintenance, and selling costs all under your control.",
  path: "/calculators/rent-vs-buy"
});

export default function Page() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="Rent or buy, on your assumptions"
        gradientWord="your assumptions"
        description="There is no verdict button here. The assumptions drive the answer, so they are all editable and all visible."
      />
      <RentVsBuyCalculator />
    </Section>
  );
}
