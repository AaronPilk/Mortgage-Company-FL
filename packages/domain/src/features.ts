import type { ServerEnv } from "@tract/schemas";

/**
 * The feature registry is server-owned. The browser receives derived booleans
 * only — never a mode string, a provider name, or the reason a flag is off.
 */

export type ServerFeatures = {
  ghl: ServerEnv["GHL_MODE"];
  ai: ServerEnv["AI_MODE"];
  mls: ServerEnv["MLS_PROVIDER"];
  turnstile: ServerEnv["TURNSTILE_MODE"];
  email: ServerEnv["EMAIL_MODE"];
  vision: boolean;
  rendProp: boolean;
  accounts: boolean;
  propertySearch: boolean;
  tract: boolean;
  secureApplicationConfigured: boolean;
};

export function serverFeatures(env: ServerEnv): ServerFeatures {
  return {
    ghl: env.GHL_MODE,
    ai: env.AI_MODE,
    mls: env.MLS_PROVIDER,
    turnstile: env.TURNSTILE_MODE,
    email: env.EMAIL_MODE,
    vision: env.FEATURE_VISION,
    rendProp: env.FEATURE_RENDPROP,
    accounts: env.FEATURE_ACCOUNTS,
    propertySearch: env.FEATURE_PROPERTY_SEARCH,
    tract: env.FEATURE_TRACT,
    secureApplicationConfigured: env.SECURE_APPLICATION_URL !== undefined
  };
}

export type PublicFeatureState = {
  vision: boolean;
  rendProp: boolean;
  propertySearch: boolean;
  accounts: boolean;
  tract: boolean;
  secureApplication: boolean;
};

export function publicFeatureState(features: ServerFeatures): PublicFeatureState {
  return {
    // Vision without an AI provider would present fixtures as analysis. Both must be on.
    vision: features.vision && features.ai !== "disabled",
    rendProp: features.rendProp,
    propertySearch: features.propertySearch && features.mls !== "disabled",
    accounts: features.accounts,
    // TRACT is an authenticated surface: a borrower must be able to hold an
    // account, so the loan portal is only live when accounts are on too.
    tract: features.tract && features.accounts,
    secureApplication: features.secureApplicationConfigured
  };
}
