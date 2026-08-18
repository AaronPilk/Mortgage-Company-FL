/**
 * The RendProp job model.
 *
 * This module is the part that has to be provably correct, so it is pure: no
 * database, no clock, no randomness, no network. Every dependency that could
 * vary — time, jitter, the quota reader, the provider itself — arrives as an
 * argument. That is what makes the reserve-before-spend invariant testable
 * rather than merely asserted in a comment.
 *
 * Where the work runs
 * -------------------
 * Not in a request handler. Cloudflare Workers enforce a hard CPU budget per
 * request, and a walkthrough transcode plus several provider round-trips is not
 * a request-shaped amount of work. The request path calls
 * `public.rendprop_enqueue_job`, which inserts one `queued` row and returns. A
 * separate long-running worker calls `public.rendprop_claim_job`, and only that
 * worker ever touches a provider.
 *
 * Invariant 8, concretely
 * -----------------------
 * `executeReservedJob` will not call the provider until the reservation gate has
 * returned `allowed`, and the gate is expected to hold the quota lock while it
 * decides. When the provider's outcome is ambiguous, the settlement writes no
 * ledger entry at all: the reservation is HELD and the job is flagged for
 * reconciliation. Releasing budget against a bill that may still arrive is how
 * a spend cap silently stops being a cap.
 */

import { settleReservation, type Settlement } from "@tract/integrations";
import { fingerprintParameters, type RendPropTransformation } from "./pipeline";

/* ------------------------------------------------------------------ *
 * States
 * ------------------------------------------------------------------ */

export const RENDPROP_JOB_STATES = [
  "queued",
  "reserved",
  "running",
  "succeeded",
  "failed",
  "cancelled"
] as const;

export type RendPropJobState = (typeof RENDPROP_JOB_STATES)[number];

/**
 * `reserved -> queued` and `running -> queued` are the retry edges. A retry
 * returns the job to the queue rather than looping in place, so the reservation
 * is released on the way out and re-taken on the way back in; a job waiting for
 * its third attempt is not allowed to sit on somebody else's budget.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<RendPropJobState, readonly RendPropJobState[]>> = {
  queued: ["reserved", "cancelled", "failed"],
  reserved: ["running", "queued", "failed", "cancelled"],
  running: ["succeeded", "failed", "queued", "cancelled"],
  succeeded: [],
  failed: [],
  cancelled: []
};

export class JobTransitionError extends Error {}

export function canTransition(from: RendPropJobState, to: RendPropJobState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: RendPropJobState, to: RendPropJobState): void {
  if (!canTransition(from, to)) {
    throw new JobTransitionError(`illegal RendProp job transition: ${from} -> ${to}`);
  }
}

export function isTerminalState(state: RendPropJobState): boolean {
  return ALLOWED_TRANSITIONS[state].length === 0;
}

/* ------------------------------------------------------------------ *
 * Error classification
 * ------------------------------------------------------------------ */

export type JobErrorClass = "terminal" | "retryable" | "unknown";

/**
 * Every code a job may fail with, and what class it is. An unrecognised code is
 * treated as `unknown` rather than as retryable: retrying an error nobody has
 * classified is how a single bad input turns into a bill.
 */
export const JOB_ERROR_CLASSES = {
  provider_not_configured: "terminal",
  kill_switch_engaged: "terminal",
  quota_denied: "retryable",
  rights_not_confirmed: "terminal",
  unsupported_media_type: "terminal",
  asset_too_large: "terminal",
  asset_missing: "terminal",
  invalid_parameters: "terminal",
  safety_refusal: "terminal",
  output_failed_validation: "terminal",
  attempts_exhausted: "terminal",
  cancelled_by_owner: "terminal",
  provider_rate_limited: "retryable",
  provider_unavailable: "retryable",
  provider_timeout: "retryable",
  network_error: "retryable",
  worker_lease_expired: "retryable",
  provider_outcome_unknown: "unknown",
  provider_response_unreadable: "unknown"
} as const satisfies Record<string, JobErrorClass>;

export type JobErrorCode = keyof typeof JOB_ERROR_CLASSES;

export function classifyError(code: string): JobErrorClass {
  const known = (JOB_ERROR_CLASSES as Record<string, JobErrorClass | undefined>)[code];
  return known ?? "unknown";
}

export function isRetryable(code: string): boolean {
  return classifyError(code) === "retryable";
}

/* ------------------------------------------------------------------ *
 * Backoff
 * ------------------------------------------------------------------ */

export type BackoffPolicy = {
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly factor: number;
  /** Fraction of the delay the jitter may move it by, in either direction. */
  readonly jitterRatio: number;
};

export const DEFAULT_BACKOFF: BackoffPolicy = {
  baseDelayMs: 30_000,
  maxDelayMs: 15 * 60_000,
  factor: 2,
  jitterRatio: 0.25
};

/**
 * Bounded exponential backoff with symmetric jitter.
 *
 * The bound matters as much as the growth: without `maxDelayMs` a fourth attempt
 * lands hours away, and without jitter every job that failed during the same
 * provider outage retries in the same millisecond and reproduces the outage.
 *
 * `random` is injected so the result is reproducible in a test. `attempt` is
 * 1-based and counts the attempt that just failed.
 */
export function computeBackoffMs(
  attempt: number,
  policy: BackoffPolicy = DEFAULT_BACKOFF,
  random: () => number = Math.random
): number {
  if (!Number.isFinite(attempt) || attempt < 1) {
    throw new RangeError("attempt must be a positive integer");
  }
  const exponent = Math.min(attempt - 1, 30);
  const raw = policy.baseDelayMs * Math.pow(policy.factor, exponent);
  const bounded = Math.min(raw, policy.maxDelayMs);
  const spread = bounded * policy.jitterRatio;
  const jittered = bounded - spread + random() * spread * 2;
  // Clamped to the ceiling so the upper jitter cannot push past the bound, and
  // to zero so a pathological `random` cannot schedule a retry in the past.
  return Math.max(0, Math.min(policy.maxDelayMs, Math.round(jittered)));
}

/* ------------------------------------------------------------------ *
 * Retry planning
 * ------------------------------------------------------------------ */

export type RetryPlan =
  | {
      decision: "retry";
      nextState: "queued";
      attempt: number;
      availableAtMs: number;
      delayMs: number;
    }
  | {
      decision: "fail";
      nextState: "failed";
      errorCode: string;
      reason: "terminal_error" | "attempts_exhausted";
    }
  | { decision: "hold_for_reconciliation"; nextState: "running"; errorCode: string };

/**
 * What to do with a job that just failed. Three outcomes and no fourth: retry,
 * give up, or park it for a human because nobody knows whether money was spent.
 */
export function planNextAttempt(input: {
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly errorCode: string;
  readonly nowMs: number;
  readonly policy?: BackoffPolicy;
  readonly random?: () => number;
}): RetryPlan {
  const { attempt, maxAttempts, errorCode, nowMs } = input;
  const policy = input.policy ?? DEFAULT_BACKOFF;
  const random = input.random ?? Math.random;
  const classification = classifyError(errorCode);

  if (classification === "unknown") {
    return { decision: "hold_for_reconciliation", nextState: "running", errorCode };
  }
  if (classification === "terminal") {
    return { decision: "fail", nextState: "failed", errorCode, reason: "terminal_error" };
  }
  if (attempt >= maxAttempts) {
    return {
      decision: "fail",
      nextState: "failed",
      errorCode: "attempts_exhausted",
      reason: "attempts_exhausted"
    };
  }

  const delayMs = computeBackoffMs(attempt, policy, random);
  return {
    decision: "retry",
    nextState: "queued",
    attempt: attempt + 1,
    availableAtMs: nowMs + delayMs,
    delayMs
  };
}

/* ------------------------------------------------------------------ *
 * Idempotency
 * ------------------------------------------------------------------ */

export type JobIdentity = {
  readonly projectId: string;
  readonly sourceAssetId: string;
  readonly transformation: RendPropTransformation;
  readonly parameters?: Readonly<Record<string, unknown>>;
};

/**
 * Stable across retries by design. The key identifies the logical unit of work,
 * not the attempt, so a retried POST, a double-clicked button, and a worker
 * re-reading the queue all resolve to the same job — and the same reservation.
 */
export function rendPropIdempotencyKey(identity: JobIdentity): string {
  const fingerprint = fingerprintParameters(identity.parameters ?? {});
  return [
    "rendprop",
    identity.projectId,
    identity.sourceAssetId,
    identity.transformation,
    fingerprint
  ].join(":");
}

/* ------------------------------------------------------------------ *
 * Kill switch and quota gates
 * ------------------------------------------------------------------ */

export type KillSwitchState = {
  readonly global: boolean;
  readonly feature: boolean;
  readonly provider: boolean;
};

export type GateResult = { allowed: true } | { allowed: false; errorCode: JobErrorCode };

/**
 * Checked before anything else, including before the quota read. A kill switch
 * is an emergency stop; making it the first branch is what stops it being
 * something you can race past.
 */
export function checkKillSwitches(switches: KillSwitchState): GateResult {
  if (switches.global || switches.feature || switches.provider) {
    return { allowed: false, errorCode: "kill_switch_engaged" };
  }
  return { allowed: true };
}

export type QuotaSnapshot = {
  readonly requestsInPeriod: number;
  readonly reservedCents: number;
  readonly chargedCents: number;
  readonly inFlight: number;
};

export type UserQuota = {
  readonly requestLimit: number | null;
  readonly costLimitCents: number | null;
  readonly concurrencyLimit: number | null;
  readonly enabled: boolean;
};

export type QuotaDenialReason =
  "feature_disabled" | "request_limit" | "cost_limit" | "concurrency_limit" | "exceeds_max_cost";

export type QuotaDecision =
  { allowed: true; reserveCents: number } | { allowed: false; reason: QuotaDenialReason };

/**
 * Per-user quota. Deliberately never reports how much budget remains — a denial
 * that leaks the headroom is a probe for how much someone else is spending.
 */
export function evaluateUserQuota(input: {
  readonly quota: UserQuota | undefined;
  readonly usage: QuotaSnapshot;
  readonly estimatedCostCents: number;
  readonly maxCostCents: number;
}): QuotaDecision {
  const { quota, usage, estimatedCostCents, maxCostCents } = input;

  if (estimatedCostCents < 0) throw new RangeError("estimatedCostCents must not be negative");
  if (estimatedCostCents > maxCostCents) {
    return { allowed: false, reason: "exceeds_max_cost" };
  }
  // No policy row means the feature was never provisioned for this subject.
  // Deny by default; an unprovisioned feature is not a free one.
  if (quota === undefined || !quota.enabled) {
    return { allowed: false, reason: "feature_disabled" };
  }
  if (quota.concurrencyLimit !== null && usage.inFlight >= quota.concurrencyLimit) {
    return { allowed: false, reason: "concurrency_limit" };
  }
  if (quota.requestLimit !== null && usage.requestsInPeriod >= quota.requestLimit) {
    return { allowed: false, reason: "request_limit" };
  }
  const committed = usage.reservedCents + usage.chargedCents;
  if (quota.costLimitCents !== null && committed + estimatedCostCents > quota.costLimitCents) {
    return { allowed: false, reason: "cost_limit" };
  }
  return { allowed: true, reserveCents: estimatedCostCents };
}

/* ------------------------------------------------------------------ *
 * The reserve-before-spend orchestrator
 * ------------------------------------------------------------------ */

export type ProviderOutcome =
  | { kind: "succeeded"; actualCostCents: number; outputKey: string }
  | { kind: "failed"; errorCode: string; billable: boolean; actualCostCents?: number }
  | { kind: "unknown"; errorCode: string };

/**
 * The reservation gate. The implementation is expected to run inside a
 * transaction that has taken `FOR UPDATE` on the quota bucket — that lock is
 * the reason two concurrent workers cannot both read "budget available" and both
 * spend it. `public.rendprop_claim_job` is the real one.
 */
export type ReservationGate = (input: {
  readonly jobId: string;
  readonly estimatedCostCents: number;
  readonly idempotencyKey: string;
}) => Promise<{ allowed: true; reservedCents: number } | { allowed: false; reason: string }>;

export type ProviderCall = (input: {
  readonly jobId: string;
  readonly idempotencyKey: string;
  readonly reservedCents: number;
}) => Promise<ProviderOutcome>;

export type JobExecutionResult = {
  readonly state: RendPropJobState;
  readonly settlement: Settlement;
  readonly providerCalled: boolean;
  readonly errorCode?: string;
  readonly errorClass?: JobErrorClass;
  readonly retry?: RetryPlan;
  readonly outputKey?: string;
};

const NO_SPEND: Settlement = { entries: [], requiresReconciliation: false, netChargedCents: 0 };

/**
 * Run one attempt of one job.
 *
 * The ordering below is the invariant, not an implementation detail:
 *   1. kill switches
 *   2. quota
 *   3. reservation, under a lock
 *   4. the provider
 *   5. settlement
 *
 * Any refusal in 1–3 returns before step 4, so `providerCalled` is false and no
 * money can have moved. Step 5 is the only place a reservation is released, and
 * an `unknown` outcome does not reach it as a release.
 */
export async function executeRendPropJob(input: {
  readonly jobId: string;
  readonly idempotencyKey: string;
  readonly estimatedCostCents: number;
  readonly maxCostCents: number;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly killSwitches: KillSwitchState;
  readonly quota: UserQuota | undefined;
  readonly usage: QuotaSnapshot;
  readonly reserve: ReservationGate;
  readonly callProvider: ProviderCall;
  readonly nowMs: number;
  readonly policy?: BackoffPolicy;
  readonly random?: () => number;
}): Promise<JobExecutionResult> {
  const gate = checkKillSwitches(input.killSwitches);
  if (!gate.allowed) {
    return refuse(input, gate.errorCode);
  }

  const quota = evaluateUserQuota({
    quota: input.quota,
    usage: input.usage,
    estimatedCostCents: input.estimatedCostCents,
    maxCostCents: input.maxCostCents
  });
  if (!quota.allowed) {
    const code: JobErrorCode =
      quota.reason === "exceeds_max_cost" || quota.reason === "feature_disabled"
        ? "invalid_parameters"
        : "quota_denied";
    return refuse(input, code);
  }

  const reservation = await input.reserve({
    jobId: input.jobId,
    estimatedCostCents: quota.reserveCents,
    idempotencyKey: input.idempotencyKey
  });
  if (!reservation.allowed) {
    return refuse(input, "quota_denied");
  }

  // Everything above this line is free. Everything below it can cost money.
  let outcome: ProviderOutcome;
  try {
    outcome = await input.callProvider({
      jobId: input.jobId,
      idempotencyKey: input.idempotencyKey,
      reservedCents: reservation.reservedCents
    });
  } catch (error) {
    // A thrown adapter is not evidence that nothing was billed — the request may
    // have reached the provider and the response may have been lost. That is the
    // definition of `unknown`, so the reservation is held.
    const code = error instanceof RendPropProviderError ? error.code : "provider_outcome_unknown";
    const classification = classifyError(code);
    if (classification === "unknown") {
      return {
        state: "running",
        settlement: settleReservation({
          reservedCents: reservation.reservedCents,
          outcome: { kind: "unknown" }
        }),
        providerCalled: true,
        errorCode: code,
        errorClass: "unknown",
        retry: { decision: "hold_for_reconciliation", nextState: "running", errorCode: code }
      };
    }
    outcome = { kind: "failed", errorCode: code, billable: false };
  }

  if (outcome.kind === "succeeded") {
    return {
      state: "succeeded",
      settlement: settleReservation({
        reservedCents: reservation.reservedCents,
        outcome: { kind: "succeeded", actualCostCents: outcome.actualCostCents }
      }),
      providerCalled: true,
      outputKey: outcome.outputKey
    };
  }

  if (outcome.kind === "unknown") {
    return {
      state: "running",
      settlement: settleReservation({
        reservedCents: reservation.reservedCents,
        outcome: { kind: "unknown" }
      }),
      providerCalled: true,
      errorCode: outcome.errorCode,
      errorClass: "unknown",
      retry: {
        decision: "hold_for_reconciliation",
        nextState: "running",
        errorCode: outcome.errorCode
      }
    };
  }

  const plan = planNextAttempt({
    attempt: input.attempt,
    maxAttempts: input.maxAttempts,
    errorCode: outcome.errorCode,
    nowMs: input.nowMs,
    ...(input.policy === undefined ? {} : { policy: input.policy }),
    ...(input.random === undefined ? {} : { random: input.random })
  });

  const settlement = outcome.billable
    ? settleReservation({
        reservedCents: reservation.reservedCents,
        outcome: {
          kind: "failed_after_billable",
          actualCostCents: outcome.actualCostCents ?? 0
        }
      })
    : settleReservation({
        reservedCents: reservation.reservedCents,
        outcome: { kind: "failed_before_billable" }
      });

  return {
    state: plan.nextState,
    settlement,
    providerCalled: true,
    errorCode: outcome.errorCode,
    errorClass: classifyError(outcome.errorCode),
    retry: plan
  };
}

function refuse(
  input: {
    readonly attempt: number;
    readonly maxAttempts: number;
    readonly nowMs: number;
    readonly policy?: BackoffPolicy;
    readonly random?: () => number;
  },
  errorCode: JobErrorCode
): JobExecutionResult {
  const plan = planNextAttempt({
    attempt: input.attempt,
    maxAttempts: input.maxAttempts,
    errorCode,
    nowMs: input.nowMs,
    ...(input.policy === undefined ? {} : { policy: input.policy }),
    ...(input.random === undefined ? {} : { random: input.random })
  });
  return {
    state: plan.nextState,
    // Nothing was reserved, so there is nothing to settle. An empty settlement
    // is the honest record of "no money moved", not a release of budget that was
    // never taken.
    settlement: NO_SPEND,
    providerCalled: false,
    errorCode,
    errorClass: classifyError(errorCode),
    retry: plan
  };
}

/** Thrown by an adapter so the orchestrator can classify what happened. */
export class RendPropProviderError extends Error {
  constructor(
    readonly code: JobErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = "RendPropProviderError";
  }
}
