import "server-only";
import {
  type MarketRates,
  type RateFeedPort,
  DisabledRateFeedPort,
  FixtureRateFeedPort,
  FredRateFeedPort
} from "@tract/integrations";
import { basisPointChange } from "@tract/mortgage-math";
import { env, publicFeatures } from "./env";
import type { MarketRatesView } from "./market-rates-types";

/**
 * Market-rate provider selection and read.
 *
 * `disabled` is the default: no feed, no number. `fixture` is the dev double. A
 * live mode builds the FRED adapter from the injected key. Selection mirrors the
 * other integrations so the platform turns feeds on the same way. The read is
 * cached for an hour because the survey is weekly — there is no reason to hit
 * FRED on every request, and it keeps us well inside any rate limit.
 */

let instance: RateFeedPort | undefined;

export function rateFeed(): RateFeedPort {
  if (instance !== undefined) return instance;
  const configuration = env();
  switch (configuration.RATE_FEED_MODE) {
    case "fixture":
      instance = new FixtureRateFeedPort();
      break;
    case "sandbox":
    case "production": {
      const apiKey = configuration.FRED_API_KEY;
      instance =
        apiKey === undefined ? new DisabledRateFeedPort() : new FredRateFeedPort({ apiKey });
      break;
    }
    default:
      instance = new DisabledRateFeedPort();
  }
  return instance;
}

/**
 * Whether the rate-watch surface may serve a consumer. The feature flag and a
 * non-disabled mode are necessary; the fixture average is a dev-only convenience
 * and never renders in production (invariant 6) — no production sample switch,
 * because a fabricated market rate is worse than none.
 */
export function rateWatchAvailable(): boolean {
  if (!publicFeatures().rateWatch) return false;
  const mode = env().RATE_FEED_MODE;
  if (mode === "sandbox" || mode === "production") return true;
  return mode === "fixture" && env().NODE_ENV !== "production";
}

const RATE_CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { at: number; value: MarketRatesView | null } | undefined;

function toView(rates: MarketRates, sampleData: boolean): MarketRatesView {
  return {
    thirtyYearBp: rates.thirtyYearFixedBp,
    fifteenYearBp: rates.fifteenYearFixedBp,
    thirtyYearChangeBp:
      rates.previousThirtyYearFixedBp === undefined
        ? null
        : basisPointChange(rates.thirtyYearFixedBp, rates.previousThirtyYearFixedBp),
    fifteenYearChangeBp:
      rates.previousFifteenYearFixedBp === undefined
        ? null
        : basisPointChange(rates.fifteenYearFixedBp, rates.previousFifteenYearFixedBp),
    asOfDate: rates.asOfDate,
    thirtyYearHistoryBp: rates.thirtyYearHistoryBp,
    sampleData
  };
}

export async function readMarketRates(): Promise<MarketRatesView | null> {
  if (!rateWatchAvailable()) return null;
  const now = Date.now();
  if (cache !== undefined && now - cache.at < RATE_CACHE_TTL_MS) return cache.value;

  let value: MarketRatesView | null = null;
  try {
    const sourced = await rateFeed().latest();
    if (sourced !== null) value = toView(sourced.value, sourced.provenance.provider === "fixture");
  } catch {
    value = null;
  }
  cache = { at: now, value };
  return value;
}

/** Test seam: inject a double and clear the read cache. */
export function __setRateFeedForTesting(port: RateFeedPort | undefined): void {
  instance = port;
  cache = undefined;
}
