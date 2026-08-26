import { z } from "zod";

/**
 * AGENT DIRECTORY schemas.
 *
 * The join request is a marketing-adjacent form and inherits the lead form's
 * prohibitions in full: no government identifier, no account number, no income
 * documentation, no file upload — a directory listing is not an application of
 * any kind. Contact details are normalized with the same functions the lead
 * pipeline uses, so deduplication agrees across both.
 */

/**
 * State license identifier as issued: 4–20 characters, letters, digits, and
 * hyphens. This bounds an identifier — it does not verify one. Verification is
 * a separate human step recorded in licenseVerified, which stays false until it
 * actually happened.
 */
export const AGENT_LICENSE_NUMBER_REGEX = /^[A-Za-z0-9-]{4,20}$/;

export const AgentJoinRequestSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().min(7).max(32),
  licenseNumber: z
    .string()
    .trim()
    .regex(AGENT_LICENSE_NUMBER_REGEX, "License number must be 4–20 letters, digits, or hyphens."),
  brokerage: z.string().trim().min(1).max(120).optional(),
  /** Comma-separated served cities as the agent typed them. Bounded plain text. */
  cities: z.string().trim().min(1).max(400),
  bio: z.string().trim().min(1).max(1000).optional(),
  /** Consent to appear in the public directory. Approval alone never publishes a row. */
  displayConsent: z.boolean(),
  turnstileToken: z.string().min(1).max(4096),
  /** Must arrive empty. A populated value is a bot signal. */
  honeypot: z.string().max(0).optional(),
  submissionId: z.string().uuid()
});
export type AgentJoinRequestInput = z.input<typeof AgentJoinRequestSchema>;
export type AgentJoinRequestParsed = z.output<typeof AgentJoinRequestSchema>;

/** Five-digit US ZIP. */
export const ZIP5_REGEX = /^\d{5}$/;

/**
 * Upper bound on how many ZIPs one agent may register at once. A generous
 * ceiling — an agent covering a metro can list a lot of ZIPs — but bounded, so
 * a single request cannot post an unbounded set.
 */
export const AGENT_COVERAGE_MAX_ZIPS = 200;

/**
 * AGENT MARKETPLACE v1 — coverage registration (replace-set).
 *
 * The agent submits the complete set of ZIPs they cover; the server replaces
 * their coverage with it. This is not an application and inherits the lead
 * form's prohibitions in full: it carries ZIP strings only — no government
 * identifier, account number, income figure, or upload. The array is deduped
 * here so a repeated ZIP is a no-op rather than a rejection.
 */
export const AgentCoverageSchema = z.object({
  zips: z
    .array(z.string().trim().regex(ZIP5_REGEX, "Each ZIP must be five digits."))
    .max(AGENT_COVERAGE_MAX_ZIPS, "Too many ZIP codes in one request.")
    .transform((zips) => Array.from(new Set(zips)))
});
export type AgentCoverageInput = z.input<typeof AgentCoverageSchema>;
export type AgentCoverageParsed = z.output<typeof AgentCoverageSchema>;

/**
 * What the public directory renders. licenseVerified false means the UI shows
 * "verification pending" — the field is a fact about our process, never a claim
 * the agent made about themselves.
 */
export const AgentPublicSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(80),
  firstName: z.string(),
  lastName: z.string(),
  brokerage: z.string().nullable(),
  cities: z.string(),
  bio: z.string().nullable(),
  licenseNumber: z.string(),
  licenseVerified: z.boolean(),
  /**
   * True for a public-record profile imported from the state license roll that
   * no agent has claimed yet. The UI must say so — the honest framing is the
   * condition for publishing the row without the agent's involvement.
   */
  unclaimed: z.boolean(),
  /** County from the state extract; null for rows agents typed themselves. */
  county: z.string().nullable()
});
export type AgentPublic = z.infer<typeof AgentPublicSchema>;
