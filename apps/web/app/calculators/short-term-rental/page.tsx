import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { ShortTermRentalCalculator } from "@/components/calculators/short-term-rental-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Short-term rental calculator",
  description:
    "Nightly rate and occupancy against the mortgage, fees, taxes and insurance: cash flow, cap rate and coverage, next to a long-term lease on the same home.",
  path: "/calculators/short-term-rental"
});

export default function Page() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="Short-term rental or long-term tenant?"
        gradientWord="long-term tenant?"
        description="The same home, run both ways. Occupancy replaces vacancy, platform fees and cleaning get their own lines, and furnishing counts as cash in. Flip the toggle to see what a conventional lease on the same property would clear. It runs entirely in your browser."
      />
      <ShortTermRentalCalculator />
    </Section>
  );
}
