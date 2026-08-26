/**
 * Meta (Facebook) Conversions API port.
 *
 * Server-side conversion signal for the paid-social lead pipeline. It exists so
 * a campaign can optimize on a real lead instead of a browser click, and it is
 * deliberately the narrowest possible surface: a single "Lead" event carrying
 * only hashed contact identifiers and the click id that ties the lead back to
 * the ad. No name, no raw email, no raw phone, and nothing from the mortgage
 * side of the product ever crosses this boundary.
 *
 * Like the CRM, this is a projection of application truth and never the system
 * of record. It is fired from the transactional outbox, never inline in a
 * consumer request, and it is gated on marketing consent at the call site.
 */

import type { FailureClass } from "../crm/port";

/**
 * The Advanced Matching parameters Meta accepts. Every value here is either a
 * SHA-256 hash of a normalized identifier (`em`, `ph`) or an opaque Meta click /
 * browser id that is *defined by Meta to be sent unhashed* (`fbc`, `fbp`). A raw
 * email, a raw phone, or a name must never appear in any of these fields — the
 * mapper only ever writes hashes here, and there is no field on this type that
 * could carry cleartext contact data.
 */
export type MetaUserData = {
  /** SHA-256 of the trimmed, lowercased email. */
  em?: string;
  /** SHA-256 of the digits-only phone (country code kept, no `+` or separators). */
  ph?: string;
  /** Click id: `fb.<subdomainIndex>.<observedAtMs>.<fbclid>`. Sent unhashed by Meta's spec. */
  fbc?: string;
  /** Browser id from the `_fbp` cookie. Never available server-side here, so never set. */
  fbp?: string;
};

/**
 * A single server-side conversion event. This is the complete set of fields
 * permitted to leave the application for Meta — the mapper builds it by
 * whitelist, never by spreading a lead, so a field cannot ride along by
 * accident. `custom_data` is restricted to a coarse intent label; it never
 * carries a monetary value, a credit band, or any calculator detail.
 */
export type MetaConversionEvent = {
  event_name: "Lead";
  /** Unix time in seconds. Taken from the consent receipt, not from send time. */
  event_time: number;
  /** Our submission id, so the browser pixel and this server event deduplicate. */
  event_id: string;
  action_source: "website";
  event_source_url?: string;
  user_data: MetaUserData;
  custom_data?: {
    lead_intent?: string;
  };
};

/** What a successful transmission tells us. `fbtraceId` is an opaque debug handle. */
export type MetaCapiResult = {
  provider: "meta" | "fixture" | "disabled";
  eventsReceived: number;
  fbtraceId?: string;
};

/** Readiness snapshot, mirroring the CRM health shape so the admin board is uniform. */
export type MetaCapiHealth = {
  ok: boolean;
  mode: string;
  detail: string;
  checkedAt: string;
};

export interface MetaCapiPort {
  readonly key: string;
  send(event: MetaConversionEvent): Promise<MetaCapiResult>;
  health(): Promise<MetaCapiHealth>;
}

/**
 * The subset of the outbox lead payload the mapper reads. It is intentionally
 * all-optional and loosely typed: the payload is decoded JSON from the outbox
 * row, so the mapper treats every field as possibly absent and reads only what
 * it needs. Everything else in the payload (name aside, which is read only to be
 * *excluded*) is ignored rather than trusted.
 */
export type MetaLeadSource = {
  externalId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneE164?: string;
  intent?: string;
  sourcePath?: string;
  consent?: {
    smsMarketing?: boolean;
    emailMarketing?: boolean;
    receivedAtIso?: string;
  };
  attribution?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    gclid?: string;
    fbclid?: string;
  };
};

/**
 * The outcome of an outbox dispatch. `dispatchLeadConversion` returns one of
 * these and never throws, so the outbox worker can log the result and move on
 * without a Meta outage ever touching the CRM completion path.
 *
 * - `skipped` — nothing was transmitted, on purpose. `disabled` (feature off),
 *   `no_consent` (no email/SMS marketing consent), `insufficient_identifiers`
 *   (no hashable email or phone), or `unsupported_event` (not `lead.received`).
 * - `sent` — Meta accepted the event.
 * - `failed` — every attempt failed; `failureClass` says whether it was terminal
 *   or exhausted retries, and `attempts` says how many calls were made.
 */
export type LeadConversionDispatch =
  | {
      status: "skipped";
      reason: "disabled" | "no_consent" | "insufficient_identifiers" | "unsupported_event";
    }
  | { status: "sent"; eventsReceived: number; fbtraceId?: string }
  | { status: "failed"; failureClass: FailureClass; code: string; attempts: number };
