import { type NextRequest, NextResponse } from "next/server";
import {
  CreateLeadSchema,
  ContactNormalizationError,
  HTTP_STATUS_BY_CODE,
  PLANNER_VERSION,
  type ApiErrorCode,
  type CreateLeadParsed,
  type LeadAttributionTouch,
  type PlannerTiming,
  type PlanningSnapshot,
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
import { resolveReferralAgent } from "@/lib/referral";
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
 *
 * The progressive planner at /plan posts here too, with an optional `planner`
 * object. It is the same endpoint on purpose: a second lead route would mean a
 * second copy of the consent, dedupe, rate-limit, bot-challenge, and outbox
 * guarantees, and two copies of a guarantee is one guarantee. The planner only
 * widens what step 10 writes; it moves nothing in the order above.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const FORM_VERSION = "lead-form@1.0.0";
/** Recorded on the consent receipt so the ledger says which form was shown. */
const PLANNER_FORM_VERSION = "lead-planner-form@1.0.0";

/**
 * The planner asks about timing in its own words. The lead table's timeline
 * column predates it and drives existing routing, so the planner answer is
 * translated into that vocabulary rather than the column being widened. The
 * precise answer is not lost: it is stored verbatim in the planner row.
 */
const LEAD_TIMELINE_BY_PLANNER_TIMING: Record<PlannerTiming, string> = {
  immediately: "now",
  within_30_days: "0_3_months",
  "60_to_90_days": "0_3_months",
  researching: "researching"
};

/**
 * Planner answers as the database column names. Every value is an enumerated
 * band; there is no exact income, no exact debt, and no credit score here, and
 * there must never be.
 */
function plannerRow(planner: NonNullable<CreateLeadParsed["planner"]>): Record<string, unknown> {
  return {
    goal: planner.goal,
    property_state: planner.propertyState,
    property_location: planner.propertyLocation ?? null,
    property_type: planner.propertyType,
    property_stage: planner.propertyStage,
    price_band: planner.priceBand,
    down_payment_band: planner.downPaymentBand,
    current_mortgage_balance_band: planner.currentMortgageBalanceBand ?? null,
    current_mortgage_rate_band: planner.currentMortgageRateBand ?? null,
    credit_band: planner.creditBand,
    employment: planner.employment,
    income_band: planner.incomeBand,
    monthly_debt_band: planner.monthlyDebtBand,
    timing: planner.timing,
    planner_version: PLANNER_VERSION
  };
}

function databaseTouch(touch: LeadAttributionTouch, touchKind: "first" | "last" | "conversion") {
  return {
    touch_kind: touchKind,
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

function approvedPlanningSummary(snapshot: PlanningSnapshot | undefined): string | null {
  if (snapshot === undefined) return null;
  const labels: Record<PlanningSnapshot["source"], string> = {
    mortgage_planner: "Mortgage planner",
    mortgage_payment: "Payment calculator",
    affordability: "Affordability calculator",
    refinance_break_even: "Refinance break-even calculator",
    rent_vs_buy: "Rent-versus-buy calculator",
    closing_cost: "Closing-cost calculator"
  };
  const candidateKeys = [
    "estimatedMonthlyHousingDollars",
    "totalMonthlyDollars",
    "estimatedPurchasePriceDollars",
    "newPaymentDollars",
    "estimatedCashToCloseDollars"
  ];
  const result = snapshot.resultSnapshot;
  const key = candidateKeys.find((candidate) => typeof result[candidate] === "number");
  const value = key === undefined ? null : Number(result[key]);
  const bounded = value !== null && Number.isFinite(value) && value >= 0 && value <= 250_000_000;
  return `${labels[snapshot.source]} submitted for review${bounded ? ` · $${Math.round(value).toLocaleString("en-US")}` : ""}.`;
}

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
        : { secretKey: configuration.TURNSTILE_SECRET_KEY }),
      expectedAction: "lead",
      expectedHostnames: (configuration.TURNSTILE_HOSTNAMES ?? "")
        .split(",")
        .map((hostname) => hostname.trim())
        .filter(Boolean)
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
  const planningSummary = approvedPlanningSummary(input.planningSnapshot);
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

  // The planner is an optional richer front end onto this same pipeline. It
  // supplies the timeline and the self-reported credit band in its own
  // vocabulary, so those columns are filled from it when the caller did not send
  // them directly. Nothing else about the ordering above or below changes.
  const planner = input.planner;
  const timeline =
    input.timeline ??
    (planner === undefined ? null : LEAD_TIMELINE_BY_PLANNER_TIMING[planner.timing]);
  const creditBand = input.estimatedCreditBand ?? planner?.creditBand ?? null;

  // A referral is re-checked against the public directory (a consenting partner,
  // never an imported record); a bogus or unresolvable code yields no referral
  // and never blocks the lead. It rides to the CRM as a tag/custom field and is
  // also persisted as a queryable referring_agent_id on the lead (in the same
  // transaction, NULL-safe) so a consenting partner can see the leads their link
  // drove — the marketing status, never any borrower detail.
  const referralAgent = await resolveReferralAgent(input.referringAgentSlug);
  const referralSlug = referralAgent?.slug ?? null;
  const referralAgentId = referralAgent?.id ?? null;

  // FUTURE (Wave 4 agent marketplace — deferred): when there is no explicit
  // referral and the lead carries a property ZIP, `coveringAgentForZip(zip)`
  // (lib/lead-routing.ts) would supply `referring_agent_id`, routing the lead to
  // an approved agent who covers that area. The lookup and its tests ship now;
  // the wiring does NOT, on purpose — auto-assignment waits on real coverage
  // data, a tie-break policy for overlapping coverage, and a structured property
  // ZIP on the seller lead. This is the one call site; nothing here changes yet.

  // 10. One transaction: lead, consent receipt, attribution, outbox row, and —
  // when the planner supplied them — the qualifying answers. A partial write is
  // not a possible outcome: either the consumer has a receipt and a queued sync,
  // or nothing happened.
  const rpcArguments = {
    p_lead: {
      intent: input.intent,
      first_name: input.firstName,
      last_name: input.lastName,
      email_normalized: normalized.emailNormalized,
      phone_e164: normalized.phoneE164,
      preferred_contact: input.preferredContact ?? null,
      state_code: input.stateCode,
      timeline,
      estimated_credit_band: creditBand,
      message: input.message ?? null,
      source_path: input.conversionTouch.landingPath,
      dedupe_hash: dedupe,
      referring_agent_id: referralAgentId
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
      source_path: input.conversionTouch.landingPath,
      form_version: planner === undefined ? FORM_VERSION : PLANNER_FORM_VERSION,
      ip_prefix_hash: context.ipPrefixHash,
      user_agent_family: context.userAgentFamily
    },
    p_attribution: [
      databaseTouch(input.firstTouch, "first"),
      databaseTouch(input.lastTouch, "last"),
      databaseTouch(input.conversionTouch, "conversion")
    ],
    p_outbox: {
      event_type: "lead.received",
      idempotency_key: leadSyncIdempotencyKey(input.submissionId, "lead.received"),
      // Only marketing-safe fields cross into the CRM projection. The screening
      // in the CRM adapter is a second barrier over this one.
      payload: {
        externalId: input.submissionId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: normalized.emailNormalized,
        phoneE164: normalized.phoneE164,
        intent: input.intent,
        timeline,
        sourcePath: input.conversionTouch.landingPath,
        tags: [
          "web-lead",
          `intent:${input.intent}`,
          ...(planner === undefined ? [] : ["planner", `goal:${planner.goal}`]),
          ...(referralSlug === null ? [] : [`agent:${referralSlug}`])
        ],
        // Planner context travels to the CRM as bands only, so a loan officer
        // opens the record already knowing the shape of the conversation. No
        // exact income, no exact debt, and no credit score crosses this line —
        // the adapter's own screening is the second barrier over this one.
        ...(planner === undefined
          ? {}
          : {
              planner: {
                goal: planner.goal,
                propertyState: planner.propertyState,
                propertyLocation: planner.propertyLocation ?? null,
                propertyType: planner.propertyType,
                propertyStage: planner.propertyStage,
                priceBand: planner.priceBand,
                downPaymentBand: planner.downPaymentBand,
                currentMortgageBalanceBand: planner.currentMortgageBalanceBand ?? null,
                currentMortgageRateBand: planner.currentMortgageRateBand ?? null,
                creditBand: planner.creditBand,
                employment: planner.employment,
                incomeBand: planner.incomeBand,
                monthlyDebtBand: planner.monthlyDebtBand,
                timing: planner.timing,
                plannerVersion: PLANNER_VERSION
              }
            }),
        consent: {
          smsMarketing: input.consent.smsMarketing,
          emailMarketing: input.consent.emailMarketing,
          disclosureVersion: LEAD_DISCLOSURE_VERSION,
          receivedAtIso: receivedAt
        },
        attribution: {
          utmSource: input.lastTouch.utmSource ?? null,
          utmMedium: input.lastTouch.utmMedium ?? null,
          utmCampaign: input.lastTouch.utmCampaign ?? null,
          gclid: input.lastTouch.gclid ?? null,
          // Carried so the outbox drain can reconstruct Meta's `fbc` for the
          // server-side conversion; GHL ignores it (no tract_ mapping).
          fbclid: input.lastTouch.fbclid ?? null
        },
        planningSummary,
        ...(referralSlug === null ? {} : { referringAgentSlug: referralSlug })
      }
    },
    p_request_id: input.submissionId
  };

  // One statement either way, so the planner answers cannot land without the
  // lead and the lead cannot land without them. The sibling function delegates
  // the receipt to create_lead_with_receipt rather than duplicating it.
  const { data: leadId, error } =
    planner === undefined
      ? await supabase.rpc("create_lead_with_receipt", {
          ...rpcArguments,
          p_plan:
            input.planningSnapshot === undefined
              ? null
              : {
                  source: input.planningSnapshot.source,
                  version: input.planningSnapshot.version,
                  calculation_version: input.planningSnapshot.calculationVersion,
                  input_snapshot: input.planningSnapshot.inputSnapshot,
                  result_snapshot: input.planningSnapshot.resultSnapshot,
                  summary: planningSummary
                }
        })
      : await supabase.rpc("create_lead_with_planner_response", {
          ...rpcArguments,
          p_planner: plannerRow(planner)
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
