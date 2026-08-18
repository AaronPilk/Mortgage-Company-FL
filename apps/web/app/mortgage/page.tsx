import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, Card, CtaPanel, Disclosure, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { PROGRAMS, type Program, type ProgramHeroImage } from "@/content/programs";

export const metadata: Metadata = pageMetadata({
  title: "Mortgage options in Florida",
  description:
    "Purchase, refinance, and program-specific financing explained in plain language, with the tradeoffs that usually go unmentioned.",
  path: "/mortgage"
});

/**
 * The hub's grouping lives here rather than in the content file, because it is
 * a presentation decision — how this page guides a visitor — not a fact about
 * the programs. The order within each list is the display order.
 *
 * Most visitors arrive with a situation, not a program name, so the page leads
 * with the four situation pages, keeps the government-backed programs at
 * medium weight, and folds everything else into a quiet, scannable list.
 *
 * Home equity sits in the featured row deliberately: owners weighing a HELOC
 * or second mortgage are a primary paid-campaign audience, and buried in the
 * specialty list the page's own owner failed to spot it.
 */
const SITUATION_SLUGS = ["purchase", "refinance", "home-equity", "first-time-home-buyers"];
const GOVERNMENT_SLUGS = ["fha", "va", "usda"];

function requireProgram(slug: string): Program {
  const program = PROGRAMS.find((candidate) => candidate.slug === slug);
  if (program === undefined) {
    // A stale slug here would silently drop a program from its section. Fail
    // the render instead so the mismatch is caught at build time.
    throw new Error(
      `/mortgage hub grouping references unknown program slug "${slug}". ` +
        "Update SITUATION_SLUGS/GOVERNMENT_SLUGS in app/mortgage/page.tsx."
    );
  }
  return program;
}

const situationPrograms = SITUATION_SLUGS.map(requireProgram);
const governmentPrograms = GOVERNMENT_SLUGS.map(requireProgram);

// Everything not explicitly grouped falls through to the specialty list, so a
// newly added program is always reachable from the hub even before anyone
// revisits the grouping above.
const groupedSlugs = new Set([...SITUATION_SLUGS, ...GOVERNMENT_SLUGS]);
const specialtyPrograms = PROGRAMS.filter((program) => !groupedSlugs.has(program.slug));

/**
 * The first-time buyer page shares the purchase page's hero photograph in the
 * content file. Side by side in one row the repeat reads as a mistake, so the
 * hub substitutes different Florida home photography from the asset manifest.
 * Same rights class: company-generated scenario imagery, not any real client
 * or property.
 */
const CARD_IMAGE_OVERRIDES: Record<string, ProgramHeroImage> = {
  "first-time-home-buyers": {
    src: "/images/home/hero-florida-home-1200.webp",
    alt: "A Florida house behind mature landscaping",
    width: 1200,
    height: 509
  },
  // The home-equity page shares the refinance hero photograph, which sits two
  // cards away in this same row — so the hub substitutes another company-
  // generated Florida home image from the asset manifest.
  "home-equity": {
    src: "/images/home/tract-vision-preview.webp",
    alt: "A Florida bungalow with a tidy front garden",
    width: 1600,
    height: 1000
  }
};

function cardImage(program: Program): ProgramHeroImage | undefined {
  return CARD_IMAGE_OVERRIDES[program.slug] ?? program.heroImage;
}

export default function MortgageIndexPage() {
  return (
    <>
      <Section orbs pad="head">
        <SectionHeading
          as="h1"
          eyebrow="Mortgage"
          title="Financing options, explained honestly"
          gradientWord="honestly"
          description="Start with your situation. Every guide covers what the option is, who it tends to fit, and the variables that actually move your outcome."
        />
      </Section>

      <Section pad="tight">
        <SectionHeading
          title="Start with your situation"
          description="Buying, refinancing, putting your home's equity to work, or doing this for the first time — start with the guide that matches."
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {situationPrograms.map((program, index) => {
            const image = cardImage(program);
            return (
              <Card as="li" key={program.slug} interactive className="overflow-hidden !p-0">
                <Link href={`/mortgage/${program.slug}`} className="flex h-full flex-col">
                  {image !== undefined && (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      // The first card is the likely LCP element on every
                      // viewport; the others are above the fold only on
                      // desktop, where eager loading is still the right call.
                      fetchPriority={index === 0 ? "high" : undefined}
                      loading="eager"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-semibold text-[var(--text)]">{program.navLabel}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      {program.summary}
                    </p>
                    <span
                      aria-hidden="true"
                      className="mt-auto inline-block pt-4 text-sm font-semibold"
                      style={{ color: "var(--purple)" }}
                    >
                      Read the guide →
                    </span>
                  </div>
                </Link>
              </Card>
            );
          })}
        </ul>
      </Section>

      <Section tone="surface">
        <SectionHeading
          title="Government-backed options"
          description="Insured or guaranteed by a federal agency, which is what makes their qualifying terms different — and worth checking before you assume you don't qualify."
        />
        <ul className="grid gap-4 sm:grid-cols-3">
          {governmentPrograms.map((program) => (
            <Card as="li" key={program.slug} interactive className="!p-0">
              <Link href={`/mortgage/${program.slug}`} className="block h-full p-6">
                <h3 className="text-lg font-semibold text-[var(--text)]">{program.navLabel}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {program.description}
                </p>
                <span
                  aria-hidden="true"
                  className="mt-4 inline-block text-sm font-semibold"
                  style={{ color: "var(--purple)" }}
                >
                  Read the guide →
                </span>
              </Link>
            </Card>
          ))}
        </ul>
      </Section>

      <Section pad="tight">
        <CtaPanel
          title="Not sure which applies to you?"
          body="That is the normal starting point. Tell us what you're working on and a licensed mortgage professional will walk through the options that actually fit."
          primary={{
            href: "/plan",
            label: "Build my mortgage plan",
            cta: "mortgage-hub"
          }}
          secondary={{ href: "/contact", label: "Talk to us" }}
        />
      </Section>

      <Section className="pb-16 sm:pb-24">
        <SectionHeading
          title="Conventional and specialty financing"
          description="The standard conventional loan, plus the narrower paths for when the property, the income, or the structure needs its own underwriting."
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {specialtyPrograms.map((program) => (
            <Card as="li" key={program.slug} interactive className="!p-0">
              <Link
                href={`/mortgage/${program.slug}`}
                className="flex h-full items-center justify-between gap-4 p-5"
              >
                <div>
                  <h3 className="text-base font-semibold text-[var(--text)]">{program.navLabel}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                    {program.description}
                  </p>
                </div>
                <ArrowIcon />
              </Link>
            </Card>
          ))}
        </ul>
        <Disclosure
          headline="Availability depends on an approved lender path."
          body="We can only arrange financing through lenders with whom we hold an executed broker agreement covering that product. The pages above explain how each option works; whether it is available to you is part of the conversation."
        />
      </Section>
    </>
  );
}
