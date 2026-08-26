import type { Metadata } from "next";
import Link from "next/link";
import { Card, CtaPanel, Disclosure, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";

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
  },
  {
    href: "/calculators/amortization",
    title: "Amortization schedule",
    body: "How each payment splits between principal and interest over the life of the loan, and what an extra payment does to the payoff date."
  },
  {
    href: "/calculators/rate-impact",
    title: "Rate impact",
    body: "What a change in interest rate does to your monthly payment and the total interest you pay, side by side."
  },
  {
    href: "/calculators/debt-to-income",
    title: "Debt-to-income ratio",
    body: "Your front-end and back-end DTI from your income and monthly debts — the ratios underwriting actually checks."
  },
  {
    href: "/calculators/investment-property-cash-flow",
    title: "Investment property cash flow",
    body: "Rent against the mortgage, taxes, insurance, and expenses to see monthly cash flow and cap rate on a rental."
  },
  {
    href: "/calculators/dscr",
    title: "DSCR — rental coverage",
    body: "Whether a rental's income covers its debt: the debt-service-coverage ratio lenders use for investor loans."
  }
];

export default function CalculatorsIndexPage() {
  return (
    <>
      <Section orbs>
        <SectionHeading
          as="h1"
          eyebrow="Tools"
          title="Calculators that show their work"
          gradientWord="show their work"
          description="Every one of these runs entirely on your device. Nothing you type is sent anywhere, stored, or used to contact you."
        />
        {publicFeatures().homeLookup && (
          <Link
            href="/home-lookup"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 transition-colors hover:border-[var(--purple)]"
            style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
          >
            <span>
              <span className="block font-semibold" style={{ color: "var(--text)" }}>
                Have a specific home in mind?
              </span>
              <span className="block text-sm" style={{ color: "var(--text-muted)" }}>
                Paste its listing link and we&apos;ll pull the price, taxes, and payment for you.
              </span>
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--purple)" }}>
              Look up a home →
            </span>
          </Link>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATORS.map((calculator) => (
            <Card as="li" key={calculator.href} interactive className="!p-0">
              <Link href={calculator.href} className="block h-full p-6">
                <h2 className="text-lg font-semibold text-[var(--text)]">{calculator.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {calculator.body}
                </p>
                <span
                  aria-hidden="true"
                  className="mt-4 inline-block text-sm font-semibold"
                  style={{ color: "var(--purple)" }}
                >
                  Open calculator →
                </span>
              </Link>
            </Card>
          ))}
        </ul>
        <Disclosure
          headline="These are illustrations, not quotes."
          body="Results come from values you enter. They are not an offer of credit, a rate quote, a preapproval, or a statement that any lender will approve a scenario. Your actual figures come from a lender's Loan Estimate."
        />
      </Section>

      <Section pad="tight" className="pb-16 sm:pb-24">
        <CtaPanel
          title="Numbers are a starting point, not an answer"
          body="Once you have a range you like, a licensed mortgage professional can tell you what a lender will actually do with it. No application, no credit pull."
          primary={{
            href: "/contact",
            label: "Talk to a mortgage professional",
            cta: "calculators-hub"
          }}
        />
      </Section>
    </>
  );
}
