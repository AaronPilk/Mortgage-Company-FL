import { type NextRequest, NextResponse } from "next/server";
import { RateWatchSchema } from "@tract/schemas";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";

export const dynamic = "force-dynamic";

/**
 * Saved rate watch — PUT upserts the signed-in visitor's row.
 *
 * Reads happen server-side in the account page (a same-origin GET carries no
 * Origin header, so the mutation gate would reject it); this route is the write.
 * RLS scopes the upsert to auth.uid(); the same-origin + auth gate in
 * beginAccountMutation is the application check that pairs with it (invariant 4).
 * The target rate is the visitor's own aspiration — never a rate we quote.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  const body = await parseAccountBody(request, RateWatchSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  // Units boundary (percentage → basis points), not financial math.
  const targetRateBp =
    body.targetRatePercent === undefined ? null : Math.round(body.targetRatePercent * 100);

  const { error } = await context.supabase.from("rate_watches").upsert(
    {
      owner_user_id: context.userId,
      term: body.term,
      target_rate_bp: targetRateBp,
      notify_email: body.notifyEmail,
      updated_at: new Date().toISOString()
    },
    { onConflict: "owner_user_id" }
  );
  if (error !== null) return accountFailure("INTEGRATION_UNAVAILABLE", context.requestId);
  return accountSuccess({ saved: true }, context.requestId);
}
