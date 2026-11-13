import { sourced } from "@tract/domain";
import type { SourcedValue } from "@tract/domain";
import { makeProvenance } from "../property/ports";
import type { MarketRates, RateFeedPort } from "./ports";

/**
 * Deterministic market-rate double for development and tests. Provenance is
 * "fixture" so every surface labels it as sample data and it can never publish
 * in production (invariant 6). The numbers are invented and must not be shown as
 * a real market average.
 */
export class FixtureRateFeedPort implements RateFeedPort {
  readonly key = "fixture";

  async latest(): Promise<SourcedValue<MarketRates> | null> {
    return sourced<MarketRates>(
      {
        thirtyYearFixedBp: 681,
        fifteenYearFixedBp: 601,
        previousThirtyYearFixedBp: 693,
        previousFifteenYearFixedBp: 611,
        asOfDate: "2026-08-21",
        previousAsOfDate: "2026-08-14",
        thirtyYearHistoryBp: [702, 699, 695, 693, 688, 685, 690, 693, 681]
      },
      makeProvenance({
        provider: "fixture",
        licenseClass: "public",
        limitations: [
          "Sample data, not a real market average. Invented figures for development only."
        ],
        observedAt: "2026-08-21"
      })
    );
  }
}
