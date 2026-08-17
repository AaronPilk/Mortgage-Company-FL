import type { Metadata } from "next";
import { MortgagePlanner } from "@/components/mortgage/mortgage-planner";
import { Disclosure, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { EMAIL_CONSENT_TEXT, LEAD_DISCLOSURE_TEXT, SMS_CONSENT_TEXT } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Build a Florida mortgage plan",
  description:
    "Create an immediate mortgage planning range, save it locally, or choose to ask TRACT for a review.",
  path: "/mortgage/plan",
  noIndex: true
});

export default function MortgagePlanPage() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Mortgage planner"
        title="Build a useful plan before sharing your information"
        gradientWord="before sharing"
        description="Five short steps. The estimate runs in your browser, shows its assumptions, and does not require an account or contact details."
      />
      <MortgagePlanner
        disclosureText={LEAD_DISCLOSURE_TEXT}
        smsConsentText={SMS_CONSENT_TEXT}
        emailConsentText={EMAIL_CONSENT_TEXT}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />
      <Disclosure
        headline="This is planning—not an application or a rate quote."
        body="The result uses visitor inputs and visible assumptions. It does not pull credit, establish eligibility, account for every lender rule, or commit anyone to lend."
      />
    </Section>
  );
}
