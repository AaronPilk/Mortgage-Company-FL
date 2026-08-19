/**
 * Route registry.
 *
 * One list drives navigation, the sitemap, and the indexation test. Adding a
 * public page without registering it here means it never enters the sitemap,
 * which is the intended failure mode: pages get published deliberately.
 */

export type RouteEntry = {
  path: string;
  /** Sitemap priority relative to the rest of the site. */
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  /** Explicit indexation decision. Drafts and tools default to noindex. */
  indexable: boolean;
  /** Content grouping used by analytics. */
  contentGroup: string;
};

export const ROUTE_REGISTRY: RouteEntry[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly", indexable: true, contentGroup: "home" },
  {
    path: "/plan",
    priority: 0.95,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },

  // Mortgage core
  {
    path: "/mortgage",
    priority: 0.9,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/purchase",
    priority: 0.9,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/refinance",
    priority: 0.9,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/first-time-home-buyers",
    priority: 0.85,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/conventional",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  // Evergreen home-equity education. Indexable on purpose: this is the organic
  // page the noindex /get-started/heloc campaign page points its visitors at.
  {
    path: "/mortgage/home-equity",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/fha",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/va",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/usda",
    priority: 0.75,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/jumbo",
    priority: 0.75,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/investment-property",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/self-employed",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/condo",
    priority: 0.75,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/dscr",
    priority: 0.75,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/bank-statement",
    priority: 0.75,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/renovation",
    priority: 0.75,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/construction",
    priority: 0.75,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },
  {
    path: "/mortgage/land",
    priority: 0.75,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "mortgage"
  },

  // Calculators
  {
    path: "/calculators",
    priority: 0.85,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/mortgage-payment",
    priority: 0.85,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/affordability",
    priority: 0.85,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/refinance-break-even",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/rent-vs-buy",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/closing-cost",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/amortization",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/debt-to-income",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/investment-property-cash-flow",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/dscr",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },
  {
    path: "/calculators/rate-impact",
    priority: 0.8,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "calculators"
  },

  // Company and conversion
  {
    path: "/about",
    priority: 0.7,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "company"
  },
  {
    path: "/contact",
    priority: 0.9,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "conversion"
  },
  {
    path: "/apply",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "conversion"
  },
  {
    path: "/partners/real-estate-agents",
    priority: 0.75,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "partners"
  },
  {
    path: "/resources",
    priority: 0.7,
    changeFrequency: "weekly",
    indexable: true,
    contentGroup: "resources"
  },
  // Article library. Generated from apps/web/content/articles/ — every
  // article is registered individually so indexation stays a deliberate,
  // reviewable decision per page, exactly like the program pages.
  {
    path: "/resources/fha-mip-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/va-loan-benefits-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/usda-eligibility-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/conventional-vs-fha",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/pmi-vs-mip",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/jumbo-loans-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/fha-203k-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/homestyle-choicerenovation",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/dscr-loans-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/bank-statement-loans",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/preapproval-vs-prequalification",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/down-payment-how-much",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/gift-funds-rules",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/closing-timeline-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/loan-estimate-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/closing-disclosure-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/earnest-money-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/home-appraisal-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/underwriting-conditions",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/first-home-mistakes",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/florida-homeowners-insurance-mortgage",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/wind-mitigation-inspection",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/flood-zones-flood-insurance",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/four-point-inspection",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/roof-age-insurance-mortgage",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/citizens-property-insurance",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/florida-property-taxes-reset",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/homestead-exemption-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/escrow-accounts-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/cdd-fees-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/condo-financing-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/warrantable-vs-non-warrantable",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/milestone-inspection-sirs",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/special-assessments-mortgage",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/hoa-condo-docs-review",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/condo-master-insurance-h06",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/fha-va-condo-approval",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/condotel-financing",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/condo-investor-ratios",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/townhouse-vs-condo-financing",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/rental-cash-flow-analysis",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/cap-rate-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/dscr-vs-conventional-investor",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/str-financing-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/house-hacking-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/brrrr-financing",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/investor-reserves-requirements",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/llc-vs-personal-title-financing",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/fix-and-flip-financing",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/portfolio-growth-financing",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/refinance-break-even",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/cash-out-refinance-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/rate-term-vs-cash-out",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/fha-streamline-refinance",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/va-irrrl-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/remove-pmi",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/recast-vs-refinance",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/heloc-vs-cash-out",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/no-closing-cost-refinance",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/refinance-investment-property",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/buying-home-st-petersburg",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/buying-home-tampa",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/buying-home-sarasota",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/buying-home-orlando",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/buying-home-jacksonville",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/buying-home-miami",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/buying-home-cape-coral",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/buying-home-naples",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/florida-coastal-vs-inland",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/relocating-to-florida-mortgage",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/dti-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/credit-score-mortgage",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/self-employed-mortgage-docs",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/employment-history-mortgage",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/student-loans-dti",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/collections-medical-debt-mortgage",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/thin-credit-nontraditional",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/co-borrower-vs-cosigner",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/waiting-periods-bankruptcy-foreclosure",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/mortgage-credit-inquiries",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/lot-loans-vs-land-loans",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/construction-to-permanent",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/construction-draws-inspections",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/builder-approval-process",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/owner-builder-realities",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/adu-financing-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/manufactured-home-financing",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/well-septic-financing",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/impact-fees-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/renovation-budget-contingency",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/what-is-piti",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/apr-vs-interest-rate",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/discount-points-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/rate-lock-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/amortization-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/ltv-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/title-insurance-florida",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/mortgage-servicing-explained",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/fixed-vs-arm",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/resources/how-mortgage-brokers-work",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "resources"
  },
  {
    path: "/locations/florida",
    priority: 0.7,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "locations"
  },

  // Trust and legal
  {
    path: "/privacy",
    priority: 0.4,
    changeFrequency: "yearly",
    indexable: true,
    contentGroup: "legal"
  },
  {
    path: "/terms",
    priority: 0.4,
    changeFrequency: "yearly",
    indexable: true,
    contentGroup: "legal"
  },
  {
    path: "/accessibility",
    priority: 0.4,
    changeFrequency: "yearly",
    indexable: true,
    contentGroup: "legal"
  },
  {
    path: "/licenses",
    priority: 0.5,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "legal"
  },
  {
    path: "/disclosures",
    priority: 0.5,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "legal"
  },
  {
    path: "/sms-terms",
    priority: 0.4,
    changeFrequency: "yearly",
    indexable: true,
    contentGroup: "legal"
  },
  {
    path: "/do-not-sell-or-share",
    priority: 0.4,
    changeFrequency: "yearly",
    indexable: true,
    contentGroup: "legal"
  },
  {
    path: "/security",
    priority: 0.4,
    changeFrequency: "yearly",
    indexable: true,
    contentGroup: "legal"
  },

  // Feature surfaces. Off the sitemap until the feature ships and the content
  // is genuinely useful; a stub page in the index is worse than no page.
  {
    path: "/vision",
    priority: 0.5,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "vision"
  },
  {
    path: "/vision/start",
    priority: 0.4,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "vision"
  },
  {
    path: "/rendprop",
    priority: 0.5,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "rendprop"
  },
  {
    path: "/rendprop/demo",
    priority: 0.4,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "rendprop"
  },
  {
    path: "/tour/rendprop-coastal-demo",
    priority: 0.1,
    changeFrequency: "yearly",
    indexable: false,
    contentGroup: "rendprop"
  },
  {
    path: "/properties",
    priority: 0.5,
    changeFrequency: "daily",
    indexable: false,
    contentGroup: "properties"
  },

  // Agent directory. Dynamic profile pages (/agents/[slug]) are covered by
  // this prefix, the same way /properties/[listingKey] rides on /properties —
  // and only this literal path enters the sitemap: the ~68k imported profile
  // pages are indexable but deliberately not enumerated there.
  // Indexable since the DBPR import: every row the page renders is a real
  // record — a reviewed joined agent or a factual state license record — so
  // nothing invented can reach a crawler. The one residual case, an empty or
  // unreachable database falling back to labelled sample fixtures, is handled
  // per-request: the page emits noindex for exactly those responses.
  {
    path: "/agents",
    priority: 0.5,
    changeFrequency: "daily",
    indexable: true,
    contentGroup: "agents"
  },
  // The agent-side funnel carries no sample data and describes a real,
  // currently offered program, so it is indexable like the partner page.
  {
    path: "/agents/join",
    priority: 0.6,
    changeFrequency: "monthly",
    indexable: true,
    contentGroup: "agents"
  },

  // Ad campaign landing pages and the "Talk to us" chooser. Deliberately not
  // indexable: campaign pages exist to receive paid clicks and must not
  // compete with the organic program pages for ranking (and the site is
  // pre-launch); /talk is a router page with nothing to rank for.
  {
    path: "/talk",
    priority: 0.3,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "conversion"
  },
  {
    path: "/get-started/purchase",
    priority: 0.3,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "campaign"
  },
  {
    path: "/get-started/refinance",
    priority: 0.3,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "campaign"
  },
  {
    path: "/get-started/heloc",
    priority: 0.3,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "campaign"
  },
  {
    path: "/get-started/fha",
    priority: 0.3,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "campaign"
  },
  {
    path: "/get-started/va",
    priority: 0.3,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "campaign"
  },
  {
    path: "/get-started/first-home",
    priority: 0.3,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "campaign"
  },
  {
    path: "/get-started/investment",
    priority: 0.3,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "campaign"
  },
  {
    path: "/get-started/sell",
    priority: 0.3,
    changeFrequency: "monthly",
    indexable: false,
    contentGroup: "campaign"
  },

  // Never indexable.
  {
    path: "/offline",
    priority: 0.1,
    changeFrequency: "yearly",
    indexable: false,
    contentGroup: "system"
  },
  {
    path: "/account",
    priority: 0.1,
    changeFrequency: "yearly",
    indexable: false,
    contentGroup: "system"
  },
  // Password-reset completion. Reached only from the emailed recovery link
  // via /auth/callback; never indexable, never in the sitemap.
  {
    path: "/auth/update-password",
    priority: 0.1,
    changeFrequency: "yearly",
    indexable: false,
    contentGroup: "system"
  },
  {
    path: "/admin",
    priority: 0.1,
    changeFrequency: "yearly",
    indexable: false,
    contentGroup: "system"
  }
];

export function indexableRoutes(): RouteEntry[] {
  return ROUTE_REGISTRY.filter((route) => route.indexable);
}

export function contentGroupFor(path: string): string {
  const exact = ROUTE_REGISTRY.find((route) => route.path === path);
  if (exact !== undefined) return exact.contentGroup;
  const prefix = ROUTE_REGISTRY.filter((route) => route.path !== "/" && path.startsWith(route.path))
    .sort((a, b) => b.path.length - a.path.length)
    .at(0);
  return prefix?.contentGroup ?? "other";
}
