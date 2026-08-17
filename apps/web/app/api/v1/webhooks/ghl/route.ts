import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@tract/integrations";
import { redact } from "@tract/domain";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;

/**
 * Inbound CRM webhook.
 *
 * An unverified webhook is an unauthenticated write path into the CRM
 * projection, so this route verifies the Ed25519 signature, enforces a replay
 * window, deduplicates by event id, and stores only a redacted receipt.
 *
 * It responds 202 for anything it accepts and a bare 400 for anything it does
 * not, without explaining which check failed.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = randomUUID();
  const configuration = env();

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  const timestampHeader = request.headers.get("x-wh-timestamp");
  const timestampMs = timestampHeader === null ? undefined : Number(timestampHeader);

  const verification = verifyWebhook({
    rawBody,
    signature: request.headers.get("x-wh-signature"),
    publicKeyPem: configuration.GHL_WEBHOOK_PUBLIC_KEY,
    ...(timestampMs !== undefined && Number.isFinite(timestampMs) ? { timestampMs } : {})
  });

  if (!verification.ok) {
    log.warn("webhook rejected", {
      requestId,
      route: "/api/v1/webhooks/ghl",
      outcome: "rejected",
      errorCode: verification.reason
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (supabase === null) {
    log.error("webhook received with no database configured", { requestId });
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  // The unique (provider, event_id) index is what makes deduplication real: a
  // replayed delivery collides here rather than being processed twice.
  const { error } = await supabase.from("webhook_receipts").insert({
    provider: "ghl",
    event_id: verification.eventId,
    body_sha256: verification.bodyHash,
    signature_verified: true,
    payload_redacted: redact(JSON.parse(rawBody)) as Record<string, unknown>
  });

  if (error !== null && error.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  }
  if (error !== null) {
    log.error("webhook receipt failed", { requestId, errorCode: error.code ?? "unknown" });
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  log.info("webhook accepted", {
    requestId,
    route: "/api/v1/webhooks/ghl",
    outcome: "accepted"
  });
  return NextResponse.json({ ok: true }, { status: 202 });
}
