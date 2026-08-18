import type { FeatureMode } from "@tract/schemas";

/**
 * Vendor precedence for live AI modes, as a pure function so the rule is
 * testable without an environment: Anthropic when its key is present, else
 * OpenAI when its key is present, else no vendor (the caller falls back to the
 * disabled provider). The environment schema enforces that a live AI_MODE
 * carries at least one of the two keys; returning null here is the belt to
 * that suspender.
 */

export type AiVendor = "anthropic" | "openai";

export type AiVendorSelection =
  { vendor: AiVendor; apiKey: string } | { vendor: null; apiKey?: undefined };

export function selectAiVendor(config: {
  AI_MODE: FeatureMode;
  ANTHROPIC_API_KEY?: string | undefined;
  OPENAI_API_KEY?: string | undefined;
}): AiVendorSelection {
  if (config.AI_MODE !== "sandbox" && config.AI_MODE !== "production") {
    return { vendor: null };
  }
  if (config.ANTHROPIC_API_KEY !== undefined) {
    return { vendor: "anthropic", apiKey: config.ANTHROPIC_API_KEY };
  }
  if (config.OPENAI_API_KEY !== undefined) {
    return { vendor: "openai", apiKey: config.OPENAI_API_KEY };
  }
  return { vendor: null };
}
