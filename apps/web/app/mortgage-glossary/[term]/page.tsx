import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Disclosure, Eyebrow, Prose, Section } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { businessIdentity, SITE_URL } from "@/lib/site";
import {
  GLOSSARY_AS_OF,
  GLOSSARY_CATEGORY_LABELS,
  GLOSSARY_TERMS,
  definedTermNode,
  glossaryTermBySlug
} from "@/lib/glossary-data";
import { absoluteUrl, breadcrumbNode, graph, webPageNode } from "@tract/seo";

/**
 * Glossary term page.
 *
 * One page per defined term. Only the slugs in the glossary render; anything
 * else is a 404 (dynamicParams=false). Each page emits a DefinedTerm node whose
 * definition matches the prose on the page, and links back to the hub and out to
 * the related guides and tools the definition references.
 */

export function generateStaticParams() {
  return GLOSSARY_TERMS.map((entry) => ({ term: entry.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params
}: {
  params: Promise<{ term: string }>;
}): Promise<Metadata> {
  const { term: slug } = await params;
  const term = glossaryTermBySlug(slug);
  if (term === undefined)
    return pageMetadata({
      title: "Term not found",
      description: "",
      path: "/mortgage-glossary",
      noIndex: true
    });
  return pageMetadata({
    title: term.term,
    description: term.short,
    path: `/mortgage-glossary/${term.slug}`
  });
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ term: string }> }) {
  const { term: slug } = await params;
  const term = glossaryTermBySlug(slug);
  if (term === undefined) notFound();

  const url = absoluteUrl(SITE_URL, `/mortgage-glossary/${term.slug}`);
  const categoryLabel = GLOSSARY_CATEGORY_LABELS[term.category];

  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: term.term,
              description: term.short,
              dateModified: "2026-08-25"
            }),
            breadcrumbNode([
              { name: "Home", url: absoluteUrl(SITE_URL, "/") },
              { name: "Mortgage glossary", url: absoluteUrl(SITE_URL, "/mortgage-glossary") },
              { name: term.term, url }
            ]),
            definedTermNode(term, SITE_URL)
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
          <Link href="/mortgage-glossary" className="hover:text-[var(--purple)]">
            Glossary
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{term.term}</span>
        </nav>

        <Eyebrow>{categoryLabel}</Eyebrow>
        <h1 className="text-4xl sm:text-5xl">{term.term}</h1>
        {term.aliases !== undefined && term.aliases.length > 0 && (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Also called: {term.aliases.join(", ")}
          </p>
        )}

        {/* The direct definition, first — the passage built to be quoted. */}
        <div
          className="mt-8 rounded-2xl border-l-4 p-6"
          style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--purple)]">
            In short
          </p>
          <p className="mt-2 text-lg leading-relaxed text-[var(--text)]">{term.short}</p>
        </div>
      </Section>

      <Section width="narrow" pad="tight">
        <Prose>
          {term.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </Prose>
      </Section>

      <Section width="narrow" pad="tight">
        <h2 className="text-xl font-bold text-[var(--text)]">Related</h2>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {term.related.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--purple)] hover:text-[var(--purple)]"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm">
          <Link
            href="/mortgage-glossary"
            className="font-semibold underline underline-offset-4"
            style={{ color: "var(--purple)" }}
          >
            ← Back to the full glossary
          </Link>
        </p>
        <p className="mt-6 text-xs text-[var(--text-muted)]">Current as of {GLOSSARY_AS_OF}.</p>

        <Disclosure
          headline="A definition for education, not advice about your situation."
          body="This explains how the term generally works. It is not financial, legal, or tax advice, not an offer of credit or a rate quote, and specifics change. Confirm any figure against the responsible official source — the county Property Appraiser for Florida tax numbers — and a licensed loan officer confirms what you qualify for. Wholesale Mortgage Lending arranges, but does not make, mortgage loans."
        />
      </Section>
    </>
  );
}
