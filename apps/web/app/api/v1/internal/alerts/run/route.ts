import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { runEmailAlertsFromEnv } from "@/lib/email-alerts";
import { createServiceClient } from "@/lib/supabase";

/**
 * Engagement email alert run.
 *
 * The cron entrypoint for both alert loops. Token-guarded exactly like the outbox
 * drain: a constant-time bearer comparison against ALERTS_RUN_TOKEN, POST-only,
 * and no-store. The Worker's own `scheduled` handler runs the same integrations
 * core directly (a Worker cannot call its own route); this route is the
 * Next-runtime path — used in development and as a manual trigger — so the two
 * stay behavior-identical.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/v1/internal/alerts/run";

function authorized(header: string | null, expected: string | undefined): boolean {
  if (header === null || expected === undefined || !header.startsWith("Bearer ")) return false;
  const provided = header.slice("Bearer ".length);
  const expectedHash = createHash("sha256").update(expected).digest();
  const providedHash = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expectedHash, providedHash);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const runId = randomUUID();
  const configuration = env();
  if (!authorized(request.headers.get("authorization"), configuration.ALERTS_RUN_TOKEN)) {
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createServiceClient();
  if (supabase === null) {
    log.error("email alerts run has no database configured", {
      runId,
      route: ROUTE,
      errorCode: "database_unconfigured"
    });
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const summary = await runEmailAlertsFromEnv(runId);
    if (summary === null) {
      return NextResponse.json(
        { ok: false },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
    log.info("email alerts run completed", {
      runId,
      route: ROUTE,
      outcome: "completed",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json(
      { ok: true, data: summary },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    log.error("email alerts run threw", {
      runId,
      route: ROUTE,
      errorCode: error instanceof Error ? error.name : "unknown"
    });
    return NextResponse.json(
      { ok: false },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } }
  );
}
