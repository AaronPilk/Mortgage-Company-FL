import type { Metadata } from "next";
import Link from "next/link";
import { Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { PROGRAMS } from "@/content/programs";

export const metadata: Metadata = pageMetadata({
  title: "Mortgage options in Florida",
  description:
    "Purchase, refinance, and program-specific financing explained in plain language, with the tradeoffs that usually go unmentioned.",
  path: "/mortgage"
});

export default function MortgageIndexPage() {
  return (
    <Section>
      <SectionHeading
        as="h1"
        eyebrow="Mortgage"
        title="Financing options, explained honestly"
        description="Each page covers what the option is, who it tends to fit, who should look elsewhere, and the variables that actually move your outcome."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROGRAMS.map((program) => (
          <Card as="li" key={program.slug}>
            <Link href={`/mortgage/${program.slug}`} className="block">
              <h2 className="text-lg font-semibold text-purple-900">{program.navLabel}</h2>
              <p className="mt-2 text-sm text-muted">{program.description}</p>
            </Link>
          </Card>
        ))}
      </ul>
      <Disclosure
        headline="Availability depends on an approved lender path."
        body="We can only arrange financing through lenders with whom we hold an executed broker agreement covering that product. The pages above explain how each option works; whether it is available to you is part of the conversation."
      />
    </Section>
  );
}
