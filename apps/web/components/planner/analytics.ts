"use client";

import { type AnalyticsEvent, inspectEvent } from "@tract/analytics";

/**
 * Planner analytics.
 *
 * Four facts leave this file and nothing else: that the planner was started,
 * which goal was chosen, that an estimate was produced, and that a lead was
 * received. The state, the city, the price, the down payment, the income range,
 * the debt range, the credit band, the name, the email, and the phone number all
 * stay in the browser.
 *
 * Every event passes through `inspectEvent` first. There is no path around it,
 * and a refused event is dropped rather than sent — a lost metric is
 * recoverable, a leaked figure is not.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const FORM_ID = "planner";

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

/** The goal is a fixed vocabulary word, not anything the visitor typed. */
export function trackPlannerStarted(goal: string): void {
  emit({ name: "form_start", formId: FORM_ID, intent: goal });
}

export function trackEstimateShown(goal: string): void {
  emit({ name: "calculator_complete", calculator: `planner:${goal}` });
}

/**
 * `leadReceiptId` is the server-issued receipt. It is deliberately permitted by
 * the guard: it is opaque, it is not a database primary key, and it is what
 * makes conversion deduplication possible without sending a person.
 */
export function trackPlannerLead(goal: string, receiptId: string): void {
  emit({ name: "generate_lead", formId: FORM_ID, intent: goal, leadReceiptId: receiptId });
}
