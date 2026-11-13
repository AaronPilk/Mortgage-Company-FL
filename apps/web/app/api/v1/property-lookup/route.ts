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
import { homeLookupAvailable } from "@/lib/property";
import { lookupHome, resolveListingLink } from "@/lib/home-lookup";
import { log } from "@/lib/logger";
import { rateLimitStore } from "@/lib/rate-limit";
import { buildRequestContext, isSameOrigin } from "@/lib/request-context";
import { SITE_URL } from "@/lib/site";

/**
 * Home lookup: an address (typed, or read from a pasted listing link) in, a
 * licensed property record and a seeded estimate out.
 *
 * A POST rather than a GET because it can spend a metered provider call, so it
 * carries the write-side guards — same-origin and a tight rate limit — even
 * though it stores nothing. Fixture data is served only where
 * `homeLookupAvailable()` permits it, and is labelled in the response.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tighter than search: each lookup can bill a provider, so a script gets little room. */
const PROPERTY_LOOKUP_RATE_LIMIT = { windowMs: 60 * 1000, limit: 15 } as const;
const MAX_BODY_BYTES = 8 * 1024;

const AddressSchema = z.object({
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
});

const PropertyLookupBodySchema = z
  .object({
    link: z.string().trim().url().max(2000).optional(),
    address: AddressSchema.optional()
  })
  .refine((body) => body.link !== undefined || body.address !== undefined, {
    message: "Provide a listing link or an address."
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
  const route = "/api/v1/property-lookup";

  const finish = (outcome: string, response: NextResponse): NextResponse => {
    log.info("home lookup endpoint", {
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
    `property:lookup:${context.ipPrefixHash ?? "unknown"}`,
    PROPERTY_LOOKUP_RATE_LIMIT.windowMs,
    PROPERTY_LOOKUP_RATE_LIMIT.limit
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

  const parsed = PropertyLookupBodySchema.safeParse(raw);
  if (!parsed.success) {
    return finish(
      "rejected_validation",
      fail("BAD_REQUEST", context.requestId, { fields: fieldErrors(parsed.error) })
    );
  }

  // Availability. A fixture provider in production is treated as unavailable:
  // invented property facts must never publish.
  if (!homeLookupAvailable()) {
    return finish("provider_unavailable", fail("INTEGRATION_UNAVAILABLE", context.requestId));
  }

  // Resolve the address: a structured address wins; otherwise read it from the
  // pasted link, and ask the visitor to confirm when the slug is incomplete.
  let address = parsed.data.address ?? null;
  if (address === null && parsed.data.link !== undefined) {
    const resolved = resolveListingLink(parsed.data.link);
    if (resolved.address === null) {
      return finish(
        "needs_address",
        ok(
          { status: "needs_address", parsed: resolved.parsed, host: resolved.host },
          context.requestId
        )
      );
    }
    address = resolved.address;
  }
  if (address === null) {
    return finish("no_address", fail("BAD_REQUEST", context.requestId));
  }

  // Any provider fault is a generic unavailability — no provider message, URL,
  // or stack reaches the caller.
  try {
    const result = await lookupHome(address);
    if (result === null) {
      return finish("not_found", ok({ status: "not_found", address }, context.requestId));
    }
    return finish("ok", ok({ status: "found", result }, context.requestId));
  } catch (error) {
    log.error("home lookup provider failed", {
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
