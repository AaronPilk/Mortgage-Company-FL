import { describe, expect, it } from "vitest";
import {
  DisabledEmailPort,
  EmailCopyError,
  FixtureEmailPort,
  ResendEmailPort,
  assertEducationalCopy,
  buildRateThresholdEmail,
  buildValueMoveEmail,
  unsubscribeToken,
  type EmailMessage
} from "./index";

/** A fetch double that answers Resend's /emails with a canned response. */
function resendStub(response: { ok: boolean; status: number; body?: unknown }): typeof fetch {
  return (async () => ({
    ok: response.ok,
    status: response.status,
    json: async () => response.body ?? {}
  })) as unknown as typeof fetch;
}

const message: EmailMessage = {
  to: "owner@example.com",
  from: "alerts@tract.example",
  subject: "A neutral subject",
  html: "<p>hello</p>",
  text: "hello"
};

describe("DisabledEmailPort", () => {
  it("reports sent with a disabled message id and records nothing external", async () => {
    const port = new DisabledEmailPort();
    const outcome = await port.send(message, "idem-1");
    expect(outcome.status).toBe("sent");
    if (outcome.status === "sent") {
      expect(outcome.provider).toBe("disabled");
      expect(outcome.messageId).toBe("disabled:idem-1");
    }
  });
});

describe("FixtureEmailPort", () => {
  it("records a send once and replays the same message id for a repeated idempotency key", async () => {
    const port = new FixtureEmailPort();
    const first = await port.send(message, "idem-1");
    const second = await port.send(message, "idem-1");
    expect(first.status).toBe("sent");
    expect(second.status).toBe("sent");
    expect(port.sent).toHaveLength(1);
    if (first.status === "sent" && second.status === "sent") {
      expect(second.messageId).toBe(first.messageId);
    }
  });

  it("forces the next send to a definite failure", async () => {
    const port = new FixtureEmailPort();
    port.failNext(1);
    const failed = await port.send(message, "idem-2");
    expect(failed.status).toBe("failed");
    const ok = await port.send(message, "idem-3");
    expect(ok.status).toBe("sent");
  });

  it("forces the next send to an unknown outcome", async () => {
    const port = new FixtureEmailPort();
    port.failNext(1, "unknown");
    const unknown = await port.send(message, "idem-4");
    expect(unknown.status).toBe("unknown");
  });
});

describe("ResendEmailPort classification", () => {
  it("maps a 2xx to sent and captures the provider id", async () => {
    const port = new ResendEmailPort({
      apiKey: "k",
      from: "alerts@tract.example",
      fetchImpl: resendStub({ ok: true, status: 200, body: { id: "re_123" } })
    });
    const outcome = await port.send(message, "idem-1");
    expect(outcome.status).toBe("sent");
    if (outcome.status === "sent") expect(outcome.messageId).toBe("re_123");
  });

  it("maps 429 to a retryable failure", async () => {
    const port = new ResendEmailPort({
      apiKey: "k",
      from: "alerts@tract.example",
      fetchImpl: resendStub({ ok: false, status: 429 })
    });
    const outcome = await port.send(message, "idem-1");
    expect(outcome.status).toBe("failed");
    if (outcome.status === "failed") expect(outcome.failureClass).toBe("retryable");
  });

  it("maps 500 to a retryable failure", async () => {
    const port = new ResendEmailPort({
      apiKey: "k",
      from: "alerts@tract.example",
      fetchImpl: resendStub({ ok: false, status: 500 })
    });
    const outcome = await port.send(message, "idem-1");
    expect(outcome.status).toBe("failed");
    if (outcome.status === "failed") expect(outcome.failureClass).toBe("retryable");
  });

  it("maps a non-retryable 4xx to a terminal failure", async () => {
    const port = new ResendEmailPort({
      apiKey: "k",
      from: "alerts@tract.example",
      fetchImpl: resendStub({ ok: false, status: 400 })
    });
    const outcome = await port.send(message, "idem-1");
    expect(outcome.status).toBe("failed");
    if (outcome.status === "failed") expect(outcome.failureClass).toBe("terminal");
  });

  it("maps an abort or network throw to unknown, never to a failure", async () => {
    const throwingFetch = (async () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      throw error;
    }) as unknown as typeof fetch;
    const port = new ResendEmailPort({
      apiKey: "k",
      from: "alerts@tract.example",
      fetchImpl: throwingFetch
    });
    const outcome = await port.send(message, "idem-1");
    expect(outcome.status).toBe("unknown");
  });
});

describe("assertEducationalCopy", () => {
  it("throws on a quote/decision phrase", () => {
    expect(() => assertEducationalCopy("your rate is 6.5%")).toThrow(EmailCopyError);
    expect(() => assertEducationalCopy("You are pre-approved")).toThrow(EmailCopyError);
    expect(() => assertEducationalCopy("Your credit score improved")).toThrow(EmailCopyError);
  });

  it("permits neutral educational copy", () => {
    expect(() => assertEducationalCopy("The national average moved this week.")).not.toThrow();
  });

  it("matches whole terms, not substrings inside benign words", () => {
    // A saved-search alert renders the recipient's own query in a results link.
    // These innocent words contain forbidden LETTERS but are not the mortgage
    // terms, so they must pass — otherwise a query like "April" would throw on
    // every run and permanently freeze that search's alerts.
    expect(() => assertEducationalCopy("New listings in April near Apopka")).not.toThrow();
    expect(() =>
      assertEducationalCopy("homes with a rate-locked HOA aprons and a scoreboard")
    ).not.toThrow();
    // The real term is still caught at a word boundary.
    expect(() => assertEducationalCopy("Today's APR is low")).toThrow(EmailCopyError);
  });
});

describe("built messages", () => {
  const commonBuild = {
    to: "owner@example.com",
    from: "alerts@tract.example",
    pepper: "test-pepper-0123456789",
    appUrl: "https://tract.example/"
  };

  it("every built message carries the RFC 8058 unsubscribe headers, a body link, and its disclosure", () => {
    const built: EmailMessage[] = [
      buildValueMoveEmail({
        ...commonBuild,
        previousValueCents: 40_000_000,
        newValueCents: 43_000_000,
        city: "Tampa"
      }),
      buildRateThresholdEmail({ ...commonBuild, term: "thirtyYearFixed" })
    ];
    for (const msg of built) {
      expect(msg.headers?.["List-Unsubscribe"]).toBeDefined();
      expect(msg.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
      expect(msg.text).toContain("/api/v1/email/unsubscribe");
      expect(msg.html).toContain("/api/v1/email/unsubscribe");
      // The rendered copy never trips the educational screen.
      expect(() => assertEducationalCopy(`${msg.subject}\n${msg.text}\n${msg.html}`)).not.toThrow();
    }
    expect(built[0]?.text).toContain("estimate, not an appraisal");
    expect(built[1]?.text).toContain("national survey average, not a quote");
  });

  it("derives a stable, kind-scoped unsubscribe token", () => {
    const a = unsubscribeToken("Owner@Example.com", "home_value_move", "pepper-1234567890");
    const b = unsubscribeToken("owner@example.com", "home_value_move", "pepper-1234567890");
    const c = unsubscribeToken("owner@example.com", "rate_threshold", "pepper-1234567890");
    // Normalized email is case-insensitive; the kind changes the token.
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
