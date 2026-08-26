import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  HTTP_STATUS_BY_CODE,
  type ApiErrorCode,
  apiFailure,
  apiSuccess,
  fieldErrors
} from "@tract/schemas";
import type { PropertyLookupResponse } from "@/lib/home-lookup-types";
import { env } from "@/lib/env";
import { sellerAvmAvailable } from "@/lib/property";
import { lookupHome } from "@/lib/home-lookup";
import { log } from "@/lib/logger";
import { rateLimitStore } from "@/lib/rate-limit";
import { buildRequestContext, isSameOrigin } from "@/lib/request-context";
import { SITE_URL } from "@/lib/site";

/**
 * Seller funnel — automated value estimate.
 *
 * A homeowner's own address in, a licensed automated valuation out. It reuses
 * the EXISTING home-value AVM (`lookupHome` -> `propertyFacts().lookup`), never
 * a second one, and carries the same write-side guards as
 * `/api/v1/property-lookup` — same-origin and a tight rate limit — because it
 * can spend a metered provider call even though it stores nothing.
 *
 * The estimate inherits ATTOM gating: `sellerAvmAvailable()` is the availability
 * gate, so a fixture provider in production reads as unavailable and no invented
 * value ever publishes (invariant 6). This route is only the value figure — the
 * seller LEAD is captured by the existing `/api/v1/leads` pipeline, which does
 * not depend on this route being live.
 *
 * Reserve-before-spend note: this follows the same discipline as the existing
 * property-lookup and home-value routes — availability gate + per-caller rate
 * limit before the provider call, and a generic unavailability on any fault. It
 * introduces no usage-ledger reservation because ATTOM lookups are not
 * ledger-metered here; the ledgered reservation (invariant 8) belongs to the
 * later automated re-snapshot pass, per lib/home-value.ts.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tighter than search: each estimate can bill a provider, matching property-lookup. */
const SELL_ESTIMATE_RATE_LIMIT = { windowMs: 60 * 1000, limit: 15 } as const;
const MAX_BODY_BYTES = 8 * 1024;

/**
 * Address only. A seller knows their own address, so there is no listing-link
 * parsing here (that is the buyer-side home-lookup path). Same field shape and
 * bounds as the home-value and property-lookup address schemas.
 */
const SellEstimateBodySchema = z.object({
  address: z.object({
    line1: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(120),
    state: z
      .string()
      .trim()
      .length(2)
      .transform((s) => s.toUpperCase()),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/)
  })
});

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

function ok(body: PropertyLookupResponse, requestId: string): NextResponse {
  return NextResponse.json(apiSuccess(body, requestId), {
    headers: { "Cache-Control": "no-store" }
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const context = buildRequestContext(request.headers, env().HASH_PEPPER);
  const route = "/api/v1/sell/estimate";

  const finish = (outcome: string, response: NextResponse): NextResponse => {
    log.info("seller estimate endpoint", {
      requestId: context.requestId,
      route,
      outcome,
      durationMs: Date.now() - startedAt,
      userAgentFamily: context.userAgentFamily
    });
    return response;
  };

  // A browser-only POST: reject anything not from our own origin before work.
  if (!isSameOrigin(context.origin, SITE_URL)) {
    return finish("forbidden_origin", fail("FORBIDDEN", context.requestId));
  }

  // Rate limit before parsing or touching the provider.
  const decision = await rateLimitStore.hit(
    `sell:estimate:${context.ipPrefixHash ?? "unknown"}`,
    SELL_ESTIMATE_RATE_LIMIT.windowMs,
    SELL_ESTIMATE_RATE_LIMIT.limit
  );
  if (!decision.allowed) {
    return finish(
      "rate_limited",
      fail("RATE_LIMITED", context.requestId, { retryAfterSeconds: decision.retryAfterSeconds })
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return finish("body_too_large", fail("BAD_REQUEST", context.requestId));
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES)
      return finish("body_too_large", fail("BAD_REQUEST", context.requestId));
    raw = JSON.parse(text);
  } catch {
    return finish("bad_json", fail("BAD_REQUEST", context.requestId));
  }

  const parsed = SellEstimateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return finish(
      "rejected_validation",
      fail("BAD_REQUEST", context.requestId, { fields: fieldErrors(parsed.error) })
    );
  }

  // Availability. A fixture provider in production is treated as unavailable, and
  // the whole surface is dark unless sellerTools is on and ATTOM is live: invented
  // value data must never publish (invariant 6). The funnel handles this cleanly —
  // it shows no number and still captures the seller lead.
  if (!sellerAvmAvailable()) {
    return finish("provider_unavailable", fail("INTEGRATION_UNAVAILABLE", context.requestId));
  }

  // Any provider fault is a generic unavailability — no provider message, URL, or
  // stack reaches the caller.
  try {
    const result = await lookupHome(parsed.data.address);
    if (result === null) {
      return finish(
        "not_found",
        ok({ status: "not_found", address: parsed.data.address }, context.requestId)
      );
    }
    return finish("ok", ok({ status: "found", result }, context.requestId));
  } catch (error) {
    log.error("seller estimate provider failed", {
      requestId: context.requestId,
      route,
      errorName: error instanceof Error ? error.name : "unknown"
    });
    return finish("provider_error", fail("INTEGRATION_UNAVAILABLE", context.requestId));
  }
}

export function GET(): NextResponse {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
