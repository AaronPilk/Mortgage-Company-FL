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
   * The drain runs through the SELF service binding — a binding from this Worker
   * back to itself (see wrangler.jsonc). A Worker cannot fetch() its own public
   * hostname: Cloudflare answers that self-loop with 404 / error 1042, which is
   * precisely why an earlier version fired every minute and drained nothing. A
   * service binding is the supported path: it delivers the request to this
   * Worker's own fetch entrypoint, so the existing token-protected drain route
   * runs with routing and configuration populated exactly as a normal request.
   *
   * Every outcome is logged so a silent cron can never recur — `wrangler tail`
   * shows the drain's HTTP status on each tick.
   */
  async scheduled(controller, env, ctx) {
    const token = env.OUTBOX_DRAIN_TOKEN;
    if (typeof token !== "string" || token.length === 0) {
      console.error("outbox cron: OUTBOX_DRAIN_TOKEN is not set; skipping drain");
      return;
    }
    if (env.SELF === undefined || typeof env.SELF.fetch !== "function") {
      console.error("outbox cron: SELF service binding is missing; skipping drain");
      return;
    }
    const origin = env.WORKER_SELF_ORIGIN || "https://mortgage-company-fl.aaron-9c3.workers.dev";

    ctx.waitUntil(
      (async () => {
        try {
          const response = await env.SELF.fetch(
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
