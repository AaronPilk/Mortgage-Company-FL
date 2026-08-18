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
