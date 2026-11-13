import { createHash } from "node:crypto";

import {
  type FailureClass,
  assertCrmPayloadSafe,
  backoffMs,
  classifyHttpFailure
} from "../crm/port";
import type {
  LeadConversionDispatch,
  MetaCapiHealth,
  MetaCapiPort,
  MetaCapiResult,
  MetaConversionEvent,
  MetaLeadSource,
  MetaUserData
} from "./ports";

/**
 * Meta Conversions API adapters and the mapping that feeds them.
 *
 * The retry classification, the payload screen, and the backoff are reused from
 * the CRM port rather than reimplemented: a conversion send has exactly the same
 * transient-versus-terminal profile as a CRM write, and a second copy of that
 * logic is a second thing to get wrong.
 */

// --- Normalization and hashing -------------------------------------------------

/** Meta's email normalization: trim surrounding whitespace and lowercase. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Meta's phone normalization: keep the digits, drop everything else. The country
 * code is preserved because it is already part of the E.164 value we store; only
 * the `+` and any separators are removed.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** SHA-256 as lowercase hex — the encoding Meta requires for hashed identifiers. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Hash an email, or return undefined when there is nothing to hash. Hashing an
 * empty string is a real footgun: it produces the SHA-256 of "", a constant that
 * every consentless or malformed lead would share, so Meta would match them all
 * to one phantom person. An absent identifier must stay absent.
 */
export function hashEmail(email: string | undefined | null): string | undefined {
  if (email === undefined || email === null) return undefined;
  const normalized = normalizeEmail(email);
  if (normalized === "") return undefined;
  return sha256Hex(normalized);
}

/** Hash a phone, or return undefined when there is nothing to hash. Never hash "". */
export function hashPhone(phone: string | undefined | null): string | undefined {
  if (phone === undefined || phone === null) return undefined;
  const normalized = normalizePhone(phone);
  if (normalized === "") return undefined;
  return sha256Hex(normalized);
}

/**
 * Build the `fbc` click id from the `fbclid` query parameter Meta put on the ad
 * click. The format is fixed by Meta: `fb.<subdomainIndex>.<observedAtMs>.<fbclid>`.
 * Returns undefined when there is no click id, so a lead that did not arrive via
 * a Meta ad simply carries no click id rather than a malformed one.
 */
export function buildFbc(
  fbclid: string | undefined | null,
  observedAtMs: number,
  subdomainIndex = 1
): string | undefined {
  if (fbclid === undefined || fbclid === null || fbclid === "") return undefined;
  return `fb.${subdomainIndex}.${observedAtMs}.${fbclid}`;
}

/**
 * The consent predicate. Only an explicit email- or SMS-marketing opt-in counts.
 * `privacyAccepted` and `contactRequested` are literally true on every lead and
 * say nothing about marketing consent, so they are deliberately not consulted.
 */
export function hasMarketingConsent(
  consent: { emailMarketing?: boolean; smsMarketing?: boolean } | null | undefined
): boolean {
  return consent?.emailMarketing === true || consent?.smsMarketing === true;
}

// --- Mapping -------------------------------------------------------------------

export type MetaMapConfig = {
  /** Absolute origin used to resolve `sourcePath` into an `event_source_url`. */
  siteBaseUrl?: string;
};

function parseIsoToMs(iso: string | undefined): number {
  if (iso !== undefined) {
    const parsed = Date.parse(iso);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

function buildEventSourceUrl(
  sourcePath: string | undefined,
  siteBaseUrl: string | undefined
): string | undefined {
  if (sourcePath === undefined || siteBaseUrl === undefined) return undefined;
  try {
    const url = new URL(sourcePath, siteBaseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Map a lead payload to a conversion event, or null when there is no hashable
 * identifier. The event is assembled field by field from a whitelist — the lead
 * is never spread — so the only contact data that can leave is the hashed `em`
 * and `ph`. The `event_time` is the consent receipt time (not the send time) so
 * a retry does not shift the event, and `event_id` is our submission id so this
 * server event deduplicates against the browser pixel.
 */
export function mapLeadToConversion(
  src: MetaLeadSource,
  cfg?: MetaMapConfig
): MetaConversionEvent | null {
  const em = hashEmail(src.email);
  const ph = hashPhone(src.phoneE164);
  // Without at least one hashable identifier there is nothing for Meta to match
  // on, so there is no event worth sending.
  if (em === undefined && ph === undefined) return null;

  const observedAtMs = parseIsoToMs(src.consent?.receivedAtIso);
  const fbc = buildFbc(src.attribution?.fbclid, observedAtMs);

  const userData: MetaUserData = {
    ...(em === undefined ? {} : { em }),
    ...(ph === undefined ? {} : { ph }),
    ...(fbc === undefined ? {} : { fbc })
  };

  const eventSourceUrl = buildEventSourceUrl(src.sourcePath, cfg?.siteBaseUrl);

  return {
    event_name: "Lead",
    event_time: Math.floor(observedAtMs / 1000),
    event_id: src.externalId ?? "",
    action_source: "website",
    ...(eventSourceUrl === undefined ? {} : { event_source_url: eventSourceUrl }),
    user_data: userData,
    ...(src.intent === undefined ? {} : { custom_data: { lead_intent: src.intent } })
  };
}

// --- Defensive payload decoding ------------------------------------------------

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * Read the fields the mapper needs out of an untrusted outbox payload. Anything
 * of the wrong type is dropped rather than coerced, so a malformed payload
 * degrades to "not enough to send" instead of throwing.
 */
export function parseMetaLeadSource(payload: unknown): MetaLeadSource {
  const record = asRecord(payload) ?? {};
  const consent = asRecord(record.consent);
  const attribution = asRecord(record.attribution);

  const externalId = asString(record.externalId);
  const firstName = asString(record.firstName);
  const lastName = asString(record.lastName);
  const email = asString(record.email);
  const phoneE164 = asString(record.phoneE164);
  const intent = asString(record.intent);
  const sourcePath = asString(record.sourcePath);

  const smsMarketing = consent === undefined ? undefined : asBoolean(consent.smsMarketing);
  const emailMarketing = consent === undefined ? undefined : asBoolean(consent.emailMarketing);
  const receivedAtIso = consent === undefined ? undefined : asString(consent.receivedAtIso);

  const utmSource = attribution === undefined ? undefined : asString(attribution.utmSource);
  const utmMedium = attribution === undefined ? undefined : asString(attribution.utmMedium);
  const utmCampaign = attribution === undefined ? undefined : asString(attribution.utmCampaign);
  const gclid = attribution === undefined ? undefined : asString(attribution.gclid);
  const fbclid = attribution === undefined ? undefined : asString(attribution.fbclid);

  const consentOut =
    consent === undefined
      ? undefined
      : {
          ...(smsMarketing === undefined ? {} : { smsMarketing }),
          ...(emailMarketing === undefined ? {} : { emailMarketing }),
          ...(receivedAtIso === undefined ? {} : { receivedAtIso })
        };

  const attributionOut =
    attribution === undefined
      ? undefined
      : {
          ...(utmSource === undefined ? {} : { utmSource }),
          ...(utmMedium === undefined ? {} : { utmMedium }),
          ...(utmCampaign === undefined ? {} : { utmCampaign }),
          ...(gclid === undefined ? {} : { gclid }),
          ...(fbclid === undefined ? {} : { fbclid })
        };

  return {
    ...(externalId === undefined ? {} : { externalId }),
    ...(firstName === undefined ? {} : { firstName }),
    ...(lastName === undefined ? {} : { lastName }),
    ...(email === undefined ? {} : { email }),
    ...(phoneE164 === undefined ? {} : { phoneE164 }),
    ...(intent === undefined ? {} : { intent }),
    ...(sourcePath === undefined ? {} : { sourcePath }),
    ...(consentOut === undefined ? {} : { consent: consentOut }),
    ...(attributionOut === undefined ? {} : { attribution: attributionOut })
  };
}

// --- Dispatch ------------------------------------------------------------------

export type DispatchOptions = {
  /** Total attempts before giving up on a retryable failure. Defaults to 3. */
  maxAttempts?: number;
  /** Deterministic jitter source for tests. */
  rng?: () => number;
  /** Injectable sleep so tests do not actually wait out the backoff. */
  sleep?: (ms: number) => Promise<void>;
  mapConfig?: MetaMapConfig;
  /**
   * The outbox event type, when the caller wants dispatch to enforce it. Omitted
   * by the drain, which guards the event type before calling. When provided and
   * not `lead.received`, dispatch skips with `unsupported_event`.
   */
  eventType?: string;
};

function classifyDispatchError(error: unknown): { failureClass: FailureClass; code: string } {
  if (error instanceof MetaCapiRequestError) {
    return { failureClass: error.failureClass, code: `${error.failureClass}:${error.status}` };
  }
  // A thrown error with no HTTP status is a network or abort failure. Like the
  // outbox, that is treated as retryable; only a real 4xx is terminal.
  const rawStatus = (error as { status?: unknown }).status;
  const status = typeof rawStatus === "number" ? rawStatus : 0;
  const failureClass: FailureClass = status === 0 ? "retryable" : classifyHttpFailure(status);
  return { failureClass, code: `${failureClass}:${status}` };
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dispatch a lead conversion to Meta. This is the whole enforcement path, and it
 * never throws: every exit is a `LeadConversionDispatch`. Order matters — the
 * disabled short-circuit and the consent gate run before anything is built or
 * sent, so a consentless lead never even gets mapped, let alone transmitted.
 */
export async function dispatchLeadConversion(
  capi: MetaCapiPort,
  payload: unknown,
  opts?: DispatchOptions
): Promise<LeadConversionDispatch> {
  if (opts?.eventType !== undefined && opts.eventType !== "lead.received") {
    return { status: "skipped", reason: "unsupported_event" };
  }

  // A disabled adapter does nothing and must not be handed any data at all.
  if (capi.key === "disabled") {
    return { status: "skipped", reason: "disabled" };
  }

  const source = parseMetaLeadSource(payload);

  // Consent gate. This is the load-bearing check: no marketing consent, no
  // transmission, and no network call is ever made.
  if (!hasMarketingConsent(source.consent)) {
    return { status: "skipped", reason: "no_consent" };
  }

  const event = mapLeadToConversion(source, opts?.mapConfig);
  if (event === null) {
    return { status: "skipped", reason: "insufficient_identifiers" };
  }

  // Second barrier over the whitelist: prove the assembled event carries no
  // prohibited key before it can be transmitted. A whitelisted event always
  // passes; if it somehow did not, that is a terminal defect, not a retry.
  try {
    assertCrmPayloadSafe(event as unknown as Record<string, unknown>);
  } catch {
    return {
      status: "failed",
      failureClass: "terminal",
      code: "terminal:unsafe_payload",
      attempts: 0
    };
  }

  const maxAttempts = opts?.maxAttempts ?? 3;
  const rng = opts?.rng ?? Math.random;
  const sleep = opts?.sleep ?? defaultSleep;

  let attempts = 0;
  let lastFailureClass: FailureClass = "retryable";
  let lastCode = "retryable:0";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    attempts = attempt;
    try {
      const result = await capi.send(event);
      return {
        status: "sent",
        eventsReceived: result.eventsReceived,
        ...(result.fbtraceId === undefined ? {} : { fbtraceId: result.fbtraceId })
      };
    } catch (error) {
      const classified = classifyDispatchError(error);
      lastFailureClass = classified.failureClass;
      lastCode = classified.code;

      // A 4xx will not become a 2xx on a later attempt, so give up immediately.
      if (classified.failureClass === "terminal") {
        return { status: "failed", failureClass: lastFailureClass, code: lastCode, attempts };
      }
      if (attempt >= maxAttempts) {
        return { status: "failed", failureClass: lastFailureClass, code: lastCode, attempts };
      }
      await sleep(backoffMs(attempt, rng));
    }
  }

  return { status: "failed", failureClass: lastFailureClass, code: lastCode, attempts };
}

// --- Adapters ------------------------------------------------------------------

/** Transmits nothing. The default, so the site runs with Meta CAPI unconfigured. */
export class DisabledMetaCapiAdapter implements MetaCapiPort {
  readonly key = "disabled";

  // The signature mirrors the port exactly, including the unused event, so a
  // caller holding a concrete DisabledMetaCapiAdapter is interchangeable with
  // one holding a MetaCapiPort.
  async send(_event: MetaConversionEvent): Promise<MetaCapiResult> {
    // Never reached through dispatch (it short-circuits on `key === "disabled"`),
    // but a direct caller still gets a well-formed no-op rather than a throw.
    return { provider: "disabled", eventsReceived: 0 };
  }

  async health(): Promise<MetaCapiHealth> {
    return {
      ok: true,
      mode: "disabled",
      detail: "Meta CAPI is switched off; no conversions are transmitted.",
      checkedAt: new Date().toISOString()
    };
  }
}

/** Deterministic in-memory double for tests and local development. */
export class FixtureMetaCapiAdapter implements MetaCapiPort {
  readonly key = "fixture";
  readonly events: MetaConversionEvent[] = [];
  private failNextTimes = 0;

  /** Test hook: force the next N sends to fail as a transient (retryable) error. */
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

  async send(event: MetaConversionEvent): Promise<MetaCapiResult> {
    // Fail before recording, so a failed attempt leaves no event behind and a
    // later successful retry records exactly one.
    this.maybeFail();
    this.events.push(event);
    return {
      provider: "fixture",
      eventsReceived: 1,
      fbtraceId: `fixture-trace-${this.events.length}`
    };
  }

  async health(): Promise<MetaCapiHealth> {
    return {
      ok: true,
      mode: "fixture",
      detail: "In-memory Meta CAPI double. Never use outside development and tests.",
      checkedAt: new Date().toISOString()
    };
  }
}

export type MetaCapiConfig = {
  pixelId: string;
  accessToken: string;
  apiVersion?: string;
  baseUrl?: string;
  siteBaseUrl?: string;
  testEventCode?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/**
 * A request that reached Meta and came back not-ok. The message is generic and
 * carries only the HTTP status — never the provider's response body, and never
 * the access token — so a leaked log line cannot expose a secret or a person.
 * The `fbtraceId` is Meta's opaque debug handle and is safe to keep.
 */
export class MetaCapiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly failureClass: FailureClass,
    readonly fbtraceId?: string
  ) {
    super(`meta capi request failed with status ${status}`);
    this.name = "MetaCapiRequestError";
  }
}

function asFbtraceId(body: Record<string, unknown> | undefined): string | undefined {
  if (body === undefined) return undefined;
  if (typeof body.fbtrace_id === "string") return body.fbtrace_id;
  const error = body.error;
  if (error !== null && typeof error === "object") {
    const nested = (error as { fbtrace_id?: unknown }).fbtrace_id;
    if (typeof nested === "string") return nested;
  }
  return undefined;
}

async function readJsonBody(response: Response): Promise<Record<string, unknown> | undefined> {
  try {
    const parsed = (await response.json()) as unknown;
    return parsed !== null && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The real adapter. Mirrors the CRM adapter's request discipline: an
 * AbortController-bounded call, a generic error that never leaks provider text,
 * and the provider trace id captured for reconciliation. The access token goes
 * in the JSON body and never in the URL, so it cannot end up in an access log,
 * a referer header, or a proxy trace.
 */
export class RealMetaCapiAdapter implements MetaCapiPort {
  readonly key = "meta";

  constructor(private readonly config: MetaCapiConfig) {}

  private get fetchImpl(): typeof fetch {
    return this.config.fetchImpl ?? fetch;
  }

  async send(event: MetaConversionEvent): Promise<MetaCapiResult> {
    const baseUrl = this.config.baseUrl ?? "https://graph.facebook.com";
    const apiVersion = this.config.apiVersion ?? "v21.0";
    const url = `${baseUrl}/${apiVersion}/${encodeURIComponent(this.config.pixelId)}/events`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 3000);
    try {
      const response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          data: [event],
          // The token is a body field, never a query parameter.
          access_token: this.config.accessToken,
          ...(this.config.testEventCode === undefined
            ? {}
            : { test_event_code: this.config.testEventCode })
        }),
        signal: controller.signal
      });

      const body = await readJsonBody(response);
      const fbtraceId = asFbtraceId(body);

      if (!response.ok) {
        throw new MetaCapiRequestError(
          response.status,
          classifyHttpFailure(response.status),
          fbtraceId
        );
      }

      const received = body?.events_received;
      const eventsReceived = typeof received === "number" ? received : 0;
      return {
        provider: "meta",
        eventsReceived,
        ...(fbtraceId === undefined ? {} : { fbtraceId })
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async health(): Promise<MetaCapiHealth> {
    // Meta has no side-effect-free readiness probe for a pixel that would not
    // either fire an event or put the access token in a URL. Rather than do
    // either, report configured-and-armed; real reachability is confirmed with a
    // test event in Events Manager (META_CAPI_TEST_EVENT_CODE) before go-live.
    return {
      ok: true,
      mode: "production",
      detail:
        "Configured. Verify delivery with a test event in Meta Events Manager before going live.",
      checkedAt: new Date().toISOString()
    };
  }
}
