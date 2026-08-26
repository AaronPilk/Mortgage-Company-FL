import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import { LicenseFact } from "./ui";
import { businessIdentity, SITE_URL } from "@/lib/site";

/**
 * Wholesale Mortgage Lending chrome.
 *
 * The marketing host (wsmlending.com) is a different brand from the TRACT
 * product, so it gets its own header and footer. The middleware marks the
 * request and the root layout swaps these in for the TRACT chrome.
 *
 * Theme correctness is deliberate: the WML brand is the purple monogram
 * (wml-mark.png, transparent, legible on light and dark) paired with a text
 * lockup coloured by --text, never the full-logo PNG whose "Wholesale Mortgage
 * Lending" wordmark is baked black and would vanish in dark mode.
 */

/** The TRACT product origin, without a trailing slash, for cross-brand links. */
const TRACT = SITE_URL.replace(/\/$/, "");

const LEGAL_LINKS = [
  { href: `${TRACT}/privacy`, label: "Privacy" },
  { href: `${TRACT}/terms`, label: "Terms" },
  { href: `${TRACT}/accessibility`, label: "Accessibility" },
  { href: `${TRACT}/sms-terms`, label: "SMS terms" },
  { href: `${TRACT}/do-not-sell-or-share`, label: "Do not sell or share" }
];

function WmlLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/brand/wml-mark.png"
        alt=""
        width={260}
        height={108}
        priority
        className="h-9 w-auto"
      />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Wholesale Mortgage Lending
        </span>
        {!compact && (
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            Florida mortgage brokerage
          </span>
        )}
      </span>
    </span>
  );
}

export function WmlHeader() {
  return (
    // z-[60] mirrors the TRACT header so nothing paints over an open control.
    <header className="glass sticky top-0 z-[60]">
      <div className="container-wide flex items-center justify-between gap-4 py-3.5">
        <a href="/" aria-label="Wholesale Mortgage Lending home">
          <WmlLockup />
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* The product is one click away, but the landing's real job is the
              form below it, so this is a quiet secondary link, not a button. */}
          <a
            href={TRACT}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-[var(--purple)] sm:block"
            style={{ color: "var(--text-muted)" }}
          >
            Enter TRACT &rarr;
          </a>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <a
            href="#lead"
            data-cta="wml-header"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 sm:px-5"
            style={{ background: "var(--purple)", boxShadow: "0 4px 14px var(--purple-glow)" }}
          >
            Get my options
          </a>
        </div>
      </div>
    </header>
  );
}

export function WmlFooter() {
  return (
    <footer
      className="relative mt-24"
      style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="container-wide py-12 sm:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <WmlLockup />
            <p className="mt-5 text-sm" style={{ color: "var(--text-muted)" }}>
              A Florida mortgage brokerage. We help buyers and homeowners compare financing across
              lenders with clear tools and direct guidance — powered by TRACT.
            </p>
            <a
              href={TRACT}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: "var(--purple)" }}
            >
              Enter TRACT &rarr;
            </a>
          </div>

          <nav aria-label="Legal" className="flex flex-col gap-2.5">
            <h2
              className="text-xs font-bold uppercase tracking-[0.14em]"
              style={{ color: "var(--purple)" }}
            >
              Legal
            </h2>
            {LEGAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm transition-colors hover:text-[var(--purple)]"
                style={{ color: "var(--text-muted)" }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="rule-glow my-12" />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <LicenseFact label="Company NMLS ID" value={businessIdentity.nmlsId} />
            <LicenseFact
              label="Florida mortgage broker license"
              value={businessIdentity.companyLicenseId}
            />
          </div>
          <p className="text-sm">
            <a
              className="font-medium underline underline-offset-4"
              style={{ color: "var(--purple)" }}
              href="https://www.nmlsconsumeraccess.org/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Verify licensing on NMLS Consumer Access
            </a>
          </p>
          {/* Equal Housing Opportunity, never "Equal Housing Lender": a broker
              arranges credit, it does not lend, and the content linter enforces
              exactly this wording. */}
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Equal Housing Opportunity.
          </p>
          <p className="max-w-3xl text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {businessIdentity.legalName} is a mortgage brokerage. We arrange, but do not make,
            mortgage loans. All figures shown on this site are estimates based on information you
            provide and are not an offer of credit, a rate quote, a preapproval, or a commitment to
            lend. Loan approval, terms, and availability depend on the lender, the loan program, the
            property, and a complete review of your application. The company is pre-launch and not
            yet licensed to arrange Florida residential mortgage credit; licensing details will
            appear here once established.
          </p>
        </div>
      </div>
    </footer>
  );
}
