import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Cloudflare Workers deployment via the supported OpenNext adapter.
 *
 * Caching is intentionally left at the default in-Worker behaviour until the
 * KV and R2 bindings below are actually provisioned. Enabling an incremental
 * cache that points at a binding which does not exist fails at request time
 * rather than at deploy time, which is the worst place to find out.
 */
export default defineCloudflareConfig({});
