import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowIcon,
  Badge,
  Disclosure,
  Faq,
  LicenseFact,
  Section,
  SectionHeading
} from "@/components/ui";
import { AssetImage } from "@/components/asset-image";
import { HomeFunnel } from "@/components/home-funnel";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import {
  COMPANY_URL,
  EMAIL_CONSENT_TEXT,
  LEAD_DISCLOSURE_TEXT,
  LEAD_DISCLOSURE_VERSION,
  SITE_URL,
  SMS_CONSENT_TEXT,
  businessIdentity
} from "@/lib/site";
import { breadcrumbNode, faqNode, graph, webPageNode } from "@tract/seo";

/**
 * Wholesale Mortgage Lending — the marketing landing served at the WML apex
 * (wsmlending.com). This is the front door paid mortgage traffic lands on, so
 * its one job is to turn a visitor into a lead: the same real, CRM-wired funnel
 * the TRACT homepage uses shares the hero, and everything below it is mortgage
 * education that earns the organic and Maps ranking the ads sit on top of.
 *
 * The middleware serves this with WML chrome and keeps /api same-origin so the
 * form posts here rather than being redirected cross-origin. Its canonical
 * points at the WML apex, not this /wml implementation path.
 */

/** The TRACT product origin and the WML apex, both without a trailing slash. */
const TRACT = SITE_URL.replace(/\/$/, "");
const WML = COMPANY_URL.replace(/\/$/, "");

export const metadata: Metadata = pageMetadata({
  title: "Florida mortgage broker — compare lenders",
  description:
    "Wholesale Mortgage Lending is a Florida mortgage brokerage. Compare financing across lenders for a purchase, refinance, or first mortgage — no credit pull.",
  path: "/wml",
  imagePath: "/images/og/default.png",
  // Served at the WML apex; the canonical must be the WML domain, never the
  // /wml path on the product origin.
  canonicalUrl: `${WML}/`
});

const HERO_PROOF = ["No credit pull", "Not an application", "No obligation"];

/** Educational, keyword-bearing, and each one links into the TRACT product. */
const WHAT_WE_HELP = [
  {
    href: `${TRACT}/mortgage/purchase`,
    label: "Buying a home",
    detail:
      "What a Florida purchase actually costs to carry — taxes, insurance, and dues included — compared across lenders instead of fit to one product."
  },
  {
    href: `${TRACT}/mortgage/refinance`,
    label: "Refinancing",
    detail:
      "Lowering the rate, changing the term, or taking cash out only makes sense when the math works. We show you the break-even, not just the new payment."
  },
  {
    href: `${TRACT}/mortgage/first-time-home-buyers`,
    label: "First-time buyers",
    detail:
      "Your first mortgage carries the most unknowns. We explain the sequence, what to have ready, and where first-time buyers most often get surprised."
  }
];

/** The programs strip — mortgage keywords that also carry local/ads intent. */
const PROGRAMS = [
  { href: `${TRACT}/mortgage/conventional`, label: "Conventional" },
  { href: `${TRACT}/mortgage/fha`, label: "FHA" },
  { href: `${TRACT}/mortgage/va`, label: "VA" },
  { href: `${TRACT}/mortgage/usda`, label: "USDA" },
  { href: `${TRACT}/mortgage/jumbo`, label: "Jumbo" },
  { href: `${TRACT}/mortgage/home-equity`, label: "Home equity" }
];

const WML_FAQS = [
  {
    question: "What does a mortgage broker do?",
    answer:
      "A mortgage broker arranges your loan with lenders rather than lending its own money. Wholesale Mortgage Lending compares options across multiple lenders for your situation instead of fitting you to one institution's product set."
  },
  {
    question: "Do you lend the money yourselves?",
    answer:
      "No. We're a brokerage, not a lender — we arrange financing and the lender funds it. That separation is exactly what lets us compare programs and pricing across lenders on your behalf."
  },
  {
    question: "What will this cost me?",
    answer:
      "Talking to us costs nothing and there's no obligation. Any broker compensation is disclosed to you in writing before you sign anything, and it depends on the loan and the lender — never a surprise."
  },
  {
    question: "Is sending this form a credit application?",
    answer:
      "No. It's a request for a licensed professional to contact you. There's no application and no credit pull at this stage — it's a conversation about what your options actually are."
  },
  {
    question: "Which Florida loans can you help with?",
    answer:
      "Purchases, refinances, and first mortgages across common programs — conventional, FHA, VA, USDA, jumbo, and home equity. We point you to the path that actually fits your situation."
  }
];

const btnPrimary =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-3 " +
  "text-[0.95rem] font-semibold text-white transition duration-200 hover:-translate-y-0.5";
const btnSecondary =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-6 py-3 " +
  "text-[0.95rem] font-semibold transition duration-200 hover:-translate-y-0.5 hover:border-[var(--purple)] hover:text-[var(--purple)]";

export default function WmlLandingPage() {
  const url = `${WML}/`;

  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: "Wholesale Mortgage Lending — Florida mortgage broker",
              description:
                "A Florida mortgage brokerage. Compare financing across lenders for a purchase, refinance, or first mortgage — powered by TRACT. No application, no credit pull."
            }),
            faqNode(WML_FAQS, true),
            breadcrumbNode([{ name: "Home", url }])
          ],
          businessIdentity
        )}
      />

      {/*
        Hero. Same shape as the TRACT homepage: the pitch and the form share the
        first screen — pitch left, form right on desktop; on a phone the form
        comes right after the headline, where the decision to stay is made.
      */}
      <section className="relative overflow-hidden">
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
                Compare your Florida mortgage{" "}
                <span
                  style={{
                    background: "linear-gradient(120deg, #c084fc, #a855f7)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent"
                  }}
                >
                  across lenders
                </span>
              </h1>
              <p
                className="mt-6 max-w-xl text-lg sm:text-xl"
                style={{ color: "rgb(255 255 255 / 0.82)" }}
              >
                Wholesale Mortgage Lending is a Florida brokerage. Tell us what you&rsquo;re working
                on — buying, refinancing, or your first home — and a licensed professional lays out
                your real options. No credit pull, no pressure.
              </p>
            </div>

            <div
              id="lead"
              className="animate-fade-up scroll-mt-24 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:justify-self-end lg:pl-4"
            >
              <HomeFunnel
                formId="wml-hero"
                disclosureText={LEAD_DISCLOSURE_TEXT}
                smsConsentText={SMS_CONSENT_TEXT}
                emailConsentText={EMAIL_CONSENT_TEXT}
                disclosureVersion={LEAD_DISCLOSURE_VERSION}
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
            </div>
          </div>
        </div>
      </section>

      {/* What we help with — educational, and each card links into TRACT. */}
      <Section>
        <SectionHeading
          eyebrow="What we help with"
          title="Wherever you are in the process"
          gradientWord="the process"
          description="A broker works with multiple lenders, which only helps if someone walks you through the tradeoffs instead of handing you a single number and a signature line. That is the job."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHAT_WE_HELP.map((item) => (
            <li key={item.href} className="surface hover-float rounded-2xl">
              <a href={item.href} className="flex h-full flex-col p-6">
                <span className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                  {item.label}
                </span>
                <span className="mt-2 flex-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {item.detail}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-4 text-sm font-semibold"
                  style={{ color: "var(--purple)" }}
                >
                  See how it works &rarr;
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      {/* Why a broker — the trust argument, plain and keyword-bearing. */}
      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <SectionHeading
            eyebrow="Why a broker"
            title="One conversation, every lender weighed"
            gradientWord="every lender"
            description="We arrange, but do not make, mortgage loans. Because we're not tied to a single institution's product set, we can compare programs and pricing for your situation — and tell you plainly when waiting or a different path is the better move."
          />
          <ul className="grid gap-4">
            {[
              {
                h: "Options, not a single quote",
                p: "Your rate depends on credit, loan-to-value, property type, occupancy, and lock period. We compare real figures for your situation instead of advertising one number."
              },
              {
                h: "Florida-specific math",
                p: "Taxes, insurance, and dues move a Florida payment more than a quarter point of rate often does. We show you what the monthly number is really made of."
              },
              {
                h: "Straight answers, no pressure",
                p: "No application and no credit pull to start. If the numbers don't work yet, we'll say so — the goal is the right decision, not a signature today."
              }
            ].map((row) => (
              <li key={row.h} className="surface rounded-2xl p-6">
                <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
                  {row.h}
                </p>
                <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {row.p}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Programs strip — mortgage keywords with clear local/ads intent. */}
      <Section pad="tight">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              Florida loan programs we cover
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Purchase, refinance, and home equity across the programs most Florida buyers and
              owners use.
            </p>
          </div>
          <ul className="flex flex-wrap gap-3">
            {PROGRAMS.map((program) => (
              <li key={program.href}>
                <a
                  href={program.href}
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--purple)] hover:text-[var(--purple)]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  {program.label}
                  <ArrowIcon />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Powered-by-TRACT band. The product is the reason the numbers are real. */}
      <Section pad="tight">
        <div
          className="relative overflow-hidden rounded-[2rem] px-8 py-14 sm:px-14"
          style={{
            background: "linear-gradient(120deg, #0b0b14, #1a1533 60%, #241a4d)",
            boxShadow: "0 24px 70px var(--purple-glow)"
          }}
        >
          <div className="relative max-w-2xl">
            <Image
              src="/brand/tract-word-dark.png"
              alt="TRACT"
              width={640}
              height={118}
              className="h-8 w-auto"
            />
            <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">
              The tools that do the work
            </h2>
            <p className="mt-4 text-lg" style={{ color: "rgb(255 255 255 / 0.8)" }}>
              TRACT is our platform — calculators that run in your browser, real Florida home search
              with the full carrying cost shown, a homeowner value dashboard, and your own loan
              portal. Powered by Wholesale Mortgage Lending.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={TRACT} className={btnPrimary} style={{ background: "var(--purple)" }}>
                Enter TRACT &rarr;
              </a>
              <a
                href={`${TRACT}/calculators`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/40 px-6 py-3 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Try the calculators
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ — visible on the page and marked up as FAQPage. */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="Common questions"
          title="Straight answers"
          gradientWord="Straight"
        />
        <Faq items={WML_FAQS} />
      </Section>

      {/* Closing CTA back to the form, plus the compliance line. */}
      <Section width="narrow">
        <div
          className="rounded-[2rem] px-8 py-12 text-center sm:px-14"
          style={{ background: "var(--purple-subtle)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--text)" }}>
            Ready for a real conversation?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: "var(--text-muted)" }}>
            Tell us what you&rsquo;re working on. A licensed mortgage professional will get back to
            you — no application, no credit pull, no obligation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#lead"
              data-cta="wml-footer"
              className={btnPrimary}
              style={{ background: "var(--purple)" }}
            >
              Get my options
            </a>
            <a
              href={`${TRACT}/calculators`}
              className={btnSecondary}
              style={{ color: "var(--text)", borderColor: "var(--border)" }}
            >
              Run the numbers first
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-2">
          <LicenseFact label="Company NMLS ID" value={businessIdentity.nmlsId} />
          <LicenseFact
            label="Florida mortgage broker license"
            value={businessIdentity.companyLicenseId}
          />
          <Badge tone="neutral">Pre-launch</Badge>
        </div>
        <Disclosure
          headline="Nothing on this page is an offer of credit."
          body="Wholesale Mortgage Lending is a mortgage brokerage. We arrange, but do not make, mortgage loans. Every figure shown here is an estimate based on values you entered, and is not a rate quote, a preapproval, or a commitment to lend."
        />
      </Section>
    </>
  );
}
