/**
 * Agent join deduplication — the decision, separated from the database.
 *
 * The owner's requirement is that an agent coming back never produces a second
 * row. The join route looks an applicant up twice — by normalized email and by
 * license number — and this module turns those two lookup results into exactly
 * one action. Keeping it pure means the whole decision table is testable
 * without a database, and the route stays a thin executor.
 *
 * Decision table:
 *
 *   email hit | license hit | outcome
 *   ----------+-------------+---------------------------------------------
 *   no        | no          | insert a new pending row
 *   yes       | no          | update the email-matched row
 *   no        | yes         | update the license-matched row
 *   yes, same | yes, same   | update that one row
 *   yes, A    | yes, B ≠ A  | conflict: prefer the license row, write
 *             |             | nothing, report success (merging two rows is a
 *             |             | human decision; the caller logs ids only)
 *
 * The conflict case deliberately performs no write: updating the license row's
 * email would collide with the other row's unique email, and silently merging
 * two identities is exactly the kind of unestablished fact this codebase
 * refuses to record.
 */

export type AgentLookupHit = { id: string };

export type AgentUpsertDecision =
  | { action: "insert" }
  | { action: "update"; targetId: string }
  | { action: "conflict"; targetId: string; emailRowId: string; licenseRowId: string };

export function decideAgentUpsert(
  emailMatch: AgentLookupHit | null,
  licenseMatch: AgentLookupHit | null
): AgentUpsertDecision {
  if (emailMatch === null && licenseMatch === null) return { action: "insert" };
  if (emailMatch !== null && licenseMatch !== null && emailMatch.id !== licenseMatch.id) {
    return {
      action: "conflict",
      targetId: licenseMatch.id,
      emailRowId: emailMatch.id,
      licenseRowId: licenseMatch.id
    };
  }
  // One hit, or both hits on the same row. License wins the tie by the same
  // preference the conflict case applies, though here they agree anyway.
  const target = licenseMatch ?? emailMatch;
  // The guards above make target non-null; the throw keeps the type honest.
  if (target === null) throw new Error("unreachable: both lookups null was handled");
  return { action: "update", targetId: target.id };
}

/**
 * The status change a join-form submission may cause on the row it updates.
 *
 * Matching an 'unclaimed' public-record row is a claim: the submission fills in
 * the profile, and the row moves to 'pending' because a claim is an assertion
 * anyone could type — a license number is public — so staff must review it
 * before it publishes with the claimant's details. Every other status is left
 * exactly where it is: a resubmission never downgrades an approved row and
 * never re-promotes a pending one. `source` is untouched everywhere, so an
 * imported row stays auditable as 'dbpr_import' after its agent claims it.
 */
export function claimStatusUpdate(
  targetStatus: string | null | undefined
): { status: "pending" } | Record<string, never> {
  return targetStatus === "unclaimed" ? { status: "pending" } : {};
}

/** Longest base that still leaves room for a "-99" collision suffix within 80. */
const SLUG_BASE_MAX = 76;

/**
 * Kebab-case slug base from a name: lowercase, [a-z0-9-] only, no leading,
 * trailing, or doubled hyphens. Falls back to "agent" when a name contains no
 * usable characters at all, so the caller always has a valid candidate.
 */
export function agentSlugBase(firstName: string, lastName: string): string {
  const base = `${firstName} ${lastName}`
    .toLowerCase()
    .normalize("NFKD")
    // Strip combining marks so "José" becomes "jose", not "jos".
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_BASE_MAX)
    .replace(/-+$/g, "");
  return base === "" ? "agent" : base;
}

/**
 * First free slug: the base itself, then base-2, base-3, … against the set of
 * slugs already taken. Deterministic given the same inputs, so a retried
 * insert converges on the same value.
 */
export function resolveAgentSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}
