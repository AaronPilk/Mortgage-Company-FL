import type { AnalysisType } from "@tract/vision-model";

/**
 * What each analysis type asks for and what it is honest about.
 *
 * `needs` is written as a checklist rather than marketing copy, because the
 * single biggest determinant of whether a Vision result is worth anything is
 * whether the person brought real numbers to it.
 */

export type FieldKey =
  | "improvementBudget"
  | "expectedAfterValue"
  | "grossMonthlyRent"
  | "nightlyRate"
  | "downPayment"
  | "rate"
  | "term"
  | "holdMonths"
  | "annualPropertyTax"
  | "annualInsurance"
  | "monthlyHoa";

export type SizeField = "squareFeet" | "addedSquareFeet" | "buildSquareFeet";

export type AnalysisTypeMeta = {
  type: AnalysisType;
  label: string;
  blurb: string;
  /** What the model can tell you, stated without overclaiming. */
  answers: string;
  needs: readonly string[];
  priceLabel: string;
  sizeFields: readonly SizeField[];
  fields: readonly FieldKey[];
};

const FINANCING: readonly FieldKey[] = ["downPayment", "rate", "term"];
const CARRY: readonly FieldKey[] = ["annualPropertyTax", "annualInsurance", "monthlyHoa"];

export const ANALYSIS_TYPE_META: readonly AnalysisTypeMeta[] = [
  {
    type: "existing_home_renovation",
    label: "Renovate an existing home",
    blurb: "Whole-home work on a property you own or are buying.",
    answers:
      "What the project costs all in, and how much of that spend the model expects to show up in value.",
    needs: ["A budget or a contractor's bid", "Square footage", "How long the work will take"],
    priceLabel: "Purchase price or current value",
    sizeFields: ["squareFeet"],
    fields: ["improvementBudget", "expectedAfterValue", "holdMonths", ...FINANCING, ...CARRY]
  },
  {
    type: "addition",
    label: "Add square footage",
    blurb: "New conditioned space attached to an existing structure.",
    answers: "Cost per added square foot, total project cost, and the modelled value of the space.",
    needs: [
      "Square footage you are adding",
      "A bid, if you have one",
      "Whether zoning and setbacks allow it — verify before anything else"
    ],
    priceLabel: "Purchase price or current value",
    sizeFields: ["squareFeet", "addedSquareFeet"],
    fields: ["improvementBudget", "expectedAfterValue", "holdMonths", ...FINANCING, ...CARRY]
  },
  {
    type: "interior_upgrade",
    label: "Kitchen or interior upgrade",
    blurb: "A refresh inside the existing footprint.",
    answers: "Budget plus contingency, carrying cost, and the modelled value change.",
    needs: ["A quote or a budget", "How long you will be living around the work"],
    priceLabel: "Purchase price or current value",
    sizeFields: ["squareFeet"],
    fields: ["improvementBudget", "expectedAfterValue", "holdMonths", ...FINANCING, ...CARRY]
  },
  {
    type: "land_new_construction",
    label: "Land plus new construction",
    blurb: "Buying a lot and building on it.",
    answers:
      "Delivered cost including land, soft costs, and carry, against a modelled completed value.",
    needs: [
      "Lot price",
      "Planned square footage or a builder's budget",
      "Zoning, utilities, and permitting answers from the county — none of which this model checks"
    ],
    priceLabel: "Land price",
    sizeFields: ["buildSquareFeet"],
    fields: ["improvementBudget", "expectedAfterValue", "holdMonths", ...FINANCING, ...CARRY]
  },
  {
    type: "long_term_rental",
    label: "Long-term rental",
    blurb: "A twelve-month lease on a single property.",
    answers: "Monthly cash flow, the rent needed to break even, and debt service coverage.",
    needs: [
      "A rent supported by comparable listings",
      "Taxes and an insurance quote",
      "Your down payment"
    ],
    priceLabel: "Purchase price",
    sizeFields: ["squareFeet"],
    fields: ["grossMonthlyRent", ...FINANCING, ...CARRY]
  },
  {
    type: "short_term_rental",
    label: "Short-term rental",
    blurb: "Nightly letting. Check first whether it is permitted where you are.",
    answers:
      "Booking income after unbooked nights, operating cost, and the income needed to break even.",
    needs: [
      "Whether short-term letting is allowed at all — city, county, and association",
      "A nightly rate",
      "Taxes and an insurance quote"
    ],
    priceLabel: "Purchase price",
    sizeFields: ["squareFeet"],
    fields: ["nightlyRate", ...FINANCING, ...CARRY]
  },
  {
    type: "fix_and_flip",
    label: "Fix and flip",
    blurb: "Buy, renovate, and resell.",
    answers:
      "The resale price needed to break even — the one figure here that depends on costs rather than on a value nobody has established.",
    needs: [
      "A purchase price",
      "A rehab budget",
      "How long you expect to hold it, including time on market"
    ],
    priceLabel: "Purchase price",
    sizeFields: ["squareFeet"],
    fields: ["improvementBudget", "expectedAfterValue", "holdMonths", ...FINANCING, ...CARRY]
  },
  {
    type: "buy_and_hold",
    label: "Buy and hold",
    blurb: "Rent it, keep it, and look at where it lands after a number of years.",
    answers:
      "Cash flow now, plus modelled equity at the end of the hold from paydown and value change.",
    needs: ["A rent", "Your hold period", "Taxes and an insurance quote"],
    priceLabel: "Purchase price",
    sizeFields: ["squareFeet"],
    fields: ["grossMonthlyRent", "holdMonths", ...FINANCING, ...CARRY]
  }
];

export function metaFor(type: AnalysisType): AnalysisTypeMeta {
  const found = ANALYSIS_TYPE_META.find((entry) => entry.type === type);
  if (found === undefined) throw new Error(`no presentation metadata for analysis type "${type}"`);
  return found;
}

export const FIELD_LABELS: Readonly<Record<FieldKey, { label: string; hint: string }>> = {
  improvementBudget: {
    label: "Construction or renovation budget",
    hint: "Leave it blank and a placeholder cost per square foot is used instead, which is far weaker."
  },
  expectedAfterValue: {
    label: "Value after the work, if you have a figure",
    hint: "Leave it blank and the model derives one from your spend. Neither is an appraisal."
  },
  grossMonthlyRent: {
    label: "Gross monthly rent",
    hint: "From comparable listings, a signed lease, or an appraiser's rent schedule. Not a guess if you can avoid it."
  },
  nightlyRate: {
    label: "Nightly rate",
    hint: "Before platform fees and before the unbooked-nights assumption."
  },
  downPayment: { label: "Cash down", hint: "Everything above this is modelled as financed." },
  rate: {
    label: "Interest rate",
    hint: "An assumption you choose. No rate is being quoted or offered here."
  },
  term: { label: "Loan term", hint: "" },
  holdMonths: {
    label: "Months held",
    hint: "Permitting and time on market are what usually make this longer than planned."
  },
  annualPropertyTax: {
    label: "Annual property tax",
    hint: "From the county property appraiser. A sale usually resets the assessed value."
  },
  annualInsurance: {
    label: "Annual property insurance",
    hint: "Get a real quote. This is the least reliable placeholder in the model for a Florida property."
  },
  monthlyHoa: { label: "Monthly association dues", hint: "" }
};

export const SIZE_LABELS: Readonly<Record<SizeField, string>> = {
  squareFeet: "Existing square footage",
  addedSquareFeet: "Square footage being added",
  buildSquareFeet: "Square footage being built"
};
