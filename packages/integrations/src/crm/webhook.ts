import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";

/**
 * Inbound webhook verification.
 *
 * GoHighLevel signs webhook payloads with Ed25519. An unverified webhook is an
 * unauthenticated write path into the CRM projection, so every check below is
 * mandatory: signature, replay window, and event deduplication.
 */

export type WebhookVerificationInput = {
  rawBody: string;
  signature: string | null;
  /** PEM-encoded Ed25519 public key from the provider. */
  publicKeyPem: string | undefined;
  /** Provider timestamp, when the payload supplies one. */
  timestampMs?: number;
  now?: number;
  toleranceMs?: number;
};

export type WebhookVerificationResult =
  { ok: true; eventId: string; bodyHash: string } | { ok: false; reason: WebhookRejection };

export type WebhookRejection =
  | "missing_public_key"
  | "missing_signature"
  | "invalid_signature"
  | "stale_timestamp"
  | "malformed_body";

export const DEFAULT_REPLAY_TOLERANCE_MS = 5 * 60 * 1000;

export function verifyWebhook(input: WebhookVerificationInput): WebhookVerificationResult {
  if (input.publicKeyPem === undefined || input.publicKeyPem === "") {
    return { ok: false, reason: "missing_public_key" };
  }
  if (input.signature === null || input.signature === "") {
    return { ok: false, reason: "missing_signature" };
  }

  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(input.signature, "base64");
  } catch {
    return { ok: false, reason: "invalid_signature" };
  }

  let valid: boolean;
  try {
    const key = createPublicKey(input.publicKeyPem);
    valid = verifySignature(null, Buffer.from(input.rawBody, "utf8"), key, signatureBytes);
  } catch {
    return { ok: false, reason: "invalid_signature" };
  }
  if (!valid) return { ok: false, reason: "invalid_signature" };

  const now = input.now ?? Date.now();
  const tolerance = input.toleranceMs ?? DEFAULT_REPLAY_TOLERANCE_MS;
  if (input.timestampMs !== undefined && Math.abs(now - input.timestampMs) > tolerance) {
    return { ok: false, reason: "stale_timestamp" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.rawBody);
  } catch {
    return { ok: false, reason: "malformed_body" };
  }
  if (parsed === null || typeof parsed !== "object") {
    return { ok: false, reason: "malformed_body" };
  }

  const bodyHash = createHash("sha256").update(input.rawBody).digest("hex");
  const candidate = (parsed as Record<string, unknown>).webhookId;
  const eventId = typeof candidate === "string" && candidate.length > 0 ? candidate : bodyHash;

  return { ok: true, eventId, bodyHash };
}

/**
 * Deduplication store contract. Backed by the webhook_receipts table in
 * production and by a Set in tests. Returning false means "already processed".
 */
export interface WebhookDedupeStore {
  claim(eventId: string): Promise<boolean>;
}

export class InMemoryWebhookDedupeStore implements WebhookDedupeStore {
  private readonly seen = new Set<string>();
  async claim(eventId: string): Promise<boolean> {
    if (this.seen.has(eventId)) return false;
    this.seen.add(eventId);
    return true;
  }
}
