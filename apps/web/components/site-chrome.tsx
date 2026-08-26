import Link from "next/link";
import { Wordmark } from "./wordmark";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { ButtonLink, LicenseFact } from "./ui";
import { businessIdentity, isPreLaunch } from "@/lib/site";
import { createRequestClient } from "@/lib/supabase";

const PRIMARY_NAV = [
  { href: "/properties", label: "Properties" },
  { href: "/plan", label: "Start planning" },
  { href: "/mortgage", label: "Mortgage" },
  // A top-level destination on purpose: HELOC content kept being unfindable
  // two levels down, and home equity is a primary product line.
  { href: "/mortgage/home-equity", label: "Home equity" },
  { href: "/calculators", label: "Calculators" },
  { href: "/resources", label: "Resources" },
  { href: "/partners/real-estate-agents", label: "Agent partners" },
  { href: "/about", label: "About" }
];

const FOOTER_GROUPS = [
  {
    heading: "Financing",
    links: [
      { href: "/mortgage/purchase", label: "Buying a home" },
      { href: "/mortgage/refinance", label: "Refinancing" },
      { href: "/mortgage/home-equity", label: "Home equity" },
      { href: "/mortgage/first-time-home-buyers", label: "First-time buyers" },
      { href: "/mortgage/self-employed", label: "Self-employed" },
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
      { href: "/properties", label: "Search homes" },
      { href: "/plan", label: "Mortgage planner" },
      { href: "/calculators", label: "All calculators" },
      { href: "/calculators/mortgage-payment", label: "Payment" },
      { href: "/calculators/affordability", label: "Affordability" },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even" }
    ]
  },
  {
    heading: "Explore",
    links: [
      { href: "/resources", label: "Guides & resources" },
      { href: "/mortgage-glossary", label: "Mortgage glossary" },
      { href: "/florida-buyers-guide", label: "First-time buyer's guide" },
      { href: "/mortgage", label: "All loan programs" },
      { href: "/locations/florida", label: "Florida" },
      { href: "/vision", label: "TRACT Vision" },
      { href: "/rendprop", label: "RendProp tours" },
      { href: "/talk", label: "Talk to us" }
    ]
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/account", label: "Client login" },
      { href: "/agents", label: "Find an agent" },
      { href: "/agents/join", label: "Join as an agent" },
      { href: "/partners/real-estate-agents", label: "For agents" },
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

/**
 * Whether the request carries a signed-in Supabase session.
 *
 * Read server-side, the same way /account and /properties read it, so the
 * header never flashes the wrong state. Reading cookies here makes every
 * route dynamically rendered — a deliberate trade, accepted pre-launch, so
 * the one persistent piece of chrome can tell a signed-in person where their
 * account lives. Any failure renders the signed-out affordance: "Sign in"
 * shown to a signed-in person is a dead-end-free mistake, the reverse is not.
 */
async function hasSignedInUser(): Promise<boolean> {
  try {
    const supabase = await createRequestClient();
    if (supabase === null) return false;
    const { data, error } = await supabase.auth.getUser();
    return error === null && data.user !== null;
  } catch {
    return false;
  }
}

export async function SiteHeader() {
  const signedIn = await hasSignedInUser();
  const accountLabel = signedIn ? "My account" : "Sign in";
  return (
    // z-[60]: the open mobile menu (a child of this header) must paint over
    // the fixed bottom action bar, which sits at z-50.
    <header className="glass sticky top-0 z-[60]">
      <div className="container-wide flex items-center justify-between gap-4 py-3.5">
        <Link href="/" aria-label={`${businessIdentity.brandName} home`}>
          <Wordmark />
        </Link>

        {/*
          Eight primary links plus the CTA cluster only clear the 88rem
          container above ~1320px; below that they wrapped mid-label. So the
          inline nav appears at min-[1360px] (with headroom for a scrollbar and
          font variance) and the menu button covers every narrower window.
          whitespace-nowrap is the belt to that braces: a label never breaks
          across two lines even at the tightest inline width.
        */}
        <nav aria-label="Primary" className="hidden items-center gap-1 min-[1360px]:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--purple-subtle)] hover:text-[var(--purple)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quiet on purpose: the account is an amenity here, not the product.
              A signed-in borrower's loan lives one level in, on /account —
              there is no separate loan entry in the header. */}
          <Link
            href="/account"
            data-nav="account"
            className="hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--purple-subtle)] hover:text-[var(--purple)] min-[1360px]:block"
          >
            {accountLabel}
          </Link>
          {/* Below the inline-nav breakpoint the theme control lives inside the
              menu; the header row keeps only the brand, the primary CTA, and
              the menu button. */}
          <div className="hidden min-[1360px]:block">
            <ThemeToggle />
          </div>
          {/*
            One button, four audiences. /talk asks what the visitor is here for
            and routes each answer to the funnel built for it, which converts
            better than dropping everyone on a generic contact form.
          */}
          <ButtonLink
            href="/talk"
            data-cta="header-consultation"
            className="whitespace-nowrap !min-h-[44px] !px-4 sm:!px-5"
          >
            Talk to us
          </ButtonLink>
          <MobileNav items={PRIMARY_NAV} accountLabel={accountLabel} />
        </div>
      </div>
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
    <div
      role="status"
      className="relative px-4 py-2 text-center text-xs font-medium text-white sm:py-2.5 sm:text-sm"
      style={{ background: "linear-gradient(90deg, var(--purple-dark), var(--purple))" }}
    >
      {businessIdentity.brandName} is pre-launch — not yet accepting mortgage applications, and
      nothing here is an offer of credit or a rate quote.
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer
      className="relative mt-24"
      style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="container-wide py-12 sm:py-16">
        {/*
          Two columns on a phone, not one. Four single-column link groups made
          the footer several screens tall; the labels are short enough to pair.
        */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-5 lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <Wordmark />
            <p className="mt-5 max-w-xs text-sm" style={{ color: "var(--text-muted)" }}>
              A Florida mortgage brokerage. We help buyers and homeowners compare financing paths
              with clear tools and direct guidance.
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2
                className="text-xs font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--purple)" }}
              >
                {group.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-[var(--purple)]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
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
              Verify our licensing on NMLS Consumer Access
            </a>
          </p>
          {/*
            A broker arranges credit; it does not lend. The Equal Housing wording
            here is the Opportunity form, never "Equal Housing Lender", because
            that would misstate what this company is.
          */}
          <p className="text-sm font-semibold">Equal Housing Opportunity.</p>
          <p className="max-w-3xl text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {businessIdentity.brandName} is a mortgage brokerage. We arrange, but do not make,
            mortgage loans. All figures shown on this site are estimates based on information you
            provide and are not an offer of credit, a rate quote, a preapproval, or a commitment to
            lend. Loan approval, terms, and availability depend on the lender, the loan program, the
            property, and a complete review of your application.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-3">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs underline underline-offset-4 hover:text-[var(--purple)]"
                  style={{ color: "var(--text-muted)" }}
                >
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
