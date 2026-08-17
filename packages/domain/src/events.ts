/**
 * Application lifecycle events. The CRM is a projection of these; it is not the
 * source of truth. Naming them explicitly keeps automation off brittle tag logic.
 */

export const LIFECYCLE_EVENTS = [
  "lead.received",
  "lead.crm_synced",
  "lead.crm_sync_failed",
  "lead.contact_requested",
  "calculator.saved",
  "vision.project_created",
  "vision.report_requested",
  "vision.report_ready",
  "application.handoff_clicked",
  "partner.inquiry_received",
  "consent.sms_revoked",
  "consent.email_revoked"
] as const;

export type LifecycleEvent = (typeof LIFECYCLE_EVENTS)[number];

export type OutboxEvent = {
  aggregateType: "lead" | "vision_project" | "consent" | "ai_job";
  aggregateId: string;
  eventType: LifecycleEvent;
  idempotencyKey: string;
  payload: Record<string, unknown>;
};
