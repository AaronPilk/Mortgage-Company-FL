/**
 * Application roles. These are authorization facts stored in the database and
 * enforced both by an explicit server check and by Row Level Security. A role
 * claimed by a client is never trusted.
 */

export const APP_ROLES = [
  "consumer",
  "agent",
  "loan_officer",
  "content_editor",
  "compliance_reviewer",
  "operations",
  "admin"
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type Resource =
  | "lead"
  | "lead_contact_detail"
  | "consent_receipt"
  | "ai_job"
  | "usage_ledger"
  | "quota_policy"
  | "content_item"
  | "content_indexation"
  | "integration_config"
  | "audit_event"
  | "vision_project"
  | "privacy_request"
  | "kill_switch";

export type Action = "read" | "create" | "update" | "delete" | "replay" | "publish";

type Matrix = Partial<Record<Resource, Partial<Record<Action, readonly AppRole[]>>>>;

/**
 * Explicit allow-list. Absence means denied. Ownership checks (a consumer reading
 * their own Vision project) are handled separately and are additive to this table.
 */
export const AUTHORIZATION_MATRIX: Matrix = {
  lead: {
    read: ["loan_officer", "operations", "admin"],
    update: ["loan_officer", "operations", "admin"]
  },
  lead_contact_detail: { read: ["loan_officer", "operations", "admin"] },
  consent_receipt: { read: ["compliance_reviewer", "operations", "admin"] },
  ai_job: { read: ["operations", "admin"], replay: ["admin"], update: ["admin"] },
  usage_ledger: { read: ["operations", "admin"] },
  quota_policy: { read: ["operations", "admin"], update: ["admin"] },
  content_item: {
    read: ["content_editor", "compliance_reviewer", "operations", "admin"],
    create: ["content_editor", "admin"],
    update: ["content_editor", "admin"]
  },
  // Flipping a page from noindex to index is a publication decision, not an edit.
  content_indexation: { publish: ["compliance_reviewer", "admin"] },
  integration_config: { read: ["admin"], update: ["admin"] },
  audit_event: { read: ["compliance_reviewer", "admin"] },
  vision_project: { read: ["operations", "admin"] },
  privacy_request: { read: ["compliance_reviewer", "operations", "admin"] },
  kill_switch: { read: ["operations", "admin"], update: ["admin"] }
};

export function can(roles: readonly AppRole[], resource: Resource, action: Action): boolean {
  const allowed = AUTHORIZATION_MATRIX[resource]?.[action];
  if (allowed === undefined) return false;
  return roles.some((role) => allowed.includes(role));
}

export function isStaff(roles: readonly AppRole[]): boolean {
  return roles.some((role) => role !== "consumer" && role !== "agent");
}
