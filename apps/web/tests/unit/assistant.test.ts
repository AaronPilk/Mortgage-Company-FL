import { describe, expect, it } from "vitest";
import { runAssistant, scrubReply } from "../../lib/assistant";

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
});
