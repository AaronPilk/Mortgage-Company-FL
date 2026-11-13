import "server-only";
import { createServiceClient } from "./supabase";

/**
 * Lead-routing foundation — resolve a property ZIP to a covering agent.
 *
 * Wave 4 v1 builds the LOOKUP and leaves auto-assignment for a later pass. This
 * is the one place that reads coverage for routing: it calls the SECURITY
 * DEFINER `agent_coverage_for_zip` under the service role (the only role granted
 * EXECUTE, invariant 5), which returns only APPROVED covering agents.
 *
 * Fail-open by contract, exactly like `resolveReferralAgent` (lib/referral.ts):
 * any bad input, missing database, RPC error, or empty result yields null. A
 * routing miss must never break or delay a lead. When several agents cover the
 * same ZIP (overlap is allowed in v1) the first — oldest coverage — is returned;
 * the tie-break policy is a deferred decision, so callers must treat this as
 * "a covering agent", not "the" one.
 */
export type CoveringAgent = { agentId: string; slug: string };

export async function coveringAgentForZip(zip5: string): Promise<CoveringAgent | null> {
  if (!/^\d{5}$/.test(zip5)) return null;
  const supabase = createServiceClient();
  if (supabase === null) return null;
  try {
    const { data, error } = await supabase.rpc("agent_coverage_for_zip", { p_zip5: zip5 });
    if (error !== null || !Array.isArray(data) || data.length === 0) return null;
    const row = data[0] as { agent_id?: unknown; agent_slug?: unknown };
    if (typeof row.agent_id !== "string" || typeof row.agent_slug !== "string") return null;
    return { agentId: row.agent_id, slug: row.agent_slug };
  } catch {
    return null;
  }
}
