import { type NextRequest, NextResponse } from "next/server";
import { PrivacyRequestSchema } from "@tract/schemas";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  const body = await parseAccountBody(request, PrivacyRequestSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  const { data, error } = await context.supabase.rpc("create_privacy_request", {
    p_request_id: body.requestId,
    p_request_type: body.requestType
  });
  const result = Array.isArray(data) ? data[0] : data;
  if (error !== null || result === undefined || result === null) {
    return accountFailure("INTERNAL_ERROR", context.requestId);
  }
  return accountSuccess(
    {
      requestId: String(result.request_id),
      requestType: String(result.request_type),
      status: String(result.status),
      createdAt: String(result.created_at)
    },
    context.requestId,
    202
  );
}
