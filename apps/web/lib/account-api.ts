import "server-only";
import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import {
  HTTP_STATUS_BY_CODE,
  type ApiErrorCode,
  apiFailure,
  apiSuccess,
  fieldErrors
} from "@tract/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { isSameOrigin } from "./request-context";
import { createRequestClient } from "./supabase";

const MAX_ACCOUNT_BODY_BYTES = 20 * 1024;

export type AccountApiContext = {
  requestId: string;
  userId: string;
  supabase: SupabaseClient;
};

export function accountFailure(
  code: ApiErrorCode,
  requestId: string,
  fields?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(apiFailure(code, requestId, fields === undefined ? {} : { fields }), {
    status: HTTP_STATUS_BY_CODE[code],
    headers: { "Cache-Control": "no-store" }
  });
}

export function accountSuccess<T>(data: T, requestId: string, status = 200): NextResponse {
  return NextResponse.json(apiSuccess(data, requestId), {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function beginAccountMutation(
  request: NextRequest
): Promise<AccountApiContext | NextResponse> {
  const requestId = randomUUID();
  if (!isSameOrigin(request.headers.get("origin"), new URL(request.url).origin)) {
    return accountFailure("FORBIDDEN", requestId);
  }

  const client = await createRequestClient();
  if (client === null) return accountFailure("INTEGRATION_UNAVAILABLE", requestId);

  const {
    data: { user },
    error
  } = await client.auth.getUser();
  if (error !== null || user === null) return accountFailure("UNAUTHORIZED", requestId);

  return { requestId, userId: user.id, supabase: client };
}

export async function parseAccountBody<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T,
  requestId: string
): Promise<z.output<T> | NextResponse> {
  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (
    !contentType.toLowerCase().startsWith("application/json") ||
    (Number.isFinite(declaredLength) && declaredLength > MAX_ACCOUNT_BODY_BYTES)
  ) {
    return accountFailure("BAD_REQUEST", requestId);
  }

  let value: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_ACCOUNT_BODY_BYTES) return accountFailure("BAD_REQUEST", requestId);
    value = JSON.parse(text);
  } catch {
    return accountFailure("BAD_REQUEST", requestId);
  }

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return accountFailure("BAD_REQUEST", requestId, fieldErrors(parsed.error));
  }
  return parsed.data;
}
