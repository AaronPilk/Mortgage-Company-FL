import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@tract/schemas";

/**
 * Link an unclaimed agent directory row to the account that owns its email.
 *
 * An agent may join the directory first and create an account later. The join
 * form deduplicates on normalized email and license number; this closes the
 * remaining gap in the other direction, so the account and the directory row
 * become one identity instead of drifting into a duplicate.
 *
 * Runs with the service role because the signed-in user cannot, by design,
 * update a row they do not yet own. The `is null` guard means an already-owned
 * row — theirs or anyone else's — is never touched, so the write is idempotent
 * and cannot reassign ownership.
 *
 * Failure-safe by contract: the account page must render whether or not this
 * worked, so every failure collapses to a silent no-op and the next render
 * simply tries again.
 */
export async function claimAgentRowForUser(
  client: SupabaseClient,
  userId: string,
  email: string
): Promise<void> {
  try {
    const emailNormalized = normalizeEmail(email);
    await client
      .from("agents")
      .update({ owner_user_id: userId })
      .eq("email_normalized", emailNormalized)
      .is("owner_user_id", null);
  } catch {
    // No-op on purpose. Linking is opportunistic; the durable facts are the
    // directory row and the account, both of which already exist.
  }
}
