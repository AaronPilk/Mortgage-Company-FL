import type { Metadata } from "next";
import Link from "next/link";
import { Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { GuideRequest } from "@/components/lead-magnet/guide-request";
import { pageMetadata } from "@/lib/metadata";
import { businessIdentity, SITE_URL } from "@/lib/site";
import { absoluteUrl, breadcrumbNode, graph, webPageNode } from "@tract/seo";

/**
 * Florida first-time buyer's guide — the indexable landing page.
 *
 * This page ranks; the guide it unlocks does not. The landing describes what the
 * guide covers (section titles only, not the guide's body) and mounts the gated
 * request form. The on-page guide itself lives at /florida-buyers-guide/guide and
 * renders noindex, so the education is genuinely available without competing with
 * this page for the same query. Nothing here is an application or an offer of
 * credit — the exchange is an email for a guide, not a qualification.
 */

const GUIDE_HREF = "/florida-buyers-guide/guide";

/**
 * The guide's outline — section titles only. Passed to both the "what's inside"
 * list and the request form's unlocked table of contents so they never drift
 * apart. Kept local (not exported) so this route module exposes only the
 * standard Next.js exports.
 */
const GUIDE_OUTLINE = [
  "How much home you can actually afford in Florida",
  "The real monthly cost: taxes, insurance, and flood",
  "Down payments and Florida assistance programs",
  "Choosing a loan: conventional, FHA, VA, and USDA",
  "Credit, DTI, and getting preapproved",
  "Making an offer and the path to closing",
  "A plain-language glossary and your next step"
];

export const metadata: Metadata = pageMetadata({
  title: "Florida First-Time Buyer's Guide",
  description:
    "A free, plain-language guide to buying your first home in Florida: what you can afford, the real monthly cost, down-payment help, loan options, and closing.",
  path: "/florida-buyers-guide"
});

export default function FloridaBuyersGuideLandingPage() {
  const url = absoluteUrl(SITE_URL, "/florida-buyers-guide");

  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: "Florida First-Time Buyer's Guide",
              description:
                "A free, plain-language guide to buying your first home in Florida, from affordability to closing.",
              dateModified: "2026-08-25"
            }),
            breadcrumbNode([
              { name: "Home", url: absoluteUrl(SITE_URL, "/") },
              { name: "Florida First-Time Buyer's Guide", url }
            ])
          ],
          businessIdentity
        )}
      />

      <Section width="narrow" orbs>
        <SectionHeading
          as="h1"
          eyebrow="Free guide"
          title="The Florida first-time buyer's guide"
          gradientWord="buyer's guide"
          description="Buying your first home in Florida has a few twists the national guides skip — insurance, flood, and how the tax bill resets after a sale. This one is written for that."
        />

        <Prose>
          <p>
            This is a genuine, no-pressure walkthrough of buying your first home in Florida: how
            much you can really afford once insurance and taxes are in the picture, which loan and
            assistance options exist, and what actually happens between your offer and your keys. It
            is education, not an application — you can read the whole thing, and nothing here pulls
            your credit or commits you to anything.
          </p>
        </Prose>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text)]">What&apos;s inside</h2>
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-[var(--text-muted)]">
              {GUIDE_OUTLINE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-[var(--text-muted)]">
              Prefer to browse first? The{" "}
              <Link
                href="/mortgage/first-time-home-buyers"
                className="font-semibold underline"
                style={{ color: "var(--purple)" }}
              >
                first-time buyer program page
              </Link>{" "}
              and the{" "}
              <Link
                href="/mortgage-glossary"
                className="font-semibold underline"
                style={{ color: "var(--purple)" }}
              >
                mortgage glossary
              </Link>{" "}
              are open to everyone, no form required.
            </p>
          </Card>

          <GuideRequest
            guideHref={GUIDE_HREF}
            tableOfContents={GUIDE_OUTLINE}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          />
        </div>

        <Disclosure
          headline="This is a free educational guide, not an application or an offer of credit."
          body="Requesting the guide is not a mortgage application and does not result in a credit inquiry or obligate you to anything. Wholesale Mortgage Lending is a Florida mortgage brokerage: we arrange, but do not make, mortgage loans. Program terms, tax figures, and insurance costs change and are property-specific — confirm them with the responsible official source, and a licensed loan officer confirms what you actually qualify for."
        />
      </Section>
    </>
  );
}
