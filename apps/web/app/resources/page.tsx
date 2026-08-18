import type { Metadata } from "next";
import Link from "next/link";
import { Card, CtaPanel, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { ALL_ARTICLES } from "@/content/articles";
import { ARTICLE_CATEGORY_LABELS, type ArticleCategory } from "@/content/articles/types";

export const metadata: Metadata = pageMetadata({
  title: "Florida mortgage guides and explainers",
  description:
    "Plain-language guides to Florida mortgages: programs, insurance, condos, investing, refinancing, and qualifying — written against primary sources.",
  path: "/resources"
});

const CATEGORY_ORDER: ArticleCategory[] = [
  "basics",
  "first-time",
  "programs",
  "florida-costs",
  "condo",
  "qualification",
  "refinance",
  "investor",
  "construction",
  "local"
];

/**
 * Resource library index.
 *
 * Grouped by the question a reader has, not by when we published. A flat
 * reverse-chronological feed is how blogs are organised; a library grouped by
 * situation is how people actually look for an answer.
 */
export default function ResourcesPage() {
  const byCategory = new Map<ArticleCategory, typeof ALL_ARTICLES>();
  for (const article of ALL_ARTICLES) {
    const bucket = byCategory.get(article.category) ?? [];
    bucket.push(article);
    byCategory.set(article.category, bucket);
  }

  return (
    <>
      <Section orbs>
        <SectionHeading
          as="h1"
          eyebrow="Resources"
          title="Guides worth the time"
          gradientWord="worth the time"
          description={`${ALL_ARTICLES.length} plain-language guides, each written against the primary sources it cites, answer-first, and dated. No rates, no hype, no filler.`}
        />

        <nav aria-label="Guide categories" className="mb-12">
          <ul className="flex flex-wrap gap-2.5">
            {CATEGORY_ORDER.map((category) => (
              <li key={category}>
                <a
                  href={`#${category}`}
                  className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--purple)] hover:text-[var(--purple)]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  {ARTICLE_CATEGORY_LABELS[category]}
                  <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {byCategory.get(category)?.length ?? 0}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16">
          {CATEGORY_ORDER.map((category) => {
            const articles = byCategory.get(category);
            if (articles === undefined || articles.length === 0) return null;
            return (
              <section key={category} id={category} className="scroll-mt-24">
                <h2 className="text-2xl font-bold">{ARTICLE_CATEGORY_LABELS[category]}</h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article) => (
                    <Card as="li" key={article.slug} interactive className="!p-0">
                      <Link href={`/resources/${article.slug}`} className="block h-full p-5">
                        <h3 className="font-semibold leading-snug text-[var(--text)]">
                          {article.h1}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                          {article.description}
                        </p>
                      </Link>
                    </Card>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </Section>

      <Section pad="tight" className="pb-16 sm:pb-24">
        <CtaPanel
          title="Reading only gets you so far"
          body="When the general answer is not your answer, run your numbers through the planner or ask a licensed mortgage professional directly. No credit pull, no obligation."
          primary={{ href: "/plan", label: "Start planning", cta: "resources-index" }}
          secondary={{ href: "/contact", label: "Talk to a professional" }}
        />
      </Section>
    </>
  );
}
