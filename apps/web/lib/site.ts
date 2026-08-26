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

/**
 * Two names, one identity. The COMPANY is Wholesale Mortgage Lending — the legal,
 * licensed (pending) brokerage entity that the compliance statements, the NMSL
 * record, and the ad front door all attach to. The PRODUCT is TRACT — the
 * platform people actually use (calculators, properties, home value, the loan
 * portal). The site runs under one domain and one SEO identity: "TRACT, powered
 * by Wholesale Mortgage Lending." In schema, the company is the Organization name
 * and TRACT is its brand/alternateName (see @tract/seo organizationNode).
 */
export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Wholesale Mortgage Lending";
export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "TRACT";
/**
 * The company's own marketing domain — the Wholesale Mortgage Lending front door
 * (wsmlending.com), a separate domain from this product app (tractrealestate.com).
 * They are one brand: the footer links here and the org schema lists it as the
 * same entity (sameAs), which is how two domains read as one SEO umbrella.
 */
export const COMPANY_URL = process.env.NEXT_PUBLIC_COMPANY_URL ?? "https://wsmlending.com";
/** Kept for existing callers; the product brand shown in the UI. */
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME ?? PRODUCT_NAME;

export const businessIdentity: BusinessIdentity = {
  legalName: COMPANY_NAME,
  brandName: BRAND_NAME,
  siteUrl: SITE_URL,
  logoPath: "/brand/wml-logo.png",
  nmlsId: null,
  companyLicenseId: null,
  telephone: null,
  address: null,
  areaServed: ["Florida"],
  // The company's other domain, so search engines read wsmlending.com and this
  // product domain as one entity rather than two unrelated sites.
  sameAs: [COMPANY_URL]
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
  "Email me mortgage education and market updates. You can unsubscribe at any time. " +
  "Consent is not a condition of any service.";

export const VISION_REPORT_DISCLOSURE_VERSION = "vision-report-request@1.0.0";

export const VISION_REPORT_DISCLOSURE_TEXT =
  "By submitting this request you are asking TRACT to retain this planning scenario and contact you about it. " +
  "The preview is an illustration based on inputs you can change. It is not an appraisal, construction bid, " +
  "credit application, approval, rate quote, zoning opinion, or investment recommendation.";
