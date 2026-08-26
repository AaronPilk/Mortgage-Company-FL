/**
 * Email port.
 *
 * The only email this platform ever sends is a transactional engagement alert to
 * a signed-in owner who asked for it: their home's estimated value moved, or the
 * market average they are watching reached the level they picked. It is never a
 * quote, an offer of credit, or "your rate" — the software makes no credit
 * decision and advertises no rate of its own (invariant 2). Every send is
 * consent-gated and suppression-gated upstream; this port is only the transport.
 *
 * The shape mirrors the CRM port: a single narrow interface with a disabled
 * default, a fixture double, and one real adapter, so a provider swap never
 * touches a call site. `assertEducationalCopy` is the email analog of
 * `assertCrmPayloadSafe`: a compile-time-invisible screen that refuses to let a
 * quote or decision phrase reach a recipient.
 */

export type EmailTag = { name: string; value: string };

export type EmailMessage = {
  to: string;
  /** Verified sender address. Set by the builder from EMAIL_FROM; the adapter transmits it. */
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  /** RFC 8058 unsubscribe headers travel here (List-Unsubscribe, List-Unsubscribe-Post). */
  headers?: Record<string, string>;
  tags?: EmailTag[];
};

/**
 * The outcome of a single send. `sent` captured a provider message id. `failed`
 * is a definite non-delivery and is safe to retry (it is classified retryable or
 * terminal). `unknown` is the dangerous one: the provider may or may not have
 * accepted the message, so the reservation is HELD and never resent (invariant 8).
 */
export type EmailSendOutcome =
  | { status: "sent"; provider: string; messageId: string }
  | {
      status: "failed";
      provider: string;
      failureClass: "retryable" | "terminal";
      errorCode: string;
    }
  | { status: "unknown"; provider: string; errorCode: string };

export type EmailHealth = {
  ok: boolean;
  mode: string;
  detail: string;
  checkedAt: string;
};

export interface EmailPort {
  readonly key: string;
  /**
   * Send one message. `idempotencyKey` is the notification's dedupe key, so a
   * provider that honors it collapses a duplicate delivery on our behalf.
   */
  send(message: EmailMessage, idempotencyKey: string): Promise<EmailSendOutcome>;
  health(): Promise<EmailHealth>;
}

/**
 * Phrases that turn an educational notice into an advertised rate or a credit
 * decision. Forbidden anywhere in a rendered subject or body. The list is
 * deliberately blunt: an alert email never needs to state a rate, an APR, an
 * approval, or a credit-score fact, so refusing the substring outright is safer
 * than trying to reason about context. This is the email analog of
 * `CRM_PROHIBITED_KEYS`.
 */
export const EDUCATIONAL_COPY_FORBIDDEN = [
  "your rate",
  "apr",
  "approved",
  "pre-approved",
  "credit score",
  "interest rate of"
] as const;

export class EmailCopyError extends Error {}

/**
 * Throw if `text` contains a quote or decision phrase. Run over every rendered
 * subject and body before a message is handed to the port, so a template
 * regression fails the run rather than reaching a recipient.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function assertEducationalCopy(text: string): void {
  for (const phrase of EDUCATIONAL_COPY_FORBIDDEN) {
    // Match the mortgage TERM at word boundaries, not as a raw substring: the
    // screen must catch "APR" / "your rate" / "approved", but not an innocent word
    // that merely contains those letters. A saved-search alert is the first email
    // to render the recipient's own search text in a link, so a benign query like
    // "April" (contains "apr") must not trip the screen — a false positive there
    // would throw on every run and permanently freeze that search's alerts. Every
    // forbidden phrase begins and ends with a word character, so \b…\b still
    // catches all of them while dropping substring false positives.
    const pattern = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i");
    if (pattern.test(text)) {
      throw new EmailCopyError(
        `email copy contains a prohibited quote/decision phrase: "${phrase}"`
      );
    }
  }
}
