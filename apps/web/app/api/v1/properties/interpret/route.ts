import { type NextRequest, NextResponse } from "next/server";
import {
  HTTP_STATUS_BY_CODE,
  PropertyInterpretRequestSchema,
  type ApiErrorCode,
  type InterpretSource,
  apiFailure,
  apiSuccess,
  fieldErrors
} from "@tract/schemas";
import {
  AiProviderApiError,
  selectRoute,
  type AiRequest,
  type QuotaPolicy,
  type StructuredExtractionInput
} from "@tract/integrations";
import type { PropertySearchCriteria } from "@/components/properties/criteria";
import {
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_TOOL,
  describeCriteria,
  extractionToInterpreted,
  interpretedToCriteria,
  parseNaturalQuery
} from "@/components/properties/nl-parser";
import { ai, MODEL_ROUTES, PROPERTY_QUERY_ROUTE } from "@/lib/ai";
import { aiBudgetStore } from "@/lib/ai-budget";
import { env, publicFeatures } from "@/lib/env";
import { fixturesAllowed, listings } from "@/lib/listings";
import { log } from "@/lib/logger";
import { rateLimitStore } from "@/lib/rate-limit";
import { buildRequestContext, isSameOrigin } from "@/lib/request-context";
import { SITE_URL } from "@/lib/site";

/**
 * Natural-language search interpretation.
 *
 * POST { query } → { criteria, source, echo }. The criteria come back in the
 * same URL-parameter shape the filter form produces, so the client applies
 * them by navigating — the whole existing search pipeline, pagination, and
 * fixture gating are reused rather than duplicated.
 *
 * The AI path is optional on every axis. AI_MODE=disabled, a refused budget
 * reservation, a provider timeout, or an unusable model answer all land on the
 * deterministic rule-based parser, and `source` reports which one actually
 * produced the result — "ai" is never claimed for a rules answer.
 *
 * Spend discipline (invariant 8): the estimated cost is reserved before the
 * provider is called and settled after. A timeout settles as an unknown
 * outcome, which holds the reservation rather than releasing money the
 * provider may still bill. There are no retries — one request, one answer or
 * the fallback.
 *
 * The query text is search input, not PII, but it is still a consumer's own
 * words: it is never logged (length and outcome only) and never echoed back —
 * `echo` restates the validated criteria, not the input.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/v1/properties/interpret";
const MAX_BODY_BYTES = 4 * 1024;
const INTERPRET_RATE_LIMIT = { windowMs: 60 * 1000, limit: 10 } as const;

const FEATURE = "property_query_interpretation";
const PROMPT_KEY = "property_query_parse";
const PROMPT_VERSION = "1.0.0";
/** Hard per-request ceiling. This feature is a few cents at most, ever. */
const MAX_COST_CENTS = 5;

export type PropertyInterpretResponse = {
  criteria: PropertySearchCriteria;
  source: InterpretSource;
  /** Human-readable restatement of the criteria, e.g. "3+ beds in Tampa under $500,000". */
  echo: string;
};

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

/**
 * Runs the AI path end to end: route policy, reservation, one provider call,
 * output validation, settlement. Returns null on any refusal or failure so the
 * caller falls back to rules. Never throws.
 */
async function interpretWithAi(
  query: string,
  requestId: string,
  subjectKey: string
): Promise<PropertySearchCriteria | null> {
  const provider = ai();
  if (provider.key === "disabled") return null;

  const input: StructuredExtractionInput = {
    system: EXTRACTION_SYSTEM_PROMPT,
    user: query,
    toolName: EXTRACTION_TOOL.name,
    toolDescription: EXTRACTION_TOOL.description,
    inputSchema: EXTRACTION_TOOL.inputSchema,
    maxOutputTokens: 512
  };

  const aiRequest: AiRequest<StructuredExtractionInput> = {
    capability: "structured_extraction",
    feature: FEATURE,
    input,
    outputSchemaKey: EXTRACTION_TOOL.name,
    promptKey: PROMPT_KEY,
    promptVersion: PROMPT_VERSION,
    dataClass: "consumer_property",
    maxCostCents: MAX_COST_CENTS,
    timeoutMs: PROPERTY_QUERY_ROUTE.timeoutMs,
    idempotencyKey: requestId
  };

  let route;
  try {
    route = selectRoute(MODEL_ROUTES, PROPERTY_QUERY_ROUTE.key, aiRequest);
  } catch {
    return null; // route disabled or not cleared for this data class
  }

  const configuration = env();
  const subjectPolicy: QuotaPolicy = {
    subjectKind: "anonymous",
    feature: FEATURE,
    period: "day",
    requestLimit: 100,
    costLimitCents: configuration.AI_DEFAULT_USER_DAILY_BUDGET_CENTS,
    concurrencyLimit: 4,
    enabled: true
  };
  const platformPolicy: QuotaPolicy = {
    subjectKind: "platform",
    feature: FEATURE,
    period: "day",
    requestLimit: null,
    costLimitCents: configuration.AI_DAILY_PLATFORM_BUDGET_CENTS,
    concurrencyLimit: null,
    enabled: true
  };

  let estimatedCostCents: number;
  try {
    estimatedCostCents = await provider.estimateCost(input, route.providerModel);
  } catch {
    return null;
  }

  // Reserve before the provider is called. With the budget env vars at their
  // zero default, any paid estimate is refused here and the feature stays on
  // the deterministic parser — spending money is an explicit configuration act.
  const reserved = aiBudgetStore.reserve({
    feature: FEATURE,
    subjectKey,
    subjectPolicy,
    platformPolicy,
    estimatedCostCents,
    maxCostCents: MAX_COST_CENTS
  });
  if (!reserved.allowed) {
    log.info("AI interpretation budget refused", {
      requestId,
      route: ROUTE,
      reason: reserved.reason
    });
    return null;
  }

  try {
    const result = await provider.execute<StructuredExtractionInput, unknown>(
      aiRequest,
      route.providerModel
    );
    // The provider completed billable work whether or not the answer is
    // usable, so the charge is real either way.
    reserved.reservation.settle({
      kind: "succeeded",
      actualCostCents: result.actualCostCents ?? estimatedCostCents
    });
    return interpretedToCriteria(extractionToInterpreted(result.output));
  } catch (error) {
    if (error instanceof AiProviderApiError) {
      // Either vendor answered with an error status; the request was not billed.
      reserved.reservation.settle({ kind: "failed_before_billable" });
    } else {
      // Timeout or transport failure with the request possibly in flight. Hold
      // the reservation for reconciliation rather than releasing money the
      // provider may still bill.
      const { requiresReconciliation } = reserved.reservation.settle({ kind: "unknown" });
      if (requiresReconciliation) {
        log.error("AI interpretation outcome unknown; reservation held", {
          requestId,
          route: ROUTE,
          errorName: error instanceof Error ? error.name : "unknown"
        });
      }
    }
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const configuration = env();
  const context = buildRequestContext(request.headers, configuration.HASH_PEPPER);

  const finish = (
    outcome: string,
    response: NextResponse,
    extra: Record<string, unknown> = {}
  ): NextResponse => {
    // Length and outcome only. The query text itself is never logged.
    log.info("property interpret endpoint", {
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
    `properties:interpret:${context.ipPrefixHash ?? "unknown"}`,
    INTERPRET_RATE_LIMIT.windowMs,
    INTERPRET_RATE_LIMIT.limit
  );
  if (!networkLimit.allowed) {
    return finish(
      "rate_limited",
      fail("RATE_LIMITED", context.requestId, {
        retryAfterSeconds: networkLimit.retryAfterSeconds
      })
    );
  }

  // Interpretation is pointless when the search it feeds is unavailable, and
  // answering anyway would advertise a surface that will 404.
  const provider = listings();
  if (!publicFeatures().propertySearch || provider.key === "disabled" || !fixturesAllowed()) {
    return finish("provider_unavailable", fail("INTEGRATION_UNAVAILABLE", context.requestId));
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

  const parsed = PropertyInterpretRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return finish(
      "rejected_validation",
      fail("BAD_REQUEST", context.requestId, { fields: fieldErrors(parsed.error) })
    );
  }
  const query = parsed.data.query;

  let source: InterpretSource = "rules";
  let criteria = await interpretWithAi(query, context.requestId, context.ipPrefixHash ?? "unknown");
  if (criteria !== null) {
    source = "ai";
  } else {
    criteria = interpretedToCriteria(parseNaturalQuery(query));
  }

  const body: PropertyInterpretResponse = {
    criteria,
    source,
    echo: describeCriteria(criteria)
  };

  return finish(
    "ok",
    NextResponse.json(apiSuccess(body, context.requestId), {
      headers: { "Cache-Control": "no-store" }
    }),
    { source, queryLength: query.length }
  );
}
