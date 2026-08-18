import "server-only";
import {
  AnthropicAiProvider,
  DEFAULT_ANTHROPIC_STRUCTURED_MODEL,
  DisabledAiProvider,
  FixtureAiProvider,
  type AiProvider,
  type AiRequest,
  type ModelRoute,
  type StructuredExtractionInput
} from "@tract/integrations";
import { interpretedToExtraction, parseNaturalQuery } from "@/components/properties/nl-parser";
import { env } from "./env";

/**
 * AI provider selection, mirroring `crm.ts` / `listings.ts`.
 *
 * disabled → a provider that refuses every request; fixture → a deterministic
 * double whose answers come from the same rule-based parser the fallback path
 * uses (so fixture mode exercises the full AI pipeline without inventing
 * anything); sandbox/production → the real Anthropic adapter, which exists only
 * when its credential does. The environment schema enforces that a live
 * AI_MODE carries ANTHROPIC_API_KEY, and the fallback to Disabled here is the
 * belt to that suspender.
 *
 * Going live later is configuration, not code: set AI_MODE=production (or
 * sandbox), provide the ANTHROPIC_API_KEY secret through the deployment secret
 * store, and set non-zero AI_DAILY_PLATFORM_BUDGET_CENTS /
 * AI_DEFAULT_USER_DAILY_BUDGET_CENTS — with the budgets at their zero default,
 * every paid reservation is refused and the feature stays on the deterministic
 * parser. Nothing in this file or in wrangler.jsonc needs to change.
 */

/**
 * The route registry for this application. Model identifiers live here, not in
 * feature code, so a model change is a configuration edit in one place.
 */
export const PROPERTY_QUERY_ROUTE: ModelRoute = {
  key: "property-query-parse",
  capability: "structured_extraction",
  provider: "anthropic",
  providerModel: DEFAULT_ANTHROPIC_STRUCTURED_MODEL,
  enabled: true,
  maxInputBytes: 2_048,
  timeoutMs: 6_000,
  fallbackKeys: [],
  // The query is a consumer's own free text about a property they want. It is
  // search input rather than a contact record, but a person can type anything,
  // so it is classified at the property level, not as public.
  allowedDataClasses: ["public", "internal", "consumer_property"]
};

export const MODEL_ROUTES: readonly ModelRoute[] = [PROPERTY_QUERY_ROUTE];

/**
 * The fixture provider answers with the deterministic parser's reading of the
 * request text, shaped exactly like the real tool output. Zero cost: fixtures
 * spend nothing, so the budget path stays exercised without a budget being
 * provisioned in development.
 */
function fixtureResponder(request: AiRequest<unknown>): unknown {
  const input = request.input as Partial<StructuredExtractionInput>;
  const text = typeof input.user === "string" ? input.user : "";
  return interpretedToExtraction(parseNaturalQuery(text));
}

let instance: AiProvider | undefined;

export function ai(): AiProvider {
  if (instance !== undefined) return instance;
  const configuration = env();

  switch (configuration.AI_MODE) {
    case "fixture":
      instance = new FixtureAiProvider(fixtureResponder, 0);
      break;
    case "sandbox":
    case "production": {
      const apiKey = configuration.ANTHROPIC_API_KEY;
      instance =
        apiKey === undefined ? new DisabledAiProvider() : new AnthropicAiProvider({ apiKey });
      break;
    }
    default:
      instance = new DisabledAiProvider();
  }
  return instance;
}

/** Test seam so a route test can inject a double without touching the environment. */
export function __setAiForTesting(provider: AiProvider | undefined): void {
  instance = provider;
}
