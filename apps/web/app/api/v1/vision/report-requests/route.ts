import { type NextRequest, NextResponse } from "next/server";
import {
  ContactNormalizationError,
  HTTP_STATUS_BY_CODE,
  VisionReportRequestSchema,
  type ApiErrorCode,
  apiFailure,
  apiSuccess,
  fieldErrors,
  normalizeContact
} from "@tract/schemas";
import { verifyTurnstile } from "@tract/integrations";
import {
  type AnalysisType,
  type VisionInput,
  runVisionScenario,
  scenarioSummary
} from "@tract/vision-model";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { LEAD_RATE_LIMITS, rateLimitStore } from "@/lib/rate-limit";
import {
  buildRequestContext,
  clientIp,
  dedupeHash,
  isSameOrigin,
  sha256Hex
} from "@/lib/request-context";
import { createServiceClient } from "@/lib/supabase";
import {
  SITE_URL,
  VISION_REPORT_DISCLOSURE_TEXT,
  VISION_REPORT_DISCLOSURE_VERSION
} from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24 * 1024;
const FORM_VERSION = "vision-report-request@1.0.0";
const ROUTE = "/api/v1/vision/report-requests";

const GOAL_BY_ANALYSIS: Readonly<
  Record<
    AnalysisType,
    | "renovate"
    | "expand"
    | "build"
    | "flip"
    | "long_term_rental"
    | "short_term_rental"
    | "buy_and_hold"
  >
> = {
  existing_home_renovation: "renovate",
  addition: "expand",
  interior_upgrade: "renovate",
  land_new_construction: "build",
  long_term_rental: "long_term_rental",
  short_term_rental: "short_term_rental",
  fix_and_flip: "flip",
  buy_and_hold: "buy_and_hold"
};

function fail(
  code: ApiErrorCode,
  requestId: string,
  extra: { fields?: Record<string, string[]>; retryAfterSeconds?: number } = {}
): NextResponse {
  const body = apiFailure(code, requestId, extra);
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (extra.retryAfterSeconds !== undefined) {
    headers["Retry-After"] = String(extra.retryAfterSeconds);
  }
  return NextResponse.json(body, { status: HTTP_STATUS_BY_CODE[code], headers });
}

type Touch = ReturnType<typeof VisionReportRequestSchema.parse>["firstTouch"];

function databaseTouch(touch: Touch, kind: "first" | "last" | "conversion") {
  return {
    touch_kind: kind,
    occurred_at: touch.occurredAt,
    landing_path: touch.landingPath,
    referrer_host: touch.referrerHost ?? null,
    utm_source: touch.utmSource ?? null,
    utm_medium: touch.utmMedium ?? null,
    utm_campaign: touch.utmCampaign ?? null,
    utm_content: touch.utmContent ?? null,
    utm_term: touch.utmTerm ?? null,
    gclid: touch.gclid ?? null,
    gbraid: touch.gbraid ?? null,
    wbraid: touch.wbraid ?? null,
    msclkid: touch.msclkid ?? null,
    fbclid: touch.fbclid ?? null
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const configuration = env();
  const context = buildRequestContext(request.headers, configuration.HASH_PEPPER);
  const finish = (outcome: string, response: NextResponse, errorCode?: string): NextResponse => {
    log.info("Vision report request endpoint", {
      requestId: context.requestId,
      route: ROUTE,
      outcome,
      durationMs: Date.now() - startedAt,
      userAgentFamily: context.userAgentFamily,
      ...(errorCode === undefined ? {} : { errorCode })
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
    `vision:net:${context.ipPrefixHash ?? "unknown"}`,
    LEAD_RATE_LIMITS.perNetwork.windowMs,
    LEAD_RATE_LIMITS.perNetwork.limit
  );
  if (!networkLimit.allowed) {
    return finish(
      "rate_limited_network",
      fail("RATE_LIMITED", context.requestId, {
        retryAfterSeconds: networkLimit.retryAfterSeconds
      })
    );
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

  const parsed = VisionReportRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return finish(
      "rejected_validation",
      fail("BAD_REQUEST", context.requestId, { fields: fieldErrors(parsed.error) })
    );
  }
  const input = parsed.data;
  if (input.honeypot !== undefined && input.honeypot !== "") {
    return finish("rejected_honeypot", fail("BAD_REQUEST", context.requestId));
  }

  const turnstile = await verifyTurnstile(
    input.turnstileToken,
    clientIp(request.headers) ?? undefined,
    {
      mode: configuration.TURNSTILE_MODE,
      ...(configuration.TURNSTILE_SECRET_KEY === undefined
        ? {}
        : { secretKey: configuration.TURNSTILE_SECRET_KEY }),
      expectedAction: "vision_report",
      expectedHostnames: (configuration.TURNSTILE_HOSTNAMES ?? "")
        .split(",")
        .map((hostname) => hostname.trim())
        .filter(Boolean)
    }
  );
  if (!turnstile.ok) {
    return finish(
      `rejected_turnstile_${turnstile.reason}`,
      fail("BAD_REQUEST", context.requestId, {
        fields: { turnstileToken: ["We could not verify that request. Please try again."] }
      })
    );
  }

  let normalized: { emailNormalized: string; phoneE164: string };
  try {
    normalized = normalizeContact(input.email, input.phone);
  } catch (error) {
    if (error instanceof ContactNormalizationError) {
      return finish(
        "rejected_contact_format",
        fail("BAD_REQUEST", context.requestId, {
          fields: { phone: ["Please check the phone number and try again."] }
        })
      );
    }
    throw error;
  }

  const contactLimit = await rateLimitStore.hit(
    `vision:contact:${sha256Hex(
      `${configuration.HASH_PEPPER}|${normalized.emailNormalized}|${normalized.phoneE164}`
    )}`,
    LEAD_RATE_LIMITS.perContact.windowMs,
    LEAD_RATE_LIMITS.perContact.limit
  );
  if (!contactLimit.allowed) {
    return finish(
      "rate_limited_contact",
      fail("RATE_LIMITED", context.requestId, {
        retryAfterSeconds: contactLimit.retryAfterSeconds
      })
    );
  }

  // Parsed inputs are structurally identical to the model contract. Results
  // are always recomputed here; browser-authored figures never cross this line.
  const scenarioInput = Object.fromEntries(
    Object.entries(input.scenario).filter(([, value]) => value !== undefined)
  ) as VisionInput;
  const calculations = runVisionScenario(scenarioInput);
  const summary = scenarioSummary(calculations);
  const assumptions = Object.fromEntries(
    calculations.assumptions.map((assumption) => [
      assumption.key,
      {
        value: assumption.value,
        unit: assumption.unit,
        source: assumption.source,
        marketDataBacked: assumption.marketDataBacked,
        note: assumption.note
      }
    ])
  );
  const receivedAt = new Date().toISOString();
  const dedupe = dedupeHash(
    normalized.emailNormalized,
    normalized.phoneE164,
    "vision_report",
    configuration.HASH_PEPPER
  );
  const supabase = createServiceClient();
  if (supabase === null) {
    log.error("Vision report request has no database configured", {
      requestId: context.requestId,
      route: ROUTE,
      errorCode: "database_unconfigured"
    });
    return finish(
      "failed_no_database",
      fail("INTEGRATION_UNAVAILABLE", context.requestId),
      "database_unconfigured"
    );
  }

  const propertyTitle =
    scenarioInput.propertyLabel?.trim() ||
    `Vision ${scenarioInput.analysisType.replaceAll("_", " ")} scenario`;
  const { data, error } = await supabase.rpc("create_vision_report_request", {
    p_submission_id: input.submissionId,
    p_lead: {
      first_name: input.firstName,
      last_name: input.lastName,
      email_normalized: normalized.emailNormalized,
      phone_e164: normalized.phoneE164,
      preferred_contact: input.preferredContact ?? null,
      state_code: "FL",
      timeline: input.timeline ?? null,
      message: input.note === undefined ? summary : `${summary}\n\n${input.note}`,
      source_path: input.conversionTouch.landingPath,
      dedupe_hash: dedupe
    },
    p_consent: {
      privacy_accepted: input.consent.privacyAccepted,
      contact_requested: input.consent.contactRequested,
      sms_marketing: input.consent.smsMarketing,
      email_marketing: input.consent.emailMarketing,
      disclosure_version: VISION_REPORT_DISCLOSURE_VERSION,
      disclosure_text_sha256: sha256Hex(VISION_REPORT_DISCLOSURE_TEXT),
      source_path: input.conversionTouch.landingPath,
      form_version: FORM_VERSION,
      ip_prefix_hash: context.ipPrefixHash,
      user_agent_family: context.userAgentFamily
    },
    p_attribution: [
      databaseTouch(input.firstTouch, "first"),
      databaseTouch(input.lastTouch, "last"),
      databaseTouch(input.conversionTouch, "conversion")
    ],
    p_project: {
      title: propertyTitle,
      goal: GOAL_BY_ANALYSIS[scenarioInput.analysisType],
      data_as_of: receivedAt,
      assumptions
    },
    p_scenario: {
      scenario_name: propertyTitle,
      scenario_type: scenarioInput.analysisType,
      input_snapshot: scenarioInput,
      result_snapshot: calculations,
      calculation_version: calculations.calculationVersion
    },
    p_report: {
      facts_snapshot: {
        sourceKind: "visitor_input",
        propertyLabel: scenarioInput.propertyLabel ?? null,
        ownership: scenarioInput.ownership,
        externalPropertyFactsLoaded: false,
        dataAsOf: receivedAt
      },
      assumptions_snapshot: calculations.assumptions,
      calculations_snapshot: calculations,
      narrative_snapshot: {
        kind: "deterministic_summary",
        generatedByAi: false,
        summary
      },
      limitations: calculations.disclaimers,
      citation_manifest: [
        { kind: "visitor_input", label: "Scenario inputs supplied by the visitor." },
        {
          kind: "company_default",
          label: "Model placeholders are identified in the assumptions snapshot."
        },
        { kind: "calculation", version: calculations.calculationVersion }
      ]
    },
    p_outbox: {
      payload: {
        externalId: input.submissionId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: normalized.emailNormalized,
        phoneE164: normalized.phoneE164,
        intent: "vision_report",
        timeline: input.timeline ?? null,
        sourcePath: input.conversionTouch.landingPath,
        tags: ["web-lead", "intent:vision_report", `vision-analysis:${scenarioInput.analysisType}`],
        planningSummary: `Vision ${scenarioInput.analysisType.replaceAll("_", " ")} scenario`,
        consent: {
          smsMarketing: input.consent.smsMarketing,
          emailMarketing: input.consent.emailMarketing,
          disclosureVersion: VISION_REPORT_DISCLOSURE_VERSION,
          receivedAtIso: receivedAt
        },
        attribution: {
          utmSource: input.lastTouch.utmSource ?? null,
          utmMedium: input.lastTouch.utmMedium ?? null,
          utmCampaign: input.lastTouch.utmCampaign ?? null,
          gclid: input.lastTouch.gclid ?? null,
          gbraid: input.lastTouch.gbraid ?? null,
          wbraid: input.lastTouch.wbraid ?? null
        }
      }
    }
  });

  if (error !== null || data === null) {
    log.error("Vision report request persistence failed", {
      requestId: context.requestId,
      route: ROUTE,
      errorCode: error?.code ?? "empty_result"
    });
    return finish(
      "failed_persistence",
      fail("INTERNAL_ERROR", context.requestId),
      error?.code ?? "empty_result"
    );
  }

  const receipt = data as {
    receipt_id: string;
    report_id: string;
    replayed: boolean;
  };
  return finish(
    receipt.replayed ? "replayed" : "received",
    NextResponse.json(
      apiSuccess(
        {
          receiptId: receipt.receipt_id,
          reportId: receipt.report_id,
          receivedAt,
          status: "draft" as const
        },
        context.requestId
      ),
      { status: receipt.replayed ? 200 : 201, headers: { "Cache-Control": "no-store" } }
    )
  );
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    apiFailure("BAD_REQUEST", "n/a", { message: "This endpoint accepts POST only." }),
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } }
  );
}
