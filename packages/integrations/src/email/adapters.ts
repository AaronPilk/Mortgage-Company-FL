import { classifyHttpFailure } from "../crm/port";
import type { EmailHealth, EmailMessage, EmailPort, EmailSendOutcome } from "./ports";

/**
 * Email adapters.
 *
 * `Disabled` is the default: nothing leaves the app, and a synthetic
 * `disabled:<key>` message id is returned so a caller's settle path still runs.
 * `Fixture` is the deterministic in-memory double for tests. `Resend` is the one
 * real adapter, posting to Resend's transactional API. The request shell — the
 * AbortController timeout, the Bearer auth, the Idempotency-Key header, the
 * finally-clear — is copied from `GhlCrmAdapter.request` on purpose, and the HTTP
 * classification reuses `classifyHttpFailure` from `../crm/port` rather than
 * forking it.
 */

/** Records nothing externally. The default so the app runs with no email configured. */
export class DisabledEmailPort implements EmailPort {
  readonly key = "disabled";

  // The signature mirrors the port exactly, including the idempotency key, so a
  // caller holding a concrete DisabledEmailPort is interchangeable with an
  // EmailPort. A disabled send is reported as sent (nothing failed) with a
  // message id that can never be mistaken for a provider id.
  async send(_message: EmailMessage, idempotencyKey: string): Promise<EmailSendOutcome> {
    return { status: "sent", provider: "disabled", messageId: `disabled:${idempotencyKey}` };
  }

  async health(): Promise<EmailHealth> {
    return {
      ok: true,
      mode: "disabled",
      detail: "Email sending is switched off; no message leaves the app.",
      checkedAt: new Date().toISOString()
    };
  }
}

type FixtureFailMode = "failed" | "unknown";

/** Deterministic in-memory double for tests and local development. */
export class FixtureEmailPort implements EmailPort {
  readonly key = "fixture";
  readonly sent: { message: EmailMessage; idempotencyKey: string; messageId: string }[] = [];
  /** Idempotency key -> the message id first issued for it, so a replay returns the original. */
  private readonly seenIdempotencyKeys = new Map<string, string>();
  private failNextTimes = 0;
  private failMode: FixtureFailMode = "failed";
  private counter = 0;

  /**
   * Test hook: force the next N sends to a chosen non-delivery. `failed` is a
   * definite retryable failure; `unknown` exercises the held-reservation path.
   */
  failNext(times: number, mode: FixtureFailMode = "failed"): void {
    this.failNextTimes = times;
    this.failMode = mode;
  }

  async send(message: EmailMessage, idempotencyKey: string): Promise<EmailSendOutcome> {
    if (this.failNextTimes > 0) {
      this.failNextTimes -= 1;
      if (this.failMode === "unknown") {
        return { status: "unknown", provider: "fixture", errorCode: "fixture_unknown" };
      }
      return {
        status: "failed",
        provider: "fixture",
        failureClass: "retryable",
        errorCode: "fixture_failure"
      };
    }

    const replayId = this.seenIdempotencyKeys.get(idempotencyKey);
    if (replayId !== undefined) {
      // Same idempotency key: report the original send, record nothing new.
      return { status: "sent", provider: "fixture", messageId: replayId };
    }

    this.counter += 1;
    const messageId = `fixture-msg-${this.counter}`;
    this.seenIdempotencyKeys.set(idempotencyKey, messageId);
    this.sent.push({ message, idempotencyKey, messageId });
    return { status: "sent", provider: "fixture", messageId };
  }

  async health(): Promise<EmailHealth> {
    return {
      ok: true,
      mode: "fixture",
      detail: "In-memory email double. Never use outside development and tests.",
      checkedAt: new Date().toISOString()
    };
  }
}

export type ResendConfig = {
  apiKey: string;
  /** Verified sender address; used when a message omits its own `from`. */
  from: string;
  /** Defaults to the public Resend base. Overridable for a proxy. */
  baseUrl?: string;
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/**
 * Resend adapter.
 *
 * Never called from the browser. The key stays server-side. The provider body is
 * never propagated to the caller — a send collapses to sent / failed / unknown.
 * A timeout or a network throw is `unknown`, not `failed`: we cannot tell whether
 * Resend accepted the message, so the ledger holds the reservation (invariant 8).
 */
export class ResendEmailPort implements EmailPort {
  readonly key = "resend";

  constructor(private readonly config: ResendConfig) {}

  private get fetchImpl(): typeof fetch {
    return this.config.fetchImpl ?? fetch;
  }

  async send(message: EmailMessage, idempotencyKey: string): Promise<EmailSendOutcome> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 10_000);
    try {
      const response = await this.fetchImpl(
        new URL("/emails", this.config.baseUrl ?? "https://api.resend.com").toString(),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "Idempotency-Key": idempotencyKey
          },
          body: JSON.stringify({
            from: message.from === "" ? this.config.from : message.from,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            ...(message.replyTo === undefined ? {} : { reply_to: message.replyTo }),
            ...(message.headers === undefined ? {} : { headers: message.headers }),
            ...(message.tags === undefined ? {} : { tags: message.tags })
          }),
          signal: controller.signal
        }
      );

      if (!response.ok) {
        const errorCode = `resend_http_${response.status}`;
        // classifyHttpFailure returns rate_limited for 429 and retryable for
        // 408/425/5xx; both are retryable non-deliveries here. Everything else
        // (the other 4xx) is terminal.
        const failureClass = classifyHttpFailure(response.status);
        if (failureClass === "terminal") {
          return { status: "failed", provider: "resend", failureClass: "terminal", errorCode };
        }
        return { status: "failed", provider: "resend", failureClass: "retryable", errorCode };
      }

      const data = (await response.json()) as { id?: string };
      const messageId =
        typeof data.id === "string" && data.id !== "" ? data.id : "resend:unidentified";
      return { status: "sent", provider: "resend", messageId };
    } catch (error) {
      // Abort (timeout) or a network throw: acceptance is unknown. Never a failure.
      const errorCode = error instanceof Error ? `resend_${error.name}` : "resend_unknown";
      return { status: "unknown", provider: "resend", errorCode };
    } finally {
      clearTimeout(timeout);
    }
  }

  async health(): Promise<EmailHealth> {
    return {
      ok: true,
      mode: "production",
      detail: "Resend adapter configured.",
      checkedAt: new Date().toISOString()
    };
  }
}
