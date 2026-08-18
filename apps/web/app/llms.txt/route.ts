import { ALL_ARTICLES } from "@/content/articles";
import { ARTICLE_CATEGORY_LABELS } from "@/content/articles/types";
import { PROGRAMS } from "@/content/programs";
import { SITE_URL, businessIdentity } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms.txt — a curated map of this site for AI answer engines.
 *
 * The file only earns its keep if it is generated from the same content
 * registries the site itself renders from. A hand-written copy would drift the
 * first time an article shipped, and a stale map is worse for answer accuracy
 * than none.
 */
export function GET(): Response {
  const lines: string[] = [
    `# ${businessIdentity.brandName}`,
    "",
    `> A Florida mortgage brokerage. We arrange, but do not make, mortgage loans. Educational guides, payment calculators that show their assumptions, and a mortgage planner — no rates are published because pricing depends on the borrower, the property, and the lock.`,
    "",
    "## Tools",
    `- [Mortgage planner](${SITE_URL}/plan): step-by-step planning with a live payment estimate, no credit pull`,
    `- [Calculators](${SITE_URL}/calculators): payment, affordability, refinance break-even, rent vs buy, cash to close, amortization, DTI, investment cash flow, DSCR, rate impact`,
    "",
    "## Loan programs",
    ...PROGRAMS.map(
      (program) =>
        `- [${program.navLabel}](${SITE_URL}/mortgage/${program.slug}): ${program.description}`
    ),
    ""
  ];

  const byCategory = new Map<string, typeof ALL_ARTICLES>();
  for (const article of ALL_ARTICLES) {
    const label = ARTICLE_CATEGORY_LABELS[article.category];
    const bucket = byCategory.get(label) ?? [];
    bucket.push(article);
    byCategory.set(label, bucket);
  }
  for (const [label, articles] of byCategory) {
    lines.push(`## Guides: ${label}`);
    for (const article of articles) {
      lines.push(
        `- [${article.h1}](${SITE_URL}/resources/${article.slug}): ${article.description}`
      );
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
