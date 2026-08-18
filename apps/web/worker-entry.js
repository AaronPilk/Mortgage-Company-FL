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
 * fills. The cron calls the existing token-protected drain route in-process —
 * no public egress, no extra invocation — and the route does the bounded,
 * locked claim/deliver/settle work it already knows how to do.
 *
 * The request URL uses WORKER_SELF_ORIGIN (a var in wrangler.jsonc) rather
 * than a hardcoded host, because host canonicalization middleware permanently
 * redirects any host it does not recognise — including a made-up internal one.
 *
 * If either WORKER_SELF_ORIGIN or OUTBOX_DRAIN_TOKEN is absent, the tick is a
 * silent no-op by design: an unconfigured environment (preview, local) should
 * not log an error a human then has to learn to ignore.
 */
export default {
  fetch: (request, env, ctx) => openNextHandler.fetch(request, env, ctx),

  async scheduled(controller, env, ctx) {
    const origin = env.WORKER_SELF_ORIGIN;
    const token = env.OUTBOX_DRAIN_TOKEN;
    if (typeof origin !== "string" || origin.length === 0) return;
    if (typeof token !== "string" || token.length === 0) return;

    const request = new Request(`${origin}/api/v1/internal/outbox/drain`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` }
    });

    ctx.waitUntil(
      openNextHandler.fetch(request, env, ctx).catch(() => {
        // A failed tick is retried by the next tick; the outbox's own retry
        // and dead-letter accounting is the durable record of trouble.
      })
    );
  }
};

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };
