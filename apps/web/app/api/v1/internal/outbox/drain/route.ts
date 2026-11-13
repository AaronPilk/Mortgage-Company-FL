import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import {
  processOutboxRow,
  dispatchLeadConversion,
  leadAdSuppressed,
  parseMetaLeadSource,
  type OutboxRow,
  type SuppressionDb
} from "@tract/integrations";
import { crm } from "@/lib/crm";
import { metaCapi } from "@/lib/meta-capi";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/v1/internal/outbox/drain";
const BATCH_SIZE = 10;

type ClaimedRow = {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  idempotency_key: string;
  payload: Record<string, unknown>;
  attempt_count: number;
};

function authorized(header: string | null, expected: string | undefined): boolean {
  if (header === null || expected === undefined || !header.startsWith("Bearer ")) return false;
  const provided = header.slice("Bearer ".length);
  const expectedHash = createHash("sha256").update(expected).digest();
  const providedHash = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expectedHash, providedHash);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const requestId = randomUUID();
  const configuration = env();
  if (!authorized(request.headers.get("authorization"), configuration.OUTBOX_DRAIN_TOKEN)) {
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createServiceClient();
  if (supabase === null) {
    log.error("outbox drain has no database configured", {
      requestId,
      route: ROUTE,
      errorCode: "database_unconfigured"
    });
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const workerId = `worker:${requestId}`;
  const { data, error } = await supabase.rpc("claim_integration_outbox", {
    p_worker_id: workerId,
    p_limit: BATCH_SIZE
  });
  if (error !== null) {
    log.error("outbox claim failed", {
      requestId,
      route: ROUTE,
      errorCode: error.code ?? "unknown"
    });
    return NextResponse.json(
      { ok: false },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const claimed = (data ?? []) as ClaimedRow[];
  let succeeded = 0;
  let retried = 0;
  let dead = 0;
  let completionFailures = 0;

  // Memoized; one instance per drain. Disabled unless META_CAPI_MODE is live.
  const capi = metaCapi();

  for (const row of claimed) {
    const outboxRow: OutboxRow = {
      id: row.id,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      idempotencyKey: row.idempotency_key,
      payload: row.payload,
      attemptCount: row.attempt_count
    };
    const outcome = await processOutboxRow(outboxRow, { crm: crm() });
    const { data: completed, error: completionError } = await supabase.rpc(
      "complete_integration_outbox",
      {
        p_id: row.id,
        p_worker_id: workerId,
        p_outcome: outcome.status,
        p_error_code: outcome.status === "succeeded" ? null : outcome.errorCode,
        p_available_in_ms: outcome.status === "retry" ? outcome.availableInMs : 0,
        p_crm_contact_id: outcome.status === "succeeded" ? outcome.contactId : null
      }
    );

    if (completionError !== null || completed !== true) {
      completionFailures += 1;
      log.error("outbox completion failed", {
        requestId,
        route: ROUTE,
        errorCode: completionError?.code ?? "claim_lost"
      });
      continue;
    }
    if (outcome.status === "succeeded") succeeded += 1;
    if (outcome.status === "retry") retried += 1;
    if (outcome.status === "dead") dead += 1;

    // Meta conversion signal — a best-effort paid-social side-channel, dispatched
    // only AFTER the row is settled so a slow Meta call can never strand a row in
    // 'processing'. It is fully isolated from the GHL lifecycle: consent- and
    // config-gated inside the helper, one attempt (no in-drain backoff — a Meta
    // event dedups on event_id, and re-drains give natural retries), never throws,
    // and its result is never consulted, so it cannot re-drive or duplicate a
    // CRM sync. The `capi.key` guard means a dark Meta config does zero work
    // (no suppression query either); when live, a do-not-sell/share or global
    // opt-out blocks the send before any identifier leaves.
    if (outboxRow.eventType === "lead.received" && capi.key !== "disabled") {
      try {
        const source = parseMetaLeadSource(outboxRow.payload);
        // The concrete client's builder type is too deep to match structurally
        // (TS2589), so narrow it to the small slice the check uses — the same
        // `as unknown as` the email core uses for its DB port.
        const suppressed = await leadAdSuppressed(
          supabase as unknown as SuppressionDb,
          source.email,
          source.phoneE164
        );
        if (!suppressed) {
          const conversion = await dispatchLeadConversion(capi, outboxRow.payload, {
            maxAttempts: 1
          });
          if (conversion.status === "failed") {
            log.warn("meta capi dispatch failed", {
              requestId,
              route: ROUTE,
              errorCode: conversion.code
            });
          }
        }
      } catch {
        // Contract says unreachable; kept so a future change cannot break the drain.
      }
    }
  }

  log.info("outbox drain completed", {
    requestId,
    route: ROUTE,
    outcome: completionFailures === 0 ? "completed" : "partial",
    durationMs: Date.now() - startedAt
  });
  return NextResponse.json(
    {
      ok: completionFailures === 0,
      data: { claimed: claimed.length, succeeded, retried, dead, completionFailures }
    },
    {
      status: completionFailures === 0 ? 200 : 500,
      headers: { "Cache-Control": "no-store" }
    }
  );
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } }
  );
}
