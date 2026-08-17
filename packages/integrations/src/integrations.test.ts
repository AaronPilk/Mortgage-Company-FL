import { generateKeyPairSync, sign as signBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  CrmPayloadError,
  DisabledCrmAdapter,
  FixtureCrmAdapter,
  GhlCrmAdapter,
  type CrmLead,
  assertCrmPayloadSafe,
  backoffMs,
  classifyHttpFailure
} from "./crm/index";
import {
  InMemoryWebhookDedupeStore,
  processOutboxRow,
  leadSyncIdempotencyKey,
  verifyWebhook
} from "./crm/index";
import {
  DisabledListingProvider,
  FixtureListingProvider,
  isDisplayable,
  recordsToUnpublish,
  resolvePastedLink
} from "./listings/index";
import {
  AiPolicyError,
  DisabledAiProvider,
  FixtureAiProvider,
  type AiRequest,
  type ModelRoute,
  assertTransition,
  evaluateReservation,
  executeWithValidation,
  JobTransitionError,
  selectRoute,
  settleReservation
} from "./ai/index";
import { FixtureFloodPort, FixtureZoningPort } from "./property/index";
import { FIXTURE_FAILING_TOKEN, verifyTurnstile } from "./turnstile";

const lead: CrmLead = {
  externalId: "receipt-1",
  firstName: "Dana",
  lastName: "Reyes",
  email: "dana@example.com",
  phoneE164: "+18135550147",
  intent: "purchase",
  sourcePath: "/mortgage/purchase",
  tags: ["web-lead"],
  consent: {
    smsMarketing: false,
    emailMarketing: true,
    disclosureVersion: "v1",
    receivedAtIso: "2026-08-17T12:00:00.000Z"
  },
  attribution: { utmSource: "google", gclid: "abc" }
};

describe("CRM payload boundary", () => {
  it("rejects loan-file and identity fields regardless of key casing", () => {
    for (const key of [
      "ssn",
      "credit_score",
      "creditScore",
      "bankAccount",
      "tax_return",
      "prompt"
    ]) {
      expect(() => assertCrmPayloadSafe({ [key]: "x" }), key).toThrow(CrmPayloadError);
    }
  });

  it("rejects a prohibited field nested inside an allowed object", () => {
    expect(() => assertCrmPayloadSafe({ custom: { detail: { income: 90_000 } } })).toThrow(
      CrmPayloadError
    );
  });

  it("allows the approved marketing payload", () => {
    expect(() => assertCrmPayloadSafe(lead as unknown as Record<string, unknown>)).not.toThrow();
  });
});

describe("CRM adapters", () => {
  it("makes no external claim when disabled", async () => {
    const adapter = new DisabledCrmAdapter();
    const result = await adapter.upsertLead(lead, "key-1");
    expect(result.provider).toBe("disabled");
    expect((await adapter.health()).ok).toBe(true);
  });

  it("deduplicates by email in the fixture adapter", async () => {
    const adapter = new FixtureCrmAdapter();
    const first = await adapter.upsertLead(lead, "key-1");
    const second = await adapter.upsertLead({ ...lead, externalId: "receipt-2" }, "key-2");
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.contactId).toBe(first.contactId);
  });

  it("mirrors channel consent into provider do-not-disturb settings", async () => {
    let captured: Record<string, unknown> = {};
    const adapter = new GhlCrmAdapter({
      baseUrl: "https://provider.invalid",
      apiVersion: "2021-07-28",
      token: "secret-token",
      locationId: "loc_1",
      customFieldMap: { tract_receipt_id: "cf_1" },
      pipelineMap: {},
      fetchImpl: (async (_url: string, init: RequestInit) => {
        captured = JSON.parse(String(init.body)) as Record<string, unknown>;
        return new Response(JSON.stringify({ contact: { id: "c_1" }, new: true }), {
          status: 200,
          headers: { "content-type": "application/json", "x-request-id": "prov-1" }
        });
      }) as unknown as typeof fetch
    });

    const result = await adapter.upsertLead(lead, "key-1");
    expect(result.contactId).toBe("c_1");
    expect(result.requestId).toBe("prov-1");
    expect(captured.dndSettings).toEqual({
      SMS: { status: "active" },
      Email: { status: "inactive" }
    });
    // Only mapped custom fields are transmitted.
    expect(captured.customFields).toEqual([{ id: "cf_1", value: "receipt-1" }]);
  });

  it("does not leak the provider message on failure", async () => {
    const adapter = new GhlCrmAdapter({
      baseUrl: "https://provider.invalid",
      apiVersion: "2021-07-28",
      token: "secret-token",
      locationId: "loc_1",
      customFieldMap: {},
      pipelineMap: {},
      fetchImpl: (async () =>
        new Response(JSON.stringify({ message: "invalid token secret-token" }), {
          status: 401
        })) as unknown as typeof fetch
    });
    await expect(adapter.upsertLead(lead, "k")).rejects.toThrow(/status 401/);
    await expect(adapter.upsertLead(lead, "k")).rejects.not.toThrow(/secret-token/);
  });
});

describe("retry classification and outbox", () => {
  it("retries 5xx and 429 but never a 4xx", () => {
    expect(classifyHttpFailure(500)).toBe("retryable");
    expect(classifyHttpFailure(503)).toBe("retryable");
    expect(classifyHttpFailure(429)).toBe("rate_limited");
    expect(classifyHttpFailure(400)).toBe("terminal");
    expect(classifyHttpFailure(401)).toBe("terminal");
    expect(classifyHttpFailure(422)).toBe("terminal");
  });

  it("bounds backoff and applies jitter", () => {
    expect(backoffMs(1, () => 0)).toBe(1000);
    expect(backoffMs(1, () => 1)).toBe(2000);
    expect(backoffMs(30, () => 1)).toBeLessThanOrEqual(5 * 60 * 1000);
  });

  it("marks a row for retry on a transient failure", async () => {
    const crm = new FixtureCrmAdapter();
    crm.failNext(1);
    const outcome = await processOutboxRow(
      {
        id: "row-1",
        aggregateType: "lead",
        aggregateId: "lead-1",
        eventType: "lead.received",
        idempotencyKey: leadSyncIdempotencyKey("receipt-1", "lead.received"),
        payload: lead as unknown as Record<string, unknown>,
        attemptCount: 0
      },
      { crm, rng: () => 0.5 }
    );
    expect(outcome.status).toBe("retry");
  });

  it("dead-letters after the attempt ceiling rather than retrying forever", async () => {
    const crm = new FixtureCrmAdapter();
    crm.failNext(1);
    const outcome = await processOutboxRow(
      {
        id: "row-1",
        aggregateType: "lead",
        aggregateId: "lead-1",
        eventType: "lead.received",
        idempotencyKey: "k",
        payload: lead as unknown as Record<string, unknown>,
        attemptCount: 5
      },
      { crm, maxAttempts: 6 }
    );
    expect(outcome.status).toBe("dead");
  });

  it("succeeds and returns a contact id", async () => {
    const outcome = await processOutboxRow(
      {
        id: "row-1",
        aggregateType: "lead",
        aggregateId: "lead-1",
        eventType: "lead.received",
        idempotencyKey: "k",
        payload: lead as unknown as Record<string, unknown>,
        attemptCount: 0
      },
      { crm: new FixtureCrmAdapter() }
    );
    expect(outcome.status).toBe("succeeded");
  });

  it("produces a stable idempotency key across retries", () => {
    expect(leadSyncIdempotencyKey("r1", "lead.received")).toBe(
      leadSyncIdempotencyKey("r1", "lead.received")
    );
    expect(leadSyncIdempotencyKey("r1", "lead.received")).not.toBe(
      leadSyncIdempotencyKey("r2", "lead.received")
    );
  });
});

describe("webhook verification", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const body = JSON.stringify({ webhookId: "evt_1", type: "ContactCreate" });
  const signature = signBytes(null, Buffer.from(body, "utf8"), privateKey).toString("base64");

  it("accepts a correctly signed payload", () => {
    const result = verifyWebhook({ rawBody: body, signature, publicKeyPem });
    expect(result.ok).toBe(true);
    expect(result.ok === true && result.eventId).toBe("evt_1");
  });

  it("rejects a tampered payload", () => {
    const tampered = JSON.stringify({ webhookId: "evt_1", type: "ContactDelete" });
    const result = verifyWebhook({ rawBody: tampered, signature, publicKeyPem });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe("invalid_signature");
  });

  it("refuses to verify when no public key is configured", () => {
    const result = verifyWebhook({ rawBody: body, signature, publicKeyPem: undefined });
    expect(result.ok === false && result.reason).toBe("missing_public_key");
  });

  it("rejects a missing signature", () => {
    const result = verifyWebhook({ rawBody: body, signature: null, publicKeyPem });
    expect(result.ok === false && result.reason).toBe("missing_signature");
  });

  it("rejects a replayed payload outside the tolerance window", () => {
    const result = verifyWebhook({
      rawBody: body,
      signature,
      publicKeyPem,
      timestampMs: 1_000_000,
      now: 1_000_000 + 10 * 60 * 1000
    });
    expect(result.ok === false && result.reason).toBe("stale_timestamp");
  });

  it("deduplicates a repeated event id", async () => {
    const store = new InMemoryWebhookDedupeStore();
    expect(await store.claim("evt_1")).toBe(true);
    expect(await store.claim("evt_1")).toBe(false);
  });
});

describe("listing provider", () => {
  it("returns nothing when no agreement is configured", async () => {
    const page = await new DisabledListingProvider().search();
    expect(page.items).toHaveLength(0);
  });

  it("filters, paginates, and reports data-as-of", async () => {
    const provider = new FixtureListingProvider();
    const first = await provider.search({ market: "FL", limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBe("2");
    expect(first.dataAsOf).toBeTruthy();

    const filtered = await provider.search({
      market: "FL",
      limit: 10,
      minBeds: 4,
      status: ["active"]
    });
    expect(filtered.items.every((item) => (item.bedrooms ?? 0) >= 4)).toBe(true);
  });

  it("keeps attribution on every record", async () => {
    const page = await new FixtureListingProvider().search({ market: "FL", limit: 10 });
    expect(page.items.every((item) => item.attributionText.length > 0)).toBe(true);
  });

  it("refuses to display fixture records when fixtures are not allowed", async () => {
    const listing = await new FixtureListingProvider().getByKey("FX-TPA-0001");
    expect(listing).not.toBeNull();
    if (listing !== null) {
      expect(isDisplayable(listing, true)).toBe(true);
      expect(isDisplayable(listing, false)).toBe(false);
    }
  });

  it("unpublishes records that vanished from the provider or lost display status", async () => {
    // The limit covers the whole fixture corpus: this asserts on which records
    // are stale, not on which ones fit a page.
    const page = await new FixtureListingProvider().search({ market: "FL", limit: 100 });
    const stale = recordsToUnpublish(page.items, new Set(["FX-TPA-0001", "FX-ORL-0002"]));
    expect(stale.map((item) => item.listingKey)).toContain("FX-JAX-0003");
    // A closed record is unpublished even if the provider still returns it.
    expect(stale.map((item) => item.listingKey)).toContain("FX-SRQ-0005");
  });

  it("never fetches a pasted link and blocks private hosts and odd schemes", () => {
    expect(resolvePastedLink("https://www.zillow.com/homedetails/123")).toEqual({
      kind: "address_confirmation_required",
      hostname: "www.zillow.com"
    });
    expect(resolvePastedLink("http://127.0.0.1/admin")).toEqual({
      kind: "rejected",
      reason: "private_host"
    });
    expect(resolvePastedLink("http://169.254.169.254/latest/meta-data/")).toEqual({
      kind: "rejected",
      reason: "private_host"
    });
    expect(resolvePastedLink("file:///etc/passwd")).toEqual({
      kind: "rejected",
      reason: "unsupported_scheme"
    });
    expect(resolvePastedLink("not a url")).toEqual({ kind: "rejected", reason: "malformed" });
  });
});

describe("AI budget and quotas", () => {
  const policy = {
    subjectKind: "consumer" as const,
    feature: "vision_report",
    period: "day" as const,
    requestLimit: 3,
    costLimitCents: 500,
    concurrencyLimit: 1,
    enabled: true
  };
  const noUsage = { requestsInPeriod: 0, reservedCents: 0, chargedCents: 0, inFlight: 0 };

  it("allows a request inside every limit", () => {
    const decision = evaluateReservation({
      request: {
        feature: "vision_report",
        subjectKind: "consumer",
        estimatedCostCents: 100,
        maxCostCents: 200
      },
      subjectPolicy: policy,
      platformPolicy: undefined,
      subjectUsage: noUsage,
      platformUsage: noUsage
    });
    expect(decision).toEqual({ allowed: true, reservedCents: 100 });
  });

  it("denies when no policy exists rather than defaulting to allow", () => {
    const decision = evaluateReservation({
      request: {
        feature: "vision_report",
        subjectKind: "consumer",
        estimatedCostCents: 1,
        maxCostCents: 100
      },
      subjectPolicy: undefined,
      platformPolicy: undefined,
      subjectUsage: noUsage,
      platformUsage: noUsage
    });
    expect(decision.allowed).toBe(false);
    expect(decision.allowed === false && decision.reason).toBe("feature_disabled");
  });

  it("counts reserved spend against the limit, not just charged spend", () => {
    const decision = evaluateReservation({
      request: {
        feature: "vision_report",
        subjectKind: "consumer",
        estimatedCostCents: 200,
        maxCostCents: 500
      },
      subjectPolicy: policy,
      platformPolicy: undefined,
      subjectUsage: { requestsInPeriod: 1, reservedCents: 350, chargedCents: 0, inFlight: 0 },
      platformUsage: noUsage
    });
    expect(decision.allowed === false && decision.reason).toBe("cost_limit");
  });

  it("enforces concurrency and request ceilings", () => {
    const busy = evaluateReservation({
      request: {
        feature: "vision_report",
        subjectKind: "consumer",
        estimatedCostCents: 10,
        maxCostCents: 100
      },
      subjectPolicy: policy,
      platformPolicy: undefined,
      subjectUsage: { ...noUsage, inFlight: 1 },
      platformUsage: noUsage
    });
    expect(busy.allowed === false && busy.reason).toBe("concurrency_limit");

    const exhausted = evaluateReservation({
      request: {
        feature: "vision_report",
        subjectKind: "consumer",
        estimatedCostCents: 10,
        maxCostCents: 100
      },
      subjectPolicy: policy,
      platformPolicy: undefined,
      subjectUsage: { ...noUsage, requestsInPeriod: 3 },
      platformUsage: noUsage
    });
    expect(exhausted.allowed === false && exhausted.reason).toBe("request_limit");
  });

  it("stops an allowed user when the platform ceiling is reached", () => {
    const decision = evaluateReservation({
      request: {
        feature: "vision_report",
        subjectKind: "consumer",
        estimatedCostCents: 100,
        maxCostCents: 500
      },
      subjectPolicy: policy,
      platformPolicy: { ...policy, subjectKind: "platform", costLimitCents: 1_000 },
      subjectUsage: noUsage,
      platformUsage: { requestsInPeriod: 40, reservedCents: 950, chargedCents: 0, inFlight: 3 }
    });
    expect(decision.allowed === false && decision.reason).toBe("platform_budget");
  });

  it("never tells an anonymous caller how much budget remains", () => {
    const decision = evaluateReservation({
      request: {
        feature: "vision_report",
        subjectKind: "anonymous",
        estimatedCostCents: 100,
        maxCostCents: 500
      },
      subjectPolicy: { ...policy, subjectKind: "anonymous", costLimitCents: 10 },
      platformPolicy: undefined,
      subjectUsage: noUsage,
      platformUsage: noUsage
    });
    expect(Object.keys(decision)).toEqual(["allowed", "reason", "retryAfterSeconds"]);
  });
});

describe("reservation settlement", () => {
  it("charges the actual cost and releases the surplus", () => {
    const settlement = settleReservation({
      reservedCents: 100,
      outcome: { kind: "succeeded", actualCostCents: 62 }
    });
    expect(settlement.netChargedCents).toBe(62);
    expect(settlement.entries).toEqual([
      { kind: "charge", amountCents: 62, reason: "provider succeeded" },
      { kind: "release", amountCents: 38, reason: "reservation exceeded actual cost" }
    ]);
  });

  it("adjusts upward when the provider cost overran the reservation", () => {
    const settlement = settleReservation({
      reservedCents: 50,
      outcome: { kind: "succeeded", actualCostCents: 80 }
    });
    expect(settlement.entries.some((entry) => entry.kind === "adjustment")).toBe(true);
  });

  it("releases everything when nothing billable happened", () => {
    const settlement = settleReservation({
      reservedCents: 100,
      outcome: { kind: "failed_before_billable" }
    });
    expect(settlement.netChargedCents).toBe(0);
    expect(settlement.entries[0]?.kind).toBe("release");
  });

  it("still charges when the provider billed before failing", () => {
    const settlement = settleReservation({
      reservedCents: 100,
      outcome: { kind: "failed_after_billable", actualCostCents: 70 }
    });
    expect(settlement.netChargedCents).toBe(70);
  });

  it("holds the reservation for reconciliation on an unknown outcome", () => {
    const settlement = settleReservation({ reservedCents: 100, outcome: { kind: "unknown" } });
    expect(settlement.entries).toHaveLength(0);
    expect(settlement.requiresReconciliation).toBe(true);
  });
});

describe("AI job state machine", () => {
  it("permits the normal path", () => {
    expect(() => {
      assertTransition("created", "budget_reserved");
      assertTransition("budget_reserved", "queued");
      assertTransition("queued", "submitted");
      assertTransition("submitted", "processing");
      assertTransition("processing", "succeeded");
    }).not.toThrow();
  });

  it("refuses to skip budget reservation", () => {
    expect(() => assertTransition("created", "submitted")).toThrow(JobTransitionError);
  });

  it("refuses to reopen a terminal job", () => {
    expect(() => assertTransition("succeeded", "processing")).toThrow(JobTransitionError);
    expect(() => assertTransition("cancelled", "queued")).toThrow(JobTransitionError);
  });
});

describe("AI provider policy", () => {
  const route: ModelRoute = {
    key: "narrative",
    capability: "text_reasoning",
    provider: "fixture",
    providerModel: "configured-at-runtime",
    enabled: true,
    maxInputBytes: 100_000,
    timeoutMs: 30_000,
    fallbackKeys: [],
    allowedDataClasses: ["public", "internal", "consumer_property"]
  };
  const request: AiRequest<{ text: string }> = {
    capability: "text_reasoning",
    feature: "vision_narrative",
    input: { text: "summarize" },
    outputSchemaKey: "narrative.v1",
    promptKey: "vision.narrative",
    promptVersion: "1.0.0",
    dataClass: "consumer_property",
    maxCostCents: 20,
    timeoutMs: 30_000,
    idempotencyKey: "job-1"
  };

  it("refuses every request when AI is disabled", async () => {
    await expect(new DisabledAiProvider().execute()).rejects.toThrow(AiPolicyError);
  });

  it("blocks restricted data from reaching any provider", () => {
    expect(() =>
      selectRoute([route], "narrative", { ...request, dataClass: "restricted" })
    ).toThrow(AiPolicyError);
  });

  it("blocks a data class the route was never cleared for", () => {
    expect(() =>
      selectRoute([route], "narrative", { ...request, dataClass: "consumer_contact" })
    ).toThrow(AiPolicyError);
  });

  it("falls back to a cleared route instead of failing outright", () => {
    const primary: ModelRoute = {
      ...route,
      key: "primary",
      enabled: false,
      fallbackKeys: ["backup"]
    };
    const backup: ModelRoute = { ...route, key: "backup" };
    expect(selectRoute([primary, backup], "primary", request).key).toBe("backup");
  });

  it("records the prompt version on every result", async () => {
    const provider = new FixtureAiProvider(() => ({ summary: "ok" }));
    const result = await provider.execute(request, "model-key");
    expect(result.promptVersion).toBe("1.0.0");
    expect(result.actualCostCents).toBe(1);
  });

  it("repairs a malformed result exactly once, then gives up", async () => {
    let call = 0;
    const provider = new FixtureAiProvider(() => {
      call += 1;
      return call === 1 ? { wrong: true } : { summary: "recovered" };
    });
    const validate = (value: unknown) =>
      typeof (value as { summary?: unknown }).summary === "string"
        ? ({ ok: true, value: value as { summary: string } } as const)
        : ({ ok: false, error: "missing summary" } as const);

    const outcome = await executeWithValidation(provider, request, "m", validate);
    expect(outcome.status).toBe("valid");
    expect(outcome.status === "valid" && outcome.repaired).toBe(true);
    expect(call).toBe(2);

    const alwaysBad = new FixtureAiProvider(() => ({ wrong: true }));
    const failed = await executeWithValidation(alwaysBad, request, "m", validate);
    expect(failed.status).toBe("unusable");
    expect(alwaysBad.calls).toHaveLength(2);
  });
});

describe("property data provenance", () => {
  it("carries a map effective date and a non-determination limitation for flood", async () => {
    const result = await new FixtureFloodPort().lookup();
    expect(result).not.toBeNull();
    expect(result?.value.mapEffectiveDate).toBeTruthy();
    expect(result?.provenance.limitations.join(" ")).toMatch(/not a flood determination/i);
  });

  it("tells the reader zoning must be confirmed with the jurisdiction", async () => {
    const result = await new FixtureZoningPort().lookup("p-1");
    expect(result?.value.officialRecordUrl).toBeTruthy();
    expect(result?.provenance.limitations.join(" ")).toMatch(/confirmed with the jurisdiction/i);
  });
});

describe("Turnstile verification", () => {
  it("passes through when disabled", async () => {
    expect(await verifyTurnstile(undefined, undefined, { mode: "disabled" })).toEqual({
      ok: true,
      mode: "disabled"
    });
  });

  it("requires a token in every non-disabled mode", async () => {
    const result = await verifyTurnstile(undefined, undefined, { mode: "fixture" });
    expect(result.ok === false && result.reason).toBe("missing_token");
  });

  it("exercises both fixture outcomes", async () => {
    expect((await verifyTurnstile("anything", undefined, { mode: "fixture" })).ok).toBe(true);
    expect((await verifyTurnstile(FIXTURE_FAILING_TOKEN, undefined, { mode: "fixture" })).ok).toBe(
      false
    );
  });

  it("fails closed when the secret is missing in production mode", async () => {
    const result = await verifyTurnstile("token", undefined, { mode: "production" });
    expect(result.ok === false && result.reason).toBe("unavailable");
  });

  it("treats a provider outage as unavailable rather than a pass", async () => {
    const result = await verifyTurnstile("token", "203.0.113.9", {
      mode: "production",
      secretKey: "secret",
      fetchImpl: (async () => {
        throw new Error("network down");
      }) as unknown as typeof fetch
    });
    expect(result.ok === false && result.reason).toBe("unavailable");
  });

  it("rejects when the provider says the token is invalid", async () => {
    const result = await verifyTurnstile("token", undefined, {
      mode: "production",
      secretKey: "secret",
      fetchImpl: (async () =>
        new Response(JSON.stringify({ success: false }), {
          status: 200
        })) as unknown as typeof fetch
    });
    expect(result.ok === false && result.reason).toBe("rejected");
  });
});
