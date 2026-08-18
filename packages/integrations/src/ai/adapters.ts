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
 * Anthropic Messages API, for the "structured_extraction" capability only.
 *
 * The output contract is enforced with a forced tool call: the model cannot
 * answer except by filling the caller's JSON schema, so there is no free-text
 * parsing step to get wrong. One request per execute — no retry lives in this
 * adapter, because a retry against a paid API is a second spend the caller's
 * reservation never covered.
 *
 * The default model identifier is constructor configuration, not feature code;
 * a route registry's `providerModel` overrides it per route.
 */

/** Current small/fast tier. A route or constructor option overrides it. */
export const DEFAULT_ANTHROPIC_STRUCTURED_MODEL = "claude-haiku-4-5";

/**
 * Published per-million-token prices for the default model, in integer cents.
 * Used only to reserve and settle spend; overstating by rounding up is the
 * safe direction. Constructor-overridable when the model changes tier.
 */
const DEFAULT_INPUT_CENTS_PER_MTOK = 100;
const DEFAULT_OUTPUT_CENTS_PER_MTOK = 500;

/** Rough chars-per-token divisor for cost estimation. Deliberately pessimistic. */
const CHARS_PER_TOKEN = 3;

export type StructuredExtractionInput = {
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  /** JSON schema the tool call must satisfy. The model cannot reply outside it. */
  inputSchema: Record<string, unknown>;
  maxOutputTokens?: number;
};

/**
 * Shared bases so a caller can classify any vendor's failure the same way:
 * an HTTP error status means the provider refused before billable work; a
 * timeout means the outcome is unknown and the reservation must be held.
 * The vendor-specific subclasses below stay exported for existing callers.
 */
export class AiProviderApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AiProviderApiError";
  }
}

export class AiProviderTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderTimeoutError";
  }
}

/** The provider answered with an HTTP error. Carries the status, never the body. */
export class AnthropicApiError extends AiProviderApiError {
  constructor(status: number) {
    super(`Anthropic API responded ${status}`, status);
    this.name = "AnthropicApiError";
  }
}

/** The request timed out in flight. The provider may still have billed it. */
export class AnthropicTimeoutError extends AiProviderTimeoutError {
  constructor() {
    super("Anthropic API request timed out");
    this.name = "AnthropicTimeoutError";
  }
}

export type AnthropicProviderOptions = {
  apiKey: string;
  defaultModel?: string;
  baseUrl?: string;
  inputCentsPerMillionTokens?: number;
  outputCentsPerMillionTokens?: number;
  /** Test seam. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
};

function isStructuredExtractionInput(value: unknown): value is StructuredExtractionInput {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.system === "string" &&
    typeof candidate.user === "string" &&
    typeof candidate.toolName === "string" &&
    typeof candidate.inputSchema === "object" &&
    candidate.inputSchema !== null
  );
}

export class AnthropicAiProvider implements AiProvider {
  readonly key = "anthropic";
  readonly capabilities: readonly AiCapability[] = ["structured_extraction"];

  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly baseUrl: string;
  private readonly inputCentsPerMTok: number;
  private readonly outputCentsPerMTok: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AnthropicProviderOptions) {
    this.apiKey = options.apiKey;
    this.defaultModel = options.defaultModel ?? DEFAULT_ANTHROPIC_STRUCTURED_MODEL;
    this.baseUrl = (options.baseUrl ?? "https://api.anthropic.com").replace(/\/$/, "");
    this.inputCentsPerMTok = options.inputCentsPerMillionTokens ?? DEFAULT_INPUT_CENTS_PER_MTOK;
    this.outputCentsPerMTok = options.outputCentsPerMillionTokens ?? DEFAULT_OUTPUT_CENTS_PER_MTOK;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private costCents(inputTokens: number, outputTokens: number): number {
    const cents =
      (inputTokens * this.inputCentsPerMTok + outputTokens * this.outputCentsPerMTok) / 1_000_000;
    // Integer cents, rounded up, never below one: a fraction of a cent is still
    // money and understating spend is the failure the ledger exists to prevent.
    return Math.max(1, Math.ceil(cents));
  }

  async estimateCost(input: unknown): Promise<number> {
    if (!isStructuredExtractionInput(input)) return 1;
    const promptChars =
      input.system.length + input.user.length + JSON.stringify(input.inputSchema).length;
    const inputTokens = Math.ceil(promptChars / CHARS_PER_TOKEN) + 64;
    return this.costCents(inputTokens, input.maxOutputTokens ?? 512);
  }

  async execute<TInput, TOutput>(
    request: AiRequest<TInput>,
    modelKey: string
  ): Promise<AiResult<TOutput>> {
    if (request.capability !== "structured_extraction") {
      throw new AiPolicyError(
        `Anthropic adapter does not provide capability "${request.capability}"`
      );
    }
    const input: unknown = request.input;
    if (!isStructuredExtractionInput(input)) {
      throw new AiPolicyError("structured_extraction requires a schema-bearing input");
    }

    const model = modelKey !== "" ? modelKey : this.defaultModel;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          max_tokens: input.maxOutputTokens ?? 512,
          system: input.system,
          messages: [{ role: "user", content: input.user }],
          tools: [
            {
              name: input.toolName,
              description: input.toolDescription,
              input_schema: input.inputSchema
            }
          ],
          tool_choice: { type: "tool", name: input.toolName }
        })
      });
    } catch (error) {
      // An abort is a timeout with the request possibly in flight; the caller
      // must settle it as an unknown outcome, not a free failure.
      if (error instanceof Error && error.name === "AbortError") {
        throw new AnthropicTimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) throw new AnthropicApiError(response.status);

    const body = (await response.json()) as {
      id?: string;
      content?: { type: string; input?: unknown }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const toolUse = body.content?.find((block) => block.type === "tool_use");
    const inputTokens = body.usage?.input_tokens ?? 0;
    const outputTokens = body.usage?.output_tokens ?? 0;

    return {
      // Missing tool output is returned as null rather than thrown: the call
      // was billed, and the caller's output validation decides what happens.
      output: (toolUse?.input ?? null) as TOutput,
      provider: this.key,
      modelKey: model,
      promptVersion: request.promptVersion,
      ...(body.id === undefined ? {} : { requestId: body.id }),
      inputUnits: inputTokens,
      outputUnits: outputTokens,
      actualCostCents: this.costCents(inputTokens, outputTokens),
      safetyLabels: [],
      cached: false
    };
  }
}

/**
 * OpenAI Chat Completions API, for the "structured_extraction" capability only.
 *
 * Mirrors the Anthropic adapter's contract exactly: the output is a forced
 * function tool call, so `StructuredExtractionInput` maps onto the request
 * without translation and the call site does not change per vendor. One request
 * per execute — no retry lives in this adapter, because a retry against a paid
 * API is a second spend the caller's reservation never covered.
 */

/** Current small/fast tier. A route or constructor option overrides it. */
export const DEFAULT_OPENAI_STRUCTURED_MODEL = "gpt-4.1-mini";

/**
 * Published per-million-token prices for the default model, in integer cents.
 * Used only to reserve and settle spend; overstating by rounding up is the
 * safe direction. Constructor-overridable when the model changes tier.
 */
const DEFAULT_OPENAI_INPUT_CENTS_PER_MTOK = 40;
const DEFAULT_OPENAI_OUTPUT_CENTS_PER_MTOK = 160;

export class OpenAiApiError extends AiProviderApiError {
  constructor(status: number) {
    super(`OpenAI API responded ${status}`, status);
    this.name = "OpenAiApiError";
  }
}

export class OpenAiTimeoutError extends AiProviderTimeoutError {
  constructor() {
    super("OpenAI API request timed out");
    this.name = "OpenAiTimeoutError";
  }
}

export type OpenAiProviderOptions = {
  apiKey: string;
  defaultModel?: string;
  baseUrl?: string;
  inputCentsPerMillionTokens?: number;
  outputCentsPerMillionTokens?: number;
  /** Test seam. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
};

export class OpenAiAiProvider implements AiProvider {
  readonly key = "openai";
  readonly capabilities: readonly AiCapability[] = ["structured_extraction"];

  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly baseUrl: string;
  private readonly inputCentsPerMTok: number;
  private readonly outputCentsPerMTok: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenAiProviderOptions) {
    this.apiKey = options.apiKey;
    this.defaultModel = options.defaultModel ?? DEFAULT_OPENAI_STRUCTURED_MODEL;
    this.baseUrl = (options.baseUrl ?? "https://api.openai.com").replace(/\/$/, "");
    this.inputCentsPerMTok =
      options.inputCentsPerMillionTokens ?? DEFAULT_OPENAI_INPUT_CENTS_PER_MTOK;
    this.outputCentsPerMTok =
      options.outputCentsPerMillionTokens ?? DEFAULT_OPENAI_OUTPUT_CENTS_PER_MTOK;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private costCents(inputTokens: number, outputTokens: number): number {
    const cents =
      (inputTokens * this.inputCentsPerMTok + outputTokens * this.outputCentsPerMTok) / 1_000_000;
    // Integer cents, rounded up, never below one: a fraction of a cent is still
    // money and understating spend is the failure the ledger exists to prevent.
    return Math.max(1, Math.ceil(cents));
  }

  async estimateCost(input: unknown): Promise<number> {
    if (!isStructuredExtractionInput(input)) return 1;
    const promptChars =
      input.system.length + input.user.length + JSON.stringify(input.inputSchema).length;
    const inputTokens = Math.ceil(promptChars / CHARS_PER_TOKEN) + 64;
    return this.costCents(inputTokens, input.maxOutputTokens ?? 512);
  }

  async execute<TInput, TOutput>(
    request: AiRequest<TInput>,
    modelKey: string
  ): Promise<AiResult<TOutput>> {
    if (request.capability !== "structured_extraction") {
      throw new AiPolicyError(`OpenAI adapter does not provide capability "${request.capability}"`);
    }
    const input: unknown = request.input;
    if (!isStructuredExtractionInput(input)) {
      throw new AiPolicyError("structured_extraction requires a schema-bearing input");
    }

    const model = modelKey !== "" ? modelKey : this.defaultModel;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          max_completion_tokens: input.maxOutputTokens ?? 512,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: input.toolName,
                description: input.toolDescription,
                parameters: input.inputSchema
              }
            }
          ],
          tool_choice: { type: "function", function: { name: input.toolName } }
        })
      });
    } catch (error) {
      // An abort is a timeout with the request possibly in flight; the caller
      // must settle it as an unknown outcome, not a free failure.
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenAiTimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) throw new OpenAiApiError(response.status);

    const body = (await response.json()) as {
      id?: string;
      choices?: {
        message?: { tool_calls?: { function?: { name?: string; arguments?: unknown } }[] };
      }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    // Unlike Anthropic's structured tool input, the arguments arrive as a JSON
    // string the model composed, so it can be missing or truncated. Either case
    // is a billed call with an unusable answer: return null and let the
    // caller's output validation decide, never a throw that masks the fallback.
    let output: unknown = null;
    const args = body.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (typeof args === "string") {
      try {
        output = JSON.parse(args) as unknown;
      } catch {
        output = null;
      }
    }

    const inputTokens = body.usage?.prompt_tokens ?? 0;
    const outputTokens = body.usage?.completion_tokens ?? 0;

    return {
      output: output as TOutput,
      provider: this.key,
      modelKey: model,
      promptVersion: request.promptVersion,
      ...(body.id === undefined ? {} : { requestId: body.id }),
      inputUnits: inputTokens,
      outputUnits: outputTokens,
      actualCostCents: this.costCents(inputTokens, outputTokens),
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
