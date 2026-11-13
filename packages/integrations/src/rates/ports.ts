import type { SourcedValue } from "@tract/domain";

/**
 * Market-rate port.
 *
 * A single national market average — never a personalized quote and never an
 * offer of credit. The only rate this platform ever displays is a published
 * survey average with a source attached, so nothing here can imply "your rate is
 * X" (a credit decision this software never makes). Every rate is integer basis
 * points (invariant 1); a display converts to a percentage.
 */

export type MarketRates = {
  /** Current national average 30-year fixed, in integer basis points. */
  thirtyYearFixedBp: number;
  /** Current national average 15-year fixed, in integer basis points. */
  fifteenYearFixedBp: number;
  /** The prior weekly observation, for week-over-week movement. Absent on a first reading. */
  previousThirtyYearFixedBp?: number;
  previousFifteenYearFixedBp?: number;
  /** ISO date (YYYY-MM-DD) of the current observation. */
  asOfDate: string;
  /** ISO date of the prior observation. */
  previousAsOfDate?: string;
  /** Recent 30-year weekly observations in basis points, oldest first, current last — for a trend sparkline. */
  thirtyYearHistoryBp: number[];
};

export interface RateFeedPort {
  readonly key: string;
  latest(): Promise<SourcedValue<MarketRates> | null>;
}
