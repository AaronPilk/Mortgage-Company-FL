import { type NextRequest, NextResponse } from "next/server";
import {
  CreateLeadSchema,
  ContactNormalizationError,
  HTTP_STATUS_BY_CODE,
  type ApiErrorCode,
  apiFailure,
  apiSuccess,
  fieldErrors,
  normalizeContact
} from "@tract/schemas";
import { leadSyncIdempotencyKey } from "@tract/integrations";
import { verifyTurnstile } from "@tract/integrations";
import { env, features } from "@/lib/env";
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
import { LEAD_DISCLOSURE_TEXT, LEAD_DISCLOSURE_VERSION, SITE_URL } from "@/lib/site";

/**
 * Marketing lead receipt.
 *
 * Order of operations, and why each step is where it is:
 *
 *   1. method and content type      — reject obviously wrong shapes cheaply
 *   2. body size                    — before parsing, so a large body costs nothing
 *   3. origin                       — a cross-site POST is never legitimate here
 *   4. anonymous rate limit         — before any expensive work
 *   5. schema validation            — unknown keys are stripped, not stored
 *   6. honeypot                     — cheap bot signal, checked before Turnstile
 *   7. Turnstile                    — a network call, so it comes after the free checks
 *   8. contact normalization        — deterministic dedupe and suppression keys
 *   9. per-contact rate limit       — needs the normalized contact to be meaningful
 *  10. single transaction           — lead + consent + attribution + outbox
 *  11. fast response                — the consumer never waits on the CRM
 *  12. asynchronous CRM sync        — drained from the outbox by a worker
 *
 * The first-party write is authoritative. If the CRM is down, the lead is still
 * received and the consumer still gets a receipt.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const FORM_VERSION = "lead-form@1.0.0";

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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const configuration = env();
  const context = buildRequestContext(request.headers, configuration.HASH_PEPPER);
  const route = "/api/v1/leads";

  const finish = (outcome: string, response: NextResponse, errorCode?: string): NextResponse => {
    log.info("lead endpoint", {
      requestId: context.requestId,
      route,
      outcome,
      durationMs: Date.now() - startedAt,
      userAgentFamily: context.userAgentFamily,
      ...(errorCode === undefined ? {} : { errorCode })
    });
    return response;
  };

  // 1. Content type.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return finish("rejected_content_type", fail("BAD_REQUEST", context.requestId));
  }

  // 2. Declared size, before reading the body.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return finish("rejected_body_size", fail("BAD_REQUEST", context.requestId));
  }

  // 3. Same-origin. A browser always sends Origin on a cross-origin POST, and
  // this endpoint has no legitimate cross-site caller.
  if (!isSameOrigin(context.origin, SITE_URL)) {
    return finish("rejected_origin", fail("FORBIDDEN", context.requestId));
  }

  // 4. Coarse network rate limit.
  const networkKey = `lead:net:${context.ipPrefixHash ?? "unknown"}`;
  const networkLimit = await rateLimitStore.hit(
    networkKey,
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

  // 5. Parse and validate. Unknown keys are dropped by the schema.
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

  const parsed = CreateLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return finish(
      "rejected_validation",
      fail("BAD_REQUEST", context.requestId, { fields: fieldErrors(parsed.error) })
    );
  }
  const input = parsed.data;

  // 6. Honeypot. Answered with the same generic error as any other rejection so
  // a scripted client learns nothing about why it failed.
  if (input.honeypot !== undefined && input.honeypot !== "") {
    return finish("rejected_honeypot", fail("BAD_REQUEST", context.requestId));
  }

  // 7. Bot challenge.
  const turnstile = await verifyTurnstile(
    input.turnstileToken,
    clientIp(request.headers) ?? undefined,
    {
      mode: configuration.TURNSTILE_MODE,
      ...(configuration.TURNSTILE_SECRET_KEY === undefined
        ? {}
        : { secretKey: configuration.TURNSTILE_SECRET_KEY })
    }
  );
  if (!turnstile.ok) {
    // An unavailable challenge service fails closed. Letting traffic through
    // during an outage is how a form gets flooded.
    return finish(
      `rejected_turnstile_${turnstile.reason}`,
      fail("BAD_REQUEST", context.requestId, {
        fields: { turnstileToken: ["We could not verify that request. Please try again."] }
      })
    );
  }

  // 8. Normalize contact details.
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

  // 9. Per-contact limit. This is what stops a distributed script from
  // resubmitting the same person from many networks.
  const contactKey = `lead:contact:${sha256Hex(
    `${configuration.HASH_PEPPER}|${normalized.emailNormalized}|${normalized.phoneE164}`
  )}`;
  const contactLimit = await rateLimitStore.hit(
    contactKey,
    LEAD_RATE_LIMITS.perContact.windowMs,
    LEAD_RATE_LIMITS.perContact.limit
  );
  if (!contactLimit.allowed) {
    // Deliberately the same generic response as a network limit. Telling the
    // caller that this specific contact has already submitted would confirm
    // whether an address exists in our records.
    return finish(
      "rate_limited_contact",
      fail("RATE_LIMITED", context.requestId, {
        retryAfterSeconds: contactLimit.retryAfterSeconds
      })
    );
  }

  const receivedAt = new Date().toISOString();
  const dedupe = dedupeHash(
    normalized.emailNormalized,
    normalized.phoneE164,
    input.intent,
    configuration.HASH_PEPPER
  );

  const supabase = createServiceClient();
  if (supabase === null) {
    // Without a database there is no durable receipt, and pretending otherwise
    // would be worse than an honest failure the consumer can act on.
    log.error("lead endpoint has no database configured", {
      requestId: context.requestId,
      route,
      errorCode: "database_unconfigured"
    });
    return finish(
      "failed_no_database",
      fail("INTEGRATION_UNAVAILABLE", context.requestId),
      "database_unconfigured"
    );
  }

  // 10. One transaction: lead, consent receipt, attribution, and outbox row.
  const { data: leadId, error } = await supabase.rpc("create_lead_with_receipt", {
    p_lead: {
      intent: input.intent,
      first_name: input.firstName,
      last_name: input.lastName,
      email_normalized: normalized.emailNormalized,
      phone_e164: normalized.phoneE164,
      preferred_contact: input.preferredContact ?? null,
      state_code: input.stateCode,
      timeline: input.timeline ?? null,
      estimated_credit_band: input.estimatedCreditBand ?? null,
      message: input.message ?? null,
      source_path: input.attribution.landingPath,
      dedupe_hash: dedupe
    },
    p_consent: {
      privacy_accepted: input.consent.privacyAccepted,
      contact_requested: input.consent.contactRequested,
      sms_marketing: input.consent.smsMarketing,
      email_marketing: input.consent.emailMarketing,
      disclosure_version: LEAD_DISCLOSURE_VERSION,
      // The hash pins the exact wording shown, so a later copy edit cannot make
      // the stored record ambiguous about what the consumer agreed to.
      disclosure_text_sha256: sha256Hex(LEAD_DISCLOSURE_TEXT),
      source_path: input.attribution.landingPath,
      form_version: FORM_VERSION,
      ip_prefix_hash: context.ipPrefixHash,
      user_agent_family: context.userAgentFamily
    },
    p_attribution: {
      occurred_at: receivedAt,
      landing_path: input.attribution.landingPath,
      referrer_host: input.attribution.referrerHost ?? null,
      utm_source: input.attribution.utmSource ?? null,
      utm_medium: input.attribution.utmMedium ?? null,
      utm_campaign: input.attribution.utmCampaign ?? null,
      utm_content: input.attribution.utmContent ?? null,
      utm_term: input.attribution.utmTerm ?? null,
      gclid: input.attribution.gclid ?? null,
      gbraid: input.attribution.gbraid ?? null,
      wbraid: input.attribution.wbraid ?? null,
      msclkid: input.attribution.msclkid ?? null,
      fbclid: input.attribution.fbclid ?? null
    },
    p_outbox: {
      event_type: "lead.received",
      idempotency_key: leadSyncIdempotencyKey(dedupe, "lead.received"),
      // Only marketing-safe fields cross into the CRM projection. The screening
      // in the CRM adapter is a second barrier over this one.
      payload: {
        externalId: dedupe,
        firstName: input.firstName,
        lastName: input.lastName,
        email: normalized.emailNormalized,
        phoneE164: normalized.phoneE164,
        intent: input.intent,
        timeline: input.timeline ?? null,
        sourcePath: input.attribution.landingPath,
        tags: ["web-lead", `intent:${input.intent}`],
        consent: {
          smsMarketing: input.consent.smsMarketing,
          emailMarketing: input.consent.emailMarketing,
          disclosureVersion: LEAD_DISCLOSURE_VERSION,
          receivedAtIso: receivedAt
        },
        attribution: {
          utmSource: input.attribution.utmSource ?? null,
          utmMedium: input.attribution.utmMedium ?? null,
          utmCampaign: input.attribution.utmCampaign ?? null,
          gclid: input.attribution.gclid ?? null
        }
      }
    },
    p_request_id: context.requestId
  });

  if (error !== null) {
    log.error("lead persistence failed", {
      requestId: context.requestId,
      route,
      errorCode: error.code ?? "unknown"
    });
    return finish("failed_persistence", fail("INTERNAL_ERROR", context.requestId), error.code);
  }

  // 11. Respond immediately. The CRM sync is already queued and is drained by
  // the outbox worker, so a provider outage cannot slow this down or lose data.
  const crmMode = features().ghl;
  const response = NextResponse.json(
    apiSuccess(
      {
        receiptId: String(leadId),
        receivedAt,
        intent: input.intent,
        nextStep: "human_follow_up" as const
      },
      context.requestId
    ),
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );

  return finish(`received_crm_${crmMode}`, response);
}

/** Any other method is not merely unsupported; it is a signal worth rejecting cleanly. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    apiFailure("BAD_REQUEST", "n/a", { message: "This endpoint accepts POST only." }),
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } }
  );
}
