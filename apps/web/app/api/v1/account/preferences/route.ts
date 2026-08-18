import { type NextRequest, NextResponse } from "next/server";
import { NotificationPreferencesRequestSchema } from "@tract/schemas";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  const body = await parseAccountBody(
    request,
    NotificationPreferencesRequestSchema,
    context.requestId
  );
  if (body instanceof NextResponse) return body;

  const { error } = await context.supabase.from("notification_preferences").upsert({
    owner_user_id: context.userId,
    report_ready_email: body.reportReadyEmail,
    report_failure_email: body.reportFailureEmail
  });
  if (error !== null) return accountFailure("INTERNAL_ERROR", context.requestId);
  return accountSuccess({ saved: true }, context.requestId);
}
