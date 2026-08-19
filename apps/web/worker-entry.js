// @ts-check
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
export default {
  fetch: (request, env, ctx) => openNextHandler.fetch(request, env, ctx),

  /**
   * Drain the transactional outbox once a minute.
   *
   * This makes a real HTTP request to the existing token-protected drain route
   * over WORKER_SELF_ORIGIN — the same path a normal request takes and the one
   * already proven to deliver — instead of invoking the Next.js handler
   * in-process. An in-process call does not route reliably from the scheduled
   * context: the tick fired every minute and left every lead sitting undrained.
   * The origin is a configured var, not a hardcoded host, because the
   * host-canonicalization middleware redirects any host it does not recognise.
   *
   * If WORKER_SELF_ORIGIN or OUTBOX_DRAIN_TOKEN is absent the tick is a no-op,
   * and every outcome is logged so a silent cron is never a mystery again.
   */
  async scheduled(controller, env, ctx) {
    const origin = env.WORKER_SELF_ORIGIN;
    const token = env.OUTBOX_DRAIN_TOKEN;
    if (typeof origin !== "string" || origin.length === 0) {
      console.error("outbox cron: WORKER_SELF_ORIGIN is not set; skipping drain");
      return;
    }
    if (typeof token !== "string" || token.length === 0) {
      console.error("outbox cron: OUTBOX_DRAIN_TOKEN is not set; skipping drain");
      return;
    }

    ctx.waitUntil(
      (async () => {
        try {
          const response = await fetch(
            new Request(`${origin}/api/v1/internal/outbox/drain`, {
              method: "POST",
              headers: { authorization: `Bearer ${token}` }
            })
          );
          const body = await response.text();
          console.log("outbox cron: drain responded", response.status, body);
        } catch (error) {
          console.error("outbox cron: drain request threw", error);
        }
      })()
    );
  }
};

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };
