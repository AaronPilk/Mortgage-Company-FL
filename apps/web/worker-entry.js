// @ts-check
import { createClient } from "@supabase/supabase-js";
import { GhlCrmAdapter, processOutboxRow } from "@tract/integrations";
import openNextHandler, {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge
} from "./.open-next/worker.js";

/**
 * Worker entry.
 *
 * Wraps the generated OpenNext worker to add a `scheduled` handler, because a
 * transactional outbox without something that drains it is a queue that only
 * fills.
 */

function parseJsonMap(raw) {
  if (raw === undefined || raw === "") return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Drain the transactional outbox directly against Supabase and the CRM.
 *
 * The cron cannot call the site's own drain route — a Worker invoking itself is
 * blocked by Cloudflare (error 1042 / redirect loop). So this does the same
 * claim -> deliver -> settle the route does, as ordinary outbound calls to
 * Supabase and GoHighLevel. Mirrors app/api/v1/internal/outbox/drain.
 */
async function drainOutbox(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof url !== "string" || typeof serviceKey !== "string") {
    console.error("outbox cron: Supabase is not configured; skipping drain");
    return;
  }

  const token = env.GHL_PRIVATE_INTEGRATION_TOKEN;
  const locationId = env.GHL_LOCATION_ID;
  const ghlLive = env.GHL_MODE === "production" || env.GHL_MODE === "sandbox";
  if (!ghlLive || typeof token !== "string" || typeof locationId !== "string") {
    console.error("outbox cron: GoHighLevel is not configured; skipping drain");
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const crm = new GhlCrmAdapter({
    baseUrl: env.GHL_API_BASE_URL || "https://services.leadconnectorhq.com",
    apiVersion: env.GHL_API_VERSION || "2021-07-28",
    token,
    locationId,
    customFieldMap: parseJsonMap(env.GHL_CUSTOM_FIELD_MAP),
    pipelineMap: parseJsonMap(env.GHL_PIPELINE_MAP),
    // The default 10s abort was firing as retryable:0. Give the CRM real room.
    timeoutMs: 25000
  });

  // processOutboxRow collapses a thrown delivery error to a coarse code
  // (retryable:0) that hides the cause. Capture the underlying error so its
  // real name and message land both in the tail and in the settled outbox row.
  let lastError = null;
  const rawUpsertLead = crm.upsertLead.bind(crm);
  crm.upsertLead = async (payload, key) => {
    try {
      return await rawUpsertLead(payload, key);
    } catch (error) {
      lastError = error;
      console.error("outbox cron: GHL upsert threw", error && error.name, error && error.message);
      throw error;
    }
  };

  const workerId = `cron:${crypto.randomUUID()}`;
  const { data: rows, error: claimError } = await supabase.rpc("claim_integration_outbox", {
    p_worker_id: workerId,
    p_limit: 10
  });
  if (claimError) {
    console.error("outbox cron: claim failed", claimError.message ?? claimError.code);
    return;
  }

  const claimed = rows ?? [];
  let succeeded = 0;
  let retried = 0;
  let dead = 0;
  let completionFailures = 0;

  for (const row of claimed) {
    lastError = null;
    const outcome = await processOutboxRow(
      {
        id: row.id,
        aggregateType: row.aggregate_type,
        aggregateId: row.aggregate_id,
        eventType: row.event_type,
        idempotencyKey: row.idempotency_key,
        payload: row.payload,
        attemptCount: row.attempt_count
      },
      { crm }
    );

    let errorCode = outcome.status === "succeeded" ? null : outcome.errorCode;
    if (errorCode !== null && lastError !== null) {
      const name = lastError.name || "Error";
      const message = String(lastError.message || "").slice(0, 200);
      errorCode = `${errorCode}|${name}:${message}`;
    }

    const { data: completed, error: completionError } = await supabase.rpc(
      "complete_integration_outbox",
      {
        p_id: row.id,
        p_worker_id: workerId,
        p_outcome: outcome.status,
        p_error_code: errorCode,
        p_available_in_ms: outcome.status === "retry" ? outcome.availableInMs : 0,
        p_crm_contact_id: outcome.status === "succeeded" ? outcome.contactId : null
      }
    );

    if (completionError || completed !== true) {
      completionFailures += 1;
      continue;
    }
    if (outcome.status === "succeeded") succeeded += 1;
    else if (outcome.status === "retry") retried += 1;
    else if (outcome.status === "dead") dead += 1;
  }

  if (claimed.length > 0 || completionFailures > 0) {
    console.log(
      "outbox cron: drained",
      JSON.stringify({ claimed: claimed.length, succeeded, retried, dead, completionFailures })
    );
  }
}

export default {
  fetch: (request, env, ctx) => openNextHandler.fetch(request, env, ctx),

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      drainOutbox(env).catch((error) => console.error("outbox cron: drain threw", error))
    );
  }
};

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };
