import {
  type CrmHealth,
  type CrmLead,
  type CrmPort,
  type CrmSyncResult,
  assertCrmPayloadSafe,
  classifyHttpFailure
} from "./port";

/** Records nothing externally. The default so the site runs with no CRM configured. */
export class DisabledCrmAdapter implements CrmPort {
  readonly key = "disabled";

  // The signature mirrors the port exactly, including the unused idempotency
  // key, so a caller holding a concrete DisabledCrmAdapter is interchangeable
  // with one holding a CrmPort.
  async upsertLead(input: CrmLead, _idempotencyKey: string): Promise<CrmSyncResult> {
    assertCrmPayloadSafe(input as unknown as Record<string, unknown>);
    return { provider: "disabled", contactId: `disabled:${input.externalId}`, created: false };
  }

  async addOpportunity(): Promise<{ opportunityId: string }> {
    return { opportunityId: "disabled" };
  }

  async recordNote(): Promise<void> {
    /* no external effect */
  }

  async health(): Promise<CrmHealth> {
    return {
      ok: true,
      mode: "disabled",
      detail: "CRM sync is switched off; leads are stored first-party only.",
      checkedAt: new Date().toISOString()
    };
  }
}

/** Deterministic in-memory double for tests and local development. */
export class FixtureCrmAdapter implements CrmPort {
  readonly key = "fixture";
  readonly contacts = new Map<string, CrmLead>();
  readonly notes: { contactId: string; body: string }[] = [];
  readonly opportunities: { contactId: string; pipelineKey: string; stageKey: string }[] = [];
  private readonly seenIdempotencyKeys = new Set<string>();
  private failNextTimes = 0;

  /** Test hook: force the next N calls to fail as a transient provider error. */
  failNext(times: number): void {
    this.failNextTimes = times;
  }

  private maybeFail(): void {
    if (this.failNextTimes > 0) {
      this.failNextTimes -= 1;
      const error = new Error("fixture transient failure") as Error & { status?: number };
      error.status = 503;
      throw error;
    }
  }

  async upsertLead(input: CrmLead, idempotencyKey: string): Promise<CrmSyncResult> {
    assertCrmPayloadSafe(input as unknown as Record<string, unknown>);
    this.maybeFail();
    const existingByEmail = [...this.contacts.values()].find((c) => c.email === input.email);
    const replay = this.seenIdempotencyKeys.has(idempotencyKey);
    this.seenIdempotencyKeys.add(idempotencyKey);

    const contactId = existingByEmail
      ? `fixture:${existingByEmail.externalId}`
      : `fixture:${input.externalId}`;
    this.contacts.set(contactId, input);
    return {
      provider: "fixture",
      contactId,
      created: existingByEmail === undefined && !replay,
      requestId: `fixture-req-${this.seenIdempotencyKeys.size}`
    };
  }

  async addOpportunity(input: {
    contactId: string;
    pipelineKey: string;
    stageKey: string;
  }): Promise<{ opportunityId: string }> {
    this.maybeFail();
    this.opportunities.push(input);
    return { opportunityId: `fixture-opp-${this.opportunities.length}` };
  }

  async recordNote(input: { contactId: string; body: string }): Promise<void> {
    this.maybeFail();
    this.notes.push(input);
  }

  async health(): Promise<CrmHealth> {
    return {
      ok: true,
      mode: "fixture",
      detail: "In-memory CRM double. Never use outside development and tests.",
      checkedAt: new Date().toISOString()
    };
  }
}

export type GhlConfig = {
  baseUrl: string;
  apiVersion: string;
  token: string;
  locationId: string;
  /** Internal semantic key -> provider custom field id. Configuration, not code. */
  customFieldMap: Record<string, string>;
  pipelineMap: Record<string, { pipelineId: string; stages: Record<string, string> }>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export class CrmRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly failureClass: ReturnType<typeof classifyHttpFailure>,
    readonly providerRequestId?: string
  ) {
    super(message);
    this.name = "CrmRequestError";
  }
}

/**
 * GoHighLevel adapter.
 *
 * Never called from the browser. The token stays server-side, the payload is
 * screened before transmission, and the provider request id is captured for
 * reconciliation. Endpoint paths and field ids are configuration so a provider
 * change does not require touching feature code.
 */
export class GhlCrmAdapter implements CrmPort {
  readonly key = "ghl";

  constructor(private readonly config: GhlConfig) {}

  private get fetchImpl(): typeof fetch {
    return this.config.fetchImpl ?? fetch;
  }

  private async request<T>(
    path: string,
    init: { method: string; body?: unknown; idempotencyKey?: string }
  ): Promise<{ data: T; requestId?: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 10_000);
    try {
      const response = await this.fetchImpl(new URL(path, this.config.baseUrl).toString(), {
        method: init.method,
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Version: this.config.apiVersion,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(init.idempotencyKey === undefined ? {} : { "Idempotency-Key": init.idempotencyKey })
        },
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
        signal: controller.signal
      });

      const requestId = response.headers.get("x-request-id") ?? undefined;
      if (!response.ok) {
        // The provider message is deliberately not propagated to the caller.
        throw new CrmRequestError(
          `crm request failed with status ${response.status}`,
          response.status,
          classifyHttpFailure(response.status),
          requestId
        );
      }
      const data = (await response.json()) as T;
      return { data, ...(requestId === undefined ? {} : { requestId }) };
    } finally {
      clearTimeout(timeout);
    }
  }

  async upsertLead(input: CrmLead, idempotencyKey: string): Promise<CrmSyncResult> {
    assertCrmPayloadSafe(input as unknown as Record<string, unknown>);

    const customFields = Object.entries({
      tract_receipt_id: input.externalId,
      tract_intent: input.intent,
      tract_timeline: input.timeline ?? "",
      tract_source_path: input.sourcePath,
      tract_disclosure_version: input.consent.disclosureVersion,
      tract_consent_received_at: input.consent.receivedAtIso,
      tract_utm_source: input.attribution.utmSource ?? "",
      tract_utm_medium: input.attribution.utmMedium ?? "",
      tract_utm_campaign: input.attribution.utmCampaign ?? "",
      tract_gclid: input.attribution.gclid ?? ""
    })
      .filter(([key, value]) => value !== "" && this.config.customFieldMap[key] !== undefined)
      .map(([key, value]) => ({ id: this.config.customFieldMap[key] as string, value }));

    const { data, requestId } = await this.request<{ contact: { id: string }; new?: boolean }>(
      "/contacts/upsert",
      {
        method: "POST",
        idempotencyKey,
        body: {
          locationId: this.config.locationId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phoneE164,
          source: input.sourcePath,
          tags: input.tags,
          customFields,
          // Channel consent is mirrored so CRM automation cannot outrun the ledger.
          dndSettings: {
            SMS: { status: input.consent.smsMarketing ? "inactive" : "active" },
            Email: { status: input.consent.emailMarketing ? "inactive" : "active" }
          }
        }
      }
    );

    return {
      provider: "ghl",
      contactId: data.contact.id,
      created: data.new === true,
      ...(requestId === undefined ? {} : { requestId })
    };
  }

  async addOpportunity(
    input: {
      contactId: string;
      pipelineKey: string;
      stageKey: string;
      monetaryValueCents?: number;
    },
    idempotencyKey: string
  ): Promise<{ opportunityId: string }> {
    const pipeline = this.config.pipelineMap[input.pipelineKey];
    if (pipeline === undefined) {
      throw new Error(`pipeline "${input.pipelineKey}" is not mapped in configuration`);
    }
    const stageId = pipeline.stages[input.stageKey];
    if (stageId === undefined) {
      throw new Error(
        `stage "${input.stageKey}" is not mapped for pipeline "${input.pipelineKey}"`
      );
    }

    const { data } = await this.request<{ opportunity: { id: string } }>("/opportunities/", {
      method: "POST",
      idempotencyKey,
      body: {
        locationId: this.config.locationId,
        contactId: input.contactId,
        pipelineId: pipeline.pipelineId,
        pipelineStageId: stageId,
        status: "open",
        ...(input.monetaryValueCents === undefined
          ? {}
          : { monetaryValue: input.monetaryValueCents / 100 })
      }
    });
    return { opportunityId: data.opportunity.id };
  }

  async recordNote(
    input: { contactId: string; body: string },
    idempotencyKey: string
  ): Promise<void> {
    await this.request(`/contacts/${encodeURIComponent(input.contactId)}/notes`, {
      method: "POST",
      idempotencyKey,
      body: { body: input.body }
    });
  }

  async health(): Promise<CrmHealth> {
    try {
      await this.request(`/locations/${encodeURIComponent(this.config.locationId)}`, {
        method: "GET"
      });
      return {
        ok: true,
        mode: "production",
        detail: "Location reachable.",
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      const status = error instanceof CrmRequestError ? error.status : 0;
      return {
        ok: false,
        mode: "production",
        detail: `Location check failed with status ${status}.`,
        checkedAt: new Date().toISOString()
      };
    }
  }
}
