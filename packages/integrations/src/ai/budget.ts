/**
 * Spend reservation and quota enforcement.
 *
 * Every potentially expensive request reserves its estimated cost BEFORE the
 * provider is called. On completion the reservation converts to an actual charge
 * and the difference is released. On failure before billable work the reservation
 * is released in full. On an uncertain provider outcome the reservation is held
 * for reconciliation rather than silently dropped — an unreconciled charge is a
 * real bill that nobody sees.
 */

export type QuotaSubjectKind = "anonymous" | "consumer" | "agent" | "staff" | "platform";
export type QuotaPeriod = "minute" | "hour" | "day" | "month";

export type QuotaPolicy = {
  subjectKind: QuotaSubjectKind;
  feature: string;
  period: QuotaPeriod;
  requestLimit: number | null;
  costLimitCents: number | null;
  concurrencyLimit: number | null;
  enabled: boolean;
};

export type UsageSnapshot = {
  requestsInPeriod: number;
  reservedCents: number;
  chargedCents: number;
  inFlight: number;
};

export type ReservationRequest = {
  feature: string;
  subjectKind: QuotaSubjectKind;
  estimatedCostCents: number;
  /** Hard per-request ceiling supplied by the caller. */
  maxCostCents: number;
};

export type ReservationDecision =
  | { allowed: true; reservedCents: number }
  | {
      allowed: false;
      reason:
        | "feature_disabled"
        | "request_limit"
        | "cost_limit"
        | "concurrency_limit"
        | "platform_budget"
        | "exceeds_max_cost";
      /** Seconds the caller should wait. Never reveals remaining budget. */
      retryAfterSeconds: number;
    };

const PERIOD_SECONDS: Record<QuotaPeriod, number> = {
  minute: 60,
  hour: 3600,
  day: 86_400,
  month: 2_592_000
};

export class BudgetError extends Error {}

/**
 * Pure decision function. The caller performs this inside a transaction that
 * locks the quota bucket, so the read-then-write cannot race.
 */
export function evaluateReservation(input: {
  request: ReservationRequest;
  subjectPolicy: QuotaPolicy | undefined;
  platformPolicy: QuotaPolicy | undefined;
  subjectUsage: UsageSnapshot;
  platformUsage: UsageSnapshot;
}): ReservationDecision {
  const { request, subjectPolicy, platformPolicy, subjectUsage, platformUsage } = input;

  if (request.estimatedCostCents < 0) {
    throw new BudgetError("estimatedCostCents must not be negative");
  }
  if (request.estimatedCostCents > request.maxCostCents) {
    return { allowed: false, reason: "exceeds_max_cost", retryAfterSeconds: 0 };
  }

  // No policy means the feature has not been provisioned. Deny by default.
  if (subjectPolicy === undefined || !subjectPolicy.enabled) {
    return { allowed: false, reason: "feature_disabled", retryAfterSeconds: 0 };
  }

  const subjectRetry = PERIOD_SECONDS[subjectPolicy.period];

  if (
    subjectPolicy.concurrencyLimit !== null &&
    subjectUsage.inFlight >= subjectPolicy.concurrencyLimit
  ) {
    return { allowed: false, reason: "concurrency_limit", retryAfterSeconds: 30 };
  }

  if (
    subjectPolicy.requestLimit !== null &&
    subjectUsage.requestsInPeriod >= subjectPolicy.requestLimit
  ) {
    return { allowed: false, reason: "request_limit", retryAfterSeconds: subjectRetry };
  }

  const subjectCommitted = subjectUsage.reservedCents + subjectUsage.chargedCents;
  if (
    subjectPolicy.costLimitCents !== null &&
    subjectCommitted + request.estimatedCostCents > subjectPolicy.costLimitCents
  ) {
    return { allowed: false, reason: "cost_limit", retryAfterSeconds: subjectRetry };
  }

  if (platformPolicy !== undefined && platformPolicy.enabled) {
    if (!platformPolicy.enabled) {
      return { allowed: false, reason: "platform_budget", retryAfterSeconds: 3600 };
    }
    const platformCommitted = platformUsage.reservedCents + platformUsage.chargedCents;
    if (
      platformPolicy.costLimitCents !== null &&
      platformCommitted + request.estimatedCostCents > platformPolicy.costLimitCents
    ) {
      return {
        allowed: false,
        reason: "platform_budget",
        retryAfterSeconds: PERIOD_SECONDS[platformPolicy.period]
      };
    }
  }

  return { allowed: true, reservedCents: request.estimatedCostCents };
}

export type LedgerEntryKind = "reserve" | "release" | "charge" | "credit" | "adjustment";

export type LedgerEntry = {
  kind: LedgerEntryKind;
  amountCents: number;
  reason: string;
};

export type SettlementInput = {
  reservedCents: number;
  outcome:
    | { kind: "succeeded"; actualCostCents: number }
    | { kind: "failed_before_billable" }
    | { kind: "failed_after_billable"; actualCostCents: number }
    | { kind: "unknown" };
};

export type Settlement = {
  entries: LedgerEntry[];
  /** True when the provider outcome is uncertain and a human must reconcile. */
  requiresReconciliation: boolean;
  netChargedCents: number;
};

export function settleReservation(input: SettlementInput): Settlement {
  const { reservedCents, outcome } = input;

  switch (outcome.kind) {
    case "succeeded":
    case "failed_after_billable": {
      const actual = outcome.actualCostCents;
      if (actual < 0) throw new BudgetError("actualCostCents must not be negative");
      const entries: LedgerEntry[] = [
        { kind: "charge", amountCents: actual, reason: `provider ${outcome.kind}` }
      ];
      const difference = reservedCents - actual;
      if (difference > 0) {
        entries.push({
          kind: "release",
          amountCents: difference,
          reason: "reservation exceeded actual cost"
        });
      } else if (difference < 0) {
        entries.push({
          kind: "adjustment",
          amountCents: -difference,
          reason: "actual cost exceeded reservation"
        });
      }
      return { entries, requiresReconciliation: false, netChargedCents: actual };
    }

    case "failed_before_billable":
      return {
        entries: [
          {
            kind: "release",
            amountCents: reservedCents,
            reason: "failed before billable provider work"
          }
        ],
        requiresReconciliation: false,
        netChargedCents: 0
      };

    case "unknown":
      // Hold the reservation. Releasing it would understate spend against a
      // charge the provider may still bill.
      return {
        entries: [],
        requiresReconciliation: true,
        netChargedCents: 0
      };
  }
}

/** Job state machine. Illegal transitions throw rather than silently correcting. */
export const AI_JOB_STATES = [
  "created",
  "budget_reserved",
  "queued",
  "submitted",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "expired"
] as const;
export type AiJobState = (typeof AI_JOB_STATES)[number];

const ALLOWED_TRANSITIONS: Record<AiJobState, readonly AiJobState[]> = {
  created: ["budget_reserved", "failed", "cancelled"],
  budget_reserved: ["queued", "failed", "cancelled"],
  queued: ["submitted", "failed", "cancelled", "expired"],
  submitted: ["processing", "succeeded", "failed", "cancelled", "expired"],
  processing: ["succeeded", "failed", "cancelled", "expired"],
  succeeded: [],
  failed: [],
  cancelled: [],
  expired: []
};

export class JobTransitionError extends Error {}

export function assertTransition(from: AiJobState, to: AiJobState): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new JobTransitionError(`illegal AI job transition: ${from} -> ${to}`);
  }
}

export function isTerminal(state: AiJobState): boolean {
  return ALLOWED_TRANSITIONS[state].length === 0;
}
