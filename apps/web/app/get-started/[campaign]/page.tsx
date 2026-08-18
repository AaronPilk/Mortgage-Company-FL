import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Disclosure, LicenseFact, Section } from "@/components/ui";
import { HomeFunnel } from "@/components/home-funnel";
import { pageMetadata } from "@/lib/metadata";
import {
  EMAIL_CONSENT_TEXT,
  LEAD_DISCLOSURE_TEXT,
  LEAD_DISCLOSURE_VERSION,
  SMS_CONSENT_TEXT,
  businessIdentity
} from "@/lib/site";
import { CAMPAIGNS, campaignBySlug } from "@/content/campaigns";

/**
 * Campaign landing template.
 *
 * One layout for every /get-started/ page: compact campaign-matched hero, the
 * funnel immediately, a short what-happens-next strip, then the same licence
 * and disclosure block the homepage renders. The standard site header and
 * footer come from the root layout on purpose — the page limits its own
 * internal links rather than hiding the chrome.
 *
 * Every campaign is noIndex: these pages exist to receive paid clicks and must
 * not compete with the organic program pages (and the site is pre-launch).
 */

export function generateStaticParams() {
  return CAMPAIGNS.map((campaign) => ({ campaign: campaign.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ campaign: string }>;
}): Promise<Metadata> {
  const { campaign: slug } = await params;
  const campaign = campaignBySlug(slug);
  if (campaign === undefined) {
    return pageMetadata({ title: "Page not found", description: "", path: "/", noIndex: true });
  }
  return pageMetadata({
    title: campaign.metaTitle,
    description: campaign.metaDescription,
    path: `/get-started/${campaign.slug}`,
    noIndex: true
  });
}

export default async function CampaignLandingPage({
  params
}: {
  params: Promise<{ campaign: string }>;
}) {
  const { campaign: slug } = await params;
  const campaign = campaignBySlug(slug);
  if (campaign === undefined) notFound();

  return (
    <>
      {/* Compact hero: the ad's promise restated, then straight to the funnel. */}
      <Section orbs pad="tight">
        <div className="mx-auto max-w-2xl text-center">
          <p
            className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{
              borderColor: "var(--border)",
              background: "var(--purple-subtle)",
              color: "var(--purple)"
            }}
          >
            {campaign.eyebrow}
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">{campaign.headline}</h1>
          <p className="mt-4 text-lg" style={{ color: "var(--text-muted)" }}>
            {campaign.subhead}
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
            {campaign.chips.map((chip) => (
              <li key={chip}>
                <Badge tone="neutral">{chip}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-10 max-w-xl">
          <HomeFunnel
            formId={`campaign-${campaign.slug}`}
            disclosureText={LEAD_DISCLOSURE_TEXT}
            smsConsentText={SMS_CONSENT_TEXT}
            emailConsentText={EMAIL_CONSENT_TEXT}
            disclosureVersion={LEAD_DISCLOSURE_VERSION}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            preset={campaign.funnel}
          />
        </div>
      </Section>

      {/* What happens next. Short, honest, and free of outcome promises. */}
      <Section tone="surface" pad="tight">
        <Card className="mx-auto max-w-2xl">
          <h2 className="text-lg font-semibold text-[var(--text)]">What happens next</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--text-muted)]">
            {campaign.whatHappensNext.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>
        {/* Quiet path to the organic education page for visitors who want to
            read before they talk. Deliberately small: the funnel above remains
            the page's one job. */}
        {campaign.educationLink !== undefined && (
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm">
            <Link
              href={campaign.educationLink.href}
              className="font-medium underline underline-offset-4"
              style={{ color: "var(--purple)" }}
            >
              {campaign.educationLink.label}
            </Link>
          </p>
        )}
      </Section>

      {/* The standard licence and disclosure block, exactly as the homepage. */}
      <Section width="narrow" className="!pt-0">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <LicenseFact label="Company NMLS ID" value={businessIdentity.nmlsId} />
          <LicenseFact
            label="Florida mortgage broker license"
            value={businessIdentity.companyLicenseId}
          />
          <Badge tone="neutral">Pre-launch</Badge>
        </div>
        <Disclosure
          headline="Nothing on this page is an offer of credit."
          body="TRACT Mortgage is a mortgage brokerage. We arrange, but do not make, mortgage loans. Sending this form is not an application, does not result in a credit inquiry, and does not obligate you to anything. Loan terms and availability depend on the lender, the loan program, the property, and a complete review of your application."
        />
      </Section>
    </>
  );
}
