import {
  type BasisPoints,
  type Cents,
  annualRateOfCents,
  assertBasisPoints,
  assertNonNegativeCents,
  assertPositiveTerm,
  monthlyRate,
  roundCents,
  sumCents
} from "./money";

export const CALCULATION_VERSION = "mortgage-math@1.0.0";

export type PaymentInput = {
  principalCents: Cents;
  annualRateBasisPoints: BasisPoints;
  termMonths: number;
};

/**
 * Standard fully amortizing level payment for principal and interest.
 * Returns integer cents. A zero rate degrades to straight-line principal.
 */
export function monthlyPrincipalAndInterest(input: PaymentInput): Cents {
  const principalCents = assertNonNegativeCents(input.principalCents, "principalCents");
  assertBasisPoints(input.annualRateBasisPoints, "annualRateBasisPoints");
  const termMonths = assertPositiveTerm(input.termMonths);

  if (principalCents === 0) return 0;

  const rate = monthlyRate(input.annualRateBasisPoints);
  if (rate === 0) return roundCents(principalCents / termMonths);

  const growth = Math.pow(1 + rate, termMonths);
  return roundCents(principalCents * ((rate * growth) / (growth - 1)));
}

export type HousingCostInput = {
  /** Loan amount actually financed, after down payment. */
  loanAmountCents: Cents;
  annualRateBasisPoints: BasisPoints;
  termMonths: number;
  /** Annual property tax. Supply either a dollar amount or an assessed-rate pair. */
  annualPropertyTaxCents?: Cents;
  annualHomeownersInsuranceCents?: Cents;
  annualFloodInsuranceCents?: Cents;
  monthlyHoaCents?: Cents;
  /** Annual mortgage-insurance rate applied to the loan amount. User- or lender-supplied only. */
  mortgageInsuranceAnnualRateBasisPoints?: BasisPoints;
  monthlyOtherCents?: Cents;
};

export type HousingCostBreakdown = {
  principalAndInterestCents: Cents;
  propertyTaxCents: Cents;
  homeownersInsuranceCents: Cents;
  floodInsuranceCents: Cents;
  hoaCents: Cents;
  mortgageInsuranceCents: Cents;
  otherCents: Cents;
  totalMonthlyCents: Cents;
  calculationVersion: string;
};

/**
 * Estimated total monthly housing cost. Excludes utilities, maintenance, and any
 * lender fee that is not expressed as a rate on the financed balance.
 */
export function monthlyHousingCost(input: HousingCostInput): HousingCostBreakdown {
  const principalAndInterestCents = monthlyPrincipalAndInterest({
    principalCents: input.loanAmountCents,
    annualRateBasisPoints: input.annualRateBasisPoints,
    termMonths: input.termMonths
  });

  const perMonth = (annualCents: Cents | undefined): Cents =>
    annualCents === undefined ? 0 : roundCents(assertNonNegativeCents(annualCents, "annual") / 12);

  const propertyTaxCents = perMonth(input.annualPropertyTaxCents);
  const homeownersInsuranceCents = perMonth(input.annualHomeownersInsuranceCents);
  const floodInsuranceCents = perMonth(input.annualFloodInsuranceCents);
  const hoaCents =
    input.monthlyHoaCents === undefined
      ? 0
      : assertNonNegativeCents(input.monthlyHoaCents, "monthlyHoaCents");
  const otherCents =
    input.monthlyOtherCents === undefined
      ? 0
      : assertNonNegativeCents(input.monthlyOtherCents, "monthlyOtherCents");

  const mortgageInsuranceCents =
    input.mortgageInsuranceAnnualRateBasisPoints === undefined
      ? 0
      : roundCents(
          annualRateOfCents(input.loanAmountCents, input.mortgageInsuranceAnnualRateBasisPoints) /
            12
        );

  return {
    principalAndInterestCents,
    propertyTaxCents,
    homeownersInsuranceCents,
    floodInsuranceCents,
    hoaCents,
    mortgageInsuranceCents,
    otherCents,
    totalMonthlyCents: sumCents([
      principalAndInterestCents,
      propertyTaxCents,
      homeownersInsuranceCents,
      floodInsuranceCents,
      hoaCents,
      mortgageInsuranceCents,
      otherCents
    ]),
    calculationVersion: CALCULATION_VERSION
  };
}

export type AmortizationRow = {
  monthIndex: number;
  paymentCents: Cents;
  interestCents: Cents;
  principalCents: Cents;
  extraPrincipalCents: Cents;
  balanceCents: Cents;
};

export type AmortizationInput = PaymentInput & {
  extraMonthlyPrincipalCents?: Cents;
};

export type AmortizationSchedule = {
  rows: AmortizationRow[];
  monthsToPayoff: number;
  totalInterestCents: Cents;
  totalPaidCents: Cents;
  scheduledPaymentCents: Cents;
  calculationVersion: string;
};

/**
 * Full amortization with optional recurring extra principal.
 * Invariants: balance is monotonically non-increasing and terminates at exactly zero.
 */
export function amortizationSchedule(input: AmortizationInput): AmortizationSchedule {
  const principalCents = assertNonNegativeCents(input.principalCents, "principalCents");
  const termMonths = assertPositiveTerm(input.termMonths);
  const rate = monthlyRate(input.annualRateBasisPoints);
  const extra = assertNonNegativeCents(
    input.extraMonthlyPrincipalCents ?? 0,
    "extraMonthlyPrincipalCents"
  );
  const scheduledPaymentCents = monthlyPrincipalAndInterest(input);

  const rows: AmortizationRow[] = [];
  let balance = principalCents;
  let totalInterest = 0;
  let totalPaid = 0;

  for (let monthIndex = 1; monthIndex <= termMonths && balance > 0; monthIndex += 1) {
    const interestCents = roundCents(balance * rate);
    let principalPortion = scheduledPaymentCents - interestCents;
    if (principalPortion < 0) {
      // Negative amortization is not supported by this product.
      throw new RangeError("payment does not cover interest; scenario is not amortizing");
    }
    let extraPortion = extra;

    if (principalPortion >= balance || monthIndex === termMonths) {
      // Final payment adjustment. A level payment rounded to whole cents does not
      // retire the balance exactly, so the last scheduled payment absorbs the
      // remainder. This is how a real amortization schedule terminates.
      principalPortion = balance;
      extraPortion = 0;
    } else if (principalPortion + extraPortion > balance) {
      extraPortion = balance - principalPortion;
    }

    balance -= principalPortion + extraPortion;
    const paymentCents = interestCents + principalPortion + extraPortion;
    totalInterest += interestCents;
    totalPaid += paymentCents;

    rows.push({
      monthIndex,
      paymentCents,
      interestCents,
      principalCents: principalPortion,
      extraPrincipalCents: extraPortion,
      balanceCents: balance
    });
  }

  return {
    rows,
    monthsToPayoff: rows.length,
    totalInterestCents: totalInterest,
    totalPaidCents: totalPaid,
    scheduledPaymentCents,
    calculationVersion: CALCULATION_VERSION
  };
}

export type RemainingBalanceInput = PaymentInput & { afterMonths: number };

export function remainingBalance(input: RemainingBalanceInput): Cents {
  const schedule = amortizationSchedule(input);
  if (input.afterMonths <= 0) return input.principalCents;
  const row = schedule.rows[Math.min(input.afterMonths, schedule.rows.length) - 1];
  return row === undefined ? 0 : row.balanceCents;
}
