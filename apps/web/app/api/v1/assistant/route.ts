import { type NextRequest, NextResponse } from "next/server";
import {
  HTTP_STATUS_BY_CODE,
  AssistantRequestSchema,
  type ApiErrorCode,
  apiFailure,
  apiSuccess,
  fieldErrors
} from "@tract/schemas";
import { assistantAvailable, runAssistant } from "@/lib/assistant";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { rateLimitStore } from "@/lib/rate-limit";
import { buildRequestContext, isSameOrigin } from "@/lib/request-context";
import { SITE_URL } from "@/lib/site";

/**
 * Site assistant endpoint.
 *
 * POST { messages } → { reply, links, offerConnect }. Public (the assistant is a
 * top-of-funnel helper for anonymous visitors), so it carries the write-side
 * guards a metered, public surface needs: same-origin, a tight per-network rate
 * limit, and the budget reservation inside `runAssistant`. The daily budget at
 * its zero default refuses every paid call, so the assistant only spends once AI
 * is explicitly funded. The conversation is a visitor's own words: length and
 * turn count are logged, never the content.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/v1/assistant";
const MAX_BODY_BYTES = 16 * 1024;
const ASSISTANT_RATE_LIMIT = { windowMs: 60 * 1000, limit: 12 } as const;

function fail(
  code: ApiErrorCode,
  requestId: string,
  extra: { fields?: Record<string, string[]>; retryAfterSeconds?: number } = {}
): NextResponse {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (extra.retryAfterSeconds !== undefined)
    headers["Retry-After"] = String(extra.retryAfterSeconds);
  return NextResponse.json(apiFailure(code, requestId, extra), {
    status: HTTP_STATUS_BY_CODE[code],
    headers
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const context = buildRequestContext(request.headers, env().HASH_PEPPER);

  const finish = (
    outcome: string,
    response: NextResponse,
    extra: Record<string, unknown> = {}
  ): NextResponse => {
    log.info("assistant endpoint", {
      requestId: context.requestId,
      route: ROUTE,
      outcome,
      durationMs: Date.now() - startedAt,
      userAgentFamily: context.userAgentFamily,
      ...extra
    });
    return response;
  };

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return finish("rejected_content_type", fail("BAD_REQUEST", context.requestId));
  }
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return finish("rejected_body_size", fail("BAD_REQUEST", context.requestId));
  }
  if (!isSameOrigin(context.origin, SITE_URL)) {
    return finish("rejected_origin", fail("FORBIDDEN", context.requestId));
  }

  const networkLimit = await rateLimitStore.hit(
    `assistant:${context.ipPrefixHash ?? "unknown"}`,
    ASSISTANT_RATE_LIMIT.windowMs,
    ASSISTANT_RATE_LIMIT.limit
  );
  if (!networkLimit.allowed) {
    return finish(
      "rate_limited",
      fail("RATE_LIMITED", context.requestId, { retryAfterSeconds: networkLimit.retryAfterSeconds })
    );
  }

  if (!assistantAvailable()) {
    return finish("unavailable", fail("INTEGRATION_UNAVAILABLE", context.requestId));
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return finish("rejected_body_size", fail("BAD_REQUEST", context.requestId));
    }
    raw = JSON.parse(text);
  } catch {
    return finish("rejected_malformed_json", fail("BAD_REQUEST", context.requestId));
  }

  const parsed = AssistantRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return finish(
      "rejected_validation",
      fail("BAD_REQUEST", context.requestId, { fields: fieldErrors(parsed.error) })
    );
  }

  const messages = parsed.data.messages;
  const last = messages[messages.length - 1];
  if (last === undefined || last.role !== "user") {
    return finish("rejected_shape", fail("BAD_REQUEST", context.requestId));
  }

  // The daily budget belongs to the network here (the surface is anonymous); the
  // per-network rate limit above throttles raw volume by the same key.
  const reply = await runAssistant({
    messages,
    subjectKey: `ip:${context.ipPrefixHash ?? "unknown"}`,
    requestId: context.requestId
  });

  return finish(
    "ok",
    NextResponse.json(apiSuccess(reply, context.requestId), {
      headers: { "Cache-Control": "no-store" }
    }),
    { turns: messages.length }
  );
}
