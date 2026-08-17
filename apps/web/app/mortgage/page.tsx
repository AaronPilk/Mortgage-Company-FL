import type { Metadata } from "next";
import Link from "next/link";
import { Card, CtaPanel, Disclosure, Section, SectionHeading } from "@/components/ui";
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
    <>
      <Section orbs>
        <SectionHeading
          as="h1"
          eyebrow="Mortgage"
          title="Financing options, explained honestly"
          gradientWord="honestly"
          description="Each page covers what the option is, who it tends to fit, who should look elsewhere, and the variables that actually move your outcome."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((program) => (
            <Card as="li" key={program.slug} interactive className="!p-0">
              <Link href={`/mortgage/${program.slug}`} className="block h-full p-6">
                <h2 className="text-lg font-semibold text-[var(--text)]">{program.navLabel}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {program.description}
                </p>
                <span
                  aria-hidden="true"
                  className="mt-4 inline-block text-sm font-semibold"
                  style={{ color: "var(--purple)" }}
                >
                  Read more →
                </span>
              </Link>
            </Card>
          ))}
        </ul>
        <Disclosure
          headline="Availability depends on an approved lender path."
          body="We can only arrange financing through lenders with whom we hold an executed broker agreement covering that product. The pages above explain how each option works; whether it is available to you is part of the conversation."
        />
      </Section>

      <Section pad="tight" className="pb-16 sm:pb-24">
        <CtaPanel
          title="Not sure which one applies to you?"
          body="That is the normal starting point. Tell us what you're working on and a licensed mortgage professional will walk through the options that actually fit."
          primary={{
            href: "/contact",
            label: "Talk to a mortgage professional",
            cta: "mortgage-hub"
          }}
          secondary={{ href: "/calculators", label: "Run the numbers first" }}
        />
      </Section>
    </>
  );
}
