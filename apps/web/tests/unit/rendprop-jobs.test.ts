import { describe, expect, it } from "vitest";
import {
  DEFAULT_BACKOFF,
  JOB_ERROR_CLASSES,
  JobTransitionError,
  RENDPROP_JOB_STATES,
  RendPropProviderError,
  assertTransition,
  canTransition,
  checkKillSwitches,
  classifyError,
  computeBackoffMs,
  evaluateUserQuota,
  executeRendPropJob,
  isRetryable,
  isTerminalState,
  planNextAttempt,
  rendPropIdempotencyKey,
  type BackoffPolicy,
  type ProviderCall,
  type ProviderOutcome,
  type ReservationGate,
  type RendPropJobState,
  type UserQuota
} from "../../lib/rendprop/jobs";
import {
  RENDPROP_TRANSFORMATIONS,
  TRANSFORMATION_CATALOGUE,
  disclosureLabelFor,
  estimatedCostCentsFor,
  fingerprintParameters,
  requiresVisibleDisclosure
} from "../../lib/rendprop/pipeline";
import {
  RENDPROP_UPLOAD_POLICY,
  derivedStorageKey,
  isAllowedContentType,
  originalStorageKey,
  planSignedUpload
} from "../../lib/rendprop/uploads";
import {
  UnconfiguredMediaProvider,
  mediaProviderStatus,
  resolveMediaProvider
} from "../../lib/rendprop/adapter";

/* ------------------------------------------------------------------ *
 * State machine
 * ------------------------------------------------------------------ */

describe("RendProp job state machine", () => {
  it("declares exactly the six states the schema stores", () => {
    expect([...RENDPROP_JOB_STATES]).toEqual([
      "queued",
      "reserved",
      "running",
      "succeeded",
      "failed",
      "cancelled"
    ]);
  });

  it("treats succeeded, failed, and cancelled as terminal and nothing else", () => {
    const terminal = RENDPROP_JOB_STATES.filter(isTerminalState);
    expect(terminal).toEqual(["succeeded", "failed", "cancelled"]);
  });

  it("allows only the documented forward edges", () => {
    expect(canTransition("queued", "reserved")).toBe(true);
    expect(canTransition("reserved", "running")).toBe(true);
    expect(canTransition("running", "succeeded")).toBe(true);
  });

  it("allows the retry edges back to the queue so a reservation is released between attempts", () => {
    expect(canTransition("reserved", "queued")).toBe(true);
    expect(canTransition("running", "queued")).toBe(true);
  });

  it("refuses to skip the reservation", () => {
    expect(canTransition("queued", "running")).toBe(false);
    expect(() => assertTransition("queued", "running")).toThrow(JobTransitionError);
  });

  it("refuses to leave any terminal state", () => {
    for (const from of ["succeeded", "failed", "cancelled"] as const) {
      for (const to of RENDPROP_JOB_STATES) {
        expect(canTransition(from, to), `${from} -> ${to}`).toBe(false);
      }
    }
  });

  it("refuses to resurrect a succeeded job as queued", () => {
    expect(() => assertTransition("succeeded", "queued")).toThrow(/illegal/);
  });

  it("permits cancellation from every non-terminal state", () => {
    for (const from of ["queued", "reserved", "running"] as const) {
      expect(canTransition(from, "cancelled"), from).toBe(true);
    }
  });

  it("never lets a state transition to itself", () => {
    for (const state of RENDPROP_JOB_STATES) {
      expect(canTransition(state, state), state).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Error classification
 * ------------------------------------------------------------------ */

describe("error classification", () => {
  it("classifies a missing provider as terminal, not as something to retry forever", () => {
    expect(classifyError("provider_not_configured")).toBe("terminal");
    expect(isRetryable("provider_not_configured")).toBe(false);
  });

  it("classifies transport and availability failures as retryable", () => {
    for (const code of [
      "provider_rate_limited",
      "provider_unavailable",
      "provider_timeout",
      "network_error",
      "worker_lease_expired",
      "quota_denied"
    ]) {
      expect(classifyError(code), code).toBe("retryable");
    }
  });

  it("classifies an ambiguous provider result as unknown rather than retryable", () => {
    expect(classifyError("provider_outcome_unknown")).toBe("unknown");
    expect(classifyError("provider_response_unreadable")).toBe("unknown");
    expect(isRetryable("provider_outcome_unknown")).toBe(false);
  });

  it("treats an unrecognised code as unknown, so nobody retries an unclassified error", () => {
    expect(classifyError("something_nobody_wrote_down")).toBe("unknown");
    expect(isRetryable("something_nobody_wrote_down")).toBe(false);
  });

  it("classifies every registered code as exactly one of the three classes", () => {
    for (const [code, expected] of Object.entries(JOB_ERROR_CLASSES)) {
      expect(classifyError(code), code).toBe(expected);
    }
  });

  it("never classifies a bad input as retryable", () => {
    for (const code of [
      "unsupported_media_type",
      "asset_too_large",
      "invalid_parameters",
      "rights_not_confirmed",
      "safety_refusal"
    ]) {
      expect(classifyError(code), code).toBe("terminal");
    }
  });
});

/* ------------------------------------------------------------------ *
 * Backoff
 * ------------------------------------------------------------------ */

const NO_JITTER: BackoffPolicy = { ...DEFAULT_BACKOFF, jitterRatio: 0 };

describe("bounded exponential backoff with jitter", () => {
  it("doubles per attempt before the ceiling", () => {
    expect(computeBackoffMs(1, NO_JITTER, () => 0.5)).toBe(30_000);
    expect(computeBackoffMs(2, NO_JITTER, () => 0.5)).toBe(60_000);
    expect(computeBackoffMs(3, NO_JITTER, () => 0.5)).toBe(120_000);
    expect(computeBackoffMs(4, NO_JITTER, () => 0.5)).toBe(240_000);
  });

  it("is bounded — the delay never exceeds the ceiling no matter the attempt", () => {
    for (const attempt of [5, 8, 20, 100, 1_000_000]) {
      expect(
        computeBackoffMs(attempt, DEFAULT_BACKOFF, () => 1),
        `attempt ${attempt}`
      ).toBeLessThanOrEqual(DEFAULT_BACKOFF.maxDelayMs);
    }
  });

  it("never returns a negative delay, even with a pathological random source", () => {
    for (const value of [0, 0.0001, 1, 0.999]) {
      expect(computeBackoffMs(3, DEFAULT_BACKOFF, () => value)).toBeGreaterThanOrEqual(0);
    }
  });

  it("spreads retries either side of the base delay, which is what stops a thundering herd", () => {
    const low = computeBackoffMs(2, DEFAULT_BACKOFF, () => 0);
    const mid = computeBackoffMs(2, DEFAULT_BACKOFF, () => 0.5);
    const high = computeBackoffMs(2, DEFAULT_BACKOFF, () => 1);
    expect(low).toBe(45_000);
    expect(mid).toBe(60_000);
    expect(high).toBe(75_000);
    expect(low).toBeLessThan(high);
  });

  it("keeps every jittered delay inside the policy band", () => {
    const policy = DEFAULT_BACKOFF;
    for (let index = 0; index <= 100; index += 1) {
      const random = index / 100;
      const delay = computeBackoffMs(2, policy, () => random);
      expect(delay).toBeGreaterThanOrEqual(60_000 * (1 - policy.jitterRatio));
      expect(delay).toBeLessThanOrEqual(60_000 * (1 + policy.jitterRatio));
    }
  });

  it("is deterministic for a given random source, so a test can assert a schedule", () => {
    expect(computeBackoffMs(3, DEFAULT_BACKOFF, () => 0.25)).toBe(
      computeBackoffMs(3, DEFAULT_BACKOFF, () => 0.25)
    );
  });

  it("rejects a zero or fractional attempt rather than computing a nonsense delay", () => {
    expect(() => computeBackoffMs(0)).toThrow(RangeError);
    expect(() => computeBackoffMs(-1)).toThrow(RangeError);
    expect(() => computeBackoffMs(Number.NaN)).toThrow(RangeError);
  });
});

/* ------------------------------------------------------------------ *
 * Retry planning
 * ------------------------------------------------------------------ */

describe("retry planning", () => {
  const base = { attempt: 1, maxAttempts: 4, nowMs: 1_000, random: () => 0.5 };

  it("schedules a retry for a retryable error", () => {
    const plan = planNextAttempt({ ...base, errorCode: "provider_timeout", policy: NO_JITTER });
    expect(plan).toEqual({
      decision: "retry",
      nextState: "queued",
      attempt: 2,
      availableAtMs: 31_000,
      delayMs: 30_000
    });
  });

  it("fails immediately on a terminal error without burning the attempt budget", () => {
    const plan = planNextAttempt({ ...base, errorCode: "unsupported_media_type" });
    expect(plan.decision).toBe("fail");
    if (plan.decision !== "fail") throw new Error("unreachable");
    expect(plan.reason).toBe("terminal_error");
    expect(plan.errorCode).toBe("unsupported_media_type");
  });

  it("fails once the attempts are exhausted, even for a retryable error", () => {
    const plan = planNextAttempt({ ...base, attempt: 4, errorCode: "provider_timeout" });
    expect(plan).toEqual({
      decision: "fail",
      nextState: "failed",
      errorCode: "attempts_exhausted",
      reason: "attempts_exhausted"
    });
  });

  it("holds an unknown outcome for reconciliation instead of retrying or failing it", () => {
    const plan = planNextAttempt({ ...base, errorCode: "provider_outcome_unknown" });
    expect(plan).toEqual({
      decision: "hold_for_reconciliation",
      nextState: "running",
      errorCode: "provider_outcome_unknown"
    });
  });

  it("does not retry an unknown outcome even when attempts remain", () => {
    const plan = planNextAttempt({ ...base, attempt: 1, maxAttempts: 10, errorCode: "mystery" });
    expect(plan.decision).toBe("hold_for_reconciliation");
  });

  it("grows the delay across successive attempts", () => {
    const delays = [1, 2, 3].map((attempt) => {
      const plan = planNextAttempt({
        ...base,
        attempt,
        maxAttempts: 9,
        errorCode: "provider_unavailable",
        policy: NO_JITTER
      });
      return plan.decision === "retry" ? plan.delayMs : -1;
    });
    expect(delays).toEqual([30_000, 60_000, 120_000]);
  });
});

/* ------------------------------------------------------------------ *
 * Idempotency
 * ------------------------------------------------------------------ */

describe("idempotency keys", () => {
  const identity = {
    projectId: "project-1",
    sourceAssetId: "asset-1",
    transformation: "virtual_staging"
  } as const;

  it("is stable for the same logical work, so a retried request cannot buy it twice", () => {
    expect(rendPropIdempotencyKey(identity)).toBe(rendPropIdempotencyKey(identity));
  });

  it("does not include the attempt, so a retry reuses the same reservation", () => {
    const key = rendPropIdempotencyKey(identity);
    expect(key).not.toMatch(/attempt/);
    expect(key).toBe(rendPropIdempotencyKey({ ...identity }));
  });

  it("separates transformations, assets, and projects", () => {
    const keys = new Set([
      rendPropIdempotencyKey(identity),
      rendPropIdempotencyKey({ ...identity, transformation: "clutter_cleanup" }),
      rendPropIdempotencyKey({ ...identity, sourceAssetId: "asset-2" }),
      rendPropIdempotencyKey({ ...identity, projectId: "project-2" })
    ]);
    expect(keys.size).toBe(4);
  });

  it("separates different parameters but ignores key order", () => {
    const a = rendPropIdempotencyKey({ ...identity, parameters: { style: "coastal", rooms: 2 } });
    const b = rendPropIdempotencyKey({ ...identity, parameters: { rooms: 2, style: "coastal" } });
    const c = rendPropIdempotencyKey({ ...identity, parameters: { style: "modern", rooms: 2 } });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("treats absent parameters and an empty object as the same work", () => {
    expect(rendPropIdempotencyKey(identity)).toBe(
      rendPropIdempotencyKey({ ...identity, parameters: {} })
    );
  });

  it("fingerprints nested structures stably", () => {
    expect(fingerprintParameters({ a: { b: [1, 2, { c: 3 }] } })).toBe(
      fingerprintParameters({ a: { b: [1, 2, { c: 3 }] } })
    );
    expect(fingerprintParameters({ a: 1 })).not.toBe(fingerprintParameters({ a: 2 }));
  });
});

/* ------------------------------------------------------------------ *
 * Kill switch and quota
 * ------------------------------------------------------------------ */

describe("kill switches", () => {
  it("passes only when every switch is clear", () => {
    expect(checkKillSwitches({ global: false, feature: false, provider: false })).toEqual({
      allowed: true
    });
  });

  it("refuses on any single engaged switch", () => {
    for (const key of ["global", "feature", "provider"] as const) {
      const state = { global: false, feature: false, provider: false, [key]: true };
      expect(checkKillSwitches(state), key).toEqual({
        allowed: false,
        errorCode: "kill_switch_engaged"
      });
    }
  });
});

describe("per-user quota", () => {
  const enabled: UserQuota = {
    requestLimit: 5,
    costLimitCents: 200,
    concurrencyLimit: 2,
    enabled: true
  };
  const idle = { requestsInPeriod: 0, reservedCents: 0, chargedCents: 0, inFlight: 0 };

  it("allows a request inside every limit", () => {
    expect(
      evaluateUserQuota({ quota: enabled, usage: idle, estimatedCostCents: 45, maxCostCents: 500 })
    ).toEqual({ allowed: true, reserveCents: 45 });
  });

  it("denies by default when the feature was never provisioned for the subject", () => {
    expect(
      evaluateUserQuota({
        quota: undefined,
        usage: idle,
        estimatedCostCents: 1,
        maxCostCents: 500
      })
    ).toEqual({ allowed: false, reason: "feature_disabled" });
  });

  it("denies a disabled policy", () => {
    expect(
      evaluateUserQuota({
        quota: { ...enabled, enabled: false },
        usage: idle,
        estimatedCostCents: 1,
        maxCostCents: 500
      })
    ).toEqual({ allowed: false, reason: "feature_disabled" });
  });

  it("counts a reservation as committed spend, not only a charge", () => {
    expect(
      evaluateUserQuota({
        quota: enabled,
        usage: { ...idle, reservedCents: 180 },
        estimatedCostCents: 45,
        maxCostCents: 500
      })
    ).toEqual({ allowed: false, reason: "cost_limit" });
  });

  it("enforces the concurrency ceiling before anything else spends", () => {
    expect(
      evaluateUserQuota({
        quota: enabled,
        usage: { ...idle, inFlight: 2 },
        estimatedCostCents: 1,
        maxCostCents: 500
      })
    ).toEqual({ allowed: false, reason: "concurrency_limit" });
  });

  it("enforces the request ceiling", () => {
    expect(
      evaluateUserQuota({
        quota: enabled,
        usage: { ...idle, requestsInPeriod: 5 },
        estimatedCostCents: 1,
        maxCostCents: 500
      })
    ).toEqual({ allowed: false, reason: "request_limit" });
  });

  it("refuses a single request that exceeds the caller's own ceiling", () => {
    expect(
      evaluateUserQuota({ quota: enabled, usage: idle, estimatedCostCents: 600, maxCostCents: 500 })
    ).toEqual({ allowed: false, reason: "exceeds_max_cost" });
  });

  it("never reports how much budget remains", () => {
    const decision = evaluateUserQuota({
      quota: enabled,
      usage: { ...idle, chargedCents: 199 },
      estimatedCostCents: 45,
      maxCostCents: 500
    });
    expect(decision.allowed).toBe(false);
    expect(JSON.stringify(decision)).not.toMatch(/\b(199|200|remaining)\b/);
  });

  it("treats a null limit as unlimited on that axis alone", () => {
    expect(
      evaluateUserQuota({
        quota: { requestLimit: null, costLimitCents: null, concurrencyLimit: null, enabled: true },
        usage: { requestsInPeriod: 9_999, reservedCents: 9_999, chargedCents: 9_999, inFlight: 99 },
        estimatedCostCents: 10,
        maxCostCents: 500
      })
    ).toEqual({ allowed: true, reserveCents: 10 });
  });

  it("rejects a negative estimate outright", () => {
    expect(() =>
      evaluateUserQuota({ quota: enabled, usage: idle, estimatedCostCents: -1, maxCostCents: 500 })
    ).toThrow(RangeError);
  });
});

/* ------------------------------------------------------------------ *
 * Invariant 8: reserve before spend
 * ------------------------------------------------------------------ */

type Trace = string[];

function harness(options: {
  outcome?: ProviderOutcome;
  throws?: unknown;
  reserveAllowed?: boolean;
  quota?: UserQuota | undefined;
  usage?: {
    requestsInPeriod: number;
    reservedCents: number;
    chargedCents: number;
    inFlight: number;
  };
  killSwitches?: { global: boolean; feature: boolean; provider: boolean };
  attempt?: number;
  maxAttempts?: number;
}) {
  const trace: Trace = [];
  const reserve: ReservationGate = async ({ estimatedCostCents }) => {
    trace.push("reserve");
    return options.reserveAllowed === false
      ? { allowed: false, reason: "cost_limit" }
      : { allowed: true, reservedCents: estimatedCostCents };
  };
  const callProvider: ProviderCall = async () => {
    trace.push("provider");
    if (options.throws !== undefined) throw options.throws;
    return options.outcome ?? { kind: "succeeded", actualCostCents: 40, outputKey: "out" };
  };

  return {
    trace,
    run: () =>
      executeRendPropJob({
        jobId: "job-1",
        idempotencyKey: "rendprop:p:a:virtual_staging:deadbeef",
        estimatedCostCents: 45,
        maxCostCents: 500,
        attempt: options.attempt ?? 1,
        maxAttempts: options.maxAttempts ?? 4,
        killSwitches: options.killSwitches ?? { global: false, feature: false, provider: false },
        quota:
          options.quota === undefined && !("quota" in options)
            ? { requestLimit: 5, costLimitCents: 200, concurrencyLimit: 2, enabled: true }
            : options.quota,
        usage: options.usage ?? {
          requestsInPeriod: 0,
          reservedCents: 0,
          chargedCents: 0,
          inFlight: 0
        },
        reserve,
        callProvider,
        nowMs: 0,
        policy: NO_JITTER,
        random: () => 0.5
      })
  };
}

describe("invariant 8 — spend is reserved before a provider is called", () => {
  it("reserves first and calls the provider second, in that order", async () => {
    const { trace, run } = harness({});
    const result = await run();
    expect(trace).toEqual(["reserve", "provider"]);
    expect(result.state).toBe("succeeded");
  });

  it("never reaches the provider when a kill switch is engaged", async () => {
    const { trace, run } = harness({
      killSwitches: { global: true, feature: false, provider: false }
    });
    const result = await run();
    expect(trace).toEqual([]);
    expect(result.providerCalled).toBe(false);
    expect(result.errorCode).toBe("kill_switch_engaged");
    expect(result.state).toBe("failed");
  });

  it("checks the kill switch before it even reads the quota", async () => {
    const { trace, run } = harness({
      killSwitches: { global: false, feature: true, provider: false },
      quota: { requestLimit: 5, costLimitCents: 200, concurrencyLimit: 2, enabled: true }
    });
    await run();
    expect(trace).not.toContain("reserve");
  });

  it("never reaches the provider when the quota denies the request", async () => {
    const { trace, run } = harness({
      usage: { requestsInPeriod: 5, reservedCents: 0, chargedCents: 0, inFlight: 0 }
    });
    const result = await run();
    expect(trace).toEqual([]);
    expect(result.providerCalled).toBe(false);
    expect(result.errorCode).toBe("quota_denied");
  });

  it("never reaches the provider when the reservation itself is refused", async () => {
    const { trace, run } = harness({ reserveAllowed: false });
    const result = await run();
    expect(trace).toEqual(["reserve"]);
    expect(result.providerCalled).toBe(false);
    expect(result.settlement.entries).toEqual([]);
  });

  it("records no ledger movement at all when nothing was reserved", async () => {
    const { run } = harness({ killSwitches: { global: true, feature: false, provider: false } });
    const result = await run();
    expect(result.settlement).toEqual({
      entries: [],
      requiresReconciliation: false,
      netChargedCents: 0
    });
  });

  it("retries a quota denial rather than failing the job outright", async () => {
    const { run } = harness({
      usage: { requestsInPeriod: 0, reservedCents: 0, chargedCents: 0, inFlight: 2 }
    });
    const result = await run();
    expect(result.state).toBe("queued");
    expect(result.retry?.decision).toBe("retry");
  });
});

describe("invariant 8 — an unknown outcome holds the reservation", () => {
  it("writes no ledger entry and flags reconciliation when the provider is ambiguous", async () => {
    const { run } = harness({
      outcome: { kind: "unknown", errorCode: "provider_outcome_unknown" }
    });
    const result = await run();
    expect(result.settlement.entries).toEqual([]);
    expect(result.settlement.requiresReconciliation).toBe(true);
    expect(result.settlement.netChargedCents).toBe(0);
  });

  it("does not release the reservation on an ambiguous outcome", async () => {
    const { run } = harness({
      outcome: { kind: "unknown", errorCode: "provider_outcome_unknown" }
    });
    const result = await run();
    expect(result.settlement.entries.some((entry) => entry.kind === "release")).toBe(false);
  });

  it("does not schedule a retry for an ambiguous outcome", async () => {
    const { run } = harness({
      outcome: { kind: "unknown", errorCode: "provider_outcome_unknown" }
    });
    const result = await run();
    expect(result.retry?.decision).toBe("hold_for_reconciliation");
    expect(result.state).toBe("running");
  });

  it("treats a thrown adapter with no classification as unknown, and holds the budget", async () => {
    const { run } = harness({ throws: new Error("socket hung up") });
    const result = await run();
    expect(result.errorClass).toBe("unknown");
    expect(result.settlement.requiresReconciliation).toBe(true);
    expect(result.settlement.entries).toEqual([]);
  });

  it("classifies a typed provider error instead of assuming the worst", async () => {
    const { run } = harness({
      throws: new RendPropProviderError("provider_timeout", "gateway timeout")
    });
    const result = await run();
    expect(result.errorClass).toBe("retryable");
    expect(result.settlement.requiresReconciliation).toBe(false);
    expect(result.state).toBe("queued");
  });
});

describe("settlement of a completed attempt", () => {
  it("charges the actual cost and releases the unused reservation", async () => {
    const { run } = harness({
      outcome: { kind: "succeeded", actualCostCents: 30, outputKey: "k" }
    });
    const result = await run();
    expect(result.settlement.entries).toEqual([
      { kind: "charge", amountCents: 30, reason: "provider succeeded" },
      { kind: "release", amountCents: 15, reason: "reservation exceeded actual cost" }
    ]);
    expect(result.settlement.netChargedCents).toBe(30);
    expect(result.outputKey).toBe("k");
  });

  it("adjusts upward when the provider charged more than was reserved", async () => {
    const { run } = harness({
      outcome: { kind: "succeeded", actualCostCents: 70, outputKey: "k" }
    });
    const result = await run();
    expect(result.settlement.entries).toContainEqual({
      kind: "adjustment",
      amountCents: 25,
      reason: "actual cost exceeded reservation"
    });
  });

  it("releases the whole reservation when the failure happened before billable work", async () => {
    const { run } = harness({
      outcome: { kind: "failed", errorCode: "provider_unavailable", billable: false }
    });
    const result = await run();
    expect(result.settlement.entries).toEqual([
      {
        kind: "release",
        amountCents: 45,
        reason: "failed before billable provider work"
      }
    ]);
    expect(result.state).toBe("queued");
  });

  it("still charges when the provider failed after doing billable work", async () => {
    const { run } = harness({
      outcome: {
        kind: "failed",
        errorCode: "output_failed_validation",
        billable: true,
        actualCostCents: 45
      }
    });
    const result = await run();
    expect(result.settlement.netChargedCents).toBe(45);
    expect(result.state).toBe("failed");
  });

  it("fails terminally on a missing provider without scheduling a retry", async () => {
    const { run } = harness({
      throws: new RendPropProviderError("provider_not_configured")
    });
    const result = await run();
    expect(result.state).toBe("failed");
    expect(result.errorClass).toBe("terminal");
    expect(result.retry?.decision).toBe("fail");
    expect(result.settlement.netChargedCents).toBe(0);
  });

  it("gives up once attempts are exhausted", async () => {
    const { run } = harness({
      outcome: { kind: "failed", errorCode: "provider_timeout", billable: false },
      attempt: 4,
      maxAttempts: 4
    });
    const result = await run();
    expect(result.state).toBe("failed");
    expect(result.retry?.decision).toBe("fail");
  });

  it("reaches a terminal state or the queue on every path, never a fourth thing", async () => {
    const outcomes: ProviderOutcome[] = [
      { kind: "succeeded", actualCostCents: 10, outputKey: "k" },
      { kind: "failed", errorCode: "provider_timeout", billable: false },
      { kind: "failed", errorCode: "safety_refusal", billable: false },
      { kind: "unknown", errorCode: "provider_outcome_unknown" }
    ];
    const seen: RendPropJobState[] = [];
    for (const outcome of outcomes) {
      seen.push((await harness({ outcome }).run()).state);
    }
    expect(seen).toEqual(["succeeded", "queued", "failed", "running"]);
  });
});

/* ------------------------------------------------------------------ *
 * Disclosure catalogue
 * ------------------------------------------------------------------ */

describe("transformation catalogue and disclosure", () => {
  it("gives every imagery-altering transformation a non-empty visible label", () => {
    for (const key of RENDPROP_TRANSFORMATIONS) {
      const spec = TRANSFORMATION_CATALOGUE[key];
      if (!spec.altersImagery) continue;
      expect(spec.disclosureLabel.trim().length, key).toBeGreaterThan(0);
      expect(requiresVisibleDisclosure(key), key).toBe(true);
    }
  });

  it("labels virtual staging as digital and not included in the sale", () => {
    expect(disclosureLabelFor("virtual_staging")).toMatch(/virtually staged/i);
    expect(disclosureLabelFor("virtual_staging")).toMatch(/not included in the sale/i);
  });

  it("never claims a floor plan is a survey", () => {
    expect(disclosureLabelFor("floor_plan")).toMatch(/not a measured survey/i);
    for (const key of RENDPROP_TRANSFORMATIONS) {
      expect(TRANSFORMATION_CATALOGUE[key].disclosureLabel).not.toMatch(
        /survey-grade|measured to|accurate to/i
      );
    }
  });

  it("forbids concealing a condition on every transformation, not just cleanup", () => {
    for (const key of RENDPROP_TRANSFORMATIONS) {
      const forbidden = TRANSFORMATION_CATALOGUE[key].mayNotConceal.join(" ");
      expect(forbidden, key).toMatch(/damage/i);
      expect(forbidden, key).toMatch(/structural/i);
    }
  });

  it("keys every entry to itself, so a lookup cannot return the wrong label", () => {
    for (const key of RENDPROP_TRANSFORMATIONS) {
      expect(TRANSFORMATION_CATALOGUE[key].key).toBe(key);
    }
  });

  it("sums estimated cost in integer cents", () => {
    const total = estimatedCostCentsFor(["virtual_staging", "lighting_correction"]);
    expect(total).toBe(45 + 9);
    expect(Number.isInteger(total)).toBe(true);
    expect(estimatedCostCentsFor([])).toBe(0);
  });
});

/* ------------------------------------------------------------------ *
 * Uploads
 * ------------------------------------------------------------------ */

describe("signed upload policy", () => {
  const base = {
    projectId: "project-1",
    assetId: "asset-1",
    requestingUserId: "user-1",
    projectOwnerUserId: "user-1",
    rightsConfirmed: true,
    contentType: "video/quicktime",
    byteSize: 200_000_000,
    existingAssetCount: 3,
    existingTotalBytes: 900_000_000
  };

  it("issues a plan for an owner who has confirmed rights", () => {
    const plan = planSignedUpload(base);
    expect(plan.ok).toBe(true);
    if (!plan.ok) throw new Error("unreachable");
    expect(plan.method).toBe("PUT");
    expect(plan.expiresInSeconds).toBe(RENDPROP_UPLOAD_POLICY.signedUrlTtlSeconds);
  });

  it("refuses a caller who does not own the project", () => {
    expect(planSignedUpload({ ...base, requestingUserId: "user-2" })).toEqual({
      ok: false,
      reason: "not_project_owner"
    });
  });

  it("refuses before rights are confirmed, so unrightful media is never even stored", () => {
    expect(planSignedUpload({ ...base, rightsConfirmed: false })).toEqual({
      ok: false,
      reason: "rights_not_confirmed"
    });
  });

  it("refuses a content type outside the allowlist", () => {
    for (const contentType of [
      "application/zip",
      "text/html",
      "image/svg+xml",
      "video/x-msvideo"
    ]) {
      expect(planSignedUpload({ ...base, contentType }), contentType).toEqual({
        ok: false,
        reason: "unsupported_media_type"
      });
      expect(isAllowedContentType(contentType)).toBe(false);
    }
  });

  it("applies a tighter ceiling to a photo than to a clip", () => {
    expect(
      planSignedUpload({
        ...base,
        contentType: "image/jpeg",
        byteSize: RENDPROP_UPLOAD_POLICY.maxImageBytes + 1
      })
    ).toEqual({ ok: false, reason: "asset_too_large" });
    expect(
      planSignedUpload({
        ...base,
        contentType: "image/jpeg",
        byteSize: RENDPROP_UPLOAD_POLICY.maxImageBytes
      }).ok
    ).toBe(true);
  });

  it("refuses a zero-byte or oversized clip", () => {
    expect(planSignedUpload({ ...base, byteSize: 0 }).ok).toBe(false);
    expect(
      planSignedUpload({ ...base, byteSize: RENDPROP_UPLOAD_POLICY.maxVideoBytes + 1 }).ok
    ).toBe(false);
  });

  it("caps the number of assets and the total size of a project", () => {
    expect(
      planSignedUpload({
        ...base,
        existingAssetCount: RENDPROP_UPLOAD_POLICY.maxAssetsPerProject
      })
    ).toEqual({ ok: false, reason: "project_asset_limit" });
    expect(
      planSignedUpload({
        ...base,
        existingTotalBytes: RENDPROP_UPLOAD_POLICY.maxTotalProjectBytes
      })
    ).toEqual({ ok: false, reason: "project_size_limit" });
  });

  it("derives the storage key from ids so a filename cannot choose a path", () => {
    const key = originalStorageKey("project-1", "asset-1", "video/mp4");
    expect(key).toBe("rendprop/project-1/originals/asset-1.mp4");
    expect(key).not.toContain("..");
  });

  it("keeps derivatives on a separate path from originals", () => {
    expect(derivedStorageKey("project-1", "gen-1", "jpg")).toBe(
      "rendprop/project-1/generated/gen-1.jpg"
    );
    expect(derivedStorageKey("project-1", "gen-1", "jpg")).not.toBe(
      originalStorageKey("project-1", "gen-1", "image/jpeg")
    );
  });

  it("keeps the signed URL short-lived", () => {
    expect(RENDPROP_UPLOAD_POLICY.signedUrlTtlSeconds).toBeLessThanOrEqual(3_600);
  });
});

/* ------------------------------------------------------------------ *
 * The adapter
 * ------------------------------------------------------------------ */

describe("the media provider adapter", () => {
  const request = {
    transformation: "virtual_staging" as const,
    sourceStorageKey: "rendprop/p/originals/a.mov",
    parameters: {},
    idempotencyKey: "k",
    maxCostCents: 500,
    timeoutMs: 1_000
  };

  it("resolves to the unconfigured adapter, because nothing else exists", () => {
    const provider = resolveMediaProvider();
    expect(provider).toBeInstanceOf(UnconfiguredMediaProvider);
    expect(provider.configured).toBe(false);
    expect(provider.supports).toEqual([]);
  });

  it("refuses every execution with a terminal, classified error", async () => {
    await expect(resolveMediaProvider().execute(request)).rejects.toBeInstanceOf(
      RendPropProviderError
    );
    await expect(resolveMediaProvider().execute(request)).rejects.toMatchObject({
      code: "provider_not_configured"
    });
    expect(classifyError("provider_not_configured")).toBe("terminal");
  });

  it("estimates nothing, because nothing can be spent", async () => {
    await expect(resolveMediaProvider().estimateCostCents(request)).resolves.toBe(0);
  });

  it("reports a status the UI cannot turn into a claim that it works", () => {
    const status = mediaProviderStatus();
    expect(status.configured).toBe(false);
    expect(status.headline).toMatch(/no media provider/i);
    expect(status.detail).toMatch(/not connected/i);
    expect(status.headline).not.toMatch(/\b(live|available|working|operational)\b/i);
  });
});
