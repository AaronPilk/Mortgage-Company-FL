import { type NextRequest, NextResponse } from "next/server";
import { HomeBalanceSchema, HomeValueLookupSchema } from "@tract/schemas";
import { dollarsToCents } from "@tract/mortgage-math";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";
import { captureHomeValue, readHomeDashboard } from "@/lib/home-value";
import { homeValueAvailable } from "@/lib/property";
import { rateLimitStore } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Homeowner value dashboard writes.
 *
 * POST looks up the automated value for the owner's home and saves a snapshot —
 * it can bill a metered provider, so on top of the same-origin + auth gate in
 * `beginAccountMutation` it carries a per-user rate limit and the availability
 * gate that keeps fixture data out of production. PATCH updates only the balance
 * the owner typed and never touches the provider. Reads happen server-side in
 * the account page (a same-origin GET carries no Origin header, so the mutation
 * gate would reject it). RLS scopes every write to auth.uid() (invariant 4).
 */

/** Each POST can bill a valuation, so a per-user script gets little room. */
const HOME_VALUE_RATE_LIMIT = { windowMs: 60 * 1000, limit: 10 } as const;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;

  // A fixture provider in production is treated as unavailable: invented value
  // data must never publish.
  if (!homeValueAvailable()) return accountFailure("INTEGRATION_UNAVAILABLE", context.requestId);

  const decision = await rateLimitStore.hit(
    `home-value:${context.userId}`,
    HOME_VALUE_RATE_LIMIT.windowMs,
    HOME_VALUE_RATE_LIMIT.limit
  );
  if (!decision.allowed) return accountFailure("RATE_LIMITED", context.requestId);

  const body = await parseAccountBody(request, HomeValueLookupSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  try {
    const outcome = await captureHomeValue({
      supabase: context.supabase,
      userId: context.userId,
      address: body.address,
      estimatedBalanceCents: dollarsToCents(body.estimatedBalance)
    });
    if (outcome.status === "not_found") {
      return accountSuccess({ status: "not_found" }, context.requestId);
    }
    if (outcome.status === "unavailable") {
      return accountFailure("INTEGRATION_UNAVAILABLE", context.requestId);
    }
    return accountSuccess({ status: "saved", dashboard: outcome.dashboard }, context.requestId);
  } catch {
    return accountFailure("INTEGRATION_UNAVAILABLE", context.requestId);
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;

  const body = await parseAccountBody(request, HomeBalanceSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  // Units boundary (percentage → basis points), not financial math; omitted clears it.
  const currentRateBp =
    body.currentRatePercent === undefined ? null : Math.round(body.currentRatePercent * 100);
  const update = await context.supabase
    .from("home_profiles")
    .update({
      estimated_balance_cents: dollarsToCents(body.estimatedBalance),
      current_rate_bp: currentRateBp,
      updated_at: new Date().toISOString()
    })
    .eq("owner_user_id", context.userId);
  if (update.error !== null) return accountFailure("INTEGRATION_UNAVAILABLE", context.requestId);

  const dashboard = await readHomeDashboard(context.supabase, context.userId);
  if (dashboard === null) return accountFailure("NOT_FOUND", context.requestId);
  return accountSuccess({ status: "saved", dashboard }, context.requestId);
}
