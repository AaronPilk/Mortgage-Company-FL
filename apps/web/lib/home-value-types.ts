import type { HomeLookupAddress } from "./home-lookup-types";

/**
 * Shared shapes for the homeowner value dashboard.
 *
 * A types-only module so the client card and the server orchestration can share
 * shapes without the client pulling in any `server-only` code — the same split
 * as `home-lookup-types.ts`.
 */

export type HomeValueSnapshot = {
  /** UTC calendar date, YYYY-MM-DD. */
  capturedOn: string;
  estimatedValueCents: number;
  valueLowCents: number | null;
  valueHighCents: number | null;
};

export type HomeValueDashboard = {
  /** Structured so the client can re-run the lookup without re-parsing a string. */
  address: HomeLookupAddress;
  estimatedBalanceCents: number;
  /** The rate the owner says they're paying now, in basis points; null until supplied. */
  currentRateBp: number | null;
  current: HomeValueSnapshot;
  equityCents: number;
  equityShareBasisPoints: number;
  loanToValueBasisPoints: number;
  /** Ascending by date, oldest first, current last. At least one entry. */
  history: HomeValueSnapshot[];
  /** current − earliest estimated value; null when there is only one snapshot. */
  changeSinceFirstCents: number | null;
  /** True when the latest snapshot came from fixture data (never in production). */
  sampleData: boolean;
};

/** What the home-value write endpoint returns to the client. */
export type HomeValueResponse =
  { status: "saved"; dashboard: HomeValueDashboard } | { status: "not_found" };
