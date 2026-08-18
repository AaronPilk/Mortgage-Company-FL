import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaPanel, Disclosure, Eyebrow, Faq, Section } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { businessIdentity, SITE_URL } from "@/lib/site";
import { ALL_ARTICLES, articleBySlug } from "@/content/articles";
import { ARTICLE_CATEGORY_LABELS } from "@/content/articles/types";
import { absoluteUrl, articleNode, breadcrumbNode, faqNode, graph, webPageNode } from "@tract/seo";

export function generateStaticParams() {
  return ALL_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (article === undefined)
    return pageMetadata({
      title: "Guide not found",
      description: "",
      path: "/resources",
      noIndex: true
    });
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: `/resources/${article.slug}`
  });
}

/**
 * Article template.
 *
 * The answer comes first. A reader — or an answer engine — gets the direct
 * response to the title's question in the opening box, then the depth below it.
 * Structure is guaranteed by the type: summary, sections, visible FAQs (the
 * only condition under which FAQ schema is emitted), sources, and a route into
 * the planner or a calculator.
 */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (article === undefined) notFound();

  const url = absoluteUrl(SITE_URL, `/resources/${article.slug}`);

  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: article.title,
              description: article.description,
              dateModified: article.lastReviewed
            }),
            breadcrumbNode([
              { name: "Home", url: absoluteUrl(SITE_URL, "/") },
              { name: "Resources", url: absoluteUrl(SITE_URL, "/resources") },
              { name: article.h1, url }
            ]),
            articleNode({
              url,
              headline: article.title,
              description: article.description,
              datePublished: article.publishedAt,
              dateModified: article.lastReviewed,
              authorName: `${businessIdentity.brandName} editorial team`,
              authorType: "Organization",
              identity: businessIdentity
            }),
            faqNode(article.faqs, true)
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
          <Link href="/resources" className="hover:text-[var(--purple)]">
            Resources
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{ARTICLE_CATEGORY_LABELS[article.category]}</span>
        </nav>
        <Eyebrow>{ARTICLE_CATEGORY_LABELS[article.category]}</Eyebrow>
        <h1 className="text-4xl sm:text-5xl">{article.h1}</h1>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          By the {businessIdentity.brandName} editorial team · Last reviewed{" "}
          {formatDate(article.lastReviewed)}
        </p>

        {/* The direct answer, first. This is the passage built to be quoted. */}
        <div
          className="mt-8 rounded-2xl border-l-4 p-6"
          style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--purple)]">
            The short answer
          </p>
          <p className="mt-2 text-lg leading-relaxed text-[var(--text)]">{article.answerSummary}</p>
        </div>
      </Section>

      <Section width="narrow" pad="tight">
        <div className="prose-measure space-y-10">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-bold">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-4 text-[1.06rem] leading-[1.75] text-[var(--text-muted)]"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets !== undefined && (
                <ul className="mt-4 list-disc space-y-2 pl-6 text-[1.02rem] text-[var(--text-muted)]">
                  {section.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 40)}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </Section>

      <Section width="narrow" pad="tight">
        <h2 className="text-2xl font-bold">Questions people ask</h2>
        <div className="mt-6">
          <Faq items={article.faqs} />
        </div>
      </Section>

      <Section width="narrow" pad="tight">
        <h2 className="text-xl font-bold">Sources</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          This guide is written against the primary sources below, which is where the current
          figures live when a figure has deliberately not been quoted here.
        </p>
        <ul className="mt-4 space-y-2">
          {article.sources.map((source) => (
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
      </Section>

      {article.related.length > 0 && (
        <Section width="narrow" pad="tight">
          <h2 className="text-xl font-bold">Keep going</h2>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {article.related.map((item) => (
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
        </Section>
      )}

      <Section width="narrow" pad="tight" className="pb-16 sm:pb-24">
        <CtaPanel
          title="Put this to work on your own numbers"
          body="Reading is the easy half. Run your own scenario through the planner, or ask a licensed mortgage professional the question this page could not answer for your exact situation."
          primary={{
            href: "/plan",
            label: "Start planning",
            cta: `article-${article.slug}`
          }}
          secondary={{ href: "/contact", label: "Talk to a professional" }}
        />
        <Disclosure
          headline="Education, not advice — and never an offer."
          body="This guide explains how a part of mortgage finance generally works. It is not financial, legal, or tax advice, not an offer of credit, a rate quote, or a preapproval, and program rules change. TRACT Mortgage is a Florida mortgage brokerage: we arrange, but do not make, mortgage loans."
        />
      </Section>
    </>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });
}
