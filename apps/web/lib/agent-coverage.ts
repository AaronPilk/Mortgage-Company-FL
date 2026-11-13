import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicFeatures } from "./env";

/**
 * Agent marketplace v1 — coverage data access.
 *
 * A claimed partner agent registers the ZIP codes they cover. Every read and
 * write here goes through the caller's RLS-subject (request) client, so a row is
 * only ever the caller's own agent's — RLS ("agent owner …" policies on
 * agent_zip_coverage) is the first guarantee and the owner resolution below is
 * the application-layer half (invariant 4). v1 is coverage only: no payment, no
 * billing, no auction.
 */

/** The whole surface is dark unless FEATURE_AGENT_MARKETPLACE (and accounts) are on. */
export function agentMarketplaceAvailable(): boolean {
  return publicFeatures().agentMarketplace;
}

/** The agent row the coverage manager operates on. */
export type OwnedAgent = {
  id: string;
  slug: string;
  status: string;
};

/**
 * The caller's own agent directory row, or null. Eligibility is
 * `owner_user_id = auth.uid()`; an approved row wins over a pending one so a
 * fully approved partner manages the row that actually receives routing. RLS
 * ("owners read own agent row") already limits this select to the caller's own
 * rows; the owner filter is the application-layer half. A pending owner is
 * allowed — they may pre-register coverage that only goes live for routing once
 * approved. Any error or missing row returns null.
 */
export async function resolveOwnedAgent(
  supabase: SupabaseClient,
  userId: string
): Promise<OwnedAgent | null> {
  const { data, error } = await supabase
    .from("agents")
    .select("id,slug,status")
    .eq("owner_user_id", userId)
    // 'approved' sorts before 'pending' and 'unclaimed', so ascending status
    // prefers the approved row when a user somehow owns more than one.
    .order("status", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error !== null || data === null) return null;
  const row = data as { id: string; slug: string; status: string };
  return { id: row.id, slug: row.slug, status: row.status };
}

/**
 * The ZIPs the given agent currently covers, ascending. RLS scopes this to the
 * caller's own agent; passing another agent's id simply returns an empty list.
 * Any error yields an empty list — the manage page renders either way.
 */
export async function readCoverageZips(
  supabase: SupabaseClient,
  agentId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("agent_zip_coverage")
    .select("zip5")
    .eq("agent_id", agentId)
    .order("zip5", { ascending: true });
  if (error !== null || data === null) return [];
  const rows = data as { zip5: string }[];
  return rows.map((row) => row.zip5);
}

/**
 * Replace the agent's coverage with exactly `zips`: delete the rows no longer in
 * the set, insert the ones that are new, and leave the unchanged ones alone.
 *
 * A replace-set rather than add/remove endpoints because the manage form owns
 * the whole list — submitting it is the operation — and diffing here keeps the
 * write idempotent and free of add/remove races. Every statement runs through
 * the caller's RLS-subject client, so the "agent owner …" policies are a second
 * barrier over the route's own ownership resolve. Returns the persisted set.
 *
 * The two statements are not in one transaction (PostgREST has no cross-call tx),
 * so the ADD runs BEFORE the REMOVE deliberately: if the second statement fails,
 * the agent is left covering a SUPERSET of what they wanted (extra ZIPs), never a
 * subset — a failed save can never silently strip an agent of coverage they had.
 * Over-coverage is harmless in v1 (routing is unwired, overlap is allowed) and a
 * retry converges. Delete-then-insert would instead risk emptying coverage on a
 * mid-write failure. A single transactional replace RPC is the eventual hardening,
 * noted in docs/compliance/ before the marketplace flag is flipped.
 */
export async function replaceCoverageZips(
  supabase: SupabaseClient,
  agentId: string,
  zips: string[]
): Promise<string[]> {
  const desired = new Set(zips);
  const current = new Set(await readCoverageZips(supabase, agentId));

  const toRemove = [...current].filter((zip) => !desired.has(zip));
  const toAdd = [...desired].filter((zip) => !current.has(zip));

  if (toAdd.length > 0) {
    const insertion = await supabase
      .from("agent_zip_coverage")
      .insert(toAdd.map((zip5) => ({ agent_id: agentId, zip5 })));
    if (insertion.error !== null) throw insertion.error;
  }

  if (toRemove.length > 0) {
    const removal = await supabase
      .from("agent_zip_coverage")
      .delete()
      .eq("agent_id", agentId)
      .in("zip5", toRemove);
    if (removal.error !== null) throw removal.error;
  }

  return readCoverageZips(supabase, agentId);
}
