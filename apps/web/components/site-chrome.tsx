import Link from "next/link";
import { Wordmark } from "./wordmark";
import { ButtonLink, LicenseFact } from "./ui";
import { businessIdentity, isPreLaunch } from "@/lib/site";

const PRIMARY_NAV = [
  { href: "/mortgage", label: "Mortgage" },
  { href: "/calculators", label: "Calculators" },
  { href: "/resources", label: "Resources" },
  { href: "/partners/real-estate-agents", label: "For agents" },
  { href: "/about", label: "About" }
];

const FOOTER_GROUPS = [
  {
    heading: "Financing",
    links: [
      { href: "/mortgage/purchase", label: "Buying a home" },
      { href: "/mortgage/refinance", label: "Refinancing" },
      { href: "/mortgage/first-time-home-buyers", label: "First-time buyers" },
      { href: "/mortgage/self-employed", label: "Self-employed borrowers" },
      { href: "/mortgage/investment-property", label: "Investment property" }
    ]
  },
  {
    heading: "Programs",
    links: [
      { href: "/mortgage/conventional", label: "Conventional" },
      { href: "/mortgage/fha", label: "FHA" },
      { href: "/mortgage/va", label: "VA" },
      { href: "/mortgage/usda", label: "USDA" },
      { href: "/mortgage/jumbo", label: "Jumbo" }
    ]
  },
  {
    heading: "Tools",
    links: [
      { href: "/calculators/mortgage-payment", label: "Payment calculator" },
      { href: "/calculators/affordability", label: "Affordability" },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even" },
      { href: "/calculators/rent-vs-buy", label: "Rent vs buy" },
      { href: "/calculators/closing-cost", label: "Closing costs" }
    ]
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/licenses", label: "Licensing" },
      { href: "/disclosures", label: "Disclosures" },
      { href: "/security", label: "Security" }
    ]
  }
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/sms-terms", label: "SMS terms" },
  { href: "/do-not-sell-or-share", label: "Do not sell or share" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-wide flex items-center justify-between gap-6 py-4">
        <Link href="/" aria-label={`${businessIdentity.brandName} home`}>
          <Wordmark />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink hover:text-purple-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ButtonLink href="/contact" variant="primary" data-cta="header-consultation">
            Talk to us
          </ButtonLink>
        </div>
      </div>
      <nav aria-label="Primary mobile" className="border-t border-line lg:hidden">
        <ul className="container-wide flex gap-5 overflow-x-auto py-3 text-sm">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} className="font-medium text-ink hover:text-purple-700">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/**
 * Pre-launch notice.
 *
 * Shown until the company licence, the principal loan originator designation,
 * and the public NMLS record are all confirmed. Removing it is gated on
 * docs/compliance/launch-gates.md, not on a design preference.
 */
export function PreLaunchNotice() {
  if (!isPreLaunch()) return null;
  return (
    <div role="status" className="bg-purple-900 px-4 py-2.5 text-center text-sm text-white">
      This site is in pre-launch. {businessIdentity.brandName} is not yet accepting mortgage
      applications, and nothing here is an offer of credit or a rate quote.
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="container-wide py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm text-muted">
              A Florida mortgage brokerage. We help buyers and homeowners compare financing paths
              with clear tools and direct guidance.
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-900">
                {group.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted hover:text-purple-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 space-y-3 border-t border-line pt-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <LicenseFact label="Company NMLS ID" value={businessIdentity.nmlsId} />
            <LicenseFact
              label="Florida mortgage broker license"
              value={businessIdentity.companyLicenseId}
            />
          </div>
          <p className="text-sm text-muted">
            <a
              className="text-purple-700 underline underline-offset-2"
              href="https://www.nmlsconsumeraccess.org/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Verify our licensing on NMLS Consumer Access
            </a>
          </p>
          {/*
            A broker arranges credit; it does not lend. The Equal Housing wording
            here is the Opportunity form, never "Equal Housing Lender", because
            that would misstate what this company is.
          */}
          <p className="text-sm font-medium text-ink">Equal Housing Opportunity.</p>
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            {businessIdentity.brandName} is a mortgage brokerage. We arrange, but do not make,
            mortgage loans. All figures shown on this site are estimates based on information you
            provide and are not an offer of credit, a rate quote, a preapproval, or a commitment to
            lend. Loan approval, terms, and availability depend on the lender, the loan program, the
            property, and a complete review of your application.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-xs text-muted underline underline-offset-2">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
