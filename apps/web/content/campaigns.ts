import type { HomeFunnelPreset } from "@/components/home-funnel";

/**
 * Campaign landing pages under /get-started/.
 *
 * One page per ad group, because Google Ads scores a landing page on how well
 * its content matches the ad the visitor clicked. Each page is the same
 * skeleton — compact hero, the funnel front and center, a short
 * what-happens-next strip, the standard disclosure block — with
 * campaign-specific copy and a funnel preset.
 *
 * These pages are deliberately NOT indexable: they exist to receive paid
 * clicks, and letting them compete with the organic program pages would split
 * ranking signals. The registration in content/routes.ts and the noIndex flag
 * in the page metadata both say so.
 *
 * Copy rules, same as everywhere else on this site: no approval language of
 * any kind ("prequalified", "approved", "you qualify" are all forbidden), no
 * rate promises, bands not figures. HELOC copy is home-equity-line-of-credit
 * education only. Seller copy is connection/handoff framing only — TRACT is a
 * mortgage brokerage and does not list homes; the owner's real-estate network
 * handles sales.
 */

export type CampaignDefinition = {
  /** URL segment under /get-started/. */
  slug: string;
  /** Document title. Kept under 60 characters. */
  metaTitle: string;
  /** Meta description. Kept under 165 characters. */
  metaDescription: string;
  eyebrow: string;
  headline: string;
  /** One sentence under the headline. States what happens, never an outcome. */
  subhead: string;
  /** Truthful proof chips shown in the hero. */
  chips: string[];
  /** Funnel preset. `message` is the fixed campaign label the loan officer sees. */
  funnel: HomeFunnelPreset;
  /** The what-happens-next strip. Three honest steps, no outcome promised. */
  whatHappensNext: [string, string, string];
  /**
   * Optional quiet link to the matching organic education page. Rendered small
   * and below the fold so it informs without leaking paid clicks — the funnel
   * stays the page's one job.
   */
  educationLink?: { href: string; label: string };
};

const STANDARD_CHIPS = ["No credit pull", "Not an application", "No obligation"];

const MORTGAGE_NEXT_STEPS: [string, string, string] = [
  "A licensed mortgage professional reviews what you sent and reaches out.",
  "You talk through your situation. No credit is pulled and no application is taken at this stage.",
  "If it makes sense to move forward, you get a secure link to apply — sensitive details go there, never through this form."
];

export const CAMPAIGNS: CampaignDefinition[] = [
  {
    slug: "purchase",
    metaTitle: "Start your Florida home purchase conversation",
    metaDescription:
      "Buying a home in Florida? Two quick questions and a licensed mortgage professional will lay out your purchase financing options. No credit pull.",
    eyebrow: "Buying a home",
    headline: "Start your Florida home purchase conversation",
    subhead:
      "Tell us your timing and where your credit roughly sits, and a licensed mortgage professional will lay out what your purchase financing options actually are.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "purchase",
      message: "Arrived via the purchase campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    slug: "refinance",
    metaTitle: "See whether refinancing actually makes sense",
    metaDescription:
      "Thinking about refinancing your Florida home? Tell us your timing and a licensed professional will walk you through the break-even math. No credit pull.",
    eyebrow: "Refinancing",
    headline: "See whether a refinance actually makes sense",
    subhead:
      "A lower payment is not the whole story — we walk you through the break-even math for your situation, not just the new number.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "refinance",
      message: "Arrived via the refinance campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    // HELOC is education only. A line of credit's rate, limit, and terms come
    // from a lender after a full review — nothing on this page states or
    // implies any of them.
    slug: "heloc",
    metaTitle: "How a home equity line of credit works",
    metaDescription:
      "Curious about a home equity line of credit on your Florida home? A licensed professional will explain how a HELOC works and what opening one involves.",
    eyebrow: "Home equity",
    headline: "Understand your home equity line of credit options",
    subhead:
      "Tell us your timing and a licensed professional will explain how a home equity line of credit works, what opening one involves, and how it compares with a cash-out refinance.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "heloc",
      timelineHeading: "When are you hoping to access your equity?",
      message: "Arrived via the HELOC campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS,
    educationLink: { href: "/mortgage/home-equity", label: "Learn how HELOCs work first" }
  },
  {
    // Program interest is not a schema field. FHA arrives as a purchase lead;
    // the fixed message below is how the loan officer sees the campaign
    // context, and the page copy is what matches the ad group.
    slug: "fha",
    metaTitle: "Ask us about FHA financing in Florida",
    metaDescription:
      "Interested in an FHA loan? Tell us your timing and a licensed mortgage professional will explain how FHA financing works in Florida. No credit pull.",
    eyebrow: "FHA loans",
    headline: "Ask us about FHA financing in Florida",
    subhead:
      "FHA-insured loans are built around smaller down payments and more flexible credit guidelines — a licensed professional will walk you through how the program works and what it costs to carry.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "purchase",
      message: "Arrived via the FHA campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    slug: "va",
    metaTitle: "Ask us about VA home loans in Florida",
    metaDescription:
      "VA-guaranteed loans are a benefit earned through service. Tell us your timing and a licensed professional will explain how the program works. No credit pull.",
    eyebrow: "VA loans",
    headline: "Ask us about VA home loans in Florida",
    subhead:
      "VA-guaranteed loans are a benefit earned through military service — a licensed professional will walk you through how the program works, including its down payment and funding fee rules.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "purchase",
      message: "Arrived via the VA campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    slug: "first-home",
    metaTitle: "Buying your first home in Florida",
    metaDescription:
      "Your first mortgage comes with the most unknowns. Tell us your timing and a licensed professional will explain the sequence step by step. No credit pull.",
    eyebrow: "First home",
    headline: "Buying your first home, explained from the start",
    subhead:
      "Your first mortgage comes with the most unknowns — we explain the sequence, what to have ready, and where first-time buyers most often get surprised.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "first_time_buyer",
      message: "Arrived via the first-time buyer campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    slug: "investment",
    metaTitle: "Financing a Florida investment property",
    metaDescription:
      "Buying a rental or investment property in Florida? A licensed mortgage professional will lay out the financing paths investors actually use. No credit pull.",
    eyebrow: "Investment property",
    headline: "Financing a Florida investment property",
    subhead:
      "From conventional investor loans to DSCR, a licensed mortgage professional will lay out the financing paths investors actually use — and what each one asks of you.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "investment",
      message: "Arrived via the investment property campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    // Seller handoff. TRACT is a mortgage brokerage and does not list homes;
    // every line here is connection framing, and the credit question is
    // dropped because a seller does not need a financing credit band.
    slug: "sell",
    metaTitle: "Selling your home? We'll connect you",
    metaDescription:
      "Tell us about the home you're selling and when, and we'll connect you with the right real estate professionals in our network. No obligation.",
    eyebrow: "Selling a home",
    headline: "Selling your home? We'll connect you with the right people",
    subhead:
      "TRACT is a mortgage brokerage — we don't list homes. Tell us about the home you're selling and we'll connect you with trusted real estate professionals in our network.",
    chips: ["Not a listing agreement", "No credit pull", "No obligation"],
    funnel: {
      intent: "sell_home",
      skipCreditStep: true,
      timelineHeading: "When are you looking to sell?",
      contactHint:
        "Tell us where to reach you and we'll connect you with the right real estate professionals.",
      successBody:
        "We have your request. TRACT is a mortgage brokerage — we don't list homes — so we'll connect you with trusted real estate professionals in our network who handle sales. You're not obligated to anything.",
      message: "Arrived via the home-selling campaign page. Real-estate-side handoff."
    },
    whatHappensNext: [
      "We review what you sent about the home and your timing.",
      "We connect you with a trusted real estate professional from our network — TRACT does not list homes.",
      "If your next move involves financing a purchase, a licensed mortgage professional can help with that side too."
    ]
  }
];

export function campaignBySlug(slug: string): CampaignDefinition | undefined {
  return CAMPAIGNS.find((campaign) => campaign.slug === slug);
}
