import { afterEach, describe, expect, it } from "vitest";
import {
  AnthropicApiError,
  AnthropicTimeoutError,
  DisabledAiProvider,
  FixtureAiProvider
} from "@tract/integrations";
import { AREA_REPORT_TOOL, AreaReportSchema } from "@tract/schemas";

// Set before the first lazy env() read. aiSearch on + a small live-ish budget, so
// the whole reserve→execute→settle→scrub→cache pipeline runs against injected
// fixtures rather than a real model. Platform budget is deliberately tight (3¢) so
// a held reservation is observable against a 2¢-per-call fixture.
process.env.AI_MODE = "fixture";
process.env.FEATURE_AI_SEARCH = "true";
process.env.AI_DEFAULT_USER_DAILY_BUDGET_CENTS = "100";
process.env.AI_DAILY_PLATFORM_BUDGET_CENTS = "3";

import {
  __clearAreaCacheForTesting,
  __setAreaAiForTesting,
  buildAreaTemplate,
  runAreaNarrative,
  scrubReport
} from "../../lib/area-report";
import { aiBudgetStore } from "../../lib/ai-budget";
import { COUNTIES, countyBySlug } from "../../lib/county-data";
import { publicFeatures } from "../../lib/env";

const county = countyBySlug("hillsborough-county");
if (county === undefined) throw new Error("fixture county missing");

/** A schema-valid, figure-free prose report, as a well-behaved model would return. */
const CLEAN_REPORT = {
  overview:
    "Buying in this county is mostly an ordinary loan process, but the carrying cost rewards checking insurance and taxes early before you are under contract on a home.",
  lifestyle:
    "Neighborhoods run from the busier core out to quieter residential edges, each with its own feel and commute for the people who choose to live there.",
  buyingConsiderations:
    "Get a flood determination and a real insurance quote on the exact property, and budget the tax from the post-sale reset rather than the seller's current bill.",
  neighborhoodsProse:
    "Where a home sits shapes its cost as much as the list price does, so weigh the specific street and its elevation, not just the town it happens to be in."
};

afterEach(() => {
  __setAreaAiForTesting(undefined);
  __clearAreaCacheForTesting();
  aiBudgetStore.clear();
});

describe("area report tool schema", () => {
  it("has zero numeric fields — prose is the only expressible output", () => {
    const inputSchema = AREA_REPORT_TOOL.inputSchema as {
      properties: Record<string, { type?: string; items?: { type?: string } }>;
    };
    for (const [name, node] of Object.entries(inputSchema.properties)) {
      const isProse =
        node.type === "string" || (node.type === "array" && node.items?.type === "string");
      expect(isProse, `${name} must be prose, not ${node.type}`).toBe(true);
      expect(node.type, `${name} must not be numeric`).not.toBe("integer");
      expect(node.type, `${name} must not be numeric`).not.toBe("number");
    }
  });

  it("rejects an extra numeric field on the parsed output (.strict)", () => {
    const withNumber = { ...CLEAN_REPORT, medianPrice: 450_000 };
    expect(AreaReportSchema.safeParse(withNumber).success).toBe(false);
  });

  it("rejects a numeric value in a prose field", () => {
    const badField = { ...CLEAN_REPORT, overview: 12345 };
    expect(AreaReportSchema.safeParse(badField).success).toBe(false);
  });
});

describe("scrubReport", () => {
  it("rejects dollar amounts, percentages, and market figures", () => {
    expect(scrubReport("homes here run about $450,000")).toBe(false);
    expect(scrubReport("flood insurance adds 7% to the payment")).toBe(false);
    expect(scrubReport("the median price keeps climbing")).toBe(false);
    expect(scrubReport("about 45 days on market")).toBe(false);
    expect(scrubReport("roughly 1.2m for waterfront")).toBe(false);
    expect(scrubReport("homes sell for 35,000 over ask")).toBe(false);
  });

  it("rejects fabricated ratings, rankings, and scores", () => {
    expect(scrubReport("the schools are 9/10")).toBe(false);
    expect(scrubReport("a 5 star neighborhood")).toBe(false);
    expect(scrubReport("the #1 place to live")).toBe(false);
    expect(scrubReport("top-rated schools nearby")).toBe(false);
    expect(scrubReport("the best schools in the region")).toBe(false);
    expect(scrubReport("a low crime rate area")).toBe(false);
  });

  it("lets ordinary figure-free prose through", () => {
    expect(scrubReport("a warm coastal community with an easy commute and good weather")).toBe(
      true
    );
    // A bare year is not a figure and must survive.
    expect(scrubReport("many homes here were built after 2004")).toBe(true);
  });
});

describe("buildAreaTemplate", () => {
  it("is deterministic and figure-free for every county", () => {
    for (const entry of COUNTIES) {
      const first = buildAreaTemplate(entry);
      expect(buildAreaTemplate(entry)).toEqual(first);
      // The template is the always-safe fallback: it must validate and must never
      // trip its own scrub (some sourced notes quote a "0%" loan — deliberately
      // not embedded here).
      expect(AreaReportSchema.safeParse(first).success, `${entry.slug} schema`).toBe(true);
      const joined = [
        first.overview,
        first.lifestyle,
        first.buyingConsiderations,
        first.neighborhoodsProse
      ].join("\n");
      expect(scrubReport(joined), `${entry.slug} scrub`).toBe(true);
    }
  });
});

describe("runAreaNarrative", () => {
  it("returns AI prose and caches it on a clean fixture answer", async () => {
    const provider = new FixtureAiProvider(() => CLEAN_REPORT, 0);
    __setAreaAiForTesting(provider);

    const first = await runAreaNarrative(county, { requestId: "req-1", subjectKey: "ip:test" });
    expect(first.source).toBe("ai");
    expect(first.sections.overview).toBe(CLEAN_REPORT.overview);
    expect(provider.calls.length).toBe(1);

    // Second call is served from the 24h cache — the provider is not called again.
    const second = await runAreaNarrative(county, { requestId: "req-2", subjectKey: "ip:test" });
    expect(second.source).toBe("ai");
    expect(provider.calls.length).toBe(1);
  });

  it("falls back to the template when the model slips a figure past the schema", async () => {
    const dirty = {
      ...CLEAN_REPORT,
      overview:
        "Buying here is pleasant, but you should know the median price is about $450,000, which shapes what most families can comfortably afford."
    };
    __setAreaAiForTesting(new FixtureAiProvider(() => dirty, 0));

    const result = await runAreaNarrative(county, { requestId: "req-3", subjectKey: "ip:test" });
    expect(result.source).toBe("template");
    expect(result.sections).toEqual(buildAreaTemplate(county));
  });

  it("holds the reservation on an unknown outcome (invariant 8)", async () => {
    // 2¢ per call against a 3¢ platform budget: the first call's held reservation
    // leaves only 1¢, so a released reservation would let the second call run
    // (calls.length 2) while a held one refuses it (calls.length 1).
    const provider = new FixtureAiProvider(() => {
      throw new AnthropicTimeoutError();
    }, 2);
    __setAreaAiForTesting(provider);

    const first = await runAreaNarrative(county, { requestId: "req-4", subjectKey: "ip:test" });
    expect(first.source).toBe("template");
    expect(provider.calls.length).toBe(1);

    const second = await runAreaNarrative(county, { requestId: "req-5", subjectKey: "ip:test" });
    expect(second.source).toBe("template");
    expect(provider.calls.length).toBe(1);
  });

  it("releases the reservation on a provider error (no reconciliation)", async () => {
    // An API error is billed-before-nothing: released in full, so a second call
    // has budget again and does reach the provider.
    const provider = new FixtureAiProvider(() => {
      throw new AnthropicApiError(500);
    }, 2);
    __setAreaAiForTesting(provider);

    await runAreaNarrative(county, { requestId: "req-6", subjectKey: "ip:test" });
    await runAreaNarrative(county, { requestId: "req-7", subjectKey: "ip:test" });
    expect(provider.calls.length).toBe(2);
  });

  it("returns the template when the provider is disabled", async () => {
    __setAreaAiForTesting(new DisabledAiProvider());
    const result = await runAreaNarrative(county, { requestId: "req-8", subjectKey: "ip:test" });
    expect(result.source).toBe("template");
    expect(result.sections).toEqual(buildAreaTemplate(county));
  });

  it("exercises the pipeline through the shared fixture responder (no override)", async () => {
    // AI_MODE=fixture routes area requests to the figure-free area stub in ai.ts.
    const result = await runAreaNarrative(county, { requestId: "req-9", subjectKey: "ip:test" });
    expect(result.source).toBe("ai");
    expect(AreaReportSchema.safeParse(result.sections).success).toBe(true);
  });
});

describe("aiSearch gate (flag on)", () => {
  it("derives aiSearch=true, so the paid AI path is enabled", () => {
    // The same gate the interpret route's guard reads. Off-state is covered in
    // property-interpret-gate.test.ts; the AI paths above prove the on-state runs.
    expect(publicFeatures().aiSearch).toBe(true);
  });
});
