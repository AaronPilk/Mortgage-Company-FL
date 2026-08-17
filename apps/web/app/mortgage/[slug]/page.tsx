import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ButtonLink,
  Card,
  Disclosure,
  Eyebrow,
  Faq,
  Prose,
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

      <Section width="narrow" className="pb-0">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <Link href="/" className="hover:text-purple-700">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/mortgage" className="hover:text-purple-700">
            Mortgage
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{program.navLabel}</span>
        </nav>
        <Eyebrow>{program.eyebrow}</Eyebrow>
        <h1 className="text-4xl font-bold sm:text-5xl">{program.h1}</h1>
        <p className="mt-6 text-lg text-muted">{program.summary}</p>
      </Section>

      <Section width="narrow" className="py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold text-purple-900">This may fit if</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              {program.mayFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-purple-900">Look at alternatives if</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              {program.exploreAlternativesIf.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section width="narrow" className="py-10">
        <h2 className="text-3xl font-bold">How it works</h2>
        <Prose>
          {program.howItWorks.map((step) => (
            <div key={step.heading}>
              <h3>{step.heading}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </Prose>
      </Section>

      <Section width="narrow" className="py-10">
        <h2 className="text-3xl font-bold">What moves the outcome</h2>
        <dl className="mt-6 divide-y divide-line rounded-[--radius-lg] border border-line bg-white">
          {program.variables.map((variable) => (
            <div key={variable.label} className="p-5">
              <dt className="font-semibold text-purple-900">{variable.label}</dt>
              <dd className="mt-1 text-sm text-muted">{variable.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {program.relatedCalculators.length > 0 && (
        <Section width="narrow" className="py-10">
          <h2 className="text-3xl font-bold">Run the numbers</h2>
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

      <Section width="narrow" className="py-10">
        <SectionHeading title="Questions people actually ask" as="h2" />
        <Faq items={program.faqs} />
      </Section>

      <Section width="narrow" className="py-10">
        <h2 className="text-2xl font-bold">Sources</h2>
        <p className="mt-2 text-sm text-muted">
          Program rules change. These are the primary sources this page is written against and the
          ones we check before advising anyone.
        </p>
        <ul className="mt-4 space-y-2">
          {program.sources.map((source) => (
            <li key={source.url} className="text-sm">
              <a
                className="text-purple-700 underline underline-offset-2"
                href={source.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {source.title}
              </a>
              <span className="text-muted"> — {source.publisher}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">Last reviewed 17 August 2026.</p>
      </Section>

      {related.length > 0 && (
        <Section width="narrow" className="py-10">
          <h2 className="text-2xl font-bold">Related</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((entry) => (
              <Card as="li" key={entry.slug}>
                <Link href={`/mortgage/${entry.slug}`} className="font-semibold text-purple-800">
                  {entry.navLabel}
                </Link>
              </Card>
            ))}
          </ul>
        </Section>
      )}

      <Section width="narrow" className="py-10">
        <Card className="bg-purple-950 text-white">
          <h2 className="text-2xl font-bold text-white">Talk it through with someone licensed</h2>
          <p className="mt-3 text-purple-100">
            The page above is education. Your actual options depend on your full picture, and that
            takes a conversation. No credit pull, no application, no obligation.
          </p>
          <div className="mt-6">
            <ButtonLink href="/contact" variant="secondary" data-cta={`program-${program.slug}`}>
              Talk to a mortgage professional
            </ButtonLink>
          </div>
        </Card>
        <Disclosure
          headline="This page is educational, not an offer."
          body="TRACT Mortgage is a mortgage brokerage and arranges, but does not make, mortgage loans. Nothing here is a rate quote, a preapproval, a commitment to lend, or a statement that you qualify for any program. Program terms are set by the agency, insurer, or investor and by each lender's own overlays, and they change."
        />
      </Section>
    </>
  );
}
