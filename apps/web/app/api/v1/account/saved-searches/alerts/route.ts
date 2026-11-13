import { type NextRequest, NextResponse } from "next/server";
import { SavedSearchAlertRequestSchema } from "@tract/schemas";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";

export const dynamic = "force-dynamic";

/**
 * Toggle whether a saved search emails its owner when new listings match it.
 *
 * A first-party, reserve/settle-free write (mirrors the preferences and
 * rate-watch routes): the same-origin + auth gate in beginAccountMutation is the
 * application check that pairs with RLS (invariant 4), and it writes only
 * alerts_enabled — the one column the migration grants authenticated. The
 * watermark baseline is seeded server-side by the alert loop, never here, so the
 * browser key can never establish a baseline that would suppress or replay alerts.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  const body = await parseAccountBody(request, SavedSearchAlertRequestSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  const { error } = await context.supabase
    .from("saved_searches")
    .update({ alerts_enabled: body.alertsEnabled })
    .eq("owner_user_id", context.userId)
    .eq("id", body.saveId);
  if (error !== null) return accountFailure("INTERNAL_ERROR", context.requestId);
  return accountSuccess({ saved: true, alertsEnabled: body.alertsEnabled }, context.requestId);
}
