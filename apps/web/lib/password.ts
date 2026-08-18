/**
 * Client-side password validation for account creation and password reset.
 *
 * This is a floor, not the policy: Supabase Auth enforces its own configured
 * minimum server-side. The check here exists so the person gets an immediate,
 * specific message instead of a round trip. The password itself is never
 * logged or persisted anywhere on our side — it goes to Supabase and nowhere
 * else.
 */

export const MINIMUM_PASSWORD_LENGTH = 8;

/** Returns a human-readable problem with the candidate password, or null. */
export function passwordProblem(password: string): string | null {
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
