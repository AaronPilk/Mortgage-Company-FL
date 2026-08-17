import {
  type AiCapability,
  type AiProvider,
  type AiRequest,
  type AiResult,
  AiPolicyError
} from "./port";

/** Default provider. Refuses every request so a misconfiguration cannot spend money. */
export class DisabledAiProvider implements AiProvider {
  readonly key = "disabled";
  readonly capabilities: readonly AiCapability[] = [];

  async estimateCost(): Promise<number> {
    return 0;
  }

  async execute<TOutput>(): Promise<AiResult<TOutput>> {
    throw new AiPolicyError("AI is disabled in this environment");
  }
}

export type FixtureResponder = (request: AiRequest<unknown>) => unknown;

/** Deterministic double. Produces no network traffic and charges a fixed cost. */
export class FixtureAiProvider implements AiProvider {
  readonly key = "fixture";
  readonly capabilities: readonly AiCapability[] = [
    "text_reasoning",
    "structured_extraction",
    "vision_analysis",
    "image_generation"
  ];

  readonly calls: AiRequest<unknown>[] = [];

  constructor(
    private readonly responder: FixtureResponder,
    private readonly costCents = 1
  ) {}

  async estimateCost(): Promise<number> {
    return this.costCents;
  }

  async execute<TInput, TOutput>(
    request: AiRequest<TInput>,
    modelKey: string
  ): Promise<AiResult<TOutput>> {
    this.calls.push(request as AiRequest<unknown>);
    return {
      output: this.responder(request as AiRequest<unknown>) as TOutput,
      provider: this.key,
      modelKey,
      promptVersion: request.promptVersion,
      requestId: `fixture-${this.calls.length}`,
      actualCostCents: this.costCents,
      safetyLabels: [],
      cached: false
    };
  }
}

/**
 * Output validation contract.
 *
 * A model result is untrusted input. It is validated against a registered schema
 * before it can reach a report. A malformed result is never rendered as partial
 * JSON; it falls back to deterministic content or a human-review state.
 */
export type OutputValidator<T> = (
  value: unknown
) => { ok: true; value: T } | { ok: false; error: string };

export type ValidationOutcome<T> =
  { status: "valid"; value: T; repaired: boolean } | { status: "unusable"; error: string };

export async function executeWithValidation<TInput, TOutput>(
  provider: AiProvider,
  request: AiRequest<TInput>,
  modelKey: string,
  validate: OutputValidator<TOutput>,
  options: { allowRepair: boolean } = { allowRepair: true }
): Promise<ValidationOutcome<TOutput>> {
  const first = await provider.execute<TInput, unknown>(request, modelKey);
  const checked = validate(first.output);
  if (checked.ok) return { status: "valid", value: checked.value, repaired: false };

  if (!options.allowRepair) return { status: "unusable", error: checked.error };

  // Exactly one repair attempt. More than one is a retry storm against a paid API.
  const repair = await provider.execute<TInput, unknown>(
    { ...request, idempotencyKey: `${request.idempotencyKey}:repair` },
    modelKey
  );
  const rechecked = validate(repair.output);
  if (rechecked.ok) return { status: "valid", value: rechecked.value, repaired: true };
  return { status: "unusable", error: rechecked.error };
}
