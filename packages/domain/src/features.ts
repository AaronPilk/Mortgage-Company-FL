import type { ServerEnv } from "@tract/schemas";

/**
 * The feature registry is server-owned. The browser receives derived booleans
 * only — never a mode string, a provider name, or the reason a flag is off.
 */

export type ServerFeatures = {
  ghl: ServerEnv["GHL_MODE"];
  ai: ServerEnv["AI_MODE"];
  mls: ServerEnv["MLS_PROVIDER"];
  attom: ServerEnv["ATTOM_MODE"];
  rateFeed: ServerEnv["RATE_FEED_MODE"];
  turnstile: ServerEnv["TURNSTILE_MODE"];
  email: ServerEnv["EMAIL_MODE"];
  metaCapi: ServerEnv["META_CAPI_MODE"];
  vision: boolean;
  rendProp: boolean;
  accounts: boolean;
  propertySearch: boolean;
  homeLookup: boolean;
  homeValue: boolean;
  rateWatch: boolean;
  assistant: boolean;
  tract: boolean;
  emailAlerts: boolean;
  agentDashboard: boolean;
  savedSearchAlerts: boolean;
  aiSearch: boolean;
  marketData: boolean;
  sellerTools: boolean;
  agentMarketplace: boolean;
  secureApplicationConfigured: boolean;
};

export function serverFeatures(env: ServerEnv): ServerFeatures {
  return {
    ghl: env.GHL_MODE,
    ai: env.AI_MODE,
    mls: env.MLS_PROVIDER,
    attom: env.ATTOM_MODE,
    rateFeed: env.RATE_FEED_MODE,
    turnstile: env.TURNSTILE_MODE,
    email: env.EMAIL_MODE,
    metaCapi: env.META_CAPI_MODE,
    vision: env.FEATURE_VISION,
    rendProp: env.FEATURE_RENDPROP,
    accounts: env.FEATURE_ACCOUNTS,
    propertySearch: env.FEATURE_PROPERTY_SEARCH,
    homeLookup: env.FEATURE_HOME_LOOKUP,
    homeValue: env.FEATURE_HOME_VALUE,
    rateWatch: env.FEATURE_RATE_WATCH,
    assistant: env.FEATURE_ASSISTANT,
    tract: env.FEATURE_TRACT,
    emailAlerts: env.FEATURE_EMAIL_ALERTS,
    agentDashboard: env.FEATURE_AGENT_DASHBOARD,
    savedSearchAlerts: env.FEATURE_SAVED_SEARCH_ALERTS,
    aiSearch: env.FEATURE_AI_SEARCH,
    marketData: env.FEATURE_MARKET_DATA,
    sellerTools: env.FEATURE_SELLER_TOOLS,
    agentMarketplace: env.FEATURE_AGENT_MARKETPLACE,
    secureApplicationConfigured: env.SECURE_APPLICATION_URL !== undefined
  };
}

export type PublicFeatureState = {
  vision: boolean;
  rendProp: boolean;
  propertySearch: boolean;
  homeLookup: boolean;
  homeValue: boolean;
  rateWatch: boolean;
  assistant: boolean;
  accounts: boolean;
  tract: boolean;
  agentDashboard: boolean;
  aiSearch: boolean;
  marketData: boolean;
  sellerTools: boolean;
  agentMarketplace: boolean;
  savedSearchAlerts: boolean;
  secureApplication: boolean;
};

export function publicFeatureState(features: ServerFeatures): PublicFeatureState {
  return {
    // Vision without an AI provider would present fixtures as analysis. Both must be on.
    vision: features.vision && features.ai !== "disabled",
    rendProp: features.rendProp,
    propertySearch: features.propertySearch && features.mls !== "disabled",
    // Home lookup shows licensed property facts; a live ATTOM mode is required
    // so fixture data can never publish (mirrors propertySearch + MLS).
    homeLookup: features.homeLookup && features.attom !== "disabled",
    // Homeowner value dashboard shows a licensed automated valuation, so it too
    // requires a live ATTOM mode — fixture value data can never reach production.
    homeValue: features.homeValue && features.attom !== "disabled",
    // Rate-watch shows a live market average, so it requires a live rate-feed
    // mode — the fixture average can never reach production.
    rateWatch: features.rateWatch && features.rateFeed !== "disabled",
    // The assistant needs a live AI mode; without one it would have nothing to
    // answer with, and the budget gates every paid call regardless.
    assistant: features.assistant && features.ai !== "disabled",
    accounts: features.accounts,
    // TRACT is an authenticated surface: a borrower must be able to hold an
    // account, so the loan portal is only live when accounts are on too.
    tract: features.tract && features.accounts,
    // The agent dashboard is a signed-in partner surface, so it is only live
    // when accounts are on — an agent must be able to hold an account to see it.
    agentDashboard: features.agentDashboard && features.accounts,
    // AI search needs a live AI mode; without one it has nothing to interpret a
    // query or write a report with, and the budget gates every paid call.
    aiSearch: features.aiSearch && features.ai !== "disabled",
    // Live market-data widgets show licensed figures, so they require a live
    // ATTOM mode — a fabricated market stat can never reach production. (The
    // city/neighborhood pages themselves are static content and always render.)
    marketData: features.marketData && features.attom !== "disabled",
    // Seller tools are a public funnel; no external data dependency, so the flag
    // alone gates them.
    sellerTools: features.sellerTools,
    // The agent marketplace is a signed-in partner surface, so it is only live
    // when accounts are on too.
    agentMarketplace: features.agentMarketplace && features.accounts,
    // Saved-search alerts promise a real email when a NEW listing matches. That
    // promise needs a licensed listing feed — never fixture, never disabled — so
    // the derived flag stays false until a real MLS and the backend feature both
    // land, keeping the opt-in UI hidden rather than dead. The browser still
    // receives only this boolean, never the provider mode (invariant 6).
    savedSearchAlerts:
      features.savedSearchAlerts && features.mls !== "disabled" && features.mls !== "fixture",
    secureApplication: features.secureApplicationConfigured
  };
}
