/**
 * Marketing analytics vocabulary.
 *
 * This is a deliberately closed set. Anything not listed here does not get sent.
 * Operational telemetry and security logging use a different pipeline; mixing
 * them is how borrower data ends up in an ad platform.
 */

export type AnalyticsEvent =
  | { name: "page_view"; path: string; contentGroup: string }
  | { name: "cta_click"; ctaId: string; placement: string; destination: string }
  | { name: "form_start"; formId: string; intent: string }
  | { name: "generate_lead"; formId: string; intent: string; leadReceiptId: string }
  | { name: "calculator_start"; calculator: string }
  | { name: "calculator_complete"; calculator: string; scenarioId?: string }
  | { name: "calculator_save"; calculator: string; storage: "device" | "first_party" }
  | { name: "property_search"; resultCountBand: string; mode: "demo" | "live" }
  | { name: "property_view"; propertyKey: string; mode: "demo" | "live" }
  | { name: "property_save"; propertyKey: string; storage: "device" | "account" }
  | { name: "vision_start"; source: string }
  | { name: "scenario_configured"; product: string; calculationVersion: string }
  | { name: "report_request"; reportType: string; projectId: string }
  | { name: "report_ready"; reportType: string; projectId: string }
  | { name: "application_handoff"; destinationKey: string }
  | { name: "partner_inquiry"; partnerType: string }
  | { name: "rendprop_tour_view"; tourKey: string; mode: "demo" | "live" }
  | { name: "rendprop_inquiry"; tourKey: string; mode: "demo" | "live" }
  | { name: "login"; method: string }
  | { name: "sign_up"; method: string };

export type AnalyticsEventName = AnalyticsEvent["name"];

export const ALLOWED_EVENT_NAMES: readonly AnalyticsEventName[] = [
  "page_view",
  "cta_click",
  "form_start",
  "generate_lead",
  "calculator_start",
  "calculator_complete",
  "calculator_save",
  "property_search",
  "property_view",
  "property_save",
  "vision_start",
  "scenario_configured",
  "report_request",
  "report_ready",
  "application_handoff",
  "partner_inquiry",
  "rendprop_tour_view",
  "rendprop_inquiry",
  "login",
  "sign_up"
];
