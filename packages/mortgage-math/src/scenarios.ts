import {
  type BasisPoints,
  type Cents,
  annualRateOfCents,
  assertBasisPoints,
  assertNonNegativeCents,
  roundCents,
  sumCents
} from "./money";
import {
  CALCULATION_VERSION,
  type HousingCostInput,
  monthlyHousingCost,
  monthlyPrincipalAndInterest,
  remainingBalance
} from "./payment";

/* ------------------------------------------------------------------ *
 * Affordability
 * ------------------------------------------------------------------ */

export type AffordabilityInput = {
  grossMonthlyIncomeCents: Cents;
  monthlyDebtObligationsCents: Cents;
  downPaymentCents: Cents;
  annualRateBasisPoints: BasisPoints;
  termMonths: number;
  /** Housing ratio ceiling. Illustrative default; real limits are lender and program specific. */
  frontEndRatioBasisPoints?: BasisPoints;
  /** Total debt ratio ceiling. Illustrative default; real limits are lender and program specific. */
  backEndRatioBasisPoints?: BasisPoints;
  /** Annual tax as a rate of purchase price, e.g. Florida millage expressed in basis points. */
  propertyTaxAnnualRateBasisPoints?: BasisPoints;
  annualHomeownersInsuranceCents?: Cents;
  monthlyHoaCents?: Cents;
  mortgageInsuranceAnnualRateBasisPoints?: BasisPoints;
};

export type AffordabilityResult = {
  maxHousingPaymentCents: Cents;
  bindingConstraint: "front_end" | "back_end" | "none";
  estimatedPurchasePriceCents: Cents;
  estimatedLoanAmountCents: Cents;
  housingBreakdown: ReturnType<typeof monthlyHousingCost>;
  assumptions: Record<string, number>;
  calculationVersion: string;
};

export const DEFAULT_FRONT_END_RATIO_BP = 2_800; // 28.00%
export const DEFAULT_BACK_END_RATIO_BP = 4_300; // 43.00%

/**
 * Illustrative affordability range. This is not a preapproval, a credit decision,
 * or a statement that any lender will extend credit on these terms.
 */
export function affordability(input: AffordabilityInput): AffordabilityResult {
  const income = assertNonNegativeCents(input.grossMonthlyIncomeCents, "grossMonthlyIncomeCents");
  const debts = assertNonNegativeCents(
    input.monthlyDebtObligationsCents,
    "monthlyDebtObligationsCents"
  );
  const downPaymentCents = assertNonNegativeCents(input.downPaymentCents, "downPaymentCents");
  const frontBp = assertBasisPoints(
    input.frontEndRatioBasisPoints ?? DEFAULT_FRONT_END_RATIO_BP,
    "frontEndRatioBasisPoints"
  );
  const backBp = assertBasisPoints(
    input.backEndRatioBasisPoints ?? DEFAULT_BACK_END_RATIO_BP,
    "backEndRatioBasisPoints"
  );

  const frontCap = roundCents((income * frontBp) / 10_000);
  const backCap = Math.max(0, roundCents((income * backBp) / 10_000) - debts);
  const maxHousingPaymentCents = Math.min(frontCap, backCap);
  const bindingConstraint: AffordabilityResult["bindingConstraint"] =
    maxHousingPaymentCents === 0 ? "none" : backCap < frontCap ? "back_end" : "front_end";

  // Solve for the purchase price whose full housing cost fits the ceiling.
  // Monotonic in price, so a bisection is exact to the cent and avoids
  // closed-form error from the tax/MI terms that scale with price and loan.
  const priceFor = (priceCents: Cents) => {
    const loanAmountCents = Math.max(0, priceCents - downPaymentCents);
    const housingInput: HousingCostInput = {
      loanAmountCents,
      annualRateBasisPoints: input.annualRateBasisPoints,
      termMonths: input.termMonths,
      annualPropertyTaxCents:
        input.propertyTaxAnnualRateBasisPoints === undefined
          ? 0
          : annualRateOfCents(priceCents, input.propertyTaxAnnualRateBasisPoints),
      annualHomeownersInsuranceCents: input.annualHomeownersInsuranceCents ?? 0,
      monthlyHoaCents: input.monthlyHoaCents ?? 0,
      ...(input.mortgageInsuranceAnnualRateBasisPoints === undefined
        ? {}
        : {
            mortgageInsuranceAnnualRateBasisPoints: input.mortgageInsuranceAnnualRateBasisPoints
          })
    };
    return monthlyHousingCost(housingInput);
  };

  let low = downPaymentCents;
  // If the down payment alone already breaches the ceiling there is no capacity
  // to search for, and `low` is the answer as it stands.
  if (priceFor(low).totalMonthlyCents <= maxHousingPaymentCents) {
    let high = downPaymentCents + Math.max(100_00, maxHousingPaymentCents * input.termMonths * 2);
    // 60 iterations halves the interval far past cent precision for any
    // plausible price, so this terminates well before the bound.
    for (let i = 0; i < 60 && high - low > 1; i += 1) {
      const mid = Math.floor((low + high) / 2);
      if (priceFor(mid).totalMonthlyCents <= maxHousingPaymentCents) low = mid;
      else high = mid;
    }
  }

  const estimatedPurchasePriceCents = low;
  const housingBreakdown = priceFor(estimatedPurchasePriceCents);

  return {
    maxHousingPaymentCents,
    bindingConstraint,
    estimatedPurchasePriceCents,
    estimatedLoanAmountCents: Math.max(0, estimatedPurchasePriceCents - downPaymentCents),
    housingBreakdown,
    assumptions: {
      frontEndRatioBasisPoints: frontBp,
      backEndRatioBasisPoints: backBp,
      annualRateBasisPoints: input.annualRateBasisPoints,
      termMonths: input.termMonths
    },
    calculationVersion: CALCULATION_VERSION
  };
}

/* ------------------------------------------------------------------ *
 * Cash to close
 * ------------------------------------------------------------------ */

export type CashToCloseInput = {
  purchasePriceCents: Cents;
  downPaymentCents: Cents;
  estimatedClosingCostsCents: Cents;
  estimatedPrepaidsAndEscrowCents?: Cents;
  sellerCreditsCents?: Cents;
  lenderCreditsCents?: Cents;
  earnestMoneyAlreadyPaidCents?: Cents;
};

export type CashToCloseResult = {
  downPaymentCents: Cents;
  closingCostsCents: Cents;
  prepaidsCents: Cents;
  creditsCents: Cents;
  earnestMoneyCreditCents: Cents;
  estimatedCashToCloseCents: Cents;
  calculationVersion: string;
};

export function cashToClose(input: CashToCloseInput): CashToCloseResult {
  const downPaymentCents = assertNonNegativeCents(input.downPaymentCents, "downPaymentCents");
  const closingCostsCents = assertNonNegativeCents(
    input.estimatedClosingCostsCents,
    "estimatedClosingCostsCents"
  );
  const prepaidsCents = assertNonNegativeCents(
    input.estimatedPrepaidsAndEscrowCents ?? 0,
    "estimatedPrepaidsAndEscrowCents"
  );
  const creditsCents = sumCents([input.sellerCreditsCents ?? 0, input.lenderCreditsCents ?? 0]);
  const earnestMoneyCreditCents = assertNonNegativeCents(
    input.earnestMoneyAlreadyPaidCents ?? 0,
    "earnestMoneyAlreadyPaidCents"
  );

  return {
    downPaymentCents,
    closingCostsCents,
    prepaidsCents,
    creditsCents,
    earnestMoneyCreditCents,
    estimatedCashToCloseCents: Math.max(
      0,
      downPaymentCents + closingCostsCents + prepaidsCents - creditsCents - earnestMoneyCreditCents
    ),
    calculationVersion: CALCULATION_VERSION
  };
}

/* ------------------------------------------------------------------ *
 * Refinance break-even
 * ------------------------------------------------------------------ */

export type RefinanceInput = {
  currentBalanceCents: Cents;
  currentAnnualRateBasisPoints: BasisPoints;
  currentRemainingTermMonths: number;
  newAnnualRateBasisPoints: BasisPoints;
  newTermMonths: number;
  /** Costs paid to obtain the new loan, whether out of pocket or financed. */
  refinanceCostsCents: Cents;
  /** When true, costs are added to the new loan balance rather than paid at closing. */
  financeCosts?: boolean;
};

export type RefinanceResult = {
  currentPaymentCents: Cents;
  newPaymentCents: Cents;
  monthlyPaymentChangeCents: Cents;
  breakEvenMonths: number | null;
  newLoanAmountCents: Cents;
  totalInterestCurrentCents: Cents;
  totalInterestNewCents: Cents;
  calculationVersion: string;
};

/**
 * Break-even is measured against monthly payment change only. A shorter or longer
 * new term changes total interest independently and is reported separately.
 */
export function refinanceBreakEven(input: RefinanceInput): RefinanceResult {
  const currentPaymentCents = monthlyPrincipalAndInterest({
    principalCents: input.currentBalanceCents,
    annualRateBasisPoints: input.currentAnnualRateBasisPoints,
    termMonths: input.currentRemainingTermMonths
  });
  const refinanceCostsCents = assertNonNegativeCents(
    input.refinanceCostsCents,
    "refinanceCostsCents"
  );
  const newLoanAmountCents = input.financeCosts
    ? input.currentBalanceCents + refinanceCostsCents
    : input.currentBalanceCents;

  const newPaymentCents = monthlyPrincipalAndInterest({
    principalCents: newLoanAmountCents,
    annualRateBasisPoints: input.newAnnualRateBasisPoints,
    termMonths: input.newTermMonths
  });

  const monthlySavings = currentPaymentCents - newPaymentCents;
  const breakEvenMonths =
    monthlySavings > 0 ? Math.ceil(refinanceCostsCents / monthlySavings) : null;

  const interestOf = (
    principalCents: Cents,
    rate: BasisPoints,
    term: number,
    payment: Cents
  ): Cents => Math.max(0, payment * term - principalCents);

  return {
    currentPaymentCents,
    newPaymentCents,
    monthlyPaymentChangeCents: newPaymentCents - currentPaymentCents,
    breakEvenMonths,
    newLoanAmountCents,
    totalInterestCurrentCents: interestOf(
      input.currentBalanceCents,
      input.currentAnnualRateBasisPoints,
      input.currentRemainingTermMonths,
      currentPaymentCents
    ),
    totalInterestNewCents: interestOf(
      newLoanAmountCents,
      input.newAnnualRateBasisPoints,
      input.newTermMonths,
      newPaymentCents
    ),
    calculationVersion: CALCULATION_VERSION
  };
}

/* ------------------------------------------------------------------ *
 * Rent vs buy
 * ------------------------------------------------------------------ */

export type RentVsBuyInput = {
  horizonYears: number;
  monthlyRentCents: Cents;
  annualRentGrowthBasisPoints: BasisPoints;
  purchasePriceCents: Cents;
  downPaymentCents: Cents;
  annualRateBasisPoints: BasisPoints;
  termMonths: number;
  annualPropertyTaxCents: Cents;
  annualHomeownersInsuranceCents: Cents;
  monthlyHoaCents?: Cents;
  annualMaintenanceRateBasisPoints?: BasisPoints;
  annualAppreciationBasisPoints: BasisPoints;
  sellingCostRateBasisPoints?: BasisPoints;
  closingCostsCents: Cents;
};

export type RentVsBuyResult = {
  horizonMonths: number;
  totalRentPaidCents: Cents;
  totalOwnershipOutflowCents: Cents;
  estimatedHomeValueCents: Cents;
  estimatedLoanBalanceCents: Cents;
  estimatedNetSaleProceedsCents: Cents;
  /** Positive means buying cost less over the horizon under these assumptions. */
  buyingAdvantageCents: Cents;
  assumptions: Record<string, number>;
  calculationVersion: string;
};

/**
 * A comparison of cash outflows under stated assumptions. It is not a
 * recommendation, and it deliberately does not model tax treatment, which is
 * individual and belongs with a tax professional.
 */
export function rentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const horizonMonths = Math.round(input.horizonYears * 12);
  if (horizonMonths <= 0) throw new RangeError("horizonYears must be positive");

  const loanAmountCents = Math.max(0, input.purchasePriceCents - input.downPaymentCents);
  const monthlyRentGrowth = input.annualRentGrowthBasisPoints / 10_000 / 12;

  let totalRentPaidCents = 0;
  let rent = assertNonNegativeCents(input.monthlyRentCents, "monthlyRentCents");
  for (let month = 0; month < horizonMonths; month += 1) {
    totalRentPaidCents += rent;
    rent = roundCents(rent * (1 + monthlyRentGrowth));
  }

  const housing = monthlyHousingCost({
    loanAmountCents,
    annualRateBasisPoints: input.annualRateBasisPoints,
    termMonths: input.termMonths,
    annualPropertyTaxCents: input.annualPropertyTaxCents,
    annualHomeownersInsuranceCents: input.annualHomeownersInsuranceCents,
    monthlyHoaCents: input.monthlyHoaCents ?? 0
  });

  const monthlyMaintenance = roundCents(
    annualRateOfCents(input.purchasePriceCents, input.annualMaintenanceRateBasisPoints ?? 100) / 12
  );

  const totalOwnershipOutflowCents =
    input.downPaymentCents +
    input.closingCostsCents +
    (housing.totalMonthlyCents + monthlyMaintenance) * horizonMonths;

  const annualAppreciation = input.annualAppreciationBasisPoints / 10_000;
  const estimatedHomeValueCents = roundCents(
    input.purchasePriceCents * Math.pow(1 + annualAppreciation / 12, horizonMonths)
  );
  const estimatedLoanBalanceCents = remainingBalance({
    principalCents: loanAmountCents,
    annualRateBasisPoints: input.annualRateBasisPoints,
    termMonths: input.termMonths,
    afterMonths: Math.min(horizonMonths, input.termMonths)
  });
  const sellingCosts = annualRateOfCents(
    estimatedHomeValueCents,
    input.sellingCostRateBasisPoints ?? 700
  );
  const estimatedNetSaleProceedsCents = Math.max(
    0,
    estimatedHomeValueCents - estimatedLoanBalanceCents - sellingCosts
  );

  return {
    horizonMonths,
    totalRentPaidCents,
    totalOwnershipOutflowCents,
    estimatedHomeValueCents,
    estimatedLoanBalanceCents,
    estimatedNetSaleProceedsCents,
    buyingAdvantageCents:
      totalRentPaidCents - (totalOwnershipOutflowCents - estimatedNetSaleProceedsCents),
    assumptions: {
      annualRentGrowthBasisPoints: input.annualRentGrowthBasisPoints,
      annualAppreciationBasisPoints: input.annualAppreciationBasisPoints,
      annualMaintenanceRateBasisPoints: input.annualMaintenanceRateBasisPoints ?? 100,
      sellingCostRateBasisPoints: input.sellingCostRateBasisPoints ?? 700
    },
    calculationVersion: CALCULATION_VERSION
  };
}

/* ------------------------------------------------------------------ *
 * Investment: rental cash flow and flip
 * ------------------------------------------------------------------ */

export type RentalCashFlowInput = {
  purchasePriceCents: Cents;
  downPaymentCents: Cents;
  annualRateBasisPoints: BasisPoints;
  termMonths: number;
  grossMonthlyRentCents: Cents;
  vacancyRateBasisPoints: BasisPoints;
  managementRateBasisPoints: BasisPoints;
  maintenanceRateBasisPoints: BasisPoints;
  capitalReserveRateBasisPoints: BasisPoints;
  annualPropertyTaxCents: Cents;
  annualInsuranceCents: Cents;
  monthlyHoaCents?: Cents;
  monthlyUtilitiesCents?: Cents;
  closingCostsCents?: Cents;
  rehabCents?: Cents;
};

export type RentalCashFlowResult = {
  effectiveGrossIncomeCents: Cents;
  operatingExpensesCents: Cents;
  netOperatingIncomeCents: Cents;
  debtServiceCents: Cents;
  monthlyCashFlowCents: Cents;
  annualCashFlowCents: Cents;
  totalCashInvestedCents: Cents;
  /** Basis points; null when no cash is invested. */
  cashOnCashReturnBasisPoints: number | null;
  capRateBasisPoints: number | null;
  debtServiceCoverageRatio: number | null;
  calculationVersion: string;
};

export function rentalCashFlow(input: RentalCashFlowInput): RentalCashFlowResult {
  const gross = assertNonNegativeCents(input.grossMonthlyRentCents, "grossMonthlyRentCents");
  const vacancy = annualRateOfCents(gross, input.vacancyRateBasisPoints);
  const effectiveGrossIncomeCents = gross - vacancy;

  const management = annualRateOfCents(effectiveGrossIncomeCents, input.managementRateBasisPoints);
  const maintenance = annualRateOfCents(gross, input.maintenanceRateBasisPoints);
  const reserves = annualRateOfCents(gross, input.capitalReserveRateBasisPoints);
  const taxes = roundCents(input.annualPropertyTaxCents / 12);
  const insurance = roundCents(input.annualInsuranceCents / 12);
  const hoa = input.monthlyHoaCents ?? 0;
  const utilities = input.monthlyUtilitiesCents ?? 0;

  const operatingExpensesCents = sumCents([
    management,
    maintenance,
    reserves,
    taxes,
    insurance,
    hoa,
    utilities
  ]);
  const netOperatingIncomeCents = effectiveGrossIncomeCents - operatingExpensesCents;

  const loanAmountCents = Math.max(0, input.purchasePriceCents - input.downPaymentCents);
  const debtServiceCents = monthlyPrincipalAndInterest({
    principalCents: loanAmountCents,
    annualRateBasisPoints: input.annualRateBasisPoints,
    termMonths: input.termMonths
  });

  const monthlyCashFlowCents = netOperatingIncomeCents - debtServiceCents;
  const totalCashInvestedCents = sumCents([
    input.downPaymentCents,
    input.closingCostsCents ?? 0,
    input.rehabCents ?? 0
  ]);

  return {
    effectiveGrossIncomeCents,
    operatingExpensesCents,
    netOperatingIncomeCents,
    debtServiceCents,
    monthlyCashFlowCents,
    annualCashFlowCents: monthlyCashFlowCents * 12,
    totalCashInvestedCents,
    cashOnCashReturnBasisPoints:
      totalCashInvestedCents > 0
        ? Math.round((monthlyCashFlowCents * 12 * 10_000) / totalCashInvestedCents)
        : null,
    capRateBasisPoints:
      input.purchasePriceCents > 0
        ? Math.round((netOperatingIncomeCents * 12 * 10_000) / input.purchasePriceCents)
        : null,
    debtServiceCoverageRatio:
      debtServiceCents > 0
        ? Math.round((netOperatingIncomeCents / debtServiceCents) * 1000) / 1000
        : null,
    calculationVersion: CALCULATION_VERSION
  };
}

export type FlipInput = {
  purchasePriceCents: Cents;
  acquisitionCostsCents: Cents;
  rehabBudgetCents: Cents;
  contingencyRateBasisPoints: BasisPoints;
  holdingMonths: number;
  monthlyHoldingCostsCents: Cents;
  financedAmountCents: Cents;
  financingAnnualRateBasisPoints: BasisPoints;
  financingPointsBasisPoints?: BasisPoints;
  afterRepairValueCents: Cents;
  sellingCostRateBasisPoints: BasisPoints;
};

export type FlipResult = {
  contingencyCents: Cents;
  totalRehabCents: Cents;
  financingCostCents: Cents;
  holdingCostCents: Cents;
  sellingCostCents: Cents;
  totalProjectCostCents: Cents;
  estimatedGrossProfitCents: Cents;
  /** Basis points of total project cost. Excludes income taxes entirely. */
  returnOnCostBasisPoints: number | null;
  calculationVersion: string;
};

export function flipScenario(input: FlipInput): FlipResult {
  const contingencyCents = annualRateOfCents(
    input.rehabBudgetCents,
    input.contingencyRateBasisPoints
  );
  const totalRehabCents = input.rehabBudgetCents + contingencyCents;

  const interest = roundCents(
    (input.financedAmountCents *
      (input.financingAnnualRateBasisPoints / 10_000) *
      input.holdingMonths) /
      12
  );
  const points = annualRateOfCents(
    input.financedAmountCents,
    input.financingPointsBasisPoints ?? 0
  );
  const financingCostCents = interest + points;
  const holdingCostCents = input.monthlyHoldingCostsCents * input.holdingMonths;
  const sellingCostCents = annualRateOfCents(
    input.afterRepairValueCents,
    input.sellingCostRateBasisPoints
  );

  const totalProjectCostCents = sumCents([
    input.purchasePriceCents,
    input.acquisitionCostsCents,
    totalRehabCents,
    financingCostCents,
    holdingCostCents,
    sellingCostCents
  ]);

  const estimatedGrossProfitCents = input.afterRepairValueCents - totalProjectCostCents;

  return {
    contingencyCents,
    totalRehabCents,
    financingCostCents,
    holdingCostCents,
    sellingCostCents,
    totalProjectCostCents,
    estimatedGrossProfitCents,
    returnOnCostBasisPoints:
      totalProjectCostCents > 0
        ? Math.round((estimatedGrossProfitCents * 10_000) / totalProjectCostCents)
        : null,
    calculationVersion: CALCULATION_VERSION
  };
}
