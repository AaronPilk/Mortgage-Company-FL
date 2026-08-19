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
    MLS_BASE_URL: optionalString,
    MLS_ACCESS_TOKEN: optionalString,
    MLS_ATTRIBUTION_TEXT: optionalString,

    ATTOM_API_KEY: optionalString,
    REGRID_API_KEY: optionalString,
    SHOVELS_API_KEY: optionalString,
    AIRDNA_API_KEY: optionalString,

    FEATURE_VISION: z.coerce.boolean().default(false),
    FEATURE_RENDPROP: z.coerce.boolean().default(false),
    FEATURE_ACCOUNTS: z.coerce.boolean().default(true),
    FEATURE_PROPERTY_SEARCH: z.coerce.boolean().default(false),

    SENTRY_DSN: optionalString,
    RESEND_API_KEY: optionalString,
    EMAIL_MODE: FeatureModeSchema.default("disabled"),

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
  "SENTRY_DSN",
  "HASH_PEPPER"
] as const;
