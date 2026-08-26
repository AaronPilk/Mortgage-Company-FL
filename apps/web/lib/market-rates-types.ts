/**
 * Client-safe shapes for the rate surfaces.
 *
 * A types-only module so the client components and the server libs share shapes
 * without the client pulling in any `server-only` code. Rates are integer basis
 * points here; a component formats to a percentage.
 */

export type MarketRatesView = {
  thirtyYearBp: number;
  fifteenYearBp: number;
  /** Week-over-week change in basis points; null when there is no prior reading. */
  thirtyYearChangeBp: number | null;
  fifteenYearChangeBp: number | null;
  /** ISO date (YYYY-MM-DD) of the current observation. */
  asOfDate: string;
  /** Recent 30-year weekly averages in basis points, oldest first, current last. */
  thirtyYearHistoryBp: number[];
  /** True when the numbers are fixture sample data (never in production). */
  sampleData: boolean;
};

export type RateTerm = "thirtyYearFixed" | "fifteenYearFixed";

export type RateWatchView = {
  term: RateTerm;
  targetRatePercent: number | null;
  notifyEmail: boolean;
};
