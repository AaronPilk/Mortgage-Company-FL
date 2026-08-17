/**
 * AI provider port.
 *
 * The application orchestrator owns policy: feature gating, redaction, data
 * classification, budget reservation, prompt version, and output validation. A
 * gateway in front of the provider adds observability and traffic control; it
 * does not replace any of that.
 *
 * Model identifiers never appear in feature code. They live in the route
 * registry so a model change is configuration, not a code change.
 */

export type AiCapability =
  | "text_reasoning"
  | "structured_extraction"
  | "vision_analysis"
  | "image_generation"
  | "image_edit"
  | "video_generation"
  | "embedding";

export type DataClass =
  "public" | "internal" | "consumer_contact" | "consumer_property" | "restricted";

export type AiRequest<TInput> = {
  capability: AiCapability;
  feature: string;
  input: TInput;
  outputSchemaKey: string;
  promptKey: string;
  promptVersion: string;
  dataClass: DataClass;
  maxCostCents: number;
  timeoutMs: number;
  idempotencyKey: string;
};

export type AiResult<TOutput> = {
  output: TOutput;
  provider: string;
  modelKey: string;
  promptVersion: string;
  requestId?: string;
  inputUnits?: number;
  outputUnits?: number;
  actualCostCents?: number;
  safetyLabels: string[];
  cached: boolean;
};

export interface AiProvider {
  readonly key: string;
  readonly capabilities: readonly AiCapability[];
  estimateCost(input: unknown, modelKey: string): Promise<number>;
  execute<TInput, TOutput>(
    request: AiRequest<TInput>,
    modelKey: string
  ): Promise<AiResult<TOutput>>;
}

export type ModelRoute = {
  key: string;
  capability: AiCapability;
  provider: string;
  /** Provider-specific identifier. Supplied by configuration, never hard-coded. */
  providerModel: string;
  enabled: boolean;
  maxInputBytes: number;
  timeoutMs: number;
  fallbackKeys: string[];
  allowedDataClasses: DataClass[];
};

export class AiPolicyError extends Error {}

/**
 * Enforces the data-class contract before anything leaves the process. A route
 * that has not been explicitly cleared for a data class cannot receive it, and
 * restricted data cannot reach any provider without a separate approved data map.
 */
export function assertRouteAccepts(route: ModelRoute, request: AiRequest<unknown>): void {
  if (!route.enabled) {
    throw new AiPolicyError(`model route "${route.key}" is disabled`);
  }
  if (route.capability !== request.capability) {
    throw new AiPolicyError(
      `model route "${route.key}" does not provide capability "${request.capability}"`
    );
  }
  if (request.dataClass === "restricted") {
    throw new AiPolicyError(
      "restricted data may not be sent to an AI provider without an approved data map"
    );
  }
  if (!route.allowedDataClasses.includes(request.dataClass)) {
    throw new AiPolicyError(
      `model route "${route.key}" is not cleared for data class "${request.dataClass}"`
    );
  }
}

export function selectRoute(
  routes: readonly ModelRoute[],
  key: string,
  request: AiRequest<unknown>
): ModelRoute {
  const seen = new Set<string>();
  let candidate = routes.find((route) => route.key === key);

  while (candidate !== undefined && !seen.has(candidate.key)) {
    seen.add(candidate.key);
    try {
      assertRouteAccepts(candidate, request);
      return candidate;
    } catch (error) {
      const next = candidate.fallbackKeys.find((fallback) => !seen.has(fallback));
      if (next === undefined) throw error;
      candidate = routes.find((route) => route.key === next);
    }
  }
  throw new AiPolicyError(`no usable model route for "${key}"`);
}

/** Default registry ships empty and disabled. Routes arrive from server config. */
export const EMPTY_MODEL_ROUTES: readonly ModelRoute[] = [];
