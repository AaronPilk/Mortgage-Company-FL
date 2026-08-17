"use client";

import { type AnalyticsEvent, inspectEvent } from "@tract/analytics";
import type { AnalysisType } from "@tract/vision-model";

/**
 * Vision analytics.
 *
 * Three facts leave this file and nothing else: which kind of analysis was
 * chosen, that a preview was produced, and that a report was requested. The
 * address, the price, the budget, the rent, the rate, and every contact detail
 * stay in the browser.
 *
 * Every event goes through `inspectEvent` first. There is no path around it,
 * and a rejected event is dropped rather than sent — a lost metric is
 * recoverable, a leaked figure is not. The scenario reference is a random
 * identifier minted in this tab; it is not a database key and cannot be used to
 * look anyone up.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function emit(event: AnalyticsEvent): void {
  const verdict = inspectEvent(event);
  if (!verdict.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`analytics event refused: ${verdict.reason}`);
    }
    return;
  }
  if (typeof window === "undefined") return;
  const layer = (window.dataLayer ??= []);
  const { name, ...params } = event;
  layer.push({ event: name, ...params });
}

/** Keeps the analysis type in one namespaced slot rather than scattering free text. */
function calculatorId(analysisType: AnalysisType): string {
  return `vision:${analysisType}`;
}

export function trackVisionStarted(analysisType: AnalysisType): void {
  emit({ name: "calculator_start", calculator: calculatorId(analysisType) });
}

export function trackVisionPreviewViewed(analysisType: AnalysisType, scenarioRef: string): void {
  emit({
    name: "calculator_complete",
    calculator: calculatorId(analysisType),
    scenarioId: scenarioRef
  });
}

export function trackVisionReportRequested(analysisType: AnalysisType, scenarioRef: string): void {
  emit({ name: "report_request", reportType: calculatorId(analysisType), projectId: scenarioRef });
}

/**
 * A per-tab opaque reference. Random, meaningless outside this session, and
 * never a database id.
 *
 * Letters only, deliberately. A UUID carries long runs of digits separated by
 * hyphens, which is indistinguishable from a formatted telephone number to the
 * analytics guard — so roughly one reference in a few hundred would be rejected
 * and the event silently dropped. An alphabet with no digits in it cannot
 * collide with the phone, government-id, or email patterns at all.
 */
const REF_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const REF_LENGTH = 16;

export function newScenarioRef(): string {
  const indexes = new Uint8Array(REF_LENGTH);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(indexes);
  } else {
    for (let position = 0; position < REF_LENGTH; position += 1) {
      indexes[position] = Math.floor(Math.random() * 256);
    }
  }
  let out = "";
  for (const value of indexes) out += REF_ALPHABET[value % REF_ALPHABET.length];
  return out;
}
