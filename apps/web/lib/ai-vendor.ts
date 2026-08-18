import type { FeatureMode } from "@tract/schemas";
import {
  DEFAULT_ANTHROPIC_STRUCTURED_MODEL,
  DEFAULT_OPENAI_STRUCTURED_MODEL
} from "@tract/integrations";

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

/**
 * The cost ladder. Every AI feature declares the cheapest tier that can do its
 * job and resolves its model through this table — no feature names a model
 * directly, so "we accidentally ran an expensive model for a trivial task" is
 * not an available mistake. Parsing a search phrase into MLS filters is a
 * light job: the answer's quality comes from the listing data, not the model.
 * The standard and heavy rows exist for the roadmap (land analysis,
 * upgrade/ARV reports) and are inert until a route declares them — verify the
 * identifiers against the vendors' current catalogues before the first route
 * does.
 */
export type ModelTier = "light" | "standard" | "heavy";

export const MODEL_TIERS: Record<ModelTier, Record<AiVendor, string>> = {
  light: {
    anthropic: DEFAULT_ANTHROPIC_STRUCTURED_MODEL,
    openai: DEFAULT_OPENAI_STRUCTURED_MODEL
  },
  standard: {
    anthropic: "claude-sonnet-4-5",
    openai: "gpt-5.1"
  },
  heavy: {
    anthropic: "claude-opus-4-5",
    openai: "gpt-5.1"
  }
};
