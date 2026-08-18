import "server-only";
import {
  evaluateReservation,
  settleReservation,
  type QuotaPolicy,
  type ReservationDecision,
  type SettlementInput,
  type UsageSnapshot
} from "@tract/integrations";

/**
 * In-process spend ledger for AI features.
 *
 * Invariant 8: reserve spend before calling a provider, under a lock. In this
 * single-instance runtime the lock is the synchronous read-modify-write inside
 * `reserve` — nothing can interleave between the quota read and the
 * reservation write. This is the same posture as `MemoryRateLimitStore`: a
 * multi-instance deployment replaces the backing store (KV, Durable Objects, a
 * database ledger) behind the same interface, not the call sites.
 *
 * The decision and settlement arithmetic live in `@tract/integrations`
 * (`evaluateReservation` / `settleReservation`); this class only holds the
 * usage snapshots they operate on. An unknown provider outcome keeps its
 * reservation held and is flagged for reconciliation — the period window will
 * eventually expire it here, which is exactly the "overstate until a human
 * resolves it" behaviour the ledger documents.
 */

const PERIOD_MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  month: 2_592_000_000
} as const;

type Bucket = { snapshot: UsageSnapshot; resetAt: number };

const emptySnapshot = (): UsageSnapshot => ({
  requestsInPeriod: 0,
  reservedCents: 0,
  chargedCents: 0,
  inFlight: 0
});

export type ActiveReservation = {
  /** Idempotent. Settling twice applies once. */
  settle(outcome: SettlementInput["outcome"]): { requiresReconciliation: boolean };
};

export type ReserveResult =
  | { allowed: true; reservation: ActiveReservation }
  | Extract<ReservationDecision, { allowed: false }>;

export class MemoryAiBudgetStore {
  private readonly buckets = new Map<string, Bucket>();

  private bucket(key: string, windowMs: number): Bucket {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (existing !== undefined && existing.resetAt > now) return existing;
    const fresh: Bucket = { snapshot: emptySnapshot(), resetAt: now + windowMs };
    this.buckets.set(key, fresh);
    return fresh;
  }

  reserve(input: {
    feature: string;
    subjectKey: string;
    subjectPolicy: QuotaPolicy;
    platformPolicy: QuotaPolicy;
    estimatedCostCents: number;
    maxCostCents: number;
  }): ReserveResult {
    const subject = this.bucket(
      `${input.feature}:subject:${input.subjectKey}`,
      PERIOD_MS[input.subjectPolicy.period]
    );
    const platform = this.bucket(
      `${input.feature}:platform`,
      PERIOD_MS[input.platformPolicy.period]
    );

    const decision = evaluateReservation({
      request: {
        feature: input.feature,
        subjectKind: input.subjectPolicy.subjectKind,
        estimatedCostCents: input.estimatedCostCents,
        maxCostCents: input.maxCostCents
      },
      subjectPolicy: input.subjectPolicy,
      platformPolicy: input.platformPolicy,
      subjectUsage: subject.snapshot,
      platformUsage: platform.snapshot
    });
    if (!decision.allowed) return decision;

    const reserved = decision.reservedCents;
    for (const bucket of [subject, platform]) {
      bucket.snapshot.reservedCents += reserved;
      bucket.snapshot.inFlight += 1;
    }
    subject.snapshot.requestsInPeriod += 1;

    let settled = false;
    return {
      allowed: true,
      reservation: {
        settle: (outcome) => {
          if (settled) return { requiresReconciliation: false };
          settled = true;
          const settlement = settleReservation({ reservedCents: reserved, outcome });
          for (const bucket of [subject, platform]) {
            bucket.snapshot.inFlight = Math.max(0, bucket.snapshot.inFlight - 1);
            if (settlement.requiresReconciliation) continue; // hold the reservation
            bucket.snapshot.reservedCents = Math.max(0, bucket.snapshot.reservedCents - reserved);
            bucket.snapshot.chargedCents += settlement.netChargedCents;
          }
          return { requiresReconciliation: settlement.requiresReconciliation };
        }
      }
    };
  }

  /** Test helper. Not used at runtime. */
  clear(): void {
    this.buckets.clear();
  }
}

export const aiBudgetStore = new MemoryAiBudgetStore();
