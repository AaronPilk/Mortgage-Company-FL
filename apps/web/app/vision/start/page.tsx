import type { Metadata } from "next";
import { Disclosure, Section, SectionHeading } from "@/components/ui";
import { VisionWizard } from "@/components/vision/wizard";
import { pageMetadata } from "@/lib/metadata";
import {
  EMAIL_CONSENT_TEXT,
  LEAD_DISCLOSURE_TEXT,
  LEAD_DISCLOSURE_VERSION,
  SMS_CONSENT_TEXT
} from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Model a property scenario",
  description:
    "Run a renovation, rental, construction, or flip scenario in your browser and see the result before giving any contact details.",
  path: "/vision/start",
  noIndex: true
});

/**
 * The Vision workspace.
 *
 * Deliberately noindex. A tool page competes with nothing in search, and its
 * value is that someone arrives here from `/vision` already knowing what it
 * does and does not claim.
 */
export default function VisionStartPage() {
  return (
    <Section width="wide" orbs>
      <SectionHeading
        as="h1"
        eyebrow="TRACT Vision"
        title="Model it before you commit"
        gradientWord="before you commit"
        description="Four steps, no contact details, and a result you can read on the same screen as the assumptions that produced it."
      />

      <VisionWizard
        disclosureText={LEAD_DISCLOSURE_TEXT}
        disclosureVersion={LEAD_DISCLOSURE_VERSION}
        smsConsentText={SMS_CONSENT_TEXT}
        emailConsentText={EMAIL_CONSENT_TEXT}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />

      <Disclosure
        headline="A scenario model, not an appraisal."
        body="Every figure this tool produces is arithmetic on assumptions you chose and labelled placeholders we supplied. No comparable sales, contractor bids, cost databases, or rent data are used anywhere in it. Nothing here is an appraisal, a valuation, a broker price opinion, an offer of credit, or a guarantee of value, rent, cost, or return."
        excludes={[
          "Zoning, permitted use, setbacks, and any deed or association restriction — verify with the applicable planning authority",
          "Permit feasibility, review timelines, and impact fees — verify with the building department having jurisdiction",
          "Flood zone, base flood elevation, and elevation certificate requirements — verify with FEMA and the local floodplain administrator",
          "Property insurance availability and cost — get a quote from a licensed agent",
          "Income tax, depreciation, and entity structure — those belong with a tax professional"
        ]}
      />
    </Section>
  );
}
