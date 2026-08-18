import { describe, expect, it } from "vitest";
import { selectAiVendor } from "../../lib/ai-vendor";

/**
 * The precedence rule for live AI modes: Anthropic when its key is present,
 * else OpenAI when its key is present, else no vendor. Non-live modes never
 * select a vendor, whatever keys happen to exist in the environment.
 */
describe("selectAiVendor", () => {
  it("prefers Anthropic when both keys are present", () => {
    expect(
      selectAiVendor({
        AI_MODE: "production",
        ANTHROPIC_API_KEY: "anthropic-key",
        OPENAI_API_KEY: "openai-key"
      })
    ).toEqual({ vendor: "anthropic", apiKey: "anthropic-key" });
  });

  it("falls back to OpenAI when only its key is present", () => {
    expect(selectAiVendor({ AI_MODE: "production", OPENAI_API_KEY: "openai-key" })).toEqual({
      vendor: "openai",
      apiKey: "openai-key"
    });
    expect(selectAiVendor({ AI_MODE: "sandbox", OPENAI_API_KEY: "openai-key" })).toEqual({
      vendor: "openai",
      apiKey: "openai-key"
    });
  });

  it("selects no vendor when a live mode has no key at all", () => {
    expect(selectAiVendor({ AI_MODE: "production" })).toEqual({ vendor: null });
  });

  it("selects no vendor outside live modes, whatever keys exist", () => {
    expect(
      selectAiVendor({
        AI_MODE: "disabled",
        ANTHROPIC_API_KEY: "anthropic-key",
        OPENAI_API_KEY: "openai-key"
      })
    ).toEqual({ vendor: null });
    expect(
      selectAiVendor({
        AI_MODE: "fixture",
        ANTHROPIC_API_KEY: "anthropic-key",
        OPENAI_API_KEY: "openai-key"
      })
    ).toEqual({ vendor: null });
  });
});
