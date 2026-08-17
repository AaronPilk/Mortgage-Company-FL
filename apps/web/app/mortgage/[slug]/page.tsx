import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowIcon,
  ButtonLink,
  Card,
  CheckIcon,
  CtaPanel,
  Disclosure,
  Eyebrow,
  Faq,
  Section,
  SectionHeading
} from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { businessIdentity, SITE_URL } from "@/lib/site";
import { PROGRAMS, programBySlug } from "@/content/programs";
import {
  absoluteUrl,
  breadcrumbNode,
  faqNode,
  graph,
  mortgageLoanNode,
  webPageNode
} from "@tract/seo";

export function generateStaticParams() {
  return PROGRAMS.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = programBySlug(slug);
  if (program === undefined)
    return pageMetadata({ title: "Not found", description: "", path: "/mortgage", noIndex: true });
  return pageMetadata({
    title: program.title,
    description: program.description,
    path: `/mortgage/${program.slug}`
  });
}

/**
 * Loan program template.
 *
 * Every page rendered from this template has a full server-rendered body: what
 * the option is, who it may fit, who should look elsewhere, how it works, the
 * variables that move the outcome, visible FAQs, and the primary sources a
 * reviewer must check. A hero plus a form would not be publishable here.
 */
export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = programBySlug(slug);
  if (program === undefined) notFound();

  const url = absoluteUrl(SITE_URL, `/mortgage/${program.slug}`);
  const related = program.relatedPrograms
    .map((relatedSlug) => programBySlug(relatedSlug))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined);

  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: program.title,
              description: program.description,
              dateModified: "2026-08-17"
            }),
            breadcrumbNode([
              { name: "Home", url: absoluteUrl(SITE_URL, "/") },
              { name: "Mortgage", url: absoluteUrl(SITE_URL, "/mortgage") },
              { name: program.navLabel, url }
            ]),
            program.loanTypeForSchema === null
              ? null
              : mortgageLoanNode({
                  name: program.title,
                  description: program.summary,
                  loanType: program.loanTypeForSchema,
                  url,
                  identity: businessIdentity
                }),
            // The questions below are rendered on the page, which is the only
            // condition under which this markup may be emitted.
            faqNode(program.faqs, true)
          ],
          businessIdentity
        )}
      />

      <Section width="narrow" pad="head" orbs>
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--purple)]">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/mortgage" className="hover:text-[var(--purple)]">
            Mortgage
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{program.navLabel}</span>
        </nav>
        <Eyebrow>{program.eyebrow}</Eyebrow>
        <h1 className="text-4xl sm:text-5xl">{program.h1}</h1>
        <p className="mt-6 text-lg text-[var(--text-muted)]">{program.summary}</p>
      </Section>

      <Section width="narrow" pad="tight">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-t-2 !border-t-[var(--purple)]">
            <h2 className="text-lg font-semibold text-[var(--text)]">This may fit if</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-muted)]">
              {program.mayFit.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text)]">Look at alternatives if</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-muted)]">
              {program.exploreAlternativesIf.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <ArrowIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section width="narrow" pad="tight">
        <h2 className="text-3xl">How it works</h2>
        <ol className="mt-8 space-y-6">
          {program.howItWorks.map((step, index) => (
            <li key={step.heading} className="flex gap-5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{ background: "var(--purple-subtle)", color: "var(--purple)" }}
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-xl font-semibold">{step.heading}</h3>
                <p className="mt-1.5 leading-relaxed text-[var(--text-muted)]">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section width="narrow" pad="tight">
        <h2 className="text-3xl">What moves the outcome</h2>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          {program.variables.map((variable) => (
            <div
              key={variable.label}
              className="surface hover-float rounded-2xl p-5 hover:border-[var(--purple)]"
            >
              <dt className="font-semibold text-[var(--text)]">{variable.label}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                {variable.body}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {program.relatedCalculators.length > 0 && (
        <Section width="narrow" pad="tight">
          <h2 className="text-3xl">Run the numbers</h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {program.relatedCalculators.map((calculator) => (
              <li key={calculator.href}>
                <ButtonLink href={calculator.href} variant="secondary">
                  {calculator.label}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section width="narrow" pad="tight">
        <SectionHeading title="Questions people actually ask" gradientWord="actually" as="h2" />
        <Faq items={program.faqs} />
      </Section>

      <Section width="narrow" pad="tight">
        <h2 className="text-2xl">Sources</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Program rules change. These are the primary sources this page is written against and the
          ones we check before advising anyone.
        </p>
        <ul className="mt-4 space-y-2">
          {program.sources.map((source) => (
            <li key={source.url} className="text-sm">
              <a
                className="font-medium text-[var(--purple)] underline underline-offset-4"
                href={source.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {source.title}
              </a>
              <span className="text-[var(--text-muted)]"> — {source.publisher}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[var(--text-muted)]">Last reviewed 17 August 2026.</p>
      </Section>

      {related.length > 0 && (
        <Section width="narrow" pad="tight">
          <h2 className="text-2xl">Related</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((entry) => (
              <Card as="li" key={entry.slug} interactive className="!p-0">
                <Link
                  href={`/mortgage/${entry.slug}`}
                  className="block p-5 font-semibold text-[var(--purple)]"
                >
                  {entry.navLabel}
                </Link>
              </Card>
            ))}
          </ul>
        </Section>
      )}

      <Section width="narrow" pad="tight">
        <CtaPanel
          title="Talk it through with someone licensed"
          body="The page above is education. Your actual options depend on your full picture, and that takes a conversation. No credit pull, no application, no obligation."
          primary={{
            href: "/contact",
            label: "Talk to a mortgage professional",
            cta: `program-${program.slug}`
          }}
        />
        <Disclosure
          headline="This page is educational, not an offer."
          body="TRACT Mortgage is a mortgage brokerage and arranges, but does not make, mortgage loans. Nothing here is a rate quote, a preapproval, a commitment to lend, or a statement that you qualify for any program. Program terms are set by the agency, insurer, or investor and by each lender's own overlays, and they change."
        />
      </Section>
    </>
  );
}
