import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { RateImpactCalculator } from "@/components/calculators/rate-impact-calculator";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Rate impact calculator",
  description:
    "Price the same loan at up to four rates you choose and compare the monthly payment and lifetime interest against a base rate.",
  path: "/calculators/rate-impact"
});

export default function Page() {
  return (
    <Section orbs width="wide">
      <SectionHeading
        as="h1"
        eyebrow="Calculator"
        title="What a quarter point is worth"
        gradientWord="a quarter point"
        description="The same loan priced at rates you pick, side by side. Every rate here is a comparison figure you enter — none is quoted, offered, or available. It runs entirely in your browser."
      />
      <RateImpactCalculator />
    </Section>
  );
}
