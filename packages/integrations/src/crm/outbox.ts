import { type CrmPort, CrmRequestError, backoffMs, classifyHttpFailure } from "./index-internal";

/**
 * Transactional outbox worker.
 *
 * The lead receipt is written first-party in the same transaction as its outbox
 * row. This worker drains that outbox. A CRM outage therefore delays a sync; it
 * never loses a lead, and it never leaves the consumer waiting on a third party.
 */

export type OutboxRow = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  attemptCount: number;
};

export type OutboxOutcome =
  | { status: "succeeded"; contactId: string; requestId?: string }
  | { status: "retry"; availableInMs: number; errorCode: string }
  | { status: "dead"; errorCode: string };

export const MAX_OUTBOX_ATTEMPTS = 6;

export type ProcessDeps = {
  crm: CrmPort;
  rng?: () => number;
  maxAttempts?: number;
};

export async function processOutboxRow(row: OutboxRow, deps: ProcessDeps): Promise<OutboxOutcome> {
  if (row.eventType !== "lead.received") {
    return { status: "dead", errorCode: "terminal:unsupported_event" };
  }
  const maxAttempts = deps.maxAttempts ?? MAX_OUTBOX_ATTEMPTS;
  try {
    const result = await deps.crm.upsertLead(row.payload as never, row.idempotencyKey);
    return {
      status: "succeeded",
      contactId: result.contactId,
      ...(result.requestId === undefined ? {} : { requestId: result.requestId })
    };
  } catch (error) {
    const status =
      error instanceof CrmRequestError
        ? error.status
        : typeof (error as { status?: number }).status === "number"
          ? (error as { status: number }).status
          : 0;

    // A network error with no status is treated as retryable; a 4xx is not.
    const failureClass = status === 0 ? "retryable" : classifyHttpFailure(status);
    const errorCode = `${failureClass}:${status}`;

    if (failureClass === "terminal") return { status: "dead", errorCode };
    if (row.attemptCount + 1 >= maxAttempts) return { status: "dead", errorCode };

    return {
      status: "retry",
      availableInMs: backoffMs(row.attemptCount + 1, deps.rng),
      errorCode
    };
  }
}

/**
 * Idempotency key for a lead sync. Stable across retries of the same event and
 * distinct across separate events, so a replay cannot create a duplicate contact.
 */
export function leadSyncIdempotencyKey(receiptId: string, eventType: string): string {
  return `${eventType}:${receiptId}`;
}
