import { describe, expect, it } from "vitest";
import {
  DisabledRateFeedPort,
  FixtureRateFeedPort,
  FredRateFeedPort,
  type MarketRates
} from "./index";

/** A fetch double that answers each FRED series with a canned observations payload. */
function fredStub(payloadByTerm: { thirty: unknown; fifteen: unknown }): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.includes("MORTGAGE30US") ? payloadByTerm.thirty : payloadByTerm.fifteen;
    return { ok: true, status: 200, json: async () => body };
  }) as unknown as typeof fetch;
}

describe("FredRateFeedPort", () => {
  it("parses PMMS percentages into basis points with movement and an ascending history", async () => {
    const port = new FredRateFeedPort({
      apiKey: "test",
      fetchImpl: fredStub({
        thirty: {
          observations: [
            { date: "2026-08-21", value: "6.81" },
            { date: "2026-08-14", value: "6.93" },
            { date: "2026-08-07", value: "6.88" }
          ]
        },
        fifteen: {
          observations: [
            { date: "2026-08-21", value: "6.01" },
            { date: "2026-08-14", value: "6.11" }
          ]
        }
      })
    });

    const result = await port.latest();
    expect(result).not.toBeNull();
    const rates = result!.value as MarketRates;
    expect(rates.thirtyYearFixedBp).toBe(681);
    expect(rates.previousThirtyYearFixedBp).toBe(693);
    expect(rates.fifteenYearFixedBp).toBe(601);
    expect(rates.previousFifteenYearFixedBp).toBe(611);
    expect(rates.asOfDate).toBe("2026-08-21");
    // Oldest first, current last.
    expect(rates.thirtyYearHistoryBp.at(-1)).toBe(681);
    expect(rates.thirtyYearHistoryBp[0]).toBe(688);
    expect(result!.provenance.provider).toBe("fred");
  });

  it("skips FRED's missing-value marker and still reads the latest valid observation", async () => {
    const port = new FredRateFeedPort({
      apiKey: "test",
      fetchImpl: fredStub({
        thirty: {
          observations: [
            { date: "2026-08-28", value: "." },
            { date: "2026-08-21", value: "6.81" },
            { date: "2026-08-14", value: "6.93" }
          ]
        },
        fifteen: { observations: [{ date: "2026-08-21", value: "6.01" }] }
      })
    });
    const rates = (await port.latest())!.value as MarketRates;
    expect(rates.thirtyYearFixedBp).toBe(681);
    expect(rates.asOfDate).toBe("2026-08-21");
  });

  it("returns null when the headline series has no usable observation", async () => {
    const port = new FredRateFeedPort({
      apiKey: "test",
      fetchImpl: fredStub({
        thirty: { observations: [{ date: "2026-08-21", value: "." }] },
        fifteen: { observations: [{ date: "2026-08-21", value: "6.01" }] }
      })
    });
    expect(await port.latest()).toBeNull();
  });
});

describe("rate feed doubles", () => {
  it("DisabledRateFeedPort returns null", async () => {
    expect(await new DisabledRateFeedPort().latest()).toBeNull();
  });

  it("FixtureRateFeedPort labels itself as sample data and carries a trend", async () => {
    const result = await new FixtureRateFeedPort().latest();
    expect(result).not.toBeNull();
    expect(result!.provenance.provider).toBe("fixture");
    expect((result!.value as MarketRates).thirtyYearHistoryBp.length).toBeGreaterThan(2);
  });
});
