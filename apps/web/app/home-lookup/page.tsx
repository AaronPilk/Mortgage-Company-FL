import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section, SectionHeading } from "@/components/ui";
import { HomeLookupExperience } from "@/components/home-lookup/home-lookup";
import { homeLookupAvailable } from "@/lib/property";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Look up a home",
  description:
    "Paste a listing link or an address to pull a home's record and estimate the payment, cash to close, and whether it fits.",
  path: "/home-lookup",
  noIndex: true
});

export const dynamic = "force-dynamic";

export default function HomeLookupPage() {
  // Dark until a property-data provider is configured; fixture data serves only
  // where homeLookupAvailable() allows it, and is labelled in the response.
  if (!homeLookupAvailable()) notFound();

  return (
    <Section width="wide">
      <SectionHeading
        as="h1"
        eyebrow="Home lookup"
        title="Paste a listing. See if it works."
        description="Drop in a link to any home you're eyeing and we'll pull its record, estimate the monthly payment and cash to close, and show whether it fits — before you fill out a single thing."
      />
      <HomeLookupExperience />
      <p
        className="mt-10 border-t pt-6 text-sm"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        Estimates only, from public records and standard assumptions — not an offer of credit, a
        rate quote, or a pre-approval. A licensed loan officer confirms the real numbers.
      </p>
    </Section>
  );
}
