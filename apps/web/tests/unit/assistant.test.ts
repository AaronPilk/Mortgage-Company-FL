import { describe, expect, it } from "vitest";
import { deterministicReply, runAssistant, scrubReply } from "../../lib/assistant";

/**
 * The compliance post-filter is the safety net over the system prompt: even if
 * the model slips a rate quote or a decision phrase through, the reply is
 * dropped for a safe deflection. And with AI disabled (the default), the
 * assistant must still answer — never leave the visitor hanging.
 */

describe("scrubReply", () => {
  it("deflects a quoted rate", () => {
    expect(scrubReply("Your rate would be about 6.5% on that.").forceConnect).toBe(true);
    expect(scrubReply("Rates are around 6% right now.").forceConnect).toBe(true);
  });

  it("deflects a lending-decision phrase", () => {
    expect(scrubReply("Good news — you're approved!").forceConnect).toBe(true);
    expect(scrubReply("You qualify for a conventional loan.").forceConnect).toBe(true);
    expect(scrubReply("Your rate is locked at closing.").forceConnect).toBe(true);
  });

  it("lets ordinary educational content through unchanged", () => {
    const clean = "A 20% down payment lets you avoid mortgage insurance on a conventional loan.";
    const result = scrubReply(clean);
    expect(result.forceConnect).toBe(false);
    expect(result.reply).toBe(clean);
  });

  it("the deflection points the visitor to a licensed officer", () => {
    const result = scrubReply("You qualify!");
    expect(result.reply.toLowerCase()).toContain("licensed loan officer");
  });
});

/**
 * The deterministic router is the assistant's backend logic: it answers the
 * common intents across the whole product for free (no model call), so it must
 * route correctly, stay compliant, and cover more than mortgages.
 */
describe("deterministicReply", () => {
  const user = (content: string) => [{ role: "user" as const, content }];

  it("routes 'find a house' to property search, not a canned mortgage line", () => {
    const reply = deterministicReply(user("I want to find a house"));
    expect(reply).not.toBeNull();
    expect(reply?.links.some((link) => link.href === "/properties")).toBe(true);
  });

  it("covers the whole TRACT product, not just mortgages", () => {
    expect(
      deterministicReply(user("what's my home worth?"))?.links.some(
        (link) => link.href === "/what-is-my-home-worth"
      )
    ).toBe(true);
    expect(
      deterministicReply(user("I want to refinance"))?.links.some(
        (link) => link.href === "/mortgage/refinance"
      )
    ).toBe(true);
    expect(
      deterministicReply(user("find me a real estate agent"))?.links.some(
        (link) => link.href === "/agents"
      )
    ).toBe(true);
    expect(deterministicReply(user("can I talk to someone?"))?.offerConnect).toBe(true);
  });

  it("never quotes a rate and stays compliant on a rate question", () => {
    const reply = deterministicReply(user("what interest rate can I get?"));
    expect(reply).not.toBeNull();
    expect(reply?.offerConnect).toBe(true);
    // The reply itself must not trip the compliance post-filter.
    expect(scrubReply(reply?.reply ?? "").forceConnect).toBe(false);
  });

  it("gives distinct intents distinct answers — no repetition", () => {
    const buying = deterministicReply(user("help me buy a home"))?.reply;
    const afford = deterministicReply(user("how much can I afford?"))?.reply;
    expect(buying).toBeTruthy();
    expect(afford).toBeTruthy();
    expect(buying).not.toBe(afford);
  });

  it("returns null for an unrecognised message so the caller can escalate", () => {
    expect(deterministicReply(user("asdfqwer zxcvbnm"))).toBeNull();
  });
});

describe("runAssistant", () => {
  it("returns a safe, connect-offering fallback when AI is disabled", async () => {
    const reply = await runAssistant({
      messages: [{ role: "user", content: "what rate can I get?" }],
      subjectKey: "ip:test",
      requestId: "req-1"
    });
    expect(reply.reply.length).toBeGreaterThan(0);
    expect(reply.offerConnect).toBe(true);
    // The fallback never contains a quoted rate or a decision phrase.
    expect(scrubReply(reply.reply).forceConnect).toBe(false);
  });

  it("answers a recognised intent from the router, never the paid model", async () => {
    const reply = await runAssistant({
      messages: [{ role: "user", content: "I want to find a house" }],
      subjectKey: "ip:test",
      requestId: "req-2"
    });
    expect(reply.links.some((link) => link.href === "/properties")).toBe(true);
    expect(scrubReply(reply.reply).forceConnect).toBe(false);
  });

  it("falls back to a product-wide capability menu for an unknown message", async () => {
    const reply = await runAssistant({
      messages: [{ role: "user", content: "qwerty zxcvbnm" }],
      subjectKey: "ip:test",
      requestId: "req-3"
    });
    expect(reply.reply.length).toBeGreaterThan(0);
    expect(reply.offerConnect).toBe(true);
  });
});
