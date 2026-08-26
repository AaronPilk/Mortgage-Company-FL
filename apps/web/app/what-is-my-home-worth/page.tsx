import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section, SectionHeading } from "@/components/ui";
import { SellerWorthExperience } from "@/components/seller/home-worth";
import { publicFeatures } from "@/lib/env";
import { sellerAvmAvailable } from "@/lib/property";
import { pageMetadata } from "@/lib/metadata";
import { EMAIL_CONSENT_TEXT, LEAD_DISCLOSURE_TEXT, SMS_CONSENT_TEXT } from "@/lib/site";

/**
 * Seller funnel — /what-is-my-home-worth.
 *
 * The organic counterpart to the /get-started/sell ad campaign: an address in,
 * an estimated value out (the existing AVM), and an introduction to a real
 * estate professional as a seller lead (intent "sell_home").
 *
 * The FUNNEL is gated on the sellerTools flag alone — it renders and captures a
 * lead even with ATTOM dark. The VALUE it shows inherits ATTOM gating
 * (`sellerAvmAvailable()`), so a fabricated figure never publishes (invariant
 * 6). Noindex for now, the same pre-launch posture as /home-lookup; flip to
 * indexable once ATTOM is live and counsel has reviewed the public surface.
 */

export const metadata: Metadata = pageMetadata({
  title: "What's my home worth?",
  description:
    "See an estimated value for your Florida home, then talk to a real estate professional in our network about selling. Not an appraisal or a listing agreement.",
  path: "/what-is-my-home-worth",
  noIndex: true
});

export const dynamic = "force-dynamic";

export default function HomeWorthPage() {
  // Dark unless the seller-tools flag is on. The flag alone gates the funnel;
  // the value figure inside it is gated separately by sellerAvmAvailable().
  if (!publicFeatures().sellerTools) notFound();

  return (
    <Section width="wide">
      <SectionHeading
        as="h1"
        eyebrow="Thinking of selling?"
        title="What's my home worth?"
        description="Enter your address for an estimated value, then we'll connect you with a real estate professional in our network. TRACT brokers mortgages, not homes — this is a connection, not a listing agreement."
      />
      <SellerWorthExperience
        avmAvailable={sellerAvmAvailable()}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        disclosureText={LEAD_DISCLOSURE_TEXT}
        smsConsentText={SMS_CONSENT_TEXT}
        emailConsentText={EMAIL_CONSENT_TEXT}
      />
      <p
        className="mt-10 border-t pt-6 text-sm"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        Any value shown is an automated estimate from public records — not an appraisal, a list
        price, or an offer. TRACT is a mortgage brokerage and does not list or sell homes; we make
        an introduction to a licensed real estate professional, and nothing here is a listing
        agreement.
      </p>
    </Section>
  );
}
