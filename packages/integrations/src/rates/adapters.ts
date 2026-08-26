import { sourced } from "@tract/domain";
import type { SourcedValue } from "@tract/domain";
import { makeProvenance } from "../property/ports";
import type { MarketRates, RateFeedPort } from "./ports";

/**
 * Market-rate adapters.
 *
 * `Disabled` is the default: no feed, no number, `null`. `Fred` is the real one,
 * reading the Freddie Mac Primary Mortgage Market Survey (PMMS) weekly national
 * averages published on FRED — an authoritative, citable public source. It is a
 * market survey, not our pricing: a proprietary daily feed can replace this
 * behind the same port once it is licensed and reviewed, without touching any
 * call site.
 */

export class DisabledRateFeedPort implements RateFeedPort {
  readonly key = "disabled";
  async latest(): Promise<SourcedValue<MarketRates> | null> {
    return null;
  }
}

export type FredConfig = {
  apiKey: string;
  /** Defaults to the public FRED base. Overridable for a proxy. */
  baseUrl?: string;
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** How many recent 30-year weekly observations to keep for the trend. */
  historyWeeks?: number;
};

export class RateFeedApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "RateFeedApiError";
  }
}

export class RateFeedTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateFeedTimeoutError";
  }
}

/** Freddie Mac PMMS series on FRED: 30-year and 15-year fixed weekly averages. */
const SERIES_30 = "MORTGAGE30US";
const SERIES_15 = "MORTGAGE15US";

const FRED_LIMITS = [
  "National weekly average from the Freddie Mac Primary Mortgage Market Survey (PMMS), via FRED. It is market information, not a quote, an offer, or your rate.",
  "An average is not an APR and reflects no points, fees, or an individual file; your rate depends on your own circumstances.",
  "Published weekly (typically Thursday); the figure can lag the live market."
];

type FredObservation = { date?: string; value?: string };
type FredResponse = { observations?: FredObservation[] };

/** A percentage string like "6.81" becomes 681 basis points; "." (FRED's missing marker) becomes undefined. */
function percentToBasisPoints(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "" || value.trim() === ".") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

export class FredRateFeedPort implements RateFeedPort {
  readonly key = "fred";
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly historyWeeks: number;

  constructor(config: FredConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.stlouisfed.org/fred";
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 8_000;
    this.historyWeeks = config.historyWeeks ?? 13;
  }

  async latest(): Promise<SourcedValue<MarketRates> | null> {
    const [thirty, fifteen] = await Promise.all([
      this.series(SERIES_30, this.historyWeeks),
      this.series(SERIES_15, 2)
    ]);

    // The 30-year headline is required; without it there is nothing to show.
    const thirtyCurrent = thirty[0];
    if (thirtyCurrent === undefined) return null;
    const fifteenCurrent = fifteen[0];
    if (fifteenCurrent === undefined) return null;

    const facts: MarketRates = {
      thirtyYearFixedBp: thirtyCurrent.bp,
      fifteenYearFixedBp: fifteenCurrent.bp,
      asOfDate: thirtyCurrent.date,
      // Oldest first, current last, so a sparkline reads left to right.
      thirtyYearHistoryBp: [...thirty].reverse().map((point) => point.bp)
    };
    const thirtyPrevious = thirty[1];
    if (thirtyPrevious !== undefined) {
      facts.previousThirtyYearFixedBp = thirtyPrevious.bp;
      facts.previousAsOfDate = thirtyPrevious.date;
    }
    const fifteenPrevious = fifteen[1];
    if (fifteenPrevious !== undefined) facts.previousFifteenYearFixedBp = fifteenPrevious.bp;

    return sourced<MarketRates>(
      facts,
      makeProvenance({
        provider: "fred",
        licenseClass: "public",
        limitations: FRED_LIMITS,
        observedAt: thirtyCurrent.date,
        sourceReference: "Freddie Mac PMMS via FRED"
      })
    );
  }

  /** Most recent `limit` valid observations, newest first, as {date, bp}. */
  private async series(seriesId: string, limit: number): Promise<{ date: string; bp: number }[]> {
    const url = new URL(`${this.baseUrl}/series/observations`);
    url.searchParams.set("series_id", seriesId);
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("sort_order", "desc");
    // Overfetch a little so dropped "." rows still leave enough valid points.
    url.searchParams.set("limit", String(limit + 4));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method: "GET",
        headers: { accept: "application/json" },
        signal: controller.signal
      });
    } catch (error) {
      throw new RateFeedTimeoutError(
        `FRED request did not complete: ${error instanceof Error ? error.name : "unknown"}`
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok)
      throw new RateFeedApiError(response.status, `FRED responded ${response.status}`);
    const data = (await response.json()) as FredResponse;
    const points: { date: string; bp: number }[] = [];
    for (const observation of data.observations ?? []) {
      const bp = percentToBasisPoints(observation.value);
      if (bp !== undefined && observation.date !== undefined)
        points.push({ date: observation.date, bp });
      if (points.length >= limit) break;
    }
    return points;
  }
}
