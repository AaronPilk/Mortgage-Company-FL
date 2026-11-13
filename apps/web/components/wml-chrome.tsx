import { ThemeToggle } from "./theme-toggle";
import { LicensingFacts, NmlsVerifyLinks } from "./licensing-facts";
import { Wordmark } from "./wordmark";
import { businessIdentity, isPreLaunch } from "@/lib/site";

/**
 * Landing chrome.
 *
 * The landing at "/" on wsmlending.com is built to convert paid traffic, so it
 * gets a quieter header and footer than the rest of the site: no primary nav,
 * one call to action that scrolls to the form. The middleware marks the request
 * and the root layout swaps these in. The brand is the same everywhere
 * (ADR-014); only the amount of navigation differs.
 *
 * Every link out of this chrome is a plain <a>, never <Link>: the destination
 * renders the full site chrome, and a client-side transition would keep this
 * layout's header and footer around it.
 */

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/licenses", label: "Licensing" },
  { href: "/sms-terms", label: "SMS terms" },
  { href: "/do-not-sell-or-share", label: "Do not sell or share" }
];

export function WmlHeader() {
  return (
    // z-[60] mirrors the site header so nothing paints over an open control.
    <header className="glass sticky top-0 z-[60]">
      <div className="container-wide flex items-center justify-between gap-4 py-3.5">
        <a href="/" aria-label="Wholesale Mortgage Lending home" className="shrink-0">
          <Wordmark variant="landing" />
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* The tools are one click away, but the landing's real job is the
              form below it, so this is a quiet secondary link, not a button. */}
          <a
            href="/calculators"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-[var(--purple)] sm:block"
            style={{ color: "var(--text-muted)" }}
          >
            Calculators &rarr;
          </a>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <a
            href="#lead"
            data-cta="wml-header"
            className="inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 sm:px-5"
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
            <Wordmark />
            <p className="mt-5 text-sm" style={{ color: "var(--text-muted)" }}>
              A Florida mortgage brokerage. We help buyers and homeowners compare financing across
              lenders with clear tools and direct guidance.
            </p>
            {businessIdentity.email !== null && (
              <a
                href={"mailto:" + businessIdentity.email}
                className="mt-4 block text-sm font-medium transition-colors hover:text-[var(--purple)]"
                style={{ color: "var(--text-muted)" }}
              >
                {businessIdentity.email}
              </a>
            )}
            <a
              href="/calculators"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: "var(--purple)" }}
            >
              Try the free calculators &rarr;
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
            <LicensingFacts originator />
          </div>
          <NmlsVerifyLinks originator />
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
            property, and a complete review of your application.
            {isPreLaunch()
              ? " The company is pre-launch and not yet licensed to arrange Florida residential mortgage credit; licensing details will appear here once established."
              : ""}
          </p>
        </div>
      </div>
    </footer>
  );
}
