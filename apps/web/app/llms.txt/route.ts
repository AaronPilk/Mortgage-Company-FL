import { ALL_ARTICLES } from "@/content/articles";
import { ARTICLE_CATEGORY_LABELS } from "@/content/articles/types";
import { PROGRAMS } from "@/content/programs";
import {
  LICENSE_PENDING_LABEL,
  SITE_URL,
  businessIdentity,
  isPreLaunch,
  loanOriginator,
  nmlsCompanyUrl,
  nmlsIndividualUrl
} from "@/lib/site";
import { absoluteUrl } from "@tract/seo";

export const dynamic = "force-static";

/**
 * llms.txt — a curated map of this site for AI answer engines.
 *
 * The file only earns its keep if it is generated from the same content
 * registries and identity the site itself renders from. A hand-written copy
 * would drift the first time an article shipped, and a stale map is worse for
 * answer accuracy than none. Every URL is on the one canonical origin
 * (ADR-011), and every licensing line comes from lib/site.ts, so a value the
 * site shows as pending is pending here too. No rate is stated, ever.
 */
export function GET(): Response {
  const url = (path: string) => absoluteUrl(SITE_URL, path);
  const identity = businessIdentity;

  const licensing = [
    `- Legal name: ${identity.legalName}`,
    identity.nmlsId === null
      ? `- Company NMLS ID: pending`
      : `- Company NMLS ID: ${identity.nmlsId} (verify: ${nmlsCompanyUrl(identity.nmlsId)})`,
    `- Loan originator: ${loanOriginator.name}, NMLS ID ${loanOriginator.nmlsId} (verify: ${nmlsIndividualUrl(loanOriginator.nmlsId)})`,
    `- Florida mortgage broker license: ${identity.companyLicenseId ?? LICENSE_PENDING_LABEL}`,
    `- Area served: ${identity.areaServed.join(", ")}`,
    ...(isPreLaunch() ? ["- Status: pre-launch. Not yet accepting mortgage applications."] : [])
  ];

  const lines: string[] = [
    `# ${identity.name}`,
    "",
    `> ${identity.legalName} is a Florida mortgage brokerage. We arrange, but do not make, mortgage loans. The site has educational guides, payment calculators that show their assumptions, and a mortgage planner. No rates are published because pricing depends on the borrower, the property, and the lock.`,
    "",
    "## Company",
    `- [Home](${url("/")}): what the brokerage does and how to reach a licensed professional`,
    `- [About](${url("/about")}): who we are and what we will not do`,
    `- [Licensing](${url("/licenses")}): licence identifiers and how to verify them`,
    `- [Contact](${url("/contact")}): talk to a mortgage professional; no application, no credit pull`,
    "",
    "## Licensing",
    ...licensing,
    "",
    "## Tools",
    `- [Mortgage planner](${url("/plan")}): step-by-step planning with a live payment estimate, no credit pull`,
    `- [Calculators](${url("/calculators")}): payment, affordability, refinance break-even, rent vs buy, cash to close, amortization, DTI, investment cash flow, DSCR, rate impact`,
    "",
    "## Loan programs",
    ...PROGRAMS.map(
      (program) =>
        `- [${program.navLabel}](${url(`/mortgage/${program.slug}`)}): ${program.description}`
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
      lines.push(`- [${article.h1}](${url(`/resources/${article.slug}`)}): ${article.description}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
