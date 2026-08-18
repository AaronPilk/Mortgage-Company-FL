import type {
  CampaignChoiceQuestion,
  CampaignFunnelConfig,
  CampaignQuestion,
  CampaignSliderQuestion,
  CampaignTextQuestion
} from "../components/campaign-funnel/contract";
import {
  CREDIT_BAND_OPTIONS,
  EMPLOYMENT_OPTIONS,
  INCOME_BAND_OPTIONS,
  MONTHLY_DEBT_BAND_OPTIONS,
  MORTGAGE_RATE_BAND_OPTIONS,
  TIMING_OPTIONS
} from "../components/planner/options";

/**
 * Campaign landing pages under /get-started/.
 *
 * One page per ad group, because Google Ads scores a landing page on how well
 * its content matches the ad the visitor clicked. Each page is the same
 * skeleton — compact hero, the funnel front and center, a short
 * what-happens-next strip, the standard disclosure block — with
 * campaign-specific copy and a campaign funnel question set.
 *
 * The funnels ask one question per screen at the depth the ad campaigns run
 * at. Every answer maps into the lead schema: qualifying answers travel in
 * the `planner` object (LeadPlannerSchema), timing and credit for the shorter
 * funnels travel top-level, and the handful of answers with no schema home
 * (military service, agent status, a refinance goal, a HELOC product
 * preference) travel in the bounded `message` field as a compact labelled
 * summary built ONLY from the option labels below — never visitor free text.
 * Sliders submit bands, never figures.
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
  /** Funnel question set and routing. `message` is the fixed campaign label the loan officer sees. */
  funnel: CampaignFunnelConfig;
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

/* ----------------------------------------------------------------------------
 * Shared questions. Option values are the schema's own enumerated vocabulary
 * (the contract tests hold every one of them against @tract/schemas); labels
 * are the campaign reading of those values.
 * ------------------------------------------------------------------------- */

/** Lead-table timeline vocabulary, for funnels that do not submit a planner. */
const TIMELINE_CHOICES = [
  { value: "now", label: "As soon as possible" },
  { value: "0_3_months", label: "Within 3 months" },
  { value: "3_6_months", label: "3 to 6 months" },
  { value: "6_plus", label: "More than 6 months" },
  { value: "researching", label: "Just researching" }
];

const CREDIT_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "creditBand",
  heading: "Where do you think your credit sits?",
  help: "Your own rough sense is all we need. This is self-reported — never a credit check.",
  options: CREDIT_BAND_OPTIONS,
  twoColumns: true
};

const EMPLOYMENT_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "employment",
  heading: "How is your income earned?",
  options: EMPLOYMENT_OPTIONS,
  twoColumns: true
};

const INCOME_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "incomeBand",
  heading: "What is your gross monthly household income?",
  help: "A range is all we ask for — never an exact figure, and never documentation.",
  options: INCOME_BAND_OPTIONS,
  twoColumns: true
};

const MONTHLY_DEBT_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "monthlyDebtBand",
  heading: "About how much goes to monthly debt payments?",
  help: "Car loans, cards, student loans — not rent or a mortgage. A range is plenty.",
  options: MONTHLY_DEBT_BAND_OPTIONS,
  twoColumns: true
};

const timingQuestion = (heading: string): CampaignChoiceQuestion => ({
  kind: "choice",
  id: "timing",
  heading,
  options: TIMING_OPTIONS
});

const PROPERTY_TYPE_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "propertyType",
  heading: "What type of home is it?",
  options: [
    { value: "single_family", label: "Single family" },
    { value: "townhome", label: "Townhome" },
    { value: "condo", label: "Condominium" },
    { value: "multi_family_2_4", label: "2 to 4 units" },
    { value: "manufactured", label: "Manufactured home" },
    { value: "other", label: "Something else" }
  ],
  twoColumns: true
};

/**
 * City or ZIP only, optional, and routed exclusively into the planner's
 * bounded `propertyLocation` field — a street address identifies a person and
 * is never asked for on a marketing form. The 80-character cap is the
 * schema's own bound on that field.
 */
const locationQuestion = (heading: string): CampaignTextQuestion => ({
  kind: "text",
  id: "propertyLocation",
  heading,
  help: "City or ZIP code is plenty — never a street address.",
  placeholder: "e.g. Tampa or 33602",
  maxLength: 80,
  optional: true
});

const BUYING_STAGE_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "propertyStage",
  heading: "Where are you in the buying process?",
  options: [
    { value: "under_contract", label: "I've signed a purchase contract" },
    { value: "identified", label: "I've found the home I want" },
    {
      value: "actively_looking",
      label: "Actively looking",
      hint: "Hoping to buy in the next 2 to 6 months"
    },
    { value: "early_research", label: "Just researching" }
  ]
};

const HOME_USE_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "homeUse",
  heading: "How will you use the home?",
  options: [
    { value: "primary", label: "Primary residence" },
    { value: "vacation", label: "Vacation or second home" },
    { value: "investment", label: "Investment property" }
  ]
};

const MILITARY_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "military",
  heading: "Have you or your spouse served in the U.S. military?",
  // Factual context only: the VA program exists and eligible buyers may have
  // options under it. No promise about this visitor.
  help: "Service can matter here — eligible buyers may have VA loan options, and a licensed professional can explain how the program works.",
  options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" }
  ]
};

const MILITARY_BRANCH_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "militaryBranch",
  heading: "Which branch?",
  showIf: { id: "military", equals: "yes" },
  options: [
    { value: "army", label: "Army" },
    { value: "marine_corps", label: "Marine Corps" },
    { value: "navy", label: "Navy" },
    { value: "air_force", label: "Air Force" },
    { value: "space_force", label: "Space Force" },
    { value: "coast_guard", label: "Coast Guard" },
    { value: "national_guard", label: "National Guard or Reserve" },
    { value: "spouse", label: "Military spouse" },
    { value: "other", label: "Other eligible service" }
  ],
  twoColumns: true
};

const AGENT_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "agent",
  heading: "Are you working with a real estate agent?",
  options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "Not yet" }
  ]
};

const PRICE_QUESTION: CampaignSliderQuestion = {
  kind: "slider",
  id: "price",
  heading: "What's the approximate purchase price?",
  help: "A rough estimate is fine — we can refine it together later.",
  min: 50_000,
  max: 1_500_000,
  step: 5_000,
  defaultValue: 350_000
};

const DOWN_PAYMENT_QUESTION: CampaignSliderQuestion = {
  kind: "slider",
  id: "downPayment",
  heading: "About how much do you plan to put down?",
  help: "An estimate is fine. Only the percentage range is shared with us.",
  min: 0,
  max: 500_000,
  step: 5_000,
  defaultValue: 30_000
};

const HOME_VALUE_QUESTION: CampaignSliderQuestion = {
  kind: "slider",
  id: "homeValue",
  heading: "About what is your home worth today?",
  help: "Your best guess — only the range it falls in is shared.",
  min: 50_000,
  max: 2_000_000,
  step: 5_000,
  defaultValue: 400_000
};

const CURRENT_BALANCE_QUESTION: CampaignSliderQuestion = {
  kind: "slider",
  id: "currentBalance",
  heading: "What do you still owe on your first mortgage?",
  help: "Roughly is fine — only the range it falls in is shared.",
  min: 0,
  max: 1_500_000,
  step: 5_000,
  defaultValue: 250_000
};

const RATE_BAND_QUESTION: CampaignChoiceQuestion = {
  kind: "choice",
  id: "rateBand",
  // The visitor's own current rate, self-reported as a range. Never a rate we
  // quote, promise, or imply.
  heading: "What's the interest rate on that mortgage now?",
  options: MORTGAGE_RATE_BAND_OPTIONS,
  twoColumns: true
};

/**
 * The purchase question set, at the depth the reference ad funnels run:
 * stage → city or ZIP → property → use → military (branch when yes) → agent →
 * price → down payment → employment → income → monthly debt → credit →
 * timing. The monthly-debt question exists because LeadPlannerSchema requires
 * the band; asking (with an explicit decline option) is the honest
 * alternative to fabricating an answer the visitor never gave. The property
 * state is asked on the contact screen.
 */
function purchaseQuestions({
  militaryFirst = false
}: { militaryFirst?: boolean } = {}): CampaignQuestion[] {
  const militaryPair: CampaignQuestion[] = [MILITARY_QUESTION, MILITARY_BRANCH_QUESTION];
  const core: CampaignQuestion[] = [
    BUYING_STAGE_QUESTION,
    locationQuestion("Where are you looking to buy?"),
    PROPERTY_TYPE_QUESTION,
    HOME_USE_QUESTION,
    ...(militaryFirst ? [] : militaryPair),
    AGENT_QUESTION,
    PRICE_QUESTION,
    DOWN_PAYMENT_QUESTION,
    EMPLOYMENT_QUESTION,
    INCOME_QUESTION,
    MONTHLY_DEBT_QUESTION,
    CREDIT_QUESTION,
    timingQuestion("When are you hoping to buy?")
  ];
  return militaryFirst ? [...militaryPair, ...core] : core;
}

/** Refinance set. Stage is entailed (own_it) and down payment is not a refinance question. */
const REFINANCE_QUESTIONS: CampaignQuestion[] = [
  {
    kind: "choice",
    id: "refinanceGoal",
    heading: "What are you hoping a refinance would do?",
    options: [
      { value: "lower_payment", label: "Lower my monthly payment" },
      { value: "cash_out", label: "Take cash out of my equity" },
      { value: "pay_off_debt", label: "Pay off other debt" },
      { value: "remove_pmi", label: "Remove mortgage insurance (PMI)" },
      { value: "change_terms", label: "Switch my loan type or term" },
      { value: "not_sure", label: "I'm not sure yet" }
    ],
    twoColumns: true
  },
  locationQuestion("Where is the home?"),
  HOME_VALUE_QUESTION,
  CURRENT_BALANCE_QUESTION,
  RATE_BAND_QUESTION,
  PROPERTY_TYPE_QUESTION,
  EMPLOYMENT_QUESTION,
  INCOME_QUESTION,
  MONTHLY_DEBT_QUESTION,
  CREDIT_QUESTION,
  timingQuestion("When would you want to make a change?")
];

/**
 * HELOC set. PlannerGoalSchema has no honest home for a second-lien inquiry —
 * a HELOC is not a refinance, and saying so would misdescribe what the
 * visitor asked about — so this funnel submits no planner object. Timing and
 * credit travel top-level; the product preference and the sliders' bands
 * travel in the message summary. Educational framing throughout.
 */
const HELOC_QUESTIONS: CampaignQuestion[] = [
  {
    kind: "choice",
    id: "helocKind",
    heading: "What are you looking to understand?",
    options: [
      {
        value: "line_of_credit",
        label: "A home equity line of credit",
        hint: "Borrow as needed during a draw period"
      },
      {
        value: "fixed_second",
        label: "A fixed-rate second mortgage",
        hint: "One lump sum with a set payment"
      },
      {
        value: "help_me_decide",
        label: "Help me decide",
        hint: "We'll explain how each one works"
      }
    ]
  },
  {
    kind: "slider",
    id: "equityAmount",
    heading: "About how much equity are you hoping to access?",
    help: "How much you could actually access depends on a lender's review — this just frames the conversation.",
    min: 5_000,
    max: 500_000,
    step: 5_000,
    defaultValue: 50_000
  },
  { ...HOME_VALUE_QUESTION },
  { ...CURRENT_BALANCE_QUESTION },
  CREDIT_QUESTION,
  {
    kind: "choice",
    id: "timeline",
    heading: "When are you hoping to access your equity?",
    options: TIMELINE_CHOICES
  }
];

/** Seller set stays short on purpose: a handoff needs timing, not financing depth. */
const SELL_QUESTIONS: CampaignQuestion[] = [
  {
    kind: "choice",
    id: "timeline",
    heading: "When are you looking to sell?",
    options: TIMELINE_CHOICES
  },
  {
    kind: "slider",
    id: "homeValue",
    heading: "Roughly what do you think the home is worth?",
    help: "Optional, and a guess is fine — skip it if you'd rather not say.",
    min: 50_000,
    max: 2_000_000,
    step: 5_000,
    defaultValue: 400_000,
    optional: true
  }
];

export const CAMPAIGNS: CampaignDefinition[] = [
  {
    slug: "purchase",
    metaTitle: "Start your Florida home purchase conversation",
    metaDescription:
      "Buying a home in Florida? A few quick questions and a licensed mortgage professional will lay out your purchase financing options. No credit pull.",
    eyebrow: "Buying a home",
    headline: "Start your Florida home purchase conversation",
    subhead:
      "Tell us where you are in the process and what you're working with, and a licensed mortgage professional will lay out what your purchase financing options actually are.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "purchase",
      planner: { goal: "purchase" },
      questions: purchaseQuestions(),
      message: "Arrived via the purchase campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    slug: "refinance",
    metaTitle: "See whether refinancing actually makes sense",
    metaDescription:
      "Thinking about refinancing your Florida home? A few questions and a licensed professional will walk you through the break-even math. No credit pull.",
    eyebrow: "Refinancing",
    headline: "See whether a refinance actually makes sense",
    subhead:
      "A lower payment is not the whole story — we walk you through the break-even math for your situation, not just the new number.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "refinance",
      planner: { goal: "refinance", presetPropertyStage: "own_it" },
      questions: REFINANCE_QUESTIONS,
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
      "Tell us what you're weighing and a licensed professional will explain how a home equity line of credit works, what opening one involves, and how it compares with a cash-out refinance.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "heloc",
      questions: HELOC_QUESTIONS,
      contactHint:
        "A licensed professional will reach out to explain your home equity options — nothing is submitted to a lender from this form.",
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
      "Interested in an FHA loan? Answer a few questions and a licensed mortgage professional will explain how FHA financing works in Florida. No credit pull.",
    eyebrow: "FHA loans",
    headline: "Ask us about FHA financing in Florida",
    subhead:
      "FHA-insured loans are built around smaller down payments and more flexible credit guidelines — a licensed professional will walk you through how the program works and what it costs to carry.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "purchase",
      planner: { goal: "purchase" },
      questions: purchaseQuestions(),
      message: "Arrived via the FHA campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    slug: "va",
    metaTitle: "Ask us about VA home loans in Florida",
    metaDescription:
      "VA-guaranteed loans are a benefit earned through service. Answer a few questions and a licensed professional will explain how the program works. No credit pull.",
    eyebrow: "VA loans",
    headline: "Ask us about VA home loans in Florida",
    subhead:
      "VA-guaranteed loans are a benefit earned through military service — a licensed professional will walk you through how the program works, including its down payment and funding fee rules.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "purchase",
      planner: { goal: "purchase" },
      // The service question leads because it is the campaign's premise.
      questions: purchaseQuestions({ militaryFirst: true }),
      message: "Arrived via the VA campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    slug: "first-home",
    metaTitle: "Buying your first home in Florida",
    metaDescription:
      "Your first mortgage comes with the most unknowns. Answer a few questions and a licensed professional will explain the sequence step by step. No credit pull.",
    eyebrow: "First home",
    headline: "Buying your first home, explained from the start",
    subhead:
      "Your first mortgage comes with the most unknowns — we explain the sequence, what to have ready, and where first-time buyers most often get surprised.",
    chips: STANDARD_CHIPS,
    funnel: {
      intent: "first_time_buyer",
      planner: { goal: "purchase" },
      questions: purchaseQuestions(),
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
      // Home use is the campaign's premise, so the goal is preset rather than
      // asked; the military question is dropped because VA financing is for
      // primary residences and the factual help line would not apply here.
      planner: { goal: "investment" },
      questions: [
        BUYING_STAGE_QUESTION,
        locationQuestion("Where are you looking to buy?"),
        PROPERTY_TYPE_QUESTION,
        AGENT_QUESTION,
        PRICE_QUESTION,
        DOWN_PAYMENT_QUESTION,
        EMPLOYMENT_QUESTION,
        INCOME_QUESTION,
        MONTHLY_DEBT_QUESTION,
        CREDIT_QUESTION,
        timingQuestion("When are you hoping to buy?")
      ],
      message: "Arrived via the investment property campaign page."
    },
    whatHappensNext: MORTGAGE_NEXT_STEPS
  },
  {
    // Seller handoff. TRACT is a mortgage brokerage and does not list homes;
    // every line here is connection framing, and the financing questions are
    // dropped because a seller does not need financing depth.
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
      questions: SELL_QUESTIONS,
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
