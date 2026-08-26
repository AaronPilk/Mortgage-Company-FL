import { NextResponse } from "next/server";
import {
  agentDashboardAvailable,
  readReferralSummary,
  readReferralTimeline,
  resolveApprovedAgent
} from "@/lib/agent-referrals";
import { resolveAuthenticatedUserId } from "@/lib/account-auth";
import { createRequestClient } from "@/lib/supabase";

/**
 * Agent referral dashboard — an authed read, for a client-side refresh.
 *
 * A thin GET companion to the server-rendered page: the same RLS-subject
 * client, the same self-scoping RPCs, the same eligibility gate (an approved
 * partner row owned by the caller). It returns only coarse counts, buckets, and
 * recency — never a consumer's identity — and is never cached. A dark flag, a
 * signed-out caller, or a non-partner each get a shaped refusal, never someone
 * else's numbers. No mutation happens here, so there is no CSRF surface to gate;
 * the read is self-scoped by `auth.uid()` through the RPC and by RLS.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(): Promise<NextResponse> {
  if (!agentDashboardAvailable()) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
  }

  const supabase = await createRequestClient();
  const userId = await resolveAuthenticatedUserId(supabase);
  if (supabase === null || userId === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const agent = await resolveApprovedAgent(supabase, userId);
  if (agent === null) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  }

  const [summary, timeline] = await Promise.all([
    readReferralSummary(supabase),
    readReferralTimeline(supabase)
  ]);

  return NextResponse.json({ summary, timeline }, { headers: NO_STORE });
}
