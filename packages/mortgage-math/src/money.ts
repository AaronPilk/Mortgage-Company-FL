/**
 * Money and rate primitives.
 *
 * Rules enforced by this module:
 *  - All monetary boundaries are integer cents. Never a float dollar amount.
 *  - All annual interest rates are integer basis points (1 bp = 0.01%).
 *  - Rounding happens only at defined boundaries, never silently mid-calculation.
 *
 * These are illustrations of arithmetic, not quotes, offers, or approvals.
 */

export type Cents = number;
export type BasisPoints = number;

export class MoneyError extends RangeError {}

export function assertCents(value: number, label: string): Cents {
  if (!Number.isFinite(value)) throw new MoneyError(`${label} must be a finite number`);
  if (!Number.isInteger(value)) throw new MoneyError(`${label} must be integer cents`);
  if (!Number.isSafeInteger(value)) throw new MoneyError(`${label} exceeds safe integer range`);
  return value;
}

export function assertNonNegativeCents(value: number, label: string): Cents {
  assertCents(value, label);
  if (value < 0) throw new MoneyError(`${label} must not be negative`);
  return value;
}

export function assertBasisPoints(value: number, label: string): BasisPoints {
  if (!Number.isInteger(value)) throw new MoneyError(`${label} must be integer basis points`);
  if (value < 0) throw new MoneyError(`${label} must not be negative`);
  if (value > 200_000) throw new MoneyError(`${label} is implausibly large`);
  return value;
}

export function assertPositiveTerm(months: number, label = "termMonths"): number {
  if (!Number.isInteger(months)) throw new MoneyError(`${label} must be a whole number of months`);
  if (months <= 0) throw new MoneyError(`${label} must be positive`);
  if (months > 600) throw new MoneyError(`${label} exceeds the supported 600-month ceiling`);
  return months;
}

/** Banker-free, deterministic half-up rounding to whole cents. */
export function roundCents(value: number): Cents {
  if (!Number.isFinite(value)) throw new MoneyError("cannot round a non-finite value");
  return Math.round(value);
}

export function dollarsToCents(dollars: number): Cents {
  if (!Number.isFinite(dollars)) throw new MoneyError("dollars must be finite");
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: Cents): number {
  return assertCents(cents, "cents") / 100;
}

/** Monthly periodic rate as a decimal from an annual basis-point rate. */
export function monthlyRate(annualRateBasisPoints: BasisPoints): number {
  return assertBasisPoints(annualRateBasisPoints, "annualRateBasisPoints") / 10_000 / 12;
}

/** Apply a basis-point rate to a cents base for a full year. */
export function annualRateOfCents(baseCents: Cents, rateBasisPoints: BasisPoints): Cents {
  assertNonNegativeCents(baseCents, "baseCents");
  assertBasisPoints(rateBasisPoints, "rateBasisPoints");
  return roundCents((baseCents * rateBasisPoints) / 10_000);
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce<Cents>((total, value) => total + assertCents(value, "value"), 0);
}

export function formatUsd(cents: Cents, options: { cents?: boolean } = {}): string {
  const showCents = options.cents ?? false;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0
  }).format(centsToDollars(cents));
}

export function formatRate(basisPoints: BasisPoints): string {
  return `${(basisPoints / 100).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

/**
 * Signed change between two basis-point observations, for showing rate movement
 * ("down 12 bp this week"). Positive means the current reading is higher. This is
 * the only arithmetic behind a rate-movement display, so it lives here rather
 * than inline in a component (invariant 1).
 */
export function basisPointChange(currentBp: BasisPoints, previousBp: BasisPoints): number {
  return assertBasisPoints(currentBp, "currentBp") - assertBasisPoints(previousBp, "previousBp");
}
