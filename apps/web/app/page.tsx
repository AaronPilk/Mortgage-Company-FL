import type { Metadata } from "next";
import Link from "next/link";
import {
  ButtonLink,
  Card,
  Disclosure,
  Eyebrow,
  Faq,
  FeatureStatus,
  LicenseFact,
  Section,
  SectionHeading
} from "@/components/ui";
import { PaymentCalculator } from "@/components/calculators/payment-calculator";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { businessIdentity } from "@/lib/site";
import { PROGRAMS } from "@/content/programs";
import { breadcrumbNode, graph, webPageNode } from "@tract/seo";
import { absoluteUrl } from "@tract/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "A clearer path from home search to mortgage plan",
  description:
    "A Florida mortgage brokerage. Compare financing paths with honest calculators, plain-language guides, and direct help from a licensed professional.",
  path: "/"
});

const SCENARIOS = [
  { href: "/mortgage/purchase", label: "I'm buying", detail: "First home, move-up, or relocation" },
  { href: "/mortgage/refinance", label: "I'm refinancing", detail: "Rate, term, or cash-out" },
  {
    href: "/mortgage/investment-property",
    label: "I'm investing",
    detail: "Rental or fix-and-flip"
  },
  {
    href: "/mortgage/self-employed",
    label: "I'm self-employed",
    detail: "1099, business owner, contractor"
  },
  { href: "/contact", label: "I'm not sure yet", detail: "Start with a conversation" }
];

const PROCESS = [
  {
    step: "01",
    heading: "Understand what actually drives your payment",
    body: "Before anyone talks about rates, you should know which variables move your number. In Florida, insurance and taxes frequently move it more than a quarter point of rate does."
  },
  {
    step: "02",
    heading: "Compare real options against your situation",
    body: "A broker works with multiple lenders. That only helps if someone walks you through the tradeoffs — mortgage insurance structure, term, cash to close — rather than handing you one number."
  },
  {
    step: "03",
    heading: "Move forward through a secure system",
    body: "When you're ready to apply, it happens in a secure application system built for it. Documents and sensitive information never belong in a web form."
  }
];

const HOME_FAQS = [
  {
    question: "Are you a lender?",
    answer:
      "No. We're a mortgage brokerage. We arrange financing with lenders; we don't make the loan ourselves. Practically, that means we compare options across lenders rather than fitting you to one institution's products."
  },
  {
    question: "Why don't you show today's rates?",
    answer:
      "Because a single number on a web page isn't your rate. Pricing depends on your credit profile, loan-to-value, property type, occupancy, loan amount, and lock period. We'd rather show you real figures for your situation than an advertisement."
  },
  {
    question: "Do your calculators pull my credit?",
    answer:
      "No. Every calculator on this site runs entirely in your browser using values you type in. Nothing is sent anywhere and no credit inquiry of any kind occurs."
  },
  {
    question: "What happens after I reach out?",
    answer:
      "A licensed mortgage professional contacts you to understand your situation. There's no application, no credit pull, and no obligation at that stage — it's a conversation about what your options actually are."
  }
];

export default function HomePage() {
  const features = publicFeatures();
  const url = absoluteUrl(SITE_URL, "/");

  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: "TRACT Mortgage — A Florida mortgage brokerage",
              description:
                "A Florida mortgage brokerage offering payment and affordability tools, plain-language guides, and direct help from a licensed professional."
            }),
            breadcrumbNode([{ name: "Home", url }])
          ],
          businessIdentity
        )}
      />

      {/* Hero. The company type is stated in the first screen, deliberately. */}
      <section className="border-b border-line bg-gradient-to-b from-purple-50 to-canvas">
        <div className="container-default py-16 sm:py-24">
          <div className="max-w-3xl">
            <Eyebrow>Florida mortgage brokerage</Eyebrow>
            <h1 className="text-4xl font-bold sm:text-6xl">
              A clearer path from home search to mortgage plan
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted sm:text-xl">
              We help Florida buyers and homeowners compare financing paths with tools that show
              their assumptions and guidance from someone who will tell you when a deal does not
              make sense.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" data-cta="hero-primary">
                Build my mortgage plan
              </ButtonLink>
              <ButtonLink href="/calculators" variant="secondary" data-cta="hero-secondary">
                Explore payment calculators
              </ButtonLink>
            </div>

            {/*
              Trust row. Only claims that are true today. No years in business, no
              loan volume, no review counts, no awards — those go here when they
              exist and can be substantiated.
            */}
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
              <li>Calculators run in your browser — nothing is sent anywhere</li>
              <li>No credit pull to start a conversation</li>
              <li>Every estimate shows the assumptions behind it</li>
            </ul>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="Start here"
          title="What are you working on?"
          description="Each path explains the mechanics, the variables that matter, and what to prepare."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <Card
              as="li"
              key={scenario.href}
              className="transition-shadow hover:shadow-[--shadow-float]"
            >
              <Link href={scenario.href} className="block">
                <h3 className="text-lg font-semibold text-purple-900">{scenario.label}</h3>
                <p className="mt-2 text-sm text-muted">{scenario.detail}</p>
              </Link>
            </Card>
          ))}
        </ul>
      </Section>

      <Section className="bg-white">
        <SectionHeading
          eyebrow="How this works"
          title="Three steps, in this order"
          description="Most people are shown a rate first. That is backwards."
        />
        <ol className="grid gap-6 lg:grid-cols-3">
          {PROCESS.map((item) => (
            <li key={item.step}>
              <span className="text-sm font-bold tracking-widest text-purple-600">{item.step}</span>
              <h3 className="mt-3 text-xl font-semibold">{item.heading}</h3>
              <p className="mt-3 text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="estimate">
        <SectionHeading
          eyebrow="Try it now"
          title="Estimate a monthly payment"
          description="Move the inputs and watch which line actually drives your payment. This runs entirely on your device."
        />
        <PaymentCalculator />
      </Section>

      <Section className="bg-white">
        <SectionHeading
          eyebrow="Loan programs"
          title="Understand your options before anyone quotes you"
          description="Each page covers who a program tends to fit, who should look elsewhere, and the tradeoff nobody mentions."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.slice(0, 9).map((program) => (
            <Card as="li" key={program.slug}>
              <Link href={`/mortgage/${program.slug}`} className="block">
                <h3 className="text-lg font-semibold text-purple-900">{program.navLabel}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{program.description}</p>
              </Link>
            </Card>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Eyebrow>TRACT Vision</Eyebrow>
            <h3 className="text-2xl font-semibold">Model a property before you commit</h3>
            <p className="mt-3 text-muted">
              A planning workspace for renovation, addition, rental, and flip scenarios. It shows
              every assumption and every source, separates what is known from what is estimated, and
              never hands you a single good-deal verdict.
            </p>
            <div className="mt-5">
              <FeatureStatus label="Status" status={features.vision ? "live" : "coming_soon"} />
            </div>
          </Card>
          <Card>
            <Eyebrow>For real estate agents</Eyebrow>
            <h3 className="text-2xl font-semibold">A financing partner who communicates</h3>
            <p className="mt-3 text-muted">
              Clear status updates, education your buyers can actually use, and tools that help you
              serve clients — built around service rather than anything that would resemble payment
              for referrals.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ButtonLink href="/partners/real-estate-agents" variant="secondary">
                See the partner page
              </ButtonLink>
              <FeatureStatus
                label="RendProp listing media"
                status={features.rendProp ? "live" : "coming_soon"}
              />
            </div>
          </Card>
        </div>
      </Section>

      <Section className="bg-white">
        <SectionHeading eyebrow="Common questions" title="Straight answers" />
        <Faq items={HOME_FAQS} />
      </Section>

      <Section>
        <Card className="bg-purple-950 text-white">
          <h2 className="text-3xl font-bold text-white">Ready for a real conversation?</h2>
          <p className="mt-3 max-w-2xl text-purple-100">
            Tell us what you are working on. A licensed mortgage professional will get back to you.
            No application, no credit pull, no obligation.
          </p>
          <div className="mt-6">
            <ButtonLink href="/contact" variant="secondary" data-cta="footer-consultation">
              Talk to a mortgage professional
            </ButtonLink>
          </div>
        </Card>
      </Section>

      <Section width="narrow" className="pt-0">
        <div className="space-y-2">
          <LicenseFact label="Company NMLS ID" value={businessIdentity.nmlsId} />
          <LicenseFact
            label="Florida mortgage broker license"
            value={businessIdentity.companyLicenseId}
          />
        </div>
        <Disclosure
          headline="Nothing on this page is an offer of credit."
          body="TRACT Mortgage is a mortgage brokerage. We arrange, but do not make, mortgage loans. Every figure shown here is an estimate based on values you entered and is not a rate quote, a preapproval, or a commitment to lend."
        />
      </Section>
    </>
  );
}
