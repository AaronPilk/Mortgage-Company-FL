/**
 * Every calculator result rendered to a consumer must carry a disclosure block.
 * The copy lives here so a single approved revision propagates everywhere and so
 * the version can be stored alongside any saved scenario.
 */

export const DISCLOSURE_VERSION = "calc-disclosure@2026-08-17";

export type CalculatorDisclosure = {
  version: string;
  headline: string;
  body: string;
  excludes: string[];
};

const SHARED_EXCLUSIONS = [
  "Utilities, moving costs, and ongoing maintenance",
  "Any lender fee not entered above",
  "Income tax treatment, which is individual"
];

export const CALCULATOR_DISCLOSURES: Record<string, CalculatorDisclosure> = {
  payment: {
    version: DISCLOSURE_VERSION,
    headline: "This is an estimate, not a quote.",
    body: "Figures come from the values you entered. They are not an offer of credit, a rate quote, a preapproval, or a statement that any lender will approve this scenario. Actual payment depends on the lender, the program, the property, your full financial picture, and the rate available when you lock.",
    excludes: SHARED_EXCLUSIONS
  },
  affordability: {
    version: DISCLOSURE_VERSION,
    headline: "An illustration of ratios, not a preapproval.",
    body: "This uses the debt-to-income ratios you selected. Real limits vary by loan program, lender overlay, credit profile, reserves, and property type. Nothing here evaluates your credit or approves you for anything.",
    excludes: [...SHARED_EXCLUSIONS, "Credit review, reserves, and program eligibility"]
  },
  refinance: {
    version: DISCLOSURE_VERSION,
    headline: "Break-even depends entirely on your inputs.",
    body: "Break-even compares your monthly payment change against the refinance costs you entered. Extending the term can lower a payment while increasing total interest paid. Both figures are shown so you can weigh them.",
    excludes: SHARED_EXCLUSIONS
  },
  rent_vs_buy: {
    version: DISCLOSURE_VERSION,
    headline: "The assumptions drive the answer.",
    body: "Rent growth, appreciation, maintenance, and selling costs are assumptions you control. Small changes move the result substantially. This model deliberately omits tax treatment, which belongs with a tax professional.",
    excludes: [...SHARED_EXCLUSIONS, "Tax deductions and capital gains treatment"]
  },
  closing_cost: {
    version: DISCLOSURE_VERSION,
    headline: "A planning framework, not a Loan Estimate.",
    body: "Closing costs vary by lender, title company, county, and transaction. The binding figures arrive on your Loan Estimate and Closing Disclosure from the lender.",
    excludes: SHARED_EXCLUSIONS
  },
  investment: {
    version: DISCLOSURE_VERSION,
    headline: "A scenario model, not investment advice.",
    body: "Rent, vacancy, expenses, and resale values are estimates you supply or that come from third-party data with its own limitations. No return is projected, promised, or implied.",
    excludes: [...SHARED_EXCLUSIONS, "Income tax, depreciation, and entity structure"]
  },
  amortization: {
    version: DISCLOSURE_VERSION,
    headline: "A schedule built from your inputs, not a loan document.",
    body: "This is an estimate, not an offer of credit, a rate quote, a preapproval, or a commitment to lend. A real schedule depends on the note, the payment posting date, escrow changes, and how a servicer applies extra principal. Confirm anything that matters with your servicer.",
    excludes: [...SHARED_EXCLUSIONS, "Escrow changes and servicer payment-posting rules"]
  },
  debt_to_income: {
    version: DISCLOSURE_VERSION,
    headline: "Two ratios, not an approval.",
    body: "This is an estimate, not an offer of credit, a rate quote, a preapproval, or a commitment to lend. The 28 and 43 figures are common reference points, not thresholds any lender must apply. How income and debts are counted varies by program and by lender.",
    excludes: [...SHARED_EXCLUSIONS, "How a lender documents and counts income"]
  },
  dscr: {
    version: DISCLOSURE_VERSION,
    headline: "A ratio, not an underwriting decision.",
    body: "This is an estimate, not an offer of credit, a rate quote, a preapproval, or a commitment to lend. The reference bands shown are how the ratio is commonly described in the market. They are general reference only, they are not TRACT underwriting, and no lender is bound by them.",
    excludes: [...SHARED_EXCLUSIONS, "Vacancy, management, repairs, and capital reserves"]
  },
  rate_impact: {
    version: DISCLOSURE_VERSION,
    headline: "Comparison rates you chose, not rates on offer.",
    body: "This is an estimate, not an offer of credit, a rate quote, a preapproval, or a commitment to lend. Every rate shown is a value you entered for comparison. No rate here is quoted or available, and the rate anyone receives depends on the lender, the program, and the market at the time of lock.",
    excludes: SHARED_EXCLUSIONS
  }
};

export function disclosureFor(key: string): CalculatorDisclosure {
  const found = CALCULATOR_DISCLOSURES[key];
  if (found === undefined) {
    throw new Error(`no approved disclosure registered for calculator "${key}"`);
  }
  return found;
}
