import { type NextRequest, NextResponse } from "next/server";
import {
  HTTP_STATUS_BY_CODE,
  AreaReportRequestSchema,
  type ApiErrorCode,
  apiFailure,
  apiSuccess,
  fieldErrors
} from "@tract/schemas";
import { runAreaNarrative } from "@/lib/area-report";
import { countyBySlug } from "@/lib/county-data";
import { env, publicFeatures } from "@/lib/env";
import { log } from "@/lib/logger";
import { rateLimitStore } from "@/lib/rate-limit";
import { buildRequestContext, isSameOrigin } from "@/lib/request-context";
import { SITE_URL } from "@/lib/site";

/**
 * AI-written county area report.
 *
 * POST { county } → { sections, source }. Public (the county pages are public,
 * so their narrative is too), which is why it carries the write-side guards a
 * metered public surface needs: same-origin, a per-network rate limit, and the
 * budget reservation inside `runAreaNarrative`. Gated on the aiSearch flag; with
 * it off the surface is unavailable and the page keeps its deterministic
 * template. The prose is model-written color; every figure the reader sees is
 * server-rendered from sourced data on the page, never returned here (invariant
 * 6). `runAreaNarrative` never throws, so a live-but-failing model returns the
 * template with source "template" rather than an error.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/v1/area-report";
const MAX_BODY_BYTES = 1 * 1024;
const AREA_RATE_LIMIT = { windowMs: 60 * 1000, limit: 20 } as const;

function fail(
  code: ApiErrorCode,
  requestId: string,
  extra: { fields?: Record<string, string[]>; retryAfterSeconds?: number } = {}
): NextResponse {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (extra.retryAfterSeconds !== undefined) {
    headers["Retry-After"] = String(extra.retryAfterSeconds);
  }
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
    log.info("area report endpoint", {
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
    `area-report:${context.ipPrefixHash ?? "unknown"}`,
    AREA_RATE_LIMIT.windowMs,
    AREA_RATE_LIMIT.limit
  );
  if (!networkLimit.allowed) {
    return finish(
      "rate_limited",
      fail("RATE_LIMITED", context.requestId, {
        retryAfterSeconds: networkLimit.retryAfterSeconds
      })
    );
  }

  // The AI narrative is the aiSearch feature. Off → the surface is unavailable
  // and the page keeps its server-rendered template; nothing is answered here.
  if (!publicFeatures().aiSearch) {
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

  const parsed = AreaReportRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return finish(
      "rejected_validation",
      fail("BAD_REQUEST", context.requestId, { fields: fieldErrors(parsed.error) })
    );
  }

  // A well-formed slug that is not a county we serve is a bad request, not a
  // report — the same closed set the static pages render (dynamicParams=false).
  const county = countyBySlug(parsed.data.county);
  if (county === undefined) {
    return finish("rejected_unknown_county", fail("BAD_REQUEST", context.requestId));
  }

  // The daily budget belongs to the network here (the surface is anonymous); the
  // per-network rate limit above throttles raw volume by the same key.
  const report = await runAreaNarrative(county, {
    requestId: context.requestId,
    subjectKey: `ip:${context.ipPrefixHash ?? "unknown"}`
  });

  return finish(
    "ok",
    NextResponse.json(apiSuccess(report, context.requestId), {
      headers: { "Cache-Control": "no-store" }
    }),
    { slug: county.slug, source: report.source }
  );
}
