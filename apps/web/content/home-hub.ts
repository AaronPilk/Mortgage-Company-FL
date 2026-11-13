/**
 * Homepage hub links.
 *
 * The landing at "/" has to stay a landing (the form is first), but it is also
 * the page with the most authority on the domain, and until now it linked to
 * only a handful of program pages. These lists give crawlers and visitors a
 * plain path from "/" to every hub the sitemap lists.
 *
 * Rules, enforced by tests/unit/home-hub.test.ts:
 *   - every href is a registered, indexable route (a link from the homepage to
 *     a noindex page wastes the strongest link on the site);
 *   - every tool works on the production build (no feature-flagged page that
 *     can 404, such as /what-is-my-home-worth while seller tools are off).
 *
 * Plain data so the page renders plain <a> tags and the test can import it.
 */
import { COUNTIES } from "@/lib/county-data";

export type HubLink = { href: string; label: string };
export type HubTool = HubLink & { detail: string };
export type HubGroup = { heading: string; links: HubLink[] };

/**
 * The free-tools band. Each detail restates what the page's own metadata says
 * it does, so the band never promises more than the tool delivers. The
 * calculators need no sign-up; the planner asks for contact details first, and
 * its line says so.
 */
export const HOME_TOOLS: HubTool[] = [
  {
    href: "/calculators/mortgage-payment",
    label: "Payment calculator",
    detail: "The full monthly payment: principal, interest, taxes, insurance, and HOA dues."
  },
  {
    href: "/calculators/affordability",
    label: "Affordability calculator",
    detail: "What your debt-to-income ratios imply about a purchase price."
  },
  {
    href: "/calculators/refinance-break-even",
    label: "Refinance break-even",
    detail: "How many months until a refinance pays for itself."
  },
  {
    href: "/plan",
    label: "Mortgage planner",
    detail:
      "A few questions and a payment estimate that builds as you answer. Asks for your contact details first."
  }
];

/**
 * Program pages the landing does not already link from its "what we help with"
 * cards and its programs strip, so nothing is listed twice on one page.
 */
const MORE_PROGRAMS: HubLink[] = [
  { href: "/mortgage", label: "All loan programs" },
  { href: "/mortgage/investment-property", label: "Investment property loans" },
  { href: "/mortgage/self-employed", label: "Self-employed borrowers" },
  { href: "/mortgage/condo", label: "Condo financing" },
  { href: "/mortgage/dscr", label: "DSCR loans" },
  { href: "/mortgage/bank-statement", label: "Bank statement loans" },
  { href: "/mortgage/renovation", label: "Renovation loans" },
  { href: "/mortgage/construction", label: "Construction loans" },
  { href: "/mortgage/land", label: "Land and lot loans" }
];

export const HOME_EXPLORE: HubGroup[] = [
  { heading: "Loan programs", links: MORE_PROGRAMS },
  {
    heading: "Buying in Florida",
    links: [
      { href: "/florida-buyers-guide", label: "First-time buyer's guide" },
      { href: "/florida-down-payment-assistance", label: "Down payment assistance" },
      { href: "/locations/florida", label: "Mortgages across Florida" }
    ]
  },
  {
    heading: "Learn",
    links: [
      { href: "/resources", label: "Guides and articles" },
      { href: "/mortgage-glossary", label: "Mortgage glossary" },
      { href: "/calculators", label: "All calculators" }
    ]
  }
];

/** One link per county page, from the same data the county pages render. */
export const HOME_COUNTY_GUIDES: HubGroup = {
  heading: "Florida county guides",
  links: COUNTIES.map((county) => ({
    href: `/florida-mortgage/${county.slug}`,
    label: county.county
  }))
};
