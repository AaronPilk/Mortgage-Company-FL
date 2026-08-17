import type { Metadata } from "next";
import Link from "next/link";
import { Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Mortgage calculators",
  description:
    "Payment, affordability, refinance break-even, rent versus buy, and closing costs. Every calculator runs in your browser and shows its assumptions.",
  path: "/calculators"
});

const CALCULATORS = [
  {
    href: "/calculators/mortgage-payment",
    title: "Monthly payment",
    body: "Principal, interest, taxes, insurance, HOA, and mortgage insurance — broken out so you can see which line is driving the number."
  },
  {
    href: "/calculators/affordability",
    title: "Affordability range",
    body: "What debt-to-income ratios imply about a purchase price, with both ratio limits visible and adjustable."
  },
  {
    href: "/calculators/refinance-break-even",
    title: "Refinance break-even",
    body: "How many months until a refinance pays for itself, and what a longer term does to total interest."
  },
  {
    href: "/calculators/rent-vs-buy",
    title: "Rent versus buy",
    body: "A cash-flow comparison over your horizon, with rent growth, appreciation, maintenance, and selling costs all under your control."
  },
  {
    href: "/calculators/closing-cost",
    title: "Cash to close",
    body: "Down payment, closing costs, prepaid items, and credits — the number people are most often surprised by."
  }
];

export default function CalculatorsIndexPage() {
  return (
    <Section>
      <SectionHeading
        as="h1"
        eyebrow="Tools"
        title="Calculators that show their work"
        description="Every one of these runs entirely on your device. Nothing you type is sent anywhere, stored, or used to contact you."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CALCULATORS.map((calculator) => (
          <Card as="li" key={calculator.href}>
            <Link href={calculator.href} className="block">
              <h2 className="text-lg font-semibold text-purple-900">{calculator.title}</h2>
              <p className="mt-2 text-sm text-muted">{calculator.body}</p>
            </Link>
          </Card>
        ))}
      </ul>
      <Disclosure
        headline="These are illustrations, not quotes."
        body="Results come from values you enter. They are not an offer of credit, a rate quote, a preapproval, or a statement that any lender will approve a scenario. Your actual figures come from a lender's Loan Estimate."
      />
    </Section>
  );
}
