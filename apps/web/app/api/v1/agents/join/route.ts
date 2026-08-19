import { type NextRequest, NextResponse } from "next/server";
import {
  AgentJoinRequestSchema,
  ContactNormalizationError,
  HTTP_STATUS_BY_CODE,
  type ApiErrorCode,
  apiFailure,
  apiSuccess,
  fieldErrors,
  normalizeContact
} from "@tract/schemas";
import { verifyTurnstile } from "@tract/integrations";
import {
  agentSlugBase,
  claimStatusUpdate,
  decideAgentUpsert,
  resolveAgentSlug
} from "@/lib/agent-dedup";
import { resolveAuthenticatedUserId } from "@/lib/account-auth";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { AGENT_JOIN_RATE_LIMITS, rateLimitStore } from "@/lib/rate-limit";
import { buildRequestContext, clientIp, isSameOrigin } from "@/lib/request-context";
import { createRequestClient, createServiceClient } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";

/**
 * Agent directory join.
 *
 * Same defensive order as the lead route — cheap rejections first, the network
 * call (Turnstile) after the free checks, the durable write last. What differs
 * is the write itself: this endpoint is an UPSERT keyed on normalized email and
 * license number, because the owner's requirement is that an agent who comes
 * back — through this form again, or later with an account — never becomes a
 * second row.
 *
 * The response is deliberately identical for insert and update. Revealing
 * "this email/license is already in our directory" to an unauthenticated
 * caller would turn the form into an existence oracle.
 *
 * Every row this route writes is status 'pending' with license_verified false.
 * Approval and verification are human steps that happen elsewhere; nothing
 * here claims them.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;

/** Columns the join form is allowed to refresh on an existing row. */
type AgentProfileWrite = {
  first_name: string;
  last_name: string;
  brokerage: string | null;
  email_normalized: string;
  license_number: string;
  phone_e164: string;
  cities: string;
  bio: string | null;
  display_consent: boolean;
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const configuration = env();
  const context = buildRequestContext(request.headers, configuration.HASH_PEPPER);
  const route = "/api/v1/agents/join";

  const finish = (outcome: string, response: NextResponse, errorCode?: string): NextResponse => {
    log.info("agent join endpoint", {
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

  // 3. Same-origin. This endpoint has no legitimate cross-site caller.
  if (!isSameOrigin(context.origin, SITE_URL)) {
    return finish("rejected_origin", fail("FORBIDDEN", context.requestId));
  }

  // 4. Network rate limit, before any expensive work.
  const networkKey = `agent-join:net:${context.ipPrefixHash ?? "unknown"}`;
  const networkLimit = await rateLimitStore.hit(
    networkKey,
    AGENT_JOIN_RATE_LIMITS.perNetwork.windowMs,
    AGENT_JOIN_RATE_LIMITS.perNetwork.limit
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

  const parsed = AgentJoinRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return finish(
      "rejected_validation",
      fail("BAD_REQUEST", context.requestId, { fields: fieldErrors(parsed.error) })
    );
  }
  const input = parsed.data;

  // 6. Honeypot — same generic error as any other rejection.
  if (input.honeypot !== undefined && input.honeypot !== "") {
    return finish("rejected_honeypot", fail("BAD_REQUEST", context.requestId));
  }

  // 7. Bot challenge. Same widget and action as the lead form, so one Turnstile
  // configuration protects every conversion surface.
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
    // An unavailable challenge service fails closed, exactly as on the lead form.
    return finish(
      `rejected_turnstile_${turnstile.reason}`,
      fail("BAD_REQUEST", context.requestId, {
        fields: { turnstileToken: ["We could not verify that request. Please try again."] }
      })
    );
  }

  // 8. Normalize contact details with the same functions the lead pipeline
  // uses, so "the same agent" means the same thing everywhere.
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

  const supabase = createServiceClient();
  if (supabase === null) {
    log.error("agent join endpoint has no database configured", {
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

  // A signed-in agent claims the row they touch. Anonymous is fine too — the
  // account link can happen later, from the account page, without a duplicate.
  const userId = await resolveAuthenticatedUserId(await createRequestClient());

  // 9. THE DEDUP CORE. Two lookups, one pure decision, one write.
  const [emailLookup, licenseLookup] = await Promise.all([
    supabase
      .from("agents")
      .select("id,owner_user_id,status")
      .eq("email_normalized", normalized.emailNormalized)
      .maybeSingle(),
    supabase
      .from("agents")
      .select("id,owner_user_id,status")
      .eq("license_number", input.licenseNumber)
      .maybeSingle()
  ]);
  if (emailLookup.error !== null || licenseLookup.error !== null) {
    return finish(
      "failed_lookup",
      fail("INTERNAL_ERROR", context.requestId),
      emailLookup.error?.code ?? licenseLookup.error?.code
    );
  }

  const emailMatch = emailLookup.data ?? null;
  const licenseMatch = licenseLookup.data ?? null;
  const decision = decideAgentUpsert(emailMatch, licenseMatch);

  const profile: AgentProfileWrite = {
    first_name: input.firstName,
    last_name: input.lastName,
    brokerage: input.brokerage ?? null,
    email_normalized: normalized.emailNormalized,
    license_number: input.licenseNumber,
    phone_e164: normalized.phoneE164,
    cities: input.cities,
    bio: input.bio ?? null,
    display_consent: input.displayConsent
  };

  let agentId: string;
  let slug: string;
  let status: string;

  if (decision.action === "insert") {
    const base = agentSlugBase(input.firstName, input.lastName);
    // One query for every slug sharing the base is enough to resolve a suffix;
    // the unique index remains the hard guarantee underneath.
    const { data: slugRows, error: slugError } = await supabase
      .from("agents")
      .select("slug")
      .like("slug", `${base}%`);
    if (slugError !== null) {
      return finish(
        "failed_slug_lookup",
        fail("INTERNAL_ERROR", context.requestId),
        slugError.code
      );
    }
    slug = resolveAgentSlug(base, new Set((slugRows ?? []).map((row) => String(row.slug))));

    const { data: inserted, error: insertError } = await supabase
      .from("agents")
      .insert({
        ...profile,
        slug,
        status: "pending",
        // Never asserted at submit time. A human verifies, then flips it.
        license_verified: false,
        ...(userId === null ? {} : { owner_user_id: userId })
      })
      .select("id,slug,status")
      .single();
    if (insertError !== null || inserted === null) {
      return finish(
        "failed_insert",
        fail("INTERNAL_ERROR", context.requestId),
        insertError?.code ?? "insert_returned_nothing"
      );
    }
    agentId = String(inserted.id);
    status = String(inserted.status);
  } else if (decision.action === "update") {
    const target = licenseMatch?.id === decision.targetId ? licenseMatch : emailMatch;
    const canClaim =
      userId !== null && (target?.owner_user_id === null || target?.owner_user_id === userId);
    // Matching an unclaimed public-record row is the claim path: the same
    // update fills the profile, and claimStatusUpdate moves the row to
    // 'pending' for staff review — a license number is public, so a claim is
    // never self-approving. Any other status is left untouched, so an approved
    // agent resubmitting the form is never downgraded.
    const { data: updated, error: updateError } = await supabase
      .from("agents")
      .update({
        ...profile,
        ...claimStatusUpdate(target?.status ?? null),
        ...(canClaim ? { owner_user_id: userId } : {})
      })
      .eq("id", decision.targetId)
      .select("id,slug,status")
      .single();
    if (updateError !== null || updated === null) {
      return finish(
        "failed_update",
        fail("INTERNAL_ERROR", context.requestId),
        updateError?.code ?? "update_returned_nothing"
      );
    }
    agentId = String(updated.id);
    slug = String(updated.slug);
    status = String(updated.status);
  } else {
    // Email and license point at two different rows. Merging identities is a
    // human decision, so nothing is written; the license row answers, and the
    // caller cannot tell this apart from any other success.
    log.warn("agent join matched two distinct rows", {
      requestId: context.requestId,
      route,
      emailRowId: decision.emailRowId,
      licenseRowId: decision.licenseRowId
    });
    const { data: existing, error: existingError } = await supabase
      .from("agents")
      .select("id,slug,status")
      .eq("id", decision.targetId)
      .single();
    if (existingError !== null || existing === null) {
      return finish(
        "failed_conflict_read",
        fail("INTERNAL_ERROR", context.requestId),
        existingError?.code ?? "conflict_row_missing"
      );
    }
    agentId = String(existing.id);
    slug = String(existing.slug);
    status = String(existing.status);
  }

  // 10. Identical success shape for insert, update, and conflict: nothing in
  // the response reveals whether this agent already existed.
  const response = NextResponse.json(apiSuccess({ agentId, slug, status }, context.requestId), {
    status: 200,
    headers: { "Cache-Control": "no-store" }
  });
  return finish(`received_${decision.action}`, response);
}

/** Any other method is not merely unsupported; it is a signal worth rejecting cleanly. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    apiFailure("BAD_REQUEST", "n/a", { message: "This endpoint accepts POST only." }),
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } }
  );
}
