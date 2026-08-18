import type { Metadata } from "next";
import Image from "next/image";
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
  Section,
  SectionHeading
} from "@/components/ui";
import { AssetImage } from "@/components/asset-image";
import { PaymentCalculator } from "@/components/calculators/payment-calculator";
import { HeroEstimator } from "@/components/hero-estimator";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { SITE_URL, businessIdentity } from "@/lib/site";
import { PROGRAMS } from "@/content/programs";
import { absoluteUrl, breadcrumbNode, graph, webPageNode } from "@tract/seo";

export const metadata: Metadata = pageMetadata({
  title: "Florida mortgage payment estimate",
  description:
    "A Florida mortgage brokerage. Estimate a payment with taxes, insurance and dues included, compare financing paths, and talk to a licensed pro. No credit pull.",
  path: "/",
  imagePath: "/images/og/default.png"
});

const SCENARIOS = [
  {
    href: "/mortgage/purchase",
    label: "Buying a home",
    detail: "First home, moving up, or relocating to Florida",
    image: "/images/scenarios/purchase.webp",
    alt: "A modest Florida home with a covered front porch"
  },
  {
    href: "/mortgage/refinance",
    label: "Refinancing",
    detail: "Lower the rate, change the term, or take cash out",
    image: "/images/scenarios/refinance.webp",
    alt: "An established Florida home shaded by mature oaks"
  },
  {
    href: "/mortgage/investment-property",
    label: "Buying an investment",
    detail: "Rental cash flow, DSCR, or a fix-and-flip",
    image: "/images/scenarios/investment.webp",
    alt: "A well-kept Florida duplex rental property"
  },
  {
    href: "/mortgage/self-employed",
    label: "Self-employed",
    detail: "1099, business owner, or contractor income",
    image: "/images/scenarios/self-employed.webp",
    alt: "A Florida home with a work van and a detached workshop"
  },
  {
    href: "/mortgage/construction",
    label: "Building or renovating",
    detail: "Land, construction-to-permanent, or renovation",
    image: "/images/scenarios/construction.webp",
    alt: "A Florida home under construction, framing exposed"
  },
  {
    href: "/mortgage/condo",
    label: "Buying a condo",
    detail: "Where the building matters as much as you do",
    image: "/images/scenarios/condo.webp",
    alt: "A modern Florida coastal condominium building"
  }
];

/** Only claims that are demonstrably true on this site today. */
const HERO_PROOF = [
  "No credit pull",
  "Estimator stays in your browser",
  "No signup to get a number"
];

/**
 * What actually moves a Florida payment. Each of these is a structural fact
 * about the state rather than a market statistic, so none of it goes stale and
 * none of it needs a figure we would have to keep sourcing.
 */
const FLORIDA_REALITY = [
  {
    heading: "Insurance is the line that moves",
    body: "Wind and flood coverage are priced on the building, not on you — roof age and shape, opening protection, construction type, elevation, distance to water. Two identical offers on two identical-looking houses can carry very different payments. Get the quote before you are under contract, not after."
  },
  {
    heading: "Condos are underwritten twice",
    body: "You are underwritten, and so is the association. Reserves, deferred maintenance, milestone and structural integrity findings, litigation, and the share of units held by investors can all decide whether a building is financeable at all — and a special assessment lands on your budget, not the lender's."
  },
  {
    heading: "Taxes reset when you buy",
    body: "The seller's tax bill is not your tax bill. Portability and Save Our Homes protect the current owner's assessment; on a sale, the property is reassessed. Budgeting from the listing's current taxes is one of the most common ways a Florida payment comes in high."
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

      {/*
        Hero.

        A consumer arrives with one question — what would the payment be — and
        bounces if the page answers it with a brochure. So the estimator is the
        hero, not a section further down, and it returns a number before it asks
        for anything. The company type is still stated in the first screen.
      */}
      <section className="relative overflow-hidden" data-testid="hero-product-proof">
        <div aria-hidden="true" className="absolute inset-0">
          <picture className="block size-full">
            <source media="(max-width: 640px)" srcSet="/images/home/hero-florida-home-1200.webp" />
            <AssetImage
              src="/images/home/hero-florida-home.webp"
              alt=""
              width={2400}
              height={1018}
              priority
              sizes="100vw"
              className="object-cover"
              fallbackLabel="Generated hero preview unavailable"
            />
          </picture>
          {/*
            The scrim is what makes the headline legible in both themes over a
            bright photograph. Tuned so the left third reaches AA against white
            text while the house stays visible on the right.
          */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgb(9 9 15 / 0.88) 0%, rgb(9 9 15 / 0.74) 34%, rgb(9 9 15 / 0.34) 60%, rgb(9 9 15 / 0.12) 100%)"
            }}
          />
        </div>

        <div className="container-default relative z-10 py-16 sm:py-24">
          {/*
            Placement is explicit so mobile can lead with the estimator.
            On a phone a consumer decides whether to stay before they reach
            the second paragraph, so the tool comes directly after the
            headline and the supporting copy follows it.
          */}
          <div className="grid gap-8 lg:grid-cols-[1.05fr_minmax(380px,0.95fr)] lg:items-center lg:gap-12">
            <div className="animate-fade-up lg:col-start-1 lg:row-start-1">
              <p
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
                style={{
                  borderColor: "rgb(255 255 255 / 0.3)",
                  background: "rgb(255 255 255 / 0.08)",
                  color: "#fff"
                }}
              >
                Florida mortgage brokerage
              </p>
              <h1 className="text-[2.6rem] leading-[1.04] text-white sm:text-6xl">
                Know the housing payment{" "}
                <span
                  style={{
                    background: "linear-gradient(120deg, #c084fc, #a855f7)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent"
                  }}
                >
                  before you fall in love
                </span>{" "}
                with the house
              </h1>
              <p
                className="mt-6 max-w-xl text-lg sm:text-xl"
                style={{ color: "rgb(255 255 255 / 0.82)" }}
              >
                Taxes, insurance and dues are the part people find out about last, and in Florida
                they are the part that decides what you can carry. Move the sliders and watch the
                whole number — then talk to someone licensed who will tell you when a deal
                doesn&rsquo;t make sense.
              </p>
            </div>

            <div className="animate-fade-up lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:justify-self-end lg:self-center lg:pl-4">
              <HeroEstimator />
            </div>

            <div className="animate-fade-up lg:col-start-1 lg:row-start-2">
              <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
                {HERO_PROOF.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: "rgb(255 255 255 / 0.9)" }}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="size-4 shrink-0"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 10.5 8 14.5 16 5.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/plan" data-cta="hero-primary">
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
                <Link
                  href="/calculators"
                  data-cta="hero-secondary"
                  className="inline-flex min-h-[48px] items-center rounded-xl border px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                  style={{ borderColor: "rgb(255 255 255 / 0.35)" }}
                >
                  Explore payment calculators
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        Trust row. Only claims that are true today. No years in business, no
        loan volume, no review counts, no awards — those appear here when they
        exist and can be substantiated.
      */}
      <Section pad="tight">
        <div className="grid gap-4 sm:grid-cols-3">
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
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Start here"
          title="What are you working on?"
          gradientWord="working on"
          description="Each path explains the mechanics, the variables that decide your outcome, and what to have ready before you talk to anyone."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <Card as="li" key={scenario.href} interactive className="!p-0 overflow-hidden">
              <Link href={scenario.href} className="flex h-full flex-col">
                <span className="relative block aspect-[16/10] overflow-hidden">
                  <Image
                    src={scenario.image}
                    alt={scenario.alt}
                    width={900}
                    height={562}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="size-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                  />
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="text-lg font-semibold">{scenario.label}</span>
                  <span className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                    {scenario.detail}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-4 text-sm font-semibold"
                    style={{ color: "var(--purple)" }}
                  >
                    See how it works &rarr;
                  </span>
                </span>
              </Link>
            </Card>
          ))}
        </ul>
        {/*
          Imagery on this site is generated rather than photographed, and saying
          so once here is cheaper than an argument later about whether a picture
          implied a real property, a real client, or a real office.
        */}
        <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
          Photography on this site is illustrative and computer-generated. It does not depict a
          specific property, client, or transaction.
        </p>
      </Section>

      {/*
        The Florida section.

        This is the part a national brand cannot copy without doing the work,
        and every item is a structural fact about the state rather than a market
        statistic — so it does not go stale and needs no figure to keep current.
      */}
      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Why Florida is different"
              title="The loan is the easy part"
              gradientWord="easy part"
              description="Financing a Florida home is mostly ordinary. What surprises people is the cost of holding it — and it is knowable well before you are under contract."
            />
            <dl className="space-y-7">
              {FLORIDA_REALITY.map((item) => (
                <div key={item.heading}>
                  <dt className="text-lg font-semibold">{item.heading}</dt>
                  <dd className="mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-9">
              <ButtonLink href="/locations/florida" variant="secondary" data-cta="florida-reality">
                What makes a Florida mortgage different
              </ButtonLink>
            </div>
          </div>
          <div className="lg:justify-self-end">
            <Image
              src="/images/home/florida-storm-ready.webp"
              alt="New roof, impact-rated windows and folded hurricane shutters on a Florida home"
              width={1400}
              height={787}
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="w-full rounded-3xl object-cover"
              style={{ boxShadow: "var(--shadow-float)" }}
            />
            <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              Roof age and shape, opening protection and elevation are priced by the insurer before
              they are priced by a lender.
            </p>
          </div>
        </div>
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
          <Card className="overflow-hidden !p-0">
            <div className="aspect-[8/5] overflow-hidden bg-[var(--surface-2)]">
              <AssetImage
                src="/images/home/tract-vision-preview.webp"
                alt="Synthetic Florida bungalow used in the TRACT Vision planning preview"
                width={1600}
                height={1000}
                sizes="(max-width: 1024px) 100vw, 50vw"
                fallbackLabel="Vision preview unavailable"
              />
            </div>
            <div className="p-6">
              <Eyebrow>TRACT Vision</Eyebrow>
              <h3 className="text-2xl">Model a property before you commit</h3>
              <p className="mt-3.5" style={{ color: "var(--text-muted)" }}>
                A planning workspace for renovation, addition, rental, and flip scenarios. It shows
                every assumption and every source, separates what&rsquo;s known from what&rsquo;s
                estimated, and never hands you a single good-deal verdict.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ButtonLink href="/vision/start" variant="secondary">
                  Open the planning demo
                </ButtonLink>
                <FeatureStatus label="Status" status={features.vision ? "live" : "coming_soon"} />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden !p-0">
            <div className="aspect-[8/5] overflow-hidden bg-[var(--surface-2)] p-4 sm:p-6">
              <AssetImage
                src="/images/home/mortgage-planning-dashboard.webp"
                alt="Rendered TRACT mortgage planner result with payment, loan and assumption details"
                width={1060}
                height={402}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
                fallbackLabel="Mortgage planner result unavailable"
              />
            </div>
            <div className="p-6">
              <Eyebrow>Mortgage planner</Eyebrow>
              <h3 className="text-2xl">Get a useful range before a contact form</h3>
              <p className="mt-3.5" style={{ color: "var(--text-muted)" }}>
                Five short steps produce a deterministic payment range in your browser. Save it on
                this device, inspect the assumptions, or choose to share it for a human review.
              </p>
              <div className="mt-6">
                <ButtonLink href="/plan" variant="secondary">
                  Build a mortgage plan
                </ButtonLink>
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
