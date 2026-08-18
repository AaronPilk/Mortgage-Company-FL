import type { BusinessIdentity } from "@tract/seo";

/**
 * Business identity.
 *
 * Every licensing, address, and telephone field is null until the real value is
 * issued and confirmed on the public record. The UI renders a visible pending
 * state for a null; it never renders a placeholder that reads like a fact.
 *
 * Owner: the principal loan originator. Changing any value here is a compliance
 * action, not a copy edit.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME ?? "TRACT Mortgage";

export const businessIdentity: BusinessIdentity = {
  legalName: "TRACT Mortgage",
  brandName: BRAND_NAME,
  siteUrl: SITE_URL,
  logoPath: "/brand/wordmark.svg",
  nmlsId: null,
  companyLicenseId: null,
  telephone: null,
  address: null,
  areaServed: ["Florida"],
  sameAs: []
};

export type LicensingStatus = {
  companyLicensed: boolean;
  principalLoanOriginatorNamed: boolean;
  nmlsRecordPublic: boolean;
};

/**
 * Until every value here is true, the site must not claim the company can
 * arrange Florida residential mortgage credit, and paid mortgage advertising
 * must stay off. This flag drives the pre-launch banner and the readiness board.
 */
export const licensingStatus: LicensingStatus = {
  companyLicensed: false,
  principalLoanOriginatorNamed: false,
  nmlsRecordPublic: false
};

export function isPreLaunch(): boolean {
  return !(
    licensingStatus.companyLicensed &&
    licensingStatus.principalLoanOriginatorNamed &&
    licensingStatus.nmlsRecordPublic
  );
}

export const LEAD_DISCLOSURE_VERSION = "lead-disclosure@2026-08-17";

export const LEAD_DISCLOSURE_TEXT =
  "By submitting this form you are asking a licensed mortgage professional to contact you about financing. " +
  "This is not an application for credit, and submitting it does not obligate you to anything. " +
  "We do not pull your credit from this form.";

export const SMS_CONSENT_TEXT =
  "Text me updates about my inquiry. Message and data rates may apply. Message frequency varies. " +
  "Reply STOP to opt out at any time. Consent is not a condition of any service.";

export const EMAIL_CONSENT_TEXT =
  "Email me mortgage education and market updates. You can unsubscribe at any time.";

export const VISION_REPORT_DISCLOSURE_VERSION = "vision-report-request@1.0.0";

export const VISION_REPORT_DISCLOSURE_TEXT =
  "By submitting this request you are asking TRACT to retain this planning scenario and contact you about it. " +
  "The preview is an illustration based on inputs you can change. It is not an appraisal, construction bid, " +
  "credit application, approval, rate quote, zoning opinion, or investment recommendation.";
