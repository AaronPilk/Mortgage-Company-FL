import "server-only";
import type { AgentPublic } from "@tract/schemas";
import { fetchAgentBySlug } from "./agents";

/**
 * Agent referral resolution.
 *
 * A referral code is an agent slug from a shared link. It is only ever trusted
 * after the server confirms it against the public directory — and only when it
 * resolves to a claimed, approved, consenting partner (`unclaimed === false`),
 * never one of the imported public-record rows. That gate keeps co-branding and
 * attribution to agents who actually opted in, and stops a bogus code from
 * inventing a referral. Any lookup failure returns null: a referral must never
 * break or delay the lead itself.
 */
export async function resolveReferralAgent(code: string | undefined): Promise<AgentPublic | null> {
  if (code === undefined) return null;
  const slug = code.trim().toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  try {
    const agent = await fetchAgentBySlug(slug);
    if (agent === null || agent.unclaimed) return null;
    return agent;
  } catch {
    return null;
  }
}
