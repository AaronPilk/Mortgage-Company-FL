/**
 * Amortization reporting.
 *
 * `amortizationSchedule` in ./payment already produces the month-by-month rows.
 * This module only aggregates them into what a reader can actually use: a yearly
 * roll-up, a payoff month, and the difference an extra principal payment makes.
 * No new interest arithmetic happens here.
 */

import { type Cents, assertCents, assertNonNegativeCents, sumCents } from "./money";
import {
  type AmortizationInput,
  type AmortizationRow,
  CALCULATION_VERSION,
  amortizationSchedule
} from "./payment";

export type CalendarMonth = {
  year: number;
  /** 1 = January. */
  month: number;
};

export function assertCalendarMonth(value: CalendarMonth, label = "calendarMonth"): CalendarMonth {
  if (!Number.isInteger(value.year)) throw new RangeError(`${label}.year must be a whole year`);
  if (!Number.isInteger(value.month) || value.month < 1 || value.month > 12) {
    throw new RangeError(`${label}.month must be 1 through 12`);
  }
  return value;
}

/** Calendar arithmetic without a Date object, so it cannot drift with a time zone. */
export function addCalendarMonths(start: CalendarMonth, offsetMonths: number): CalendarMonth {
  assertCalendarMonth(start, "start");
  if (!Number.isInteger(offsetMonths)) throw new RangeError("offsetMonths must be whole months");
  const zeroBased = start.year * 12 + (start.month - 1) + offsetMonths;
  return { year: Math.floor(zeroBased / 12), month: (((zeroBased % 12) + 12) % 12) + 1 };
}

export type AmortizationYear = {
  /** 1 for the first twelve scheduled payments. */
  year: number;
  firstMonthIndex: number;
  lastMonthIndex: number;
  paymentCents: Cents;
  interestCents: Cents;
  principalCents: Cents;
  extraPrincipalCents: Cents;
  endingBalanceCents: Cents;
  rows: AmortizationRow[];
};

/** Groups scheduled months into calendar-independent payment years. */
export function summarizeAmortizationByYear(rows: readonly AmortizationRow[]): AmortizationYear[] {
  const years: AmortizationYear[] = [];
  for (const row of rows) {
    const yearNumber = Math.ceil(row.monthIndex / 12);
    let current = years[years.length - 1];
    if (current === undefined || current.year !== yearNumber) {
      current = {
        year: yearNumber,
        firstMonthIndex: row.monthIndex,
        lastMonthIndex: row.monthIndex,
        paymentCents: 0,
        interestCents: 0,
        principalCents: 0,
        extraPrincipalCents: 0,
        endingBalanceCents: row.balanceCents,
        rows: []
      };
      years.push(current);
    }
    current.lastMonthIndex = row.monthIndex;
    current.paymentCents += assertCents(row.paymentCents, "paymentCents");
    current.interestCents += row.interestCents;
    current.principalCents += row.principalCents;
    current.extraPrincipalCents += row.extraPrincipalCents;
    current.endingBalanceCents = row.balanceCents;
    current.rows.push(row);
  }
  return years;
}

export type AmortizationSummaryInput = AmortizationInput & {
  /** Month of the first scheduled payment. Omit to leave the payoff month unresolved. */
  firstPaymentMonth?: CalendarMonth;
};

export type AmortizationSummary = {
  scheduledPaymentCents: Cents;
  extraMonthlyPrincipalCents: Cents;
  totalMonthlyOutlayCents: Cents;
  monthsToPayoff: number;
  totalInterestCents: Cents;
  totalPaidCents: Cents;
  years: AmortizationYear[];
  rows: AmortizationRow[];
  /** Payoff with no extra principal, so the two are directly comparable. */
  baselineMonthsToPayoff: number;
  baselineTotalInterestCents: Cents;
  interestSavedCents: Cents;
  monthsSaved: number;
  payoffMonth: CalendarMonth | null;
  baselinePayoffMonth: CalendarMonth | null;
  calculationVersion: string;
};

/**
 * A full schedule plus the yearly roll-up and the effect of extra principal.
 * Every figure is an illustration of arithmetic on the values supplied. It is
 * not a quote, an offer of credit, or a statement of what any lender will do.
 */
export function amortizationSummary(input: AmortizationSummaryInput): AmortizationSummary {
  const extraMonthlyPrincipalCents = assertNonNegativeCents(
    input.extraMonthlyPrincipalCents ?? 0,
    "extraMonthlyPrincipalCents"
  );

  const schedule = amortizationSchedule({
    principalCents: input.principalCents,
    annualRateBasisPoints: input.annualRateBasisPoints,
    termMonths: input.termMonths,
    extraMonthlyPrincipalCents
  });

  const baseline =
    extraMonthlyPrincipalCents === 0
      ? schedule
      : amortizationSchedule({
          principalCents: input.principalCents,
          annualRateBasisPoints: input.annualRateBasisPoints,
          termMonths: input.termMonths
        });

  const payoffMonthFor = (months: number): CalendarMonth | null => {
    if (input.firstPaymentMonth === undefined || months === 0) return null;
    return addCalendarMonths(input.firstPaymentMonth, months - 1);
  };

  return {
    scheduledPaymentCents: schedule.scheduledPaymentCents,
    extraMonthlyPrincipalCents,
    totalMonthlyOutlayCents: sumCents([schedule.scheduledPaymentCents, extraMonthlyPrincipalCents]),
    monthsToPayoff: schedule.monthsToPayoff,
    totalInterestCents: schedule.totalInterestCents,
    totalPaidCents: schedule.totalPaidCents,
    years: summarizeAmortizationByYear(schedule.rows),
    rows: schedule.rows,
    baselineMonthsToPayoff: baseline.monthsToPayoff,
    baselineTotalInterestCents: baseline.totalInterestCents,
    interestSavedCents: baseline.totalInterestCents - schedule.totalInterestCents,
    monthsSaved: baseline.monthsToPayoff - schedule.monthsToPayoff,
    payoffMonth: payoffMonthFor(schedule.monthsToPayoff),
    baselinePayoffMonth: payoffMonthFor(baseline.monthsToPayoff),
    calculationVersion: CALCULATION_VERSION
  };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export function formatCalendarMonth(value: CalendarMonth): string {
  assertCalendarMonth(value);
  return `${MONTH_NAMES[value.month - 1] ?? ""} ${value.year}`;
}

/** "24 years 7 months". Used wherever a month count is shown to a reader. */
export function formatMonthSpan(months: number): string {
  if (!Number.isInteger(months) || months < 0) {
    throw new RangeError("months must be a non-negative whole number");
  }
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (remainder > 0 || years === 0) parts.push(`${remainder} month${remainder === 1 ? "" : "s"}`);
  return parts.join(" ");
}
