import { LicenseFact } from "./ui";
import {
  LICENSE_PENDING_LABEL,
  businessIdentity,
  loanOriginator,
  nmlsCompanyUrl,
  nmlsIndividualUrl
} from "@/lib/site";

/**
 * The licence identifiers, rendered the same way everywhere they appear.
 *
 * Six surfaces (both footers, the landing, the TRACT home, the campaign pages
 * and About) used to repeat these rows by hand, which is how a pending label
 * drifts on one page and not another. Values come only from lib/site.ts; a null
 * renders a visible pending state, never a placeholder.
 */
export function LicensingFacts({ originator = false }: { originator?: boolean }) {
  return (
    <>
      <LicenseFact label="Company NMLS ID" value={businessIdentity.nmlsId} />
      <LicenseFact
        label="Florida mortgage broker license"
        value={businessIdentity.companyLicenseId}
        pendingLabel={LICENSE_PENDING_LABEL}
      />
      {originator && (
        <LicenseFact
          label="Loan originator"
          value={`${loanOriginator.name}, NMLS ID ${loanOriginator.nmlsId}`}
        />
      )}
    </>
  );
}

const linkClass = "font-medium underline underline-offset-4";

/**
 * Deep links to the public record, so "verify us" lands on our entry instead of
 * the Consumer Access search page.
 */
export function NmlsVerifyLinks({ originator = false }: { originator?: boolean }) {
  const companyHref =
    businessIdentity.nmlsId === null
      ? "https://www.nmlsconsumeraccess.org/"
      : nmlsCompanyUrl(businessIdentity.nmlsId);
  return (
    <p className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      <a
        className={linkClass}
        style={{ color: "var(--purple)" }}
        href={companyHref}
        rel="noopener noreferrer"
        target="_blank"
      >
        Verify our licensing on NMLS Consumer Access
      </a>
      {originator && (
        <a
          className={linkClass}
          style={{ color: "var(--purple)" }}
          href={nmlsIndividualUrl(loanOriginator.nmlsId)}
          rel="noopener noreferrer"
          target="_blank"
        >
          Verify {loanOriginator.name}, NMLS ID {loanOriginator.nmlsId}
        </a>
      )}
    </p>
  );
}
