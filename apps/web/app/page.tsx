import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowIcon,
  Badge,
  ButtonLink,
  Card,
  CtaPanel,
  Disclosure,
  Faq,
  LicenseFact,
  Section,
  SectionHeading
} from "@/components/ui";
import { AssetImage } from "@/components/asset-image";
import { HeroEstimator } from "@/components/hero-estimator";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { pageMetadata } from "@/lib/metadata";
import {
  EMAIL_CONSENT_TEXT,
  LEAD_DISCLOSURE_TEXT,
  SITE_URL,
  SMS_CONSENT_TEXT,
  businessIdentity
} from "@/lib/site";
import { absoluteUrl, breadcrumbNode, graph, webPageNode } from "@tract/seo";

export const metadata: Metadata = pageMetadata({
  title: "Florida mortgage brokerage — honest guidance, no pressure",
  description:
    "Tell us whether you are buying, refinancing, or buying your first home, and a licensed mortgage professional will lay out your real options. No credit pull.",
  path: "/",
  imagePath: "/images/og/default.png"
});

/** Only claims that are demonstrably true on this site today. */
const HERO_PROOF = ["No credit pull", "Not an application", "No obligation"];

/**
 * What we do, in plain language. Educational claims only — no rates, no
 * approval promises, and nothing about licensing beyond what the pending
 * state at the foot of the page already says.
 */
const WHAT_WE_DO = [
  {
    href: "/mortgage/purchase",
    label: "Buying a home",
    detail:
      "We walk you through what a Florida purchase actually costs to carry — taxes, insurance, and dues included — and compare financing options across lenders instead of fitting you to one product."
  },
  {
    href: "/mortgage/refinance",
    label: "Refinancing",
    detail:
      "Lowering the rate, changing the term, or taking cash out only makes sense when the math works. We show you the break-even, not just the new payment."
  },
  {
    href: "/mortgage/first-time-home-buyers",
    label: "First-time buyers",
    detail:
      "Your first mortgage comes with the most unknowns. We explain the sequence, what to have ready, and where first-time buyers most often get surprised."
  }
];

/** Supporting tools. Deliberately compact — the page's job is the form above. */
const SECONDARY_PATHS = [
  {
    href: "/plan",
    label: "Build a full mortgage plan",
    detail: "Five short steps to a payment range, in your browser"
  },
  {
    href: "/properties",
    label: "Browse homes",
    detail: "Sample Florida listings with the full carrying cost shown"
  },
  {
    href: "/calculators",
    label: "Run the numbers",
    detail: "Payment, affordability, refinance and closing-cost calculators"
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
    question: "What happens after I send the form?",
    answer:
      "A licensed mortgage professional contacts you to understand your situation. There's no application, no credit pull, and no obligation at that stage — it's a conversation about what your options actually are."
  },
  {
    question: "Do your calculators pull my credit?",
    answer:
      "No. Every calculator on this site runs entirely in your browser using values you type in. Nothing is sent anywhere, and no credit inquiry of any kind occurs."
  }
];

export default function HomePage() {
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
                "A Florida mortgage brokerage. Tell us what you are working on and a licensed mortgage professional lays out your options — no application, no credit pull."
            }),
            breadcrumbNode([{ name: "Home", url }])
          ],
          businessIdentity
        )}
      />

      {/*
        Hero.

        This page is the destination for paid intent traffic, so its one job is
        to convert a visitor into a conversation. The lead form shares the first
        screen with the message: on desktop the pitch is on the left and the
        form on the right; on a phone the form comes directly after the
        headline, before the supporting copy, because that is where the
        decision to stay is made.
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
            text while the house stays visible behind the form card.
          */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgb(9 9 15 / 0.88) 0%, rgb(9 9 15 / 0.74) 34%, rgb(9 9 15 / 0.42) 60%, rgb(9 9 15 / 0.28) 100%)"
            }}
          />
        </div>

        <div className="container-default relative z-10 py-16 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_minmax(400px,0.95fr)] lg:items-start lg:gap-12">
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
                Honest answers about your Florida mortgage,{" "}
                <span
                  style={{
                    background: "linear-gradient(120deg, #c084fc, #a855f7)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent"
                  }}
                >
                  without the pressure
                </span>
              </h1>
              <p
                className="mt-6 max-w-xl text-lg sm:text-xl"
                style={{ color: "rgb(255 255 255 / 0.82)" }}
              >
                Tell us what you&rsquo;re working on — buying, refinancing, or your first home — and
                a licensed mortgage professional will lay out what your options actually are.
              </p>
            </div>

            {/*
              The form, not a tool, is the hero's second column. `id` gives the
              closing CTA and ad landings an anchor straight to it.
            */}
            <div
              id="talk"
              className="animate-fade-up scroll-mt-24 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:justify-self-end lg:pl-4"
            >
              <LeadForm
                intent="general"
                formId="home-hero"
                disclosureText={LEAD_DISCLOSURE_TEXT}
                smsConsentText={SMS_CONSENT_TEXT}
                emailConsentText={EMAIL_CONSENT_TEXT}
                turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              />
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
              <p className="mt-6 max-w-xl text-sm" style={{ color: "rgb(255 255 255 / 0.7)" }}>
                Prefer to explore first? The{" "}
                <Link href="/calculators" className="underline underline-offset-2 text-white">
                  calculators
                </Link>{" "}
                run entirely in your browser — no signup, nothing sent anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/*
        What we do.

        Plain language about the brokerage itself. Educational claims only: the
        licence identifiers at the foot of the page render their own pending
        state, so nothing here asserts a rate, an approval, or a credential.
      */}
      <Section>
        <SectionHeading
          eyebrow="What we do"
          title="A brokerage, in plain language"
          gradientWord="plain language"
          description="We arrange, but do not make, mortgage loans. A broker works with multiple lenders, which only helps if someone walks you through the tradeoffs instead of handing you a single number and a signature line. That is the job."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHAT_WE_DO.map((item) => (
            <Card as="li" key={item.href} interactive className="!p-0">
              <Link href={item.href} className="flex h-full flex-col p-6">
                <span className="text-lg font-semibold">{item.label}</span>
                <span className="mt-2 flex-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {item.detail}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-4 text-sm font-semibold"
                  style={{ color: "var(--purple)" }}
                >
                  How it works &rarr;
                </span>
              </Link>
            </Card>
          ))}
        </ul>
        <div className="mt-8">
          <ButtonLink href="/mortgage" variant="secondary" data-cta="home-programs">
            See every loan program we cover
          </ButtonLink>
        </div>
      </Section>

      {/*
        Secondary paths. Supporting cast, not the stars — one compact row, so
        the tools stay reachable without turning the page back into a portal.
      */}
      <Section tone="surface" pad="tight">
        <ul className="grid gap-4 sm:grid-cols-3">
          {SECONDARY_PATHS.map((path) => (
            <Card as="li" key={path.href} interactive className="!p-0">
              <Link href={path.href} className="flex h-full items-start gap-3 p-5">
                <ArrowIcon />
                <span>
                  <span className="font-semibold">{path.label}</span>
                  <span className="mt-1 block text-sm" style={{ color: "var(--text-muted)" }}>
                    {path.detail}
                  </span>
                </span>
              </Link>
            </Card>
          ))}
        </ul>
      </Section>

      {/*
        The estimator, demoted from the hero. It still earns its place: it
        computes, from the reader's own numbers, that a Florida payment is much
        more than principal and interest — an argument no static copy can make
        as convincingly. But it is now a section, not the page.
      */}
      <Section id="estimate">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Run the numbers"
              title="See what a Florida payment is really made of"
              gradientWord="really made of"
              description="In Florida, taxes, insurance and dues routinely move the monthly number more than a quarter point of rate does. Move the sliders and watch which line drives your payment — it all runs on your device, and nothing is sent anywhere."
            />
            <ButtonLink href="/calculators" variant="secondary" data-cta="home-calculators">
              Explore all calculators
            </ButtonLink>
          </div>
          <div className="lg:justify-self-end lg:w-full lg:max-w-[520px]">
            <HeroEstimator />
          </div>
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
            href: "#talk",
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
