import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicFeatures } from "./env";

/**
 * Agent partner referral dashboard — server data access.
 *
 * A signed-in, claimed-and-approved partner sees only the *shape* of what their
 * /r/<slug> link drove: coarse counts, three lifecycle buckets, and recency.
 * Never a consumer's identity — no name, email, phone, message, or intent
 * reaches this module, because the doors it calls never return one.
 *
 * Every read goes through a SECURITY DEFINER RPC on the RLS-subject (request)
 * client — the exact read precedent set by the loan portal (`lib/loan.ts`). The
 * function self-scopes to the caller's own approved agent row by `auth.uid()`
 * and returns zeros / an empty timeline for anyone who is not a claimed,
 * approved partner. So a bug in this file cannot widen the blast radius: the
 * worst case is a partner shown their own zeros.
 *
 * The raw marketing status is bucketed to three values *in SQL* (the
 * integrator's RPC), so this layer only ever displays new / working / closed —
 * a deliberately coarse vocabulary that cannot imply a credit decision
 * (invariant 6).
 */

export type ReferralBucket = "new" | "working" | "closed";

export type ReferralSummary = {
  total: number;
  new: number;
  working: number;
  closed: number;
  /** ISO timestamp of the most recent referral, or null when there are none. */
  lastReferralAt: string | null;
};

export type ReferralTimelineEntry = {
  bucket: ReferralBucket;
  /** The referral date (YYYY-MM-DD). A day, never a precise moment. */
  referredOn: string;
};

/** The agent's own directory row, reduced to the only fields the dashboard shows. */
export type ApprovedAgent = {
  id: string;
  firstName: string;
  slug: string;
};

const ZERO_SUMMARY: ReferralSummary = {
  total: 0,
  new: 0,
  working: 0,
  closed: 0,
  lastReferralAt: null
};

/** The whole surface is dark unless FEATURE_AGENT_DASHBOARD (and accounts) are on. */
export function agentDashboardAvailable(): boolean {
  return publicFeatures().agentDashboard;
}

/**
 * The caller's own approved agent row, or null. Eligibility is exactly
 * `owner_user_id = auth.uid()` AND `status = 'approved'`: a pending applicant,
 * an imported unclaimed record, or a plain consumer all resolve to null and
 * never reach a data fetch. RLS already limits this select to the owner's own
 * row ("owners read own agent row"); the status filter is the application-layer
 * half of that guarantee — RLS and an application check, both (ADR-005). Any
 * error or missing row returns null.
 */
export async function resolveApprovedAgent(
  supabase: SupabaseClient,
  userId: string
): Promise<ApprovedAgent | null> {
  const { data, error } = await supabase
    .from("agents")
    .select("id,first_name,slug,status")
    .eq("owner_user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error !== null || data === null) return null;
  const row = data as { id: string; first_name: string; slug: string };
  return { id: row.id, firstName: row.first_name, slug: row.slug };
}

/**
 * Coarse counts + recency for the caller's own referrals. The RPC self-scopes
 * by `auth.uid()` and returns a single row; a non-partner gets zeros. Any error
 * or absent row also collapses to zeros — the dashboard never fails open into
 * someone else's numbers, and never throws on a flaky read.
 */
export async function readReferralSummary(supabase: SupabaseClient): Promise<ReferralSummary> {
  const { data, error } = await supabase.rpc("agent_referral_summary");
  if (error !== null || data === null) return { ...ZERO_SUMMARY };
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null | undefined;
  if (row === null || row === undefined) return { ...ZERO_SUMMARY };
  return {
    total: toCount(row.total_count),
    new: toCount(row.new_count),
    working: toCount(row.working_count),
    closed: toCount(row.closed_count),
    lastReferralAt: toIsoOrNull(row.last_referral_at)
  };
}

/**
 * The caller's own recent referrals as coarse (bucket, day) rows, newest first.
 * The RPC caps the list; this passes the same cap so the contract is explicit.
 * A malformed bucket (a raw marketing status the SQL failed to fold) is dropped
 * rather than rendered, so the three-value vocabulary the UI relies on holds.
 * Any error or non-array result yields an empty list.
 */
export async function readReferralTimeline(
  supabase: SupabaseClient
): Promise<ReferralTimelineEntry[]> {
  const { data, error } = await supabase.rpc("agent_referral_timeline", { p_limit: 50 });
  if (error !== null || data === null || !Array.isArray(data)) return [];
  const entries: ReferralTimelineEntry[] = [];
  for (const raw of data) {
    const row = raw as Record<string, unknown>;
    const bucket = row.status_bucket;
    const referredOn = row.referred_on;
    if (isBucket(bucket) && typeof referredOn === "string" && referredOn.length > 0) {
      entries.push({ bucket, referredOn });
    }
  }
  return entries;
}

function isBucket(value: unknown): value is ReferralBucket {
  return value === "new" || value === "working" || value === "closed";
}

/**
 * A count comes back as a bigint, which supabase-js may hand over as a number
 * or a string. Coerce, and treat anything non-finite or negative as zero.
 */
function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}

function toIsoOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
