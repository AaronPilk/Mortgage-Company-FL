import type { Metadata } from "next";
import Link from "next/link";
import { Disclosure, Faq, Prose, Section, SectionHeading } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { businessIdentity, SITE_URL } from "@/lib/site";
import {
  GLOSSARY_AS_OF,
  GLOSSARY_CATEGORY_LABELS,
  GLOSSARY_CATEGORY_ORDER,
  GLOSSARY_TERMS,
  definedTermSetNode,
  glossaryTermsByCategory
} from "@/lib/glossary-data";
import { absoluteUrl, breadcrumbNode, faqNode, graph, webPageNode } from "@tract/seo";

/**
 * Mortgage glossary hub.
 *
 * Terms are grouped by category and each one shows its short definition beside a
 * link to its own page — the definitions are genuinely on the page, which is the
 * only condition under which the DefinedTermSet markup is honest. The FAQ block
 * is rendered visibly for the same reason its FAQ markup is emitted: schema must
 * match what a visitor can see.
 */

/** Rendered visibly below, so the FAQ schema mirrors on-page content. */
const HUB_FAQS = [
  {
    question: "Is this glossary legal or financial advice?",
    answer:
      "No. These are plain-language definitions to help you understand mortgage and Florida home-buying vocabulary. They are educational, not advice about your situation, and nothing here is an offer of credit. A licensed loan officer confirms what applies to you."
  },
  {
    question: "Why don't the Florida tax entries quote a rate?",
    answer:
      "Because property-tax millage is set locally each year and varies by county, so any number printed here would go stale. Those entries explain how the tax works and point you to the county Property Appraiser for the current figure."
  },
  {
    question: "How current is this glossary?",
    answer:
      "It is reviewed as a set and dated at the bottom of the page. Program rules, tax figures, and insurance costs change, so entries link to primary sources and tools that carry the current specifics rather than freezing a number in place."
  },
  {
    question: "Can I get help applying a term to my own purchase?",
    answer:
      "Yes. Each definition links to related guides and calculators, and you can talk it through with a licensed mortgage professional — no credit pull, no application, no obligation."
  }
];

export const metadata: Metadata = pageMetadata({
  title: "Mortgage Glossary",
  description:
    "Plain-language definitions of mortgage and Florida home-buying terms — from APR and PITI to homestead, flood insurance, and down payment assistance.",
  path: "/mortgage-glossary"
});

export default function MortgageGlossaryPage() {
  const url = absoluteUrl(SITE_URL, "/mortgage-glossary");

  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: "Mortgage & Florida Home-Buying Glossary",
              description:
                "Plain-language definitions of mortgage and Florida home-buying terms, grouped by topic.",
              dateModified: "2026-08-25"
            }),
            breadcrumbNode([
              { name: "Home", url: absoluteUrl(SITE_URL, "/") },
              { name: "Mortgage glossary", url }
            ]),
            // The full DefinedTermSet, with every term's definition — honest only
            // because those definitions are rendered on this page below.
            definedTermSetNode(GLOSSARY_TERMS, SITE_URL),
            // Rendered visibly in the FAQ section further down.
            faqNode(HUB_FAQS, true)
          ],
          businessIdentity
        )}
      />

      <Section width="narrow" orbs>
        <SectionHeading
          as="h1"
          eyebrow="Reference"
          title="Mortgage and Florida home-buying glossary"
          gradientWord="glossary"
          description="The vocabulary of buying a home, in plain language — including the Florida-specific terms (homestead, flood, millage, Citizens) the national glossaries leave out."
        />

        <Prose>
          <p>
            Every term below links to a fuller explanation, and the definitions here defer any
            figure that changes — a tax rate, a premium, a program limit — to its primary source
            rather than stating it as fact. Start anywhere, or jump into the{" "}
            <Link href="/florida-buyers-guide">first-time buyer&apos;s guide</Link> or the{" "}
            <Link href="/resources">full resource library</Link>.
          </p>
        </Prose>

        <div className="mt-10 space-y-12">
          {GLOSSARY_CATEGORY_ORDER.map((category) => {
            const terms = glossaryTermsByCategory(category);
            if (terms.length === 0) return null;
            return (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h2
                  id={`cat-${category}`}
                  className="text-xs font-bold uppercase tracking-[0.14em]"
                  style={{ color: "var(--purple)" }}
                >
                  {GLOSSARY_CATEGORY_LABELS[category]}
                </h2>
                <dl className="mt-4 divide-y" style={{ borderColor: "var(--border)" }}>
                  {terms.map((term) => (
                    <div key={term.slug} className="py-4">
                      <dt>
                        <Link
                          href={`/mortgage-glossary/${term.slug}`}
                          className="text-lg font-semibold underline underline-offset-4"
                          style={{ color: "var(--purple)" }}
                        >
                          {term.term}
                        </Link>
                      </dt>
                      <dd className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                        {term.short}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-bold text-[var(--text)]">Common questions</h2>
          <div className="mt-6">
            <Faq items={HUB_FAQS} />
          </div>
        </div>

        <div
          className="mt-12 rounded-2xl border p-6"
          style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
        >
          <h2 className="text-lg font-semibold text-[var(--text)]">Put a term to work</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Definitions are the easy half. Run your own numbers in the{" "}
            <Link href="/calculators" className="underline" style={{ color: "var(--purple)" }}>
              calculators
            </Link>
            , compare{" "}
            <Link href="/mortgage" className="underline" style={{ color: "var(--purple)" }}>
              loan programs
            </Link>
            , or{" "}
            <Link href="/contact" className="underline" style={{ color: "var(--purple)" }}>
              talk to a licensed mortgage professional
            </Link>
            .
          </p>
        </div>

        <p className="mt-8 text-xs text-[var(--text-muted)]">Current as of {GLOSSARY_AS_OF}.</p>

        <Disclosure
          headline="Definitions for education, not advice about your situation."
          body="These entries explain how mortgage and Florida home-buying concepts generally work. They are not financial, legal, or tax advice, not an offer of credit or a rate quote, and specifics change. Confirm any figure against the responsible official source — the county Property Appraiser for tax numbers — and a licensed loan officer confirms what you qualify for. TRACT Mortgage arranges, but does not make, mortgage loans."
        />
      </Section>
    </>
  );
}
