/**
 * Florida down-payment-assistance programs.
 *
 * Educational reference data for the statewide Florida Housing (FHFC) programs,
 * plus a transparent matcher the finder uses to suggest which ones are worth
 * asking a licensed officer about. Nothing here is an eligibility determination
 * or a credit decision — the criteria are the programs' own published rules, and
 * program terms and funding change, so every figure is dated and sourced.
 *
 * Sourced from Florida Housing Finance Corporation, August 2026. Verify current
 * terms, income limits (which are county-specific and updated annually), and
 * funding availability against the official program pages before relying on them.
 */

export const DPA_AS_OF = "August 2026";

export type DpaAnswers = {
  /** Owned a primary residence in the last three years. */
  ownedRecently: boolean;
  /** Works 35+ hours a week for a Florida-based employer. */
  floridaFullTime: boolean;
  /** Veteran or active-duty military. */
  military: boolean;
};

export type DpaProgram = {
  id: string;
  name: string;
  tagline: string;
  /** The assistance in one plain line. */
  assistance: string;
  /** How the money is structured and repaid. */
  structure: string;
  /** Stable, published eligibility criteria. */
  criteria: string[];
  sourceLabel: string;
  sourceUrl: string;
  /**
   * Whether to surface this program for the given answers. Deliberately coarse:
   * it reflects the stable structural rules (first-time status, employment), not
   * the annual income and purchase-price limits, which a licensed officer checks
   * against the current county tables. A match is "worth asking about", never
   * "you qualify".
   */
  matches: (answers: DpaAnswers) => boolean;
};

/** First-time here means the FHFC rule: no owned primary residence in the last three years — waived for military. */
function firstTimeEligible(answers: DpaAnswers): boolean {
  return !answers.ownedRecently || answers.military;
}

export const DPA_PROGRAMS: DpaProgram[] = [
  {
    id: "hometown-heroes",
    name: "Florida Hometown Heroes",
    tagline: "The largest statewide help, for people who work full-time in Florida.",
    assistance:
      "Up to 5% of your first mortgage, capped at $35,000, toward down payment and closing costs.",
    structure:
      "A 0% interest, non-amortizing second mortgage with no monthly payment. It is deferred and repaid — not forgiven — when you sell, refinance, pay it off, or the home stops being your primary residence.",
    criteria: [
      "Work at least 35 hours a week for a Florida-based employer (most full-time roles qualify — the program was expanded beyond its original public-service professions).",
      "First-time homebuyer — no owned primary residence in the last three years. Veterans and active-duty military are exempt from this rule.",
      "Buying a primary residence in Florida.",
      "Minimum 640 credit score and standard debt-to-income limits.",
      "Household income within the program limit (about 140% of area median income, which varies by county and updates yearly).",
      "Complete an approved homebuyer education course, and use an eligible FHFC first mortgage."
    ],
    sourceLabel: "Florida Housing — Hometown Heroes",
    sourceUrl: "https://www.floridahousing.org/live-local-act/hometown-heroes-program",
    matches: (answers) => firstTimeEligible(answers) && answers.floridaFullTime
  },
  {
    id: "fl-assist",
    name: "Florida Assist (FL Assist)",
    tagline: "A no-monthly-payment down payment second mortgage.",
    assistance: "Up to $10,000 toward your down payment and closing costs.",
    structure:
      "A 0% interest, deferred second mortgage with no monthly payment. The balance is repaid — not forgiven — when you sell, refinance, pay off the first mortgage, or move.",
    criteria: [
      "First-time homebuyer — no owned primary residence in the last three years (military exempt).",
      "Pair it with an eligible FHFC first mortgage (conventional HFA Preferred, FHA, VA, or USDA).",
      "Minimum 640 credit score, and income and purchase-price limits that vary by county.",
      "Complete an approved homebuyer education course."
    ],
    sourceLabel: "Florida Housing — homebuyer programs",
    sourceUrl: "https://www.floridahousing.org/programs/homebuyer-overview-page",
    matches: (answers) => firstTimeEligible(answers)
  },
  {
    id: "fl-hlp",
    name: "FL HLP Second Mortgage",
    tagline: "A larger set of buyers, with a small monthly payment.",
    assistance: "$10,000 toward your down payment and closing costs.",
    structure:
      "A second mortgage at 3% interest, fully amortizing over 15 years — so it does carry a small monthly payment. The remaining balance is due when you sell, refinance, or move.",
    criteria: [
      "First-time homebuyer — no owned primary residence in the last three years (military exempt).",
      "Pair it with an eligible FHFC first mortgage.",
      "Minimum 640 credit score, and income and purchase-price limits that vary by county.",
      "Complete an approved homebuyer education course."
    ],
    sourceLabel: "Florida Housing — homebuyer programs",
    sourceUrl: "https://www.floridahousing.org/programs/homebuyer-overview-page",
    matches: (answers) => firstTimeEligible(answers)
  }
];

export type DpaMatchResult = {
  matched: DpaProgram[];
  /** Programs that did not fit the stable rules — still shown, so the page stays honest about what was ruled out. */
  other: DpaProgram[];
};

export function matchPrograms(answers: DpaAnswers): DpaMatchResult {
  const matched = DPA_PROGRAMS.filter((program) => program.matches(answers));
  const other = DPA_PROGRAMS.filter((program) => !program.matches(answers));
  return { matched, other };
}
