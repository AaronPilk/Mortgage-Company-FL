/**
 * The engine.
 *
 * Deterministic arithmetic, start to finish. No network call, no model call, no
 * clock, no randomness — the same input produces the same output forever, which
 * is what makes it testable, free to run, instant, impossible to leak through,
 * and safe inside a Worker CPU budget.
 *
 * Every scenario is run three times, once per case, and the three runs are
 * folded into low/base/high bands. Nothing here ever emits a bare number for a
 * quantity the model cannot pin down.
 */

import { type Cents, formatUsd } from "@tract/mortgage-math";
import {
  type AssumptionKey,
  type ResolvedAssumption,
  resolveAssumptions,
  usedAssumptions
} from "./assumptions";
import { type CaseFactors, caseFactors, nonNegativeCents, positiveCount } from "./cases";
import { assessConfidence } from "./confidence";
import {
  CONSTRUCTION_ASSUMPTION_KEYS,
  computeConstructionCase,
  hardCostBasis
} from "./construction";
import { FLIP_ASSUMPTION_KEYS, computeFlipCase } from "./flip";
import {
  IMPROVEMENT_ASSUMPTION_KEYS,
  afterValueBasis,
  computeImprovementCase,
  improvementSpendBasis
} from "./improvement";
import {
  BUY_AND_HOLD_ASSUMPTION_KEYS,
  LONG_TERM_ASSUMPTION_KEYS,
  SHORT_TERM_ASSUMPTION_KEYS,
  computeRentalCase,
  incomeBasis
} from "./rental";
import { VisionModelError, rangeFromCases, ratioFromCases } from "./range";
import type { CentsRange } from "./range";
import {
  type AnalysisType,
  type InputEcho,
  type VisionFigure,
  type VisionInput,
  type VisionResult,
  SCENARIO_CASES,
  VISION_CALCULATION_VERSION,
  VISION_DISCLAIMERS
} from "./types";
import { buildUnverified } from "./unverified";

export const ANALYSIS_TYPE_LABELS: Readonly<Record<AnalysisType, string>> = {
  existing_home_renovation: "Renovating an existing home",
  addition: "Adding square footage",
  interior_upgrade: "Kitchen or interior upgrade",
  land_new_construction: "Land plus new construction",
  long_term_rental: "Long-term rental",
  short_term_rental: "Short-term rental",
  fix_and_flip: "Fix and flip",
  buy_and_hold: "Buy and hold"
};

const MODELLED_NOTE =
  "A modelled band, not a quoted, appraised, or guaranteed figure. Change any assumption and it moves.";

/** Runs one function under all three cases. Keeps the tuple shape without an assertion. */
function threeCases<T>(
  factorSet: readonly CaseFactors[],
  run: (factors: CaseFactors) => T
): [T, T, T] {
  const [low, mid, high] = factorSet;
  if (low === undefined || mid === undefined || high === undefined) {
    throw new VisionModelError("a scenario needs exactly three cases");
  }
  return [run(low), run(mid), run(high)];
}

function centsFigure(key: string, label: string, cents: CentsRange, note: string): VisionFigure {
  return { key, label, kind: "cents", cents, note };
}

/* ------------------------------------------------------------------ *
 * Input echo
 * ------------------------------------------------------------------ */

function echo(key: string, label: string, display: string, suppliedByUser: boolean): InputEcho {
  return { key, label, display, suppliedByUser };
}

function buildInputEchoes(input: VisionInput): InputEcho[] {
  const out: InputEcho[] = [
    echo("analysisType", "What you are modelling", ANALYSIS_TYPE_LABELS[input.analysisType], true),
    echo(
      "ownership",
      "Ownership",
      input.ownership === "purchasing" ? "Buying it" : "Already own it",
      true
    ),
    echo(
      "purchasePrice",
      input.ownership === "purchasing" ? "Purchase price" : "Current value you believe it has",
      formatUsd(nonNegativeCents(input.purchasePriceCents)),
      true
    )
  ];

  if (input.propertyLabel !== undefined && input.propertyLabel.trim() !== "") {
    out.push(echo("propertyLabel", "Property", input.propertyLabel.trim(), true));
  }

  const maybeCount = (key: string, label: string, value: number | undefined): void => {
    const count = positiveCount(value);
    if (count !== null) out.push(echo(key, label, `${count.toLocaleString("en-US")} sq ft`, true));
  };
  maybeCount("squareFeet", "Existing square footage", input.squareFeet);
  maybeCount("addedSquareFeet", "Square footage being added", input.addedSquareFeet);
  maybeCount("buildSquareFeet", "Square footage being built", input.buildSquareFeet);

  const maybeMoney = (key: string, label: string, value: Cents | undefined): void => {
    if (value !== undefined && Number.isFinite(value)) {
      out.push(echo(key, label, formatUsd(Math.round(value)), true));
    }
  };
  maybeMoney("improvementBudget", "Budget you entered", input.improvementBudgetCents);
  maybeMoney("expectedAfterValue", "After value you entered", input.expectedAfterValueCents);
  maybeMoney("downPayment", "Cash down", input.downPaymentCents);
  maybeMoney("grossMonthlyRent", "Gross monthly rent you entered", input.grossMonthlyRentCents);
  maybeMoney("nightlyRate", "Nightly rate you entered", input.nightlyRateCents);
  maybeMoney("annualPropertyTax", "Annual property tax you entered", input.annualPropertyTaxCents);
  maybeMoney("annualInsurance", "Annual insurance you entered", input.annualInsuranceCents);
  maybeMoney("monthlyHoa", "Monthly association dues", input.monthlyHoaCents);

  if (input.annualRateBasisPoints !== undefined) {
    out.push(
      echo(
        "annualRate",
        "Interest rate you entered",
        `${(input.annualRateBasisPoints / 100).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}% — an assumption, not a quote`,
        true
      )
    );
  }
  if (input.termMonths !== undefined) {
    out.push(echo("termMonths", "Loan term", `${Math.round(input.termMonths)} months`, true));
  }
  const hold = positiveCount(input.holdMonths);
  if (hold !== null) {
    out.push(echo("holdMonths", "Months held", `${hold}`, true));
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Figure assembly, one family at a time
 * ------------------------------------------------------------------ */

function improvementFigures(input: VisionInput, factorSet: CaseFactors[]): VisionFigure[] {
  const assumptions = resolveAssumptions(input.overrides);
  const [conservative, base, optimistic] = threeCases(factorSet, (factors) =>
    computeImprovementCase(input, assumptions, factors)
  );

  const band = (pick: (figures: typeof base) => number): CentsRange =>
    rangeFromCases(pick(conservative), pick(base), pick(optimistic));

  const figures: VisionFigure[] = [];

  if (input.ownership === "purchasing") {
    figures.push(
      centsFigure(
        "acquisitionCost",
        "Acquisition, including closing costs",
        band((f) => f.acquisitionCostCents),
        "Purchase price plus a modelled share for inspection, title, survey, and closing. Real figures come from a Loan Estimate and a title quote."
      )
    );
  }

  figures.push(
    centsFigure(
      "improvementBudget",
      "Construction budget",
      band((f) => f.improvementBudgetCents),
      improvementSpendBasis(input, assumptions).basis
    ),
    centsFigure(
      "contingency",
      "Contingency",
      band((f) => f.contingencyCents),
      "Set aside for what the scope does not yet cover. Anything that opens a wall or a roof justifies more."
    ),
    centsFigure(
      "totalImprovement",
      "Budget plus contingency",
      band((f) => f.totalImprovementCents),
      MODELLED_NOTE
    ),
    centsFigure(
      "holdingCost",
      "Carrying cost while the work happens",
      band((f) => f.holdingCostCents),
      "Taxes, insurance, dues, utilities, and any modelled loan payment across the hold. Permitting delay is what usually makes this figure grow."
    ),
    centsFigure(
      "totalProjectCost",
      "Total project cost",
      band((f) => f.totalProjectCostCents),
      MODELLED_NOTE
    ),
    centsFigure(
      "afterImprovementValue",
      "Modelled value after the work",
      band((f) => f.afterImprovementValueCents),
      `${afterValueBasis(input).basis} This is not an appraisal and not a valuation.`
    ),
    centsFigure(
      "modelledValueUplift",
      "Modelled change in value",
      band((f) => f.modelledValueUpliftCents),
      "The modelled after value less the value you started with. It exists only because of the share-of-spend assumption."
    ),
    centsFigure(
      "valueNetOfSpend",
      "Modelled value change less what you spend",
      band((f) => f.valueNetOfSpendCents),
      "Negative means the model does not expect the spend to come back in value. That is common for work done to live in rather than to sell."
    )
  );

  if (base.costPerSquareFootCents !== null) {
    figures.push(
      centsFigure(
        "costPerSquareFoot",
        "Cost per square foot",
        rangeFromCases(
          conservative.costPerSquareFootCents ?? 0,
          base.costPerSquareFootCents,
          optimistic.costPerSquareFootCents ?? 0
        ),
        "Budget plus contingency divided by the square footage you entered."
      )
    );
  }

  return figures;
}

function constructionFigures(input: VisionInput, factorSet: CaseFactors[]): VisionFigure[] {
  const assumptions = resolveAssumptions(input.overrides);
  const [conservative, base, optimistic] = threeCases(factorSet, (factors) =>
    computeConstructionCase(input, assumptions, factors)
  );

  const band = (pick: (figures: typeof base) => number): CentsRange =>
    rangeFromCases(pick(conservative), pick(base), pick(optimistic));

  const figures: VisionFigure[] = [
    centsFigure(
      "landCost",
      "Land, including acquisition costs",
      band((f) => f.landCostCents),
      "The land price you entered plus a modelled share for closing. Survey, environmental, and entitlement work are not included."
    ),
    centsFigure(
      "hardCost",
      "Hard construction cost",
      band((f) => f.hardCostCents),
      hardCostBasis(input, assumptions).basis
    ),
    centsFigure(
      "softCost",
      "Soft costs",
      band((f) => f.softCostCents),
      "Design, engineering, surveys, permits, and impact fees, modelled as a share of hard cost because the real amounts are jurisdiction specific and must be confirmed with the authority having jurisdiction."
    ),
    centsFigure(
      "contingency",
      "Contingency",
      band((f) => f.contingencyCents),
      "Set aside against the parts of the scope nobody has priced yet."
    ),
    centsFigure(
      "holdingCost",
      "Carrying cost during construction",
      band((f) => f.holdingCostCents),
      "Modelled as a flat carry. A real construction loan draws progressively and charges interest on the drawn balance, which this does not replicate."
    ),
    centsFigure(
      "totalDeliveredCost",
      "Total delivered cost",
      band((f) => f.totalDeliveredCostCents),
      MODELLED_NOTE
    ),
    centsFigure(
      "completedValue",
      "Modelled completed value",
      band((f) => f.completedValueCents),
      input.expectedAfterValueCents === undefined
        ? "Derived as a ratio of delivered cost, which is openly circular. It is not a valuation, not an appraisal, and not drawn from comparable sales."
        : "The completed value you entered. Nothing here verifies it."
    ),
    centsFigure(
      "valueNetOfCost",
      "Modelled value less delivered cost",
      band((f) => f.valueNetOfCostCents),
      "The gap between two modelled figures. Treat it as a sensitivity, not a margin."
    )
  ];

  if (base.deliveredCostPerSquareFootCents !== null) {
    figures.push(
      centsFigure(
        "deliveredCostPerSquareFoot",
        "Delivered cost per square foot",
        rangeFromCases(
          conservative.deliveredCostPerSquareFootCents ?? 0,
          base.deliveredCostPerSquareFootCents,
          optimistic.deliveredCostPerSquareFootCents ?? 0
        ),
        "Everything, including land, divided by the square footage you plan to build."
      )
    );
  }

  return figures;
}

function rentalFigures(input: VisionInput, factorSet: CaseFactors[]): VisionFigure[] {
  const assumptions = resolveAssumptions(input.overrides);
  const [conservative, base, optimistic] = threeCases(factorSet, (factors) =>
    computeRentalCase(input, assumptions, factors)
  );

  const band = (pick: (figures: typeof base) => number): CentsRange =>
    rangeFromCases(pick(conservative), pick(base), pick(optimistic));

  const isShortTerm = input.analysisType === "short_term_rental";

  const figures: VisionFigure[] = [
    centsFigure(
      "totalCashInvested",
      "Cash in",
      band((f) => f.totalCashInvestedCents),
      "Down payment plus modelled closing costs plus any budget you entered. Furnishing and reserves are not included unless you entered them."
    ),
    centsFigure(
      isShortTerm ? "grossBookingIncome" : "grossRent",
      isShortTerm ? "Gross booking income before unbooked nights" : "Gross monthly rent",
      band((f) => f.grossMonthlyIncomeCents),
      incomeBasis(input, assumptions).basis
    ),
    centsFigure(
      "effectiveGrossIncome",
      "Income after vacancy",
      band((f) => f.effectiveGrossIncomeCents),
      isShortTerm
        ? "Gross booking income less the unbooked-nights assumption. Occupancy here is a placeholder, not observed market occupancy."
        : "Gross rent less the vacancy and credit-loss assumption."
    ),
    centsFigure(
      "operatingExpenses",
      "Monthly operating expenses",
      band((f) => f.operatingExpensesCents),
      "Management, maintenance, reserves, taxes, insurance, dues, and — for a short-term rental — platform fees, turnover, and utilities. Every rate behind this is an assumption you can change."
    ),
    centsFigure(
      "netOperatingIncome",
      "Net operating income",
      band((f) => f.netOperatingIncomeCents),
      "Income after operating expenses and before any loan payment."
    ),
    centsFigure(
      "debtService",
      "Monthly loan payment",
      band((f) => f.debtServiceCents),
      "Principal and interest at the rate band shown in the assumptions. No lender has quoted this and it is not an offer of credit."
    ),
    centsFigure(
      "monthlyCashFlow",
      "Monthly cash flow",
      band((f) => f.monthlyCashFlowCents),
      MODELLED_NOTE
    ),
    centsFigure(
      "annualCashFlow",
      "Annual cash flow",
      band((f) => f.annualCashFlowCents),
      MODELLED_NOTE
    ),
    {
      key: "cashOnCash",
      label: "Cash-on-cash return",
      kind: "ratio_percent",
      ratio: ratioFromCases(
        conservative.cashOnCashBasisPoints,
        base.cashOnCashBasisPoints,
        optimistic.cashOnCashBasisPoints
      ),
      note: "Annual cash flow over the cash invested. Excludes loan paydown, value change, and tax treatment."
    },
    {
      key: "capRate",
      label: "Capitalisation rate",
      kind: "ratio_percent",
      ratio: ratioFromCases(
        conservative.capRateBasisPoints,
        base.capRateBasisPoints,
        optimistic.capRateBasisPoints
      ),
      note: "Net operating income over the price you entered. It is not a market cap rate and nothing here observes one."
    },
    {
      key: "dscr",
      label: "Debt service coverage",
      kind: "ratio_multiple",
      ratio: ratioFromCases(
        conservative.dscrBasisPoints,
        base.dscrBasisPoints,
        optimistic.dscrBasisPoints
      ),
      note: "Gross income over the full housing obligation. Lenders define and apply this differently, and no lender is bound by anything shown here."
    }
  ];

  if (base.breakEvenGrossIncomeCents !== null) {
    figures.push(
      centsFigure(
        "breakEvenIncome",
        isShortTerm ? "Booking income needed to break even" : "Rent needed to break even",
        rangeFromCases(
          conservative.breakEvenGrossIncomeCents ?? base.breakEvenGrossIncomeCents,
          base.breakEvenGrossIncomeCents,
          optimistic.breakEvenGrossIncomeCents ?? base.breakEvenGrossIncomeCents
        ),
        "The gross income at which cash flow is exactly zero under each case. This is the figure to test a real rent against."
      )
    );
  }

  if (input.analysisType === "buy_and_hold" && base.projectedValueCents > 0) {
    figures.push(
      centsFigure(
        "projectedValue",
        "Modelled value at the end of the hold",
        band((f) => f.projectedValueCents),
        "A flat annual rate applied over the hold. Values do not move at a constant rate and can fall. This is not a forecast."
      ),
      centsFigure(
        "projectedLoanBalance",
        "Loan balance at the end of the hold",
        band((f) => f.projectedLoanBalanceCents),
        "Scheduled amortisation only. It assumes every payment is made on time and nothing is refinanced."
      ),
      centsFigure(
        "projectedEquity",
        "Modelled equity at the end of the hold",
        band((f) => f.projectedEquityCents),
        "Modelled value less modelled balance, before any cost of selling."
      )
    );
  }

  return figures;
}

function flipFigures(input: VisionInput, factorSet: CaseFactors[]): VisionFigure[] {
  const assumptions = resolveAssumptions(input.overrides);
  const [conservative, base, optimistic] = threeCases(factorSet, (factors) =>
    computeFlipCase(input, assumptions, factors)
  );

  const band = (pick: (figures: typeof base) => number): CentsRange =>
    rangeFromCases(pick(conservative), pick(base), pick(optimistic));

  const figures: VisionFigure[] = [
    centsFigure(
      "acquisition",
      "Purchase plus acquisition costs",
      band((f) => f.purchasePriceCents + f.acquisitionCostsCents),
      "The price you entered plus a modelled share for inspection, title, survey, and closing."
    ),
    centsFigure(
      "totalRehab",
      "Rehab budget plus contingency",
      band((f) => f.totalRehabCents),
      improvementSpendBasis(input, assumptions).basis
    ),
    centsFigure(
      "financingCost",
      "Financing cost across the hold",
      band((f) => f.financingCostCents),
      "Interest and points on the financed amount at the rate band shown. No lender has priced this scenario."
    ),
    centsFigure(
      "holdingCost",
      "Carrying cost across the hold",
      band((f) => f.holdingCostCents),
      "Taxes, insurance, dues, and utilities while you own it. Every extra month on market adds to this."
    ),
    centsFigure(
      "sellingCost",
      "Cost of selling",
      band((f) => f.sellingCostCents),
      "Commission, doc stamps, title, and concessions, modelled as a share of resale."
    ),
    centsFigure(
      "totalProjectCost",
      "Total project cost",
      band((f) => f.totalProjectCostCents),
      MODELLED_NOTE
    ),
    centsFigure(
      "totalCashInvested",
      "Cash in",
      band((f) => f.totalCashInvestedCents),
      "Down payment, acquisition costs, rehab, and carrying. Assumes rehab is paid in cash unless you financed it elsewhere."
    )
  ];

  if (base.breakEvenResaleCents !== null) {
    figures.push(
      centsFigure(
        "breakEvenResale",
        "Resale price needed to break even",
        rangeFromCases(
          conservative.breakEvenResaleCents ?? base.breakEvenResaleCents,
          base.breakEvenResaleCents,
          optimistic.breakEvenResaleCents ?? base.breakEvenResaleCents
        ),
        "Every cost except the sale itself, grossed up for selling costs. This is the most defensible figure on the page: it depends only on costs, not on a resale value nobody has established."
      )
    );
  }

  figures.push(
    centsFigure(
      "modelledResaleValue",
      "Modelled resale value",
      band((f) => f.modelledResaleValueCents),
      `${afterValueBasis(input).basis} It is not an after-repair value from comparable sales, and it is not an appraisal.`
    ),
    centsFigure(
      "grossMargin",
      "Modelled margin before tax",
      band((f) => f.grossMarginCents),
      "Modelled resale less total project cost. It inherits every weakness of the resale figure. Income tax is excluded."
    ),
    {
      key: "returnOnCost",
      label: "Return on cost",
      kind: "ratio_percent",
      ratio: ratioFromCases(
        conservative.returnOnCostBasisPoints,
        base.returnOnCostBasisPoints,
        optimistic.returnOnCostBasisPoints
      ),
      note: "Modelled margin over total project cost. Excludes income tax entirely."
    }
  );

  return figures;
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

function assumptionKeysFor(analysisType: AnalysisType): readonly AssumptionKey[] {
  switch (analysisType) {
    case "existing_home_renovation":
    case "addition":
    case "interior_upgrade":
      return IMPROVEMENT_ASSUMPTION_KEYS;
    case "land_new_construction":
      return CONSTRUCTION_ASSUMPTION_KEYS;
    case "long_term_rental":
      return LONG_TERM_ASSUMPTION_KEYS;
    case "short_term_rental":
      return SHORT_TERM_ASSUMPTION_KEYS;
    case "buy_and_hold":
      return BUY_AND_HOLD_ASSUMPTION_KEYS;
    case "fix_and_flip":
      return FLIP_ASSUMPTION_KEYS;
  }
}

function figuresFor(input: VisionInput, factorSet: CaseFactors[]): VisionFigure[] {
  switch (input.analysisType) {
    case "existing_home_renovation":
    case "addition":
    case "interior_upgrade":
      return improvementFigures(input, factorSet);
    case "land_new_construction":
      return constructionFigures(input, factorSet);
    case "long_term_rental":
    case "short_term_rental":
    case "buy_and_hold":
      return rentalFigures(input, factorSet);
    case "fix_and_flip":
      return flipFigures(input, factorSet);
  }
}

export function runVisionScenario(input: VisionInput): VisionResult {
  const assumptions = resolveAssumptions(input.overrides);
  const factorSet = SCENARIO_CASES.map((scenarioCase) => caseFactors(scenarioCase, assumptions));
  const unverified = buildUnverified(input, assumptions);
  const used: ResolvedAssumption[] = usedAssumptions(
    assumptions,
    assumptionKeysFor(input.analysisType)
  );

  return {
    analysisType: input.analysisType,
    calculationVersion: VISION_CALCULATION_VERSION,
    producedBy: "deterministic_model",
    inputs: buildInputEchoes(input),
    assumptions: used,
    figures: figuresFor(input, factorSet),
    confidence: assessConfidence(input, assumptions, unverified),
    unverified,
    disclaimers: VISION_DISCLAIMERS
  };
}

/** Convenience for the UI: the headline figures for a given analysis type, in order. */
export const HEADLINE_FIGURE_KEYS: Readonly<Record<AnalysisType, readonly string[]>> = {
  existing_home_renovation: ["totalProjectCost", "afterImprovementValue", "valueNetOfSpend"],
  addition: ["totalProjectCost", "afterImprovementValue", "valueNetOfSpend"],
  interior_upgrade: ["totalImprovement", "afterImprovementValue", "valueNetOfSpend"],
  land_new_construction: ["totalDeliveredCost", "completedValue", "valueNetOfCost"],
  long_term_rental: ["monthlyCashFlow", "breakEvenIncome", "dscr"],
  short_term_rental: ["monthlyCashFlow", "breakEvenIncome", "dscr"],
  buy_and_hold: ["monthlyCashFlow", "projectedEquity", "cashOnCash"],
  fix_and_flip: ["breakEvenResale", "totalProjectCost", "grossMargin"]
};

export function figureByKey(result: VisionResult, key: string): VisionFigure | undefined {
  return result.figures.find((figure) => figure.key === key);
}
