/**
 * The planner's question set, in one place.
 *
 * Every financial answer is a BAND. The consumer's exact income, exact debt, and
 * exact credit score are never asked for and never leave the browser, because
 * this is a marketing conversation starter and not an application. The
 * representative figure attached to each band exists only to drive the on-screen
 * illustration; it is a midpoint, it is labelled as one, and it is never stored.
 *
 * Every value here is also a checked column value in
 * supabase/migrations/20260817000800_lead_planner_responses.sql. Adding a choice
 * means adding it there and in @tract/schemas in the same change.
 */

export type Option<T extends string> = { value: T; label: string; hint?: string };

export type PlannerGoalValue =
  "purchase" | "refinance" | "investment" | "land" | "construction_renovation";

export const GOAL_OPTIONS: Option<PlannerGoalValue>[] = [
  { value: "purchase", label: "Buy a home to live in", hint: "A primary residence or second home" },
  {
    value: "refinance",
    label: "Refinance a mortgage I have",
    hint: "Change the rate, term, or tap equity"
  },
  {
    value: "investment",
    label: "Buy an investment property",
    hint: "A rental or a property held for return"
  },
  { value: "land", label: "Buy land", hint: "A lot or acreage, with or without a build planned" },
  {
    value: "construction_renovation",
    label: "Build or renovate",
    hint: "Construction financing or a renovation loan"
  }
];

/** Which lead intent a goal maps to. The lead vocabulary predates the planner. */
export const INTENT_BY_GOAL: Record<PlannerGoalValue, string> = {
  purchase: "purchase",
  refinance: "refinance",
  investment: "investment",
  land: "general",
  construction_renovation: "general"
};

export type PropertyTypeValue =
  "single_family" | "condo" | "townhome" | "multi_family_2_4" | "manufactured" | "land" | "other";

export const PROPERTY_TYPE_OPTIONS: Option<PropertyTypeValue>[] = [
  { value: "single_family", label: "Single family" },
  { value: "condo", label: "Condominium" },
  { value: "townhome", label: "Townhome" },
  { value: "multi_family_2_4", label: "2 to 4 units" },
  { value: "manufactured", label: "Manufactured home" },
  { value: "land", label: "Land or lot" },
  { value: "other", label: "Something else" }
];

export type PropertyStageValue =
  "under_contract" | "identified" | "actively_looking" | "early_research" | "own_it";

export const PROPERTY_STAGE_OPTIONS: Option<PropertyStageValue>[] = [
  { value: "under_contract", label: "I am under contract" },
  { value: "identified", label: "I found the one I want" },
  { value: "actively_looking", label: "I am actively looking" },
  { value: "early_research", label: "I am still researching" },
  { value: "own_it", label: "I already own it" }
];

export type PriceBandValue =
  "under_200k" | "200k_350k" | "350k_500k" | "500k_750k" | "750k_1m" | "1m_plus";

/**
 * The price the consumer types drives the illustration; only the band it falls
 * into is submitted. A range is enough for a first conversation.
 */
export function priceBandFor(priceDollars: number): PriceBandValue {
  if (priceDollars < 200_000) return "under_200k";
  if (priceDollars < 350_000) return "200k_350k";
  if (priceDollars < 500_000) return "350k_500k";
  if (priceDollars < 750_000) return "500k_750k";
  if (priceDollars < 1_000_000) return "750k_1m";
  return "1m_plus";
}

export const PRICE_BAND_LABEL: Record<PriceBandValue, string> = {
  under_200k: "under $200k",
  "200k_350k": "$200k to $350k",
  "350k_500k": "$350k to $500k",
  "500k_750k": "$500k to $750k",
  "750k_1m": "$750k to $1M",
  "1m_plus": "$1M and above"
};

export type DownPaymentBandValue = "under_3" | "3_5" | "5_10" | "10_20" | "20_plus" | "not_sure";

export function downPaymentBandFor(
  downDollars: number,
  priceDollars: number
): DownPaymentBandValue {
  if (priceDollars <= 0) return "not_sure";
  const share = (downDollars / priceDollars) * 100;
  if (share < 3) return "under_3";
  if (share < 5) return "3_5";
  if (share < 10) return "5_10";
  if (share < 20) return "10_20";
  return "20_plus";
}

export const DOWN_PAYMENT_BAND_LABEL: Record<DownPaymentBandValue, string> = {
  under_3: "under 3%",
  "3_5": "3% to 5%",
  "5_10": "5% to 10%",
  "10_20": "10% to 20%",
  "20_plus": "20% or more",
  not_sure: "not sure yet"
};

export type MortgageBalanceBandValue =
  "under_100k" | "100k_250k" | "250k_500k" | "500k_750k" | "750k_plus" | "not_sure";

export function mortgageBalanceBandFor(balanceDollars: number): MortgageBalanceBandValue {
  if (balanceDollars <= 0) return "not_sure";
  if (balanceDollars < 100_000) return "under_100k";
  if (balanceDollars < 250_000) return "100k_250k";
  if (balanceDollars < 500_000) return "250k_500k";
  if (balanceDollars < 750_000) return "500k_750k";
  return "750k_plus";
}

export type MortgageRateBandValue = "under_4" | "4_5" | "5_6" | "6_7" | "7_plus" | "not_sure";

export const MORTGAGE_RATE_BAND_OPTIONS: Option<MortgageRateBandValue>[] = [
  { value: "under_4", label: "Under 4%" },
  { value: "4_5", label: "4% to 5%" },
  { value: "5_6", label: "5% to 6%" },
  { value: "6_7", label: "6% to 7%" },
  { value: "7_plus", label: "7% or more" },
  { value: "not_sure", label: "I am not sure" }
];

/** Midpoint of each band in basis points, for the illustration only. */
export const MORTGAGE_RATE_BAND_MIDPOINT_BP: Record<MortgageRateBandValue, number | null> = {
  under_4: 350,
  "4_5": 450,
  "5_6": 550,
  "6_7": 650,
  "7_plus": 750,
  not_sure: null
};

export type CreditBandValue =
  "below_580" | "580_619" | "620_679" | "680_719" | "720_759" | "760_plus" | "unknown";

/** Self-reported only. Never a credit pull, never a score, never a decision. */
export const CREDIT_BAND_OPTIONS: Option<CreditBandValue>[] = [
  { value: "760_plus", label: "760 or higher" },
  { value: "720_759", label: "720 to 759" },
  { value: "680_719", label: "680 to 719" },
  { value: "620_679", label: "620 to 679" },
  { value: "580_619", label: "580 to 619" },
  { value: "below_580", label: "Below 580" },
  { value: "unknown", label: "I do not know" }
];

export type EmploymentValue =
  "w2" | "self_employed" | "business_owner" | "contract_1099" | "retired" | "other";

export const EMPLOYMENT_OPTIONS: Option<EmploymentValue>[] = [
  { value: "w2", label: "Employed, paid by W-2" },
  { value: "self_employed", label: "Self-employed" },
  { value: "business_owner", label: "Business owner" },
  { value: "contract_1099", label: "Contract or 1099" },
  { value: "retired", label: "Retired" },
  { value: "other", label: "Something else" }
];

export type IncomeBandValue =
  "under_4k" | "4k_6k" | "6k_8k" | "8k_12k" | "12k_20k" | "20k_plus" | "prefer_not_to_say";

export const INCOME_BAND_OPTIONS: Option<IncomeBandValue>[] = [
  { value: "under_4k", label: "Under $4,000 a month" },
  { value: "4k_6k", label: "$4,000 to $6,000" },
  { value: "6k_8k", label: "$6,000 to $8,000" },
  { value: "8k_12k", label: "$8,000 to $12,000" },
  { value: "12k_20k", label: "$12,000 to $20,000" },
  { value: "20k_plus", label: "$20,000 or more" },
  { value: "prefer_not_to_say", label: "I would rather not say" }
];

/** Band midpoints in whole dollars. Used for the illustration; never submitted. */
export const INCOME_BAND_MIDPOINT_DOLLARS: Record<IncomeBandValue, number | null> = {
  under_4k: 3_000,
  "4k_6k": 5_000,
  "6k_8k": 7_000,
  "8k_12k": 10_000,
  "12k_20k": 16_000,
  "20k_plus": 24_000,
  prefer_not_to_say: null
};

export type MonthlyDebtBandValue =
  "none" | "under_500" | "500_1000" | "1000_2000" | "2000_plus" | "prefer_not_to_say";

export const MONTHLY_DEBT_BAND_OPTIONS: Option<MonthlyDebtBandValue>[] = [
  { value: "none", label: "None" },
  { value: "under_500", label: "Under $500 a month" },
  { value: "500_1000", label: "$500 to $1,000" },
  { value: "1000_2000", label: "$1,000 to $2,000" },
  { value: "2000_plus", label: "$2,000 or more" },
  { value: "prefer_not_to_say", label: "I would rather not say" }
];

export const MONTHLY_DEBT_BAND_MIDPOINT_DOLLARS: Record<MonthlyDebtBandValue, number | null> = {
  none: 0,
  under_500: 250,
  "500_1000": 750,
  "1000_2000": 1_500,
  "2000_plus": 3_000,
  prefer_not_to_say: null
};

export type TimingValue = "immediately" | "within_30_days" | "60_to_90_days" | "researching";

export const TIMING_OPTIONS: Option<TimingValue>[] = [
  { value: "immediately", label: "Right away", hint: "Ready to move now" },
  { value: "within_30_days", label: "Within 30 days" },
  { value: "60_to_90_days", label: "In 60 to 90 days" },
  { value: "researching", label: "Just researching", hint: "No timeline yet, and that is fine" }
];

export const PREFERRED_CONTACT_OPTIONS: Option<"phone" | "sms" | "email">[] = [
  { value: "phone", label: "Phone call" },
  { value: "sms", label: "Text message" },
  { value: "email", label: "Email" }
];

/**
 * Every state, because a person can ask about a property anywhere even though
 * this brokerage is licensed in Florida. Where we can actually act is a
 * licensing fact stated on the page, not something a dropdown should imply.
 */
export const STATE_OPTIONS: Option<string>[] = [
  { value: "FL", label: "Florida" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" }
];
