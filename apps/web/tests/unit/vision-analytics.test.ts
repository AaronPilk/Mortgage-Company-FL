import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYSIS_TYPES, runVisionScenario, scenarioSummary } from "@tract/vision-model";
import { inspectEvent } from "@tract/analytics";
import {
  newScenarioRef,
  trackVisionPreviewViewed,
  trackVisionReportRequested,
  trackVisionStarted
} from "../../components/vision/analytics";

/**
 * Invariant 7, applied to Vision.
 *
 * The scenario the model produces contains an address, a price, a budget, and a
 * rent. None of it may reach an analytics parameter. These tests drive the real
 * dispatch functions against a stubbed dataLayer and assert on what actually
 * lands in it, rather than on what the code appears to send.
 */

type Layer = Record<string, unknown>[];

function currentLayer(): Layer {
  return (globalThis as unknown as { window: { dataLayer?: Layer } }).window.dataLayer ?? [];
}

beforeEach(() => {
  vi.stubGlobal("window", { dataLayer: [] as Layer });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const SENSITIVE_SCENARIO = {
  analysisType: "fix_and_flip",
  ownership: "purchasing",
  propertyLabel: "1420 Palmetto Way, Sarasota",
  purchasePriceCents: 42_500_000,
  improvementBudgetCents: 9_000_000,
  grossMonthlyRentCents: 380_000,
  annualRateBasisPoints: 1_050
} as const;

describe("vision analytics", () => {
  it("emits a start event carrying only the analysis type", () => {
    trackVisionStarted("long_term_rental");
    expect(currentLayer()).toEqual([
      { event: "calculator_start", calculator: "vision:long_term_rental" }
    ]);
  });

  it("emits a preview event carrying only the type and an opaque reference", () => {
    trackVisionPreviewViewed("fix_and_flip", "ref-1234");
    expect(currentLayer()).toEqual([
      { event: "calculator_complete", calculator: "vision:fix_and_flip", scenarioId: "ref-1234" }
    ]);
  });

  it("emits a report-request event carrying only the type and an opaque reference", () => {
    trackVisionReportRequested("addition", "ref-9876");
    expect(currentLayer()).toEqual([
      { event: "report_request", reportType: "vision:addition", projectId: "ref-9876" }
    ]);
  });

  it("never puts an address, price, budget, rent, or rate into a parameter", () => {
    const result = runVisionScenario(SENSITIVE_SCENARIO);
    const summary = scenarioSummary(result);
    expect(summary).toContain("1420 Palmetto Way");

    trackVisionStarted(SENSITIVE_SCENARIO.analysisType);
    trackVisionPreviewViewed(SENSITIVE_SCENARIO.analysisType, "ref-abc");
    trackVisionReportRequested(SENSITIVE_SCENARIO.analysisType, "ref-abc");

    const serialized = JSON.stringify(currentLayer());
    for (const forbidden of ["Palmetto", "425000", "42500000", "380000", "9000000", "1050"]) {
      expect(serialized, forbidden).not.toContain(forbidden);
    }
  });

  it("passes the analytics guard for every analysis type", () => {
    for (const analysisType of ANALYSIS_TYPES) {
      expect(
        inspectEvent({ name: "calculator_start", calculator: `vision:${analysisType}` }).ok,
        analysisType
      ).toBe(true);
      expect(
        inspectEvent({
          name: "calculator_complete",
          calculator: `vision:${analysisType}`,
          scenarioId: newScenarioRef()
        }).ok,
        analysisType
      ).toBe(true);
      expect(
        inspectEvent({
          name: "report_request",
          reportType: `vision:${analysisType}`,
          projectId: newScenarioRef()
        }).ok,
        analysisType
      ).toBe(true);
    }
  });

  it("mints a reference that is opaque and unique per call", () => {
    const first = newScenarioRef();
    const second = newScenarioRef();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(7);
  });

  it("mints a reference the analytics guard can never mistake for a phone number", () => {
    // A UUID looks enough like a formatted telephone number to be rejected
    // roughly one time in a few hundred, which would drop the event silently.
    for (let attempt = 0; attempt < 2_000; attempt += 1) {
      const ref = newScenarioRef();
      expect(/[0-9]/.test(ref), ref).toBe(false);
      expect(
        inspectEvent({ name: "report_request", reportType: "vision:addition", projectId: ref }).ok,
        ref
      ).toBe(true);
    }
  });

  it("creates the dataLayer when the page has not already", () => {
    vi.stubGlobal("window", {});
    trackVisionStarted("interior_upgrade");
    expect(currentLayer()).toHaveLength(1);
  });
});
