/**
 * Table and function names as constants.
 *
 * A typo in a table name inside a query string is a runtime error that a
 * typecheck cannot catch. Referencing these constants moves that failure to
 * compile time, and it makes a rename a single-file change.
 */

export const TABLES = {
  profiles: "profiles",
  userRoles: "user_roles",
  auditEvents: "audit_events",
  leads: "leads",
  leadSubmissionReceipts: "lead_submission_receipts",
  leadPlans: "lead_plans",
  consentReceipts: "consent_receipts",
  suppressions: "suppressions",
  attributionTouches: "attribution_touches",
  integrationOutbox: "integration_outbox",
  webhookReceipts: "webhook_receipts",
  propertyEntities: "property_entities",
  listingRecords: "listing_records",
  propertyFacts: "property_facts",
  visionProjects: "vision_projects",
  visionAssumptions: "vision_assumptions",
  visionScenarios: "vision_scenarios",
  visionReports: "vision_reports",
  visionReportRequests: "vision_report_requests",
  aiJobs: "ai_jobs",
  usageLedger: "usage_ledger",
  quotaPolicies: "quota_policies",
  killSwitches: "kill_switches",
  contentItems: "content_items",
  contentSources: "content_sources",
  contentRevisions: "content_revisions",
  linkOpportunities: "link_opportunities"
} as const;

/**
 * Every one of these is `security definer` and revoked from PUBLIC. They are
 * callable only with the service role, from a narrow server path.
 */
export const FUNCTIONS = {
  createLeadWithReceipt: "create_lead_with_receipt",
  reserveAiBudget: "reserve_ai_budget",
  recordAuditEvent: "record_audit_event",
  getPublicReport: "get_public_report",
  createVisionReportRequest: "create_vision_report_request",
  claimIntegrationOutbox: "claim_integration_outbox",
  completeIntegrationOutbox: "complete_integration_outbox",
  hasRole: "has_role",
  isStaff: "is_staff"
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
export type FunctionName = (typeof FUNCTIONS)[keyof typeof FUNCTIONS];
