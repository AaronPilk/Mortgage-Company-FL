// @ts-check
import { createClient } from "@supabase/supabase-js";
import {
  GhlCrmAdapter,
  processOutboxRow,
  runEmailAlerts as runEmailAlertsCore,
  ResendEmailPort,
  FredRateFeedPort,
  DisabledRateFeedPort,
  AttomPropertyFactsPort,
  DisabledPropertyFactsPort,
  FixtureListingProvider,
  DisabledListingProvider,
  RealMetaCapiAdapter,
  DisabledMetaCapiAdapter,
  dispatchLeadConversion,
  leadAdSuppressed,
  parseMetaLeadSource
} from "@tract/integrations";
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
 * Build the Meta Conversions port for the cron path.
 *
 * The worker cannot read the app's code-level isPreLaunch() interlock, so its
 * licensing gate is the explicit env clearance META_CAPI_LIVE_CLEARED — the same
 * switch the app factory also requires. Without a live mode, that clearance, and
 * both credentials, this returns the disabled port and no identifier ever leaves.
 */
function buildMetaCapi(env) {
  const live = env.META_CAPI_MODE === "production" || env.META_CAPI_MODE === "sandbox";
  const cleared = env.META_CAPI_LIVE_CLEARED === "true" || env.META_CAPI_LIVE_CLEARED === true;
  const pixelId = env.META_PIXEL_ID;
  const accessToken = env.META_CAPI_ACCESS_TOKEN;
  if (!live || !cleared || typeof pixelId !== "string" || typeof accessToken !== "string") {
    return new DisabledMetaCapiAdapter();
  }
  return new RealMetaCapiAdapter({
    pixelId,
    accessToken,
    siteBaseUrl: env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ...(typeof env.META_CAPI_TEST_EVENT_CODE === "string"
      ? { testEventCode: env.META_CAPI_TEST_EVENT_CODE }
      : {})
  });
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
  // The async closure and the per-row reset below both write lastError; the null
  // initializer is the no-error value read when a row settles (see below). The
  // no-useless-assignment rule can't trace that closure flow, so silence it here.
  // eslint-disable-next-line no-useless-assignment
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

  // One Meta port per drain. Disabled (a no-op) unless the mode is live AND the
  // launch clearance is set AND both credentials are present.
  const capi = buildMetaCapi(env);

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

    // Best-effort Meta conversion, only after the row has settled so a slow Meta
    // call can never strand it. Skipped entirely when Meta is dark; when live, a
    // do-not-sell/share or global opt-out blocks the send before any identifier
    // leaves. Never throws into the drain, one attempt (Meta dedups on event_id).
    if (row.event_type === "lead.received" && capi.key !== "disabled") {
      try {
        const source = parseMetaLeadSource(row.payload);
        const suppressed = await leadAdSuppressed(
          /** @type {any} */ (supabase),
          source.email,
          source.phoneE164
        );
        if (!suppressed) {
          const conversion = await dispatchLeadConversion(capi, row.payload, { maxAttempts: 1 });
          if (conversion.status === "failed") {
            console.warn("meta capi cron: dispatch failed", conversion.code);
          }
        }
      } catch (error) {
        console.error("meta capi cron: dispatch threw", error && error.message);
      }
    }
  }

  if (claimed.length > 0 || completionFailures > 0) {
    console.log(
      "outbox cron: drained",
      JSON.stringify({ claimed: claimed.length, succeeded, retried, dead, completionFailures })
    );
  }
}

/**
 * Listing provider for the cron, mirroring apps/web/lib/listings.ts. The real MLS
 * adapters (Stellar, Bridge, MLS Grid) require an executed display agreement and
 * are unimplemented, so every non-fixture mode resolves to the disabled port —
 * only a licensed feed is ever live, and the saved-search loop dark-gates on the
 * provider key regardless.
 */
function buildListingProvider(env) {
  if (env.MLS_PROVIDER === "fixture") return new FixtureListingProvider();
  return new DisabledListingProvider();
}

/**
 * Engagement email alerts — the same portable core the app's /alerts/run route
 * uses, run on the cron tick. Dark by default: both FEATURE_EMAIL_ALERTS and a
 * live EMAIL_MODE are required, so nothing sends until the feature is turned on.
 *
 * Running on every tick is safe by construction, not by cadence: a home is
 * re-snapshotted only once it is older than the interval, each send is
 * deduplicated by a per-period key, and per-run and per-day caps bound the
 * provider calls — so a one-minute tick costs a cheap query and no more when
 * there is nothing eligible.
 */
async function runEmailAlerts(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof url !== "string" || typeof serviceKey !== "string") {
    console.error("email alerts cron: Supabase is not configured; skipping");
    return;
  }
  const alertsOn = env.FEATURE_EMAIL_ALERTS === "true" || env.FEATURE_EMAIL_ALERTS === true;
  const emailLive = env.EMAIL_MODE === "production" || env.EMAIL_MODE === "sandbox";
  const resendKey = env.RESEND_API_KEY;
  const from = env.EMAIL_FROM;
  if (!alertsOn || !emailLive || typeof resendKey !== "string" || typeof from !== "string") {
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const email = new ResendEmailPort({ apiKey: resendKey, from });

  // Real feeds only when licensed; otherwise a disabled port makes that loop a
  // no-op (invariant 6 — a fixture average or valuation never reaches a person).
  const rateLive = env.RATE_FEED_MODE === "production" || env.RATE_FEED_MODE === "sandbox";
  const rateFeed =
    rateLive && typeof env.FRED_API_KEY === "string"
      ? new FredRateFeedPort({ apiKey: env.FRED_API_KEY })
      : new DisabledRateFeedPort();
  const attomLive = env.ATTOM_MODE === "production" || env.ATTOM_MODE === "sandbox";
  const property =
    attomLive && typeof env.ATTOM_API_KEY === "string"
      ? new AttomPropertyFactsPort({ apiKey: env.ATTOM_API_KEY })
      : new DisabledPropertyFactsPort();

  // Saved-search alerts stay dark unless the feature is on AND a licensed feed is
  // configured. Feature-on today still yields a fixture/disabled provider, which
  // the loop's dark-gate no-ops — so nothing sends until a real MLS lands.
  const savedSearchOn =
    env.FEATURE_SAVED_SEARCH_ALERTS === "true" || env.FEATURE_SAVED_SEARCH_ALERTS === true;
  const listingProvider = savedSearchOn ? buildListingProvider(env) : new DisabledListingProvider();

  const summary = await runEmailAlertsCore({
    supabase,
    email,
    rateFeed,
    property,
    listings: listingProvider,
    runId: `cron:${crypto.randomUUID()}`,
    maxPerRun: Number(env.EMAIL_ALERTS_MAX_PER_RUN ?? 50),
    dailyCap: Number(env.EMAIL_ALERTS_DAILY_CAP ?? 500),
    valueThresholdBp: Number(env.HOME_VALUE_ALERT_THRESHOLD_BP ?? 200),
    resnapshotIntervalDays: Number(env.HOME_VALUE_RESNAPSHOT_INTERVAL_DAYS ?? 1),
    savedSearchMaxMatches: Number(env.SAVED_SEARCH_ALERT_MAX_MATCHES ?? 10),
    from,
    hashPepper: env.HASH_PEPPER,
    appUrl: env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  });
  console.log("email alerts cron: completed", JSON.stringify(summary));
}

export default {
  fetch: (request, env, ctx) => openNextHandler.fetch(request, env, ctx),

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      drainOutbox(env).catch((error) => console.error("outbox cron: drain threw", error))
    );
    ctx.waitUntil(
      runEmailAlerts(env).catch((error) => console.error("email alerts cron: threw", error))
    );
  }
};

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };
