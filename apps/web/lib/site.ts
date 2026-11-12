import type { BusinessIdentity } from "@tract/seo";

/**
 * Business identity.
 *
 * Every licensing, address, and telephone field is null until the real value is
 * known from a source we can name. The UI renders a visible pending state for a
 * null; it never renders a placeholder that reads like a fact.
 *
 * Owner: the principal loan originator. Changing any value here is a compliance
 * action, not a copy edit. Sources are recorded in docs/seo/README.md and
 * docs/architecture/decisions.md (ADR-012).
 */

/**
 * The one canonical origin (ADR-011): https://wsmlending.com in production.
 * Read at build time; every canonical, sitemap URL, og:url and JSON-LD @id is
 * built from it.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Two names, one site. The COMPANY is Wholesale Mortgage Lending, the brokerage
 * entity the compliance statements, the NMLS record and the domain attach to.
 * The PRODUCT is TRACT, the platform people use (calculators, properties, home
 * value, the loan portal). Both live on the company domain: the landing at "/"
 * and the TRACT product home at /tract. In schema the company is the
 * Organization and TRACT its alternateName (see @tract/seo organizationNode).
 */
export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Wholesale Mortgage Lending";
/** As shown in Dan's NMLS portal account list, relayed by the owner 12 Nov 2026. */
export const COMPANY_LEGAL_NAME = "Wholesale Mortgage Lending LLC";
export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "TRACT";
/**
 * The company's domain. Since the one-domain decision it is the same origin as
 * SITE_URL; scripts/check-site-url.mjs refuses a build where the two differ.
 * Kept as a name so links that mean "the company front door" still say so.
 */
export const COMPANY_URL = process.env.NEXT_PUBLIC_COMPANY_URL ?? SITE_URL;
/** Kept for existing callers; the product brand shown in the UI. */
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME ?? PRODUCT_NAME;

/** NMLS Consumer Access, the public record a visitor is told to check us against. */
const NMLS_CONSUMER_ACCESS = "https://www.nmlsconsumeraccess.org/EntityDetails.aspx";

export function nmlsCompanyUrl(nmlsId: string): string {
  return `${NMLS_CONSUMER_ACCESS}/COMPANY/${encodeURIComponent(nmlsId)}`;
}

export function nmlsIndividualUrl(nmlsId: string): string {
  return `${NMLS_CONSUMER_ACCESS}/INDIVIDUAL/${encodeURIComponent(nmlsId)}`;
}

export type LicensingStatus = {
  companyLicensed: boolean;
  principalLoanOriginatorNamed: boolean;
  nmlsRecordPublic: boolean;
};

/**
 * Until every value here is true, the site must not claim the company can take
 * applications, and paid mortgage advertising must stay off. This flag drives
 * the pre-launch banner, the readiness board and the Meta conversions gate.
 *
 * 12 Nov 2026: the owner stated the company is licensed and relayed Dan's NMLS
 * portal account list (company NMLS ID 2898263, loan originator NMLS ID
 * 132852). companyLicensed reflects that statement. principalLoanOriginatorNamed
 * does too: Dan is the only originator named, and Florida does not issue a
 * broker business licence without a designated principal loan originator.
 *
 * nmlsRecordPublic: the owner confirmed on 12 Nov 2026 that the NMLS Consumer
 * Access record is public and that MBR8794 is the Florida licence. Consumer
 * Access blocks automated lookup, so this rests on the owner's confirmation,
 * not an engineering readback (ADR-012). With all three true, isPreLaunch() is
 * false: no banner. Meta conversions still also need META_CAPI_LIVE_CLEARED.
 */
export const licensingStatus: LicensingStatus = {
  companyLicensed: true,
  principalLoanOriginatorNamed: true,
  nmlsRecordPublic: true
};

export function isPreLaunch(): boolean {
  return !(
    licensingStatus.companyLicensed &&
    licensingStatus.principalLoanOriginatorNamed &&
    licensingStatus.nmlsRecordPublic
  );
}

const COMPANY_NMLS_ID = "2898263";

export const businessIdentity: BusinessIdentity = {
  name: COMPANY_NAME,
  legalName: COMPANY_LEGAL_NAME,
  brandName: BRAND_NAME,
  siteUrl: SITE_URL,
  logoPath: "/brand/wml-logo.png",
  // Source: Dan's NMLS portal account list, relayed by the owner 12 Nov 2026.
  nmlsId: COMPANY_NMLS_ID,
  // Florida mortgage broker business licence, confirmed by the owner 12 Nov
  // 2026 (ADR-012). A null would render the visible pending state instead.
  companyLicenseId: "MBR8794",
  // Neither is confirmed for this company yet. A FinancialService node needs a
  // real public office, so the schema stays a plain Organization (ADR-009).
  telephone: null,
  address: null,
  areaServed: ["Florida"],
  // Real profiles only. The old product domain now redirects here, so it is no
  // longer a separate profile. The Consumer Access page counts once the record
  // is confirmed public, which the owner did on 12 Nov 2026.
  sameAs: licensingStatus.nmlsRecordPublic ? [nmlsCompanyUrl(COMPANY_NMLS_ID)] : []
};

export type LoanOriginator = { name: string; nmlsId: string };

/** Source: Dan's NMLS portal account list, relayed by the owner 12 Nov 2026. */
export const loanOriginator: LoanOriginator = {
  name: "Daniel Michael Cuesta",
  nmlsId: "132852"
};

/**
 * How a null licence number reads. "Pending issuance" would contradict the
 * owner's statement that the company is licensed, so once companyLicensed is
 * true the missing number reads as awaiting confirmation instead.
 */
export const LICENSE_PENDING_LABEL = licensingStatus.companyLicensed
  ? "number pending confirmation"
  : "pending issuance";

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
