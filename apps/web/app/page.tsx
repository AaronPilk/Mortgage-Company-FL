import type { Metadata } from "next";
import Link from "next/link";
import {
  Badge,
  ButtonLink,
  Card,
  CtaPanel,
  Disclosure,
  Eyebrow,
  Faq,
  FeatureStatus,
  LicenseFact,
  Orbs,
  Section,
  SectionHeading
} from "@/components/ui";
import { PaymentCalculator } from "@/components/calculators/payment-calculator";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { SITE_URL, businessIdentity } from "@/lib/site";
import { PROGRAMS } from "@/content/programs";
import { absoluteUrl, breadcrumbNode, graph, webPageNode } from "@tract/seo";

export const metadata: Metadata = pageMetadata({
  title: "A clearer path from home search to mortgage plan",
  description:
    "A Florida mortgage brokerage. Compare financing paths with honest calculators, plain-language guides, and direct help from a licensed professional.",
  path: "/"
});

const SCENARIOS = [
  {
    href: "/mortgage/purchase",
    label: "I'm buying",
    detail: "First home, move-up, or relocating to Florida",
    icon: "M4 9.5 12 4l8 5.5V20H4V9.5Z"
  },
  {
    href: "/mortgage/refinance",
    label: "I'm refinancing",
    detail: "Lower the rate, change the term, or pull cash out",
    icon: "M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"
  },
  {
    href: "/mortgage/investment-property",
    label: "I'm investing",
    detail: "Rental cash flow or a fix-and-flip scenario",
    icon: "M4 19V9m5 10V5m5 14v-7m5 7V8"
  },
  {
    href: "/mortgage/self-employed",
    label: "I'm self-employed",
    detail: "1099, business owner, or contractor income",
    icon: "M4 8h16v12H4zM9 8V6a3 3 0 0 1 6 0v2"
  },
  {
    href: "/contact",
    label: "I'm not sure yet",
    detail: "Start with a conversation, not a form",
    icon: "M9.1 9a3 3 0 1 1 4.2 2.8c-.8.4-1.3 1.1-1.3 2M12 17h.01"
  }
];

const PROCESS = [
  {
    step: "01",
    heading: "See what actually drives your payment",
    body: "In Florida, insurance and property taxes routinely move the monthly number more than a quarter point of rate does. Our calculators break out every component so you can see which line is the problem."
  },
  {
    step: "02",
    heading: "Compare real options, not one quote",
    body: "A broker works with multiple lenders. That only helps if someone walks you through the tradeoffs — mortgage insurance structure, term, cash to close — instead of handing you a single number and a signature line."
  },
  {
    step: "03",
    heading: "Move forward through a secure system",
    body: "When you're ready to apply, it happens in a system built for it. Documents and sensitive information never belong in a web form, and you'll never be asked for them here."
  }
];

const TRUST = [
  {
    title: "Calculators run on your device",
    body: "Every figure you type stays in your browser. Nothing is transmitted, stored, or used to contact you.",
    icon: "M12 3 4 6v6c0 4.4 3.4 8.4 8 9 4.6-.6 8-4.6 8-9V6l-8-3Z"
  },
  {
    title: "No credit pull to start",
    body: "A conversation costs you nothing and leaves no inquiry on your report. Nothing here is an application.",
    icon: "M3 10h18M6 15h4M3 6h18v12H3z"
  },
  {
    title: "Every estimate shows its assumptions",
    body: "You see the inputs, what's excluded, and the calculation version behind every number we show you.",
    icon: "M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"
  }
];

const HOME_FAQS = [
  {
    question: "Are you a lender?",
    answer:
      "No. We're a mortgage brokerage. We arrange financing with lenders; we don't make the loan ourselves. Practically, that means we compare options across lenders rather than fitting you to one institution's product set."
  },
  {
    question: "Why don't you show today's rates?",
    answer:
      "Because a single number on a web page isn't your rate. Pricing depends on your credit profile, loan-to-value, property type, occupancy, loan amount, and lock period. We'd rather show you real figures for your situation than an advertisement."
  },
  {
    question: "Do your calculators pull my credit?",
    answer:
      "No. Every calculator on this site runs entirely in your browser using values you type in. Nothing is sent anywhere, and no credit inquiry of any kind occurs."
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
      <section className="relative overflow-hidden">
        <Orbs />
        <div className="container-default relative z-10 py-20 sm:py-28">
          <div className="max-w-3xl animate-fade-up">
            <Eyebrow>Florida mortgage brokerage</Eyebrow>
            <h1 className="text-[2.75rem] leading-[1.05] sm:text-7xl">
              A clearer path from <span className="text-gradient">home search</span> to mortgage
              plan
            </h1>
            <p className="mt-7 max-w-2xl text-lg sm:text-xl" style={{ color: "var(--text-muted)" }}>
              We help Florida buyers and homeowners compare financing paths with tools that show
              their assumptions — and guidance from someone who will tell you when a deal
              doesn&rsquo;t make sense.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/contact" data-cta="hero-primary">
                Build my mortgage plan
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </ButtonLink>
              <ButtonLink href="/calculators" variant="secondary" data-cta="hero-secondary">
                Explore payment calculators
              </ButtonLink>
            </div>
          </div>

          {/*
            Trust row. Only claims that are true today. No years in business, no
            loan volume, no review counts, no awards — those appear here when
            they exist and can be substantiated.
          */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {TRUST.map((item) => (
              <div
                key={item.title}
                className="surface-raised hover-float rounded-2xl p-5 hover:-translate-y-1 hover:border-[var(--purple)]"
              >
                <span
                  className="grid size-10 place-items-center rounded-xl"
                  style={{ background: "var(--purple-subtle)", color: "var(--purple)" }}
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                  >
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="mt-4 font-semibold">{item.title}</p>
                <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="Start here"
          title="What are you working on?"
          gradientWord="working on"
          description="Each path explains the mechanics, the variables that matter, and what to prepare before you talk to anyone."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <Card as="li" key={scenario.href} interactive className="!p-0">
              <Link href={scenario.href} className="flex h-full flex-col gap-4 p-6">
                <span
                  className="grid size-11 place-items-center rounded-xl"
                  style={{ background: "var(--purple-subtle)", color: "var(--purple)" }}
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-[22px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                  >
                    <path d={scenario.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{scenario.label}</h3>
                  <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                    {scenario.detail}
                  </p>
                </div>
              </Link>
            </Card>
          ))}
        </ul>
      </Section>

      <Section tone="surface">
        <div>
          <SectionHeading
            eyebrow="How this works"
            title="Three steps, in this order"
            gradientWord="in this order"
            description="Most people are shown a rate first. That's backwards, and it's why so many buyers are surprised at closing."
          />
          <ol className="grid gap-8 lg:grid-cols-3">
            {PROCESS.map((item) => (
              <li key={item.step} className="relative">
                <span
                  className="text-5xl font-black tabular-nums"
                  style={{
                    background: "linear-gradient(135deg, var(--purple), var(--purple-light))",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    opacity: 0.9
                  }}
                >
                  {item.step}
                </span>
                <h3 className="mt-4 text-xl">{item.heading}</h3>
                <p className="mt-3" style={{ color: "var(--text-muted)" }}>
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section id="estimate">
        <SectionHeading
          eyebrow="Try it now"
          title="Estimate a monthly payment"
          gradientWord="monthly payment"
          description="Move the inputs and watch which line actually drives your number. This runs entirely on your device — nothing is sent anywhere."
        />
        <PaymentCalculator />
      </Section>

      <Section tone="surface">
        <div>
          <SectionHeading
            eyebrow="Loan programs"
            title="Understand your options before anyone quotes you"
            gradientWord="before anyone quotes you"
            description="Each page covers who a program tends to fit, who should look elsewhere, and the tradeoff nobody mentions."
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.slice(0, 9).map((program) => (
              <Card as="li" key={program.slug} interactive className="!p-0">
                <Link href={`/mortgage/${program.slug}`} className="block h-full p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{program.navLabel}</h3>
                    <span aria-hidden="true" style={{ color: "var(--purple)" }}>
                      <svg
                        viewBox="0 0 24 24"
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                    {program.description}
                  </p>
                </Link>
              </Card>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="relative overflow-hidden">
            <Orbs variant="subtle" />
            <div className="relative">
              <Eyebrow>TRACT Vision</Eyebrow>
              <h3 className="text-2xl">Model a property before you commit</h3>
              <p className="mt-3.5" style={{ color: "var(--text-muted)" }}>
                A planning workspace for renovation, addition, rental, and flip scenarios. It shows
                every assumption and every source, separates what&rsquo;s known from what&rsquo;s
                estimated, and never hands you a single good-deal verdict.
              </p>
              <div className="mt-6">
                <FeatureStatus label="Status" status={features.vision ? "live" : "coming_soon"} />
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <Orbs variant="subtle" />
            <div className="relative">
              <Eyebrow>For real estate agents</Eyebrow>
              <h3 className="text-2xl">A financing partner who communicates</h3>
              <p className="mt-3.5" style={{ color: "var(--text-muted)" }}>
                Status at every stage, education your buyers can actually use, and tools that make
                you look good — built around service rather than anything resembling payment for
                referrals.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ButtonLink href="/partners/real-estate-agents" variant="secondary">
                  See the partner page
                </ButtonLink>
                <FeatureStatus
                  label="RendProp"
                  status={features.rendProp ? "live" : "coming_soon"}
                />
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section tone="surface">
        <div>
          <SectionHeading
            eyebrow="Common questions"
            title="Straight answers"
            gradientWord="Straight"
          />
          <Faq items={HOME_FAQS} />
        </div>
      </Section>

      <Section>
        <CtaPanel
          title="Ready for a real conversation?"
          body="Tell us what you're working on. A licensed mortgage professional will get back to you. No application, no credit pull, no obligation."
          primary={{
            href: "/contact",
            label: "Talk to a mortgage professional",
            cta: "footer-consultation"
          }}
          secondary={{ href: "/calculators", label: "Run the numbers first" }}
        />
      </Section>

      <Section width="narrow" className="!pt-0">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <LicenseFact label="Company NMLS ID" value={businessIdentity.nmlsId} />
          <LicenseFact
            label="Florida mortgage broker license"
            value={businessIdentity.companyLicenseId}
          />
          <Badge tone="neutral">Pre-launch</Badge>
        </div>
        <Disclosure
          headline="Nothing on this page is an offer of credit."
          body="TRACT Mortgage is a mortgage brokerage. We arrange, but do not make, mortgage loans. Every figure shown here is an estimate based on values you entered, and is not a rate quote, a preapproval, or a commitment to lend."
        />
      </Section>
    </>
  );
}
