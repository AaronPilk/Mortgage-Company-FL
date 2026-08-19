import "server-only";

/**
 * Application-layer rate limiting.
 *
 * This is the in-process fallback, not the whole defence. Cloudflare rate
 * limiting rules run at the edge and a shared store (KV or Durable Objects)
 * replaces this map in a multi-instance deployment; the interface stays the same
 * so swapping the backing store does not touch the routes.
 *
 * A single global IP limit is deliberately NOT the only control: legitimate
 * users share IPs and attackers distribute traffic.
 */

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export interface RateLimitStore {
  hit(key: string, windowMs: number, limit: number): Promise<RateLimitDecision>;
}

type Bucket = { count: number; resetAt: number };

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  async hit(key: string, windowMs: number, limit: number): Promise<RateLimitDecision> {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (existing === undefined || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    existing.count += 1;
    if (existing.count > limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
      };
    }
    return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
  }

  /** Test helper. Not used at runtime. */
  clear(): void {
    this.buckets.clear();
  }
}

export const rateLimitStore: RateLimitStore = new MemoryRateLimitStore();

/**
 * Two dimensions on the lead endpoint: a coarse network bucket and a tighter
 * per-contact bucket. The second is what stops a distributed script from
 * re-submitting the same person hundreds of times.
 */
export const LEAD_RATE_LIMITS = {
  perNetwork: { windowMs: 10 * 60 * 1000, limit: 12 },
  // 5, not 3: the planner posts twice per completion by design (the sign-up
  // gate lead, then the full planner lead), and the same hour must also absorb
  // one failed-submission retry and a contact-form use without locking an
  // honest visitor out. The perNetwork limit still throttles abuse.
  perContact: { windowMs: 60 * 60 * 1000, limit: 5 }
} as const;

/**
 * Agent directory join endpoint. One network dimension only: the endpoint is
 * idempotent per agent by construction (email and license both dedupe to the
 * same row), so a per-contact bucket would add nothing but a lockout for an
 * agent fixing a typo. Tighter than the lead limit because a legitimate agent
 * joins once, not twelve times.
 */
export const AGENT_JOIN_RATE_LIMITS = {
  perNetwork: { windowMs: 10 * 60 * 1000, limit: 6 }
} as const;
