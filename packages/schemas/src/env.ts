import { z } from "zod";

/**
 * Environment validation, split so that server-only values can never be reached
 * from a client bundle. A disabled integration must not require its secret —
 * the application has to boot and pass its tests in the default configuration.
 */

const FeatureModeSchema = z.enum(["disabled", "fixture", "sandbox", "production"]);
export type FeatureMode = z.infer<typeof FeatureModeSchema>;

const optionalString = z.string().min(1).optional();

/** Recognisable on sight, and rejected by assertProductionReady. */
export const DEVELOPMENT_PEPPER = "local-development-pepper-change-me";

/** Safe to reference from browser code. Contains identifiers, never secrets. */
export const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  // The company's marketing domain (Wholesale Mortgage Lending front door). One
  // Worker serves both this and the product domain; the middleware routes by host.
  NEXT_PUBLIC_COMPANY_URL: z.string().url().default("https://wsmlending.com"),
  NEXT_PUBLIC_BRAND_NAME: z.string().min(1).default("TRACT Mortgage"),
  NEXT_PUBLIC_GTM_CONTAINER_ID: optionalString,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString
});
export type PublicEnv = z.infer<typeof PublicEnvSchema>;

export const ServerEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    SUPABASE_SERVICE_ROLE_KEY: optionalString,

    TURNSTILE_MODE: FeatureModeSchema.default("disabled"),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
    TURNSTILE_SECRET_KEY: optionalString,
    TURNSTILE_HOSTNAMES: optionalString,

    GHL_MODE: FeatureModeSchema.default("disabled"),
    GHL_PRIVATE_INTEGRATION_TOKEN: optionalString,
    GHL_LOCATION_ID: optionalString,
    GHL_API_BASE_URL: z.string().url().default("https://services.leadconnectorhq.com"),
    GHL_API_VERSION: z.string().default("2021-07-28"),
    GHL_WEBHOOK_PUBLIC_KEY: optionalString,
    OUTBOX_DRAIN_TOKEN: z.string().min(16).optional(),

    AI_MODE: FeatureModeSchema.default("disabled"),
    OPENAI_API_KEY: optionalString,
    ANTHROPIC_API_KEY: optionalString,
    HIGGSFIELD_API_KEY: optionalString,
    BYTEPLUS_API_KEY: optionalString,
    AI_DAILY_PLATFORM_BUDGET_CENTS: z.coerce.number().int().min(0).default(0),
    AI_DEFAULT_USER_DAILY_BUDGET_CENTS: z.coerce.number().int().min(0).default(0),

    MLS_PROVIDER: z
      .enum(["disabled", "fixture", "stellar", "bridge", "mlsgrid"])
      .default("disabled"),
    /**
     * Second switch required to render sample listings publicly. Off by default,
     * so sample data cannot ship because nobody noticed MLS_PROVIDER was still
     * on its default.
     */
    SHOW_SAMPLE_LISTINGS: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    /**
     * Same two-switch shape as SHOW_SAMPLE_LISTINGS, for the agent directory:
     * outside production sample agents always render (labelled), and in
     * production they render only on this explicit opt-in. Off by default so
     * fixture people cannot ship because nobody flipped a flag.
     */
    SHOW_SAMPLE_AGENTS: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    /**
     * The two-switch gate for the home-lookup surface, mirroring
     * SHOW_SAMPLE_LISTINGS. Fixture property data always renders outside
     * production; in production it renders only on this explicit opt-in, and
     * always labelled as sample data in the response.
     */
    SHOW_SAMPLE_PROPERTY_DATA: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    MLS_BASE_URL: optionalString,
    MLS_ACCESS_TOKEN: optionalString,
    MLS_ATTRIBUTION_TEXT: optionalString,

    ATTOM_MODE: FeatureModeSchema.default("disabled"),
    ATTOM_API_KEY: optionalString,
    /**
     * Flood zone from FEMA's public NFHL (no key needed). A live mode
     * (sandbox/production) calls FEMA; "fixture" is the dev double; "disabled"
     * turns flood off. Safety-relevant, so fixture flood is never served in
     * production — see floodLookupAllowed().
     */
    FLOOD_MODE: FeatureModeSchema.default("disabled"),
    /**
     * Market mortgage rates for the rate-watch surface. A live mode reads the
     * Freddie Mac PMMS weekly averages from FRED (needs FRED_API_KEY); "fixture"
     * is the dev double; "disabled" turns the feed off. Only ever a published
     * market average — never a quote — so it carries no per-user credit data.
     */
    RATE_FEED_MODE: FeatureModeSchema.default("disabled"),
    FRED_API_KEY: optionalString,
    REGRID_API_KEY: optionalString,
    SHOVELS_API_KEY: optionalString,
    AIRDNA_API_KEY: optionalString,

    /**
     * Meta (Facebook) Conversions API — server-side conversion events for the
     * lead pipeline, so paid-social campaigns optimize on real leads rather than
     * clicks. A live mode posts hashed identifiers to Meta and needs the pixel
     * id and access token; "fixture" is the dev double; "disabled" sends
     * nothing. Consent-gated at the call site: a lead without email/SMS
     * marketing consent is never transmitted, and only hashed identifiers ever
     * leave — never a raw email, a name, or any financial field.
     */
    META_CAPI_MODE: FeatureModeSchema.default("disabled"),
    META_PIXEL_ID: optionalString,
    META_CAPI_ACCESS_TOKEN: optionalString,
    /** Meta's test-event code, used only to route events to the Events Manager test tab. */
    META_CAPI_TEST_EVENT_CODE: optionalString,
    /**
     * The explicit launch switch for server-side conversions. Sending hashed
     * identifiers to Meta stays off until this is deliberately set true — the one
     * operational acknowledgement that licensing and advertising review have
     * cleared. It is the interlock the Cloudflare worker checks (it cannot read
     * the code-level isPreLaunch() the way the app can), and the app gates on it
     * too, so a live mode alone can never turn Meta on. Dark by default.
     */
    META_CAPI_LIVE_CLEARED: z.coerce.boolean().default(false),

    FEATURE_VISION: z.coerce.boolean().default(false),
    FEATURE_RENDPROP: z.coerce.boolean().default(false),
    FEATURE_ACCOUNTS: z.coerce.boolean().default(true),
    FEATURE_PROPERTY_SEARCH: z.coerce.boolean().default(false),
    /**
     * Home lookup — paste a listing link or an address and pull licensed
     * property facts (ATTOM) to seed the calculators. Dark by default, and its
     * derived public flag also requires a live ATTOM mode, so fixture property
     * data can never reach a consumer in production.
     */
    FEATURE_HOME_LOOKUP: z.coerce.boolean().default(false),
    /**
     * Homeowner value dashboard — a signed-in homeowner tracks their own home's
     * automated value (ATTOM AVM) over time and sees estimated equity, with a
     * soft refi/HELOC prompt. Reuses the ATTOM integration; dark by default, and
     * its derived public flag also requires a live ATTOM mode so fixture value
     * data can never reach a consumer in production.
     */
    FEATURE_HOME_VALUE: z.coerce.boolean().default(false),
    /**
     * Rate-watch — a signed-in visitor tracks the market average and can ask to
     * be alerted when it moves. Dark by default, and its derived public flag also
     * requires a live rate-feed mode, so the fixture average can never reach a
     * consumer in production. Never a personalized quote — only the market survey.
     */
    FEATURE_RATE_WATCH: z.coerce.boolean().default(false),
    /**
     * Site assistant — an on-site helper that educates about mortgage concepts,
     * points to the right tool or page, and offers to connect the visitor with a
     * licensed officer. It never quotes a rate or makes a decision. Dark by
     * default, and its derived public flag also requires a live AI mode (the
     * budget still gates every paid call), so it cannot run without AI configured.
     */
    FEATURE_ASSISTANT: z.coerce.boolean().default(false),
    /**
     * TRACT — the authenticated loan-origination surface (borrower intake,
     * portal, loan-officer workspace). Dark by default: the whole surface is
     * off until this is explicitly turned on, and it needs a database to do
     * anything, so the derived public flag also gates on accounts being on.
     */
    FEATURE_TRACT: z.coerce.boolean().default(false),
    /**
     * Engagement email alerts — the cron-driven outreach loops that turn the
     * home-value and rate-watch features into recurring touches: a homeowner
     * whose estimated value moved, or a rate-watcher when the market average
     * crosses their threshold. Dark by default; each loop also requires a live
     * EMAIL_MODE and its own source feature to be on, and every send is gated on
     * the recipient's stored email-marketing consent.
     */
    FEATURE_EMAIL_ALERTS: z.coerce.boolean().default(false),
    /**
     * Agent partner dashboard — a signed-in real-estate-agent partner sees the
     * leads their referral link drove (count, coarse status, recency) and
     * nothing more. Dark by default; the data is scoped to the agent's own
     * referred leads by RLS and a second application check.
     */
    FEATURE_AGENT_DASHBOARD: z.coerce.boolean().default(false),
    /**
     * Saved-search listing alerts — a cron loop that emails a signed-in visitor
     * when a new property matches a search they saved. Backend only (no public
     * flag); each send is consent-gated, reserve-before-spend, and unsubscribable
     * like the other email alerts. Dark by default.
     */
    FEATURE_SAVED_SEARCH_ALERTS: z.coerce.boolean().default(false),
    /**
     * AI-native home search — natural-language property search and AI-generated
     * neighborhood/affordability reports. Dark by default; its derived public
     * flag also requires a live AI mode, and the budget gates every paid call, so
     * it cannot run without AI configured. Educate/route only — never a quote.
     */
    FEATURE_AI_SEARCH: z.coerce.boolean().default(false),
    /**
     * Live market-data widgets on the location pages (median price, days on
     * market, trends). The city/neighborhood pages themselves are static content;
     * this flag gates only the live-data component, which also requires a live
     * data mode so a fabricated figure can never publish. Dark by default.
     */
    FEATURE_MARKET_DATA: z.coerce.boolean().default(false),
    /**
     * Seller tools — the "what's my home worth" funnel that turns a homeowner
     * into a seller lead (intent sell_home) for hand-off to the real-estate
     * network. Connection framing only; TRACT brokers mortgages, not homes. Dark
     * by default.
     */
    FEATURE_SELLER_TOOLS: z.coerce.boolean().default(false),
    /**
     * Agent marketplace — an agent partner claims coverage (ZIPs/areas) and
     * referred leads route to them. v1 carries no payment flow. A signed-in
     * partner surface, so its public flag also requires accounts. Dark by default.
     */
    FEATURE_AGENT_MARKETPLACE: z.coerce.boolean().default(false),

    SENTRY_DSN: optionalString,
    RESEND_API_KEY: optionalString,
    EMAIL_MODE: FeatureModeSchema.default("disabled"),
    /** Verified sender address; required when EMAIL_MODE is live. */
    EMAIL_FROM: optionalString,
    /** Bearer token for the cron-invoked /api/v1/internal/alerts/run entrypoint. */
    ALERTS_RUN_TOKEN: z.string().min(16).optional(),
    /** Per-run and per-day ceilings for engagement email sends (reserve-before-spend caps). */
    EMAIL_ALERTS_MAX_PER_RUN: z.coerce.number().int().min(0).default(50),
    EMAIL_ALERTS_DAILY_CAP: z.coerce.number().int().min(0).default(500),
    /** A home-value move at or above this many basis points of the prior value triggers an alert (200 = 2%). */
    HOME_VALUE_ALERT_THRESHOLD_BP: z.coerce.number().int().min(0).default(200),
    /** Only re-snapshot a home whose latest snapshot is older than this many days. */
    HOME_VALUE_RESNAPSHOT_INTERVAL_DAYS: z.coerce.number().int().min(1).default(1),
    /** Max new listings emailed per saved search per run (batch cap + watermark step). */
    SAVED_SEARCH_ALERT_MAX_MATCHES: z.coerce.number().int().min(1).max(50).default(10),

    SECURE_APPLICATION_URL: z.string().url().optional(),

    /** Rotating salt for one-way hashes used in dedupe and abuse signals. */
    HASH_PEPPER: z.string().min(16).default(DEVELOPMENT_PEPPER)
  })
  .superRefine((env, ctx) => {
    // Structural validation only: a mode that claims to be live must carry the
    // credential it needs. Deployment policy lives in assertProductionReady
    // below, deliberately separated so that parsing the environment never
    // depends on where or when it is being parsed.
    const requireWhenLive = (mode: FeatureMode, key: keyof typeof env, label: string): void => {
      if ((mode === "sandbox" || mode === "production") && env[key] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [key as string],
          message: `${label} is required when its mode is "${mode}"`
        });
      }
    };

    requireWhenLive(env.GHL_MODE, "GHL_PRIVATE_INTEGRATION_TOKEN", "GoHighLevel token");
    requireWhenLive(env.GHL_MODE, "GHL_LOCATION_ID", "GoHighLevel location id");
    requireWhenLive(env.GHL_MODE, "OUTBOX_DRAIN_TOKEN", "Outbox drain token");
    requireWhenLive(env.TURNSTILE_MODE, "TURNSTILE_SECRET_KEY", "Turnstile secret");
    requireWhenLive(env.TURNSTILE_MODE, "TURNSTILE_HOSTNAMES", "Turnstile hostnames");
    requireWhenLive(env.ATTOM_MODE, "ATTOM_API_KEY", "ATTOM API key");
    requireWhenLive(env.RATE_FEED_MODE, "FRED_API_KEY", "FRED API key");
    requireWhenLive(env.EMAIL_MODE, "RESEND_API_KEY", "Resend API key");
    requireWhenLive(env.EMAIL_MODE, "EMAIL_FROM", "Email from address");
    requireWhenLive(env.META_CAPI_MODE, "META_PIXEL_ID", "Meta pixel id");
    requireWhenLive(env.META_CAPI_MODE, "META_CAPI_ACCESS_TOKEN", "Meta CAPI access token");

    // AI has interchangeable vendors, so a live mode needs one credential, not
    // a specific one — requiring the Anthropic key alone would refuse a
    // legitimate OpenAI-only deployment. Provider precedence when both are
    // present is application policy (apps/web/lib/ai-vendor.ts), not schema.
    if (
      (env.AI_MODE === "sandbox" || env.AI_MODE === "production") &&
      env.ANTHROPIC_API_KEY === undefined &&
      env.OPENAI_API_KEY === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["AI_MODE"],
        message: `at least one AI provider key (ANTHROPIC_API_KEY or OPENAI_API_KEY) is required when AI_MODE is "${env.AI_MODE}"`
      });
    }
  });

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export class EnvironmentError extends Error {
  constructor(issues: z.ZodError) {
    const detail = issues.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n  ");
    super(`Invalid environment configuration:\n  ${detail}`);
    this.name = "EnvironmentError";
  }
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = ServerEnvSchema.safeParse(source);
  if (!result.success) throw new EnvironmentError(result.error);
  return result.data;
}

/**
 * Deployment policy.
 *
 * These are the conditions that must hold before this configuration serves real
 * traffic. They are checked by the deploy preflight script and surfaced on the
 * admin readiness board — not inside `parseServerEnv`, because a build step
 * legitimately parses the environment without being a deployment, and coupling
 * the two means a missing production secret fails as a confusing prerender
 * error instead of a clear refusal to deploy.
 */
export type ReadinessProblem = { key: string; message: string };

export function assertProductionReady(env: ServerEnv): ReadinessProblem[] {
  const problems: ReadinessProblem[] = [];

  if (env.HASH_PEPPER === DEVELOPMENT_PEPPER) {
    problems.push({
      key: "HASH_PEPPER",
      message: "HASH_PEPPER is still the development default and must be set to a real secret."
    });
  }

  // Sample listings in production are a deliberate pre-MLS decision, recorded in
  // docs/handoff/DECISIONS.md, and are safe only while the listing surfaces
  // label every record in the UI, stay noindex, and emit no listing JSON-LD.
  // Unacknowledged fixture data is still a blocking problem; acknowledged sample
  // data is a warning, so the readiness board keeps reporting it until a
  // licensed provider replaces it.
  if (env.MLS_PROVIDER === "fixture" && !env.SHOW_SAMPLE_LISTINGS) {
    problems.push({
      key: "MLS_PROVIDER",
      message:
        "Fixture listing data is not published. Set SHOW_SAMPLE_LISTINGS=true to publish labelled sample listings, or MLS_PROVIDER=disabled, or a licensed provider."
    });
  }

  if (env.SUPABASE_SERVICE_ROLE_KEY === undefined) {
    problems.push({
      key: "SUPABASE_SERVICE_ROLE_KEY",
      message: "Without a database there is no durable lead receipt."
    });
  }

  if (env.TURNSTILE_MODE === "disabled" || env.TURNSTILE_MODE === "fixture") {
    problems.push({
      key: "TURNSTILE_MODE",
      message: "Conversion forms must be protected by a real bot challenge in production."
    });
  }
  if (env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === undefined) {
    problems.push({
      key: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      message: "Conversion forms require the public Turnstile widget identifier."
    });
  }

  return problems;
}

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const result = PublicEnvSchema.safeParse(source);
  if (!result.success) throw new EnvironmentError(result.error);
  return result.data;
}

/** Keys that must never appear in a browser bundle, a log line, or an error body. */
export const SECRET_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "TURNSTILE_SECRET_KEY",
  "GHL_PRIVATE_INTEGRATION_TOKEN",
  "GHL_WEBHOOK_PUBLIC_KEY",
  "OUTBOX_DRAIN_TOKEN",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "HIGGSFIELD_API_KEY",
  "BYTEPLUS_API_KEY",
  "MLS_ACCESS_TOKEN",
  "ATTOM_API_KEY",
  "REGRID_API_KEY",
  "SHOVELS_API_KEY",
  "AIRDNA_API_KEY",
  "RESEND_API_KEY",
  "META_CAPI_ACCESS_TOKEN",
  "ALERTS_RUN_TOKEN",
  "SENTRY_DSN",
  "HASH_PEPPER"
] as const;
