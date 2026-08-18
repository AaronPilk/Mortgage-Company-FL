import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_OPENAI_STRUCTURED_MODEL,
  OpenAiAiProvider,
  OpenAiApiError,
  OpenAiTimeoutError,
  type AiRequest,
  type StructuredExtractionInput
} from "./index";

const input: StructuredExtractionInput = {
  system: "extract criteria",
  user: "3 beds in Tampa under 500k",
  toolName: "property_search_criteria",
  toolDescription: "record criteria",
  inputSchema: { type: "object", properties: {} },
  maxOutputTokens: 256
};

const request: AiRequest<StructuredExtractionInput> = {
  capability: "structured_extraction",
  feature: "property_query_interpretation",
  input,
  outputSchemaKey: "property_search_criteria",
  promptKey: "property_query_parse",
  promptVersion: "1.0.0",
  dataClass: "consumer_property",
  maxCostCents: 5,
  timeoutMs: 5_000,
  idempotencyKey: "test-1"
};

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

function toolCallResponse(args: string): Response {
  return okResponse({
    id: "chatcmpl-1",
    choices: [
      {
        message: {
          tool_calls: [{ function: { name: "property_search_criteria", arguments: args } }]
        }
      }
    ],
    usage: { prompt_tokens: 120, completion_tokens: 40 }
  });
}

describe("OpenAiAiProvider", () => {
  it("posts a forced function call and returns the parsed arguments as output", async () => {
    const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
      const headers = init?.headers as Record<string, string>;
      expect(headers.authorization).toBe("Bearer test-key");
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body.model).toBe(DEFAULT_OPENAI_STRUCTURED_MODEL);
      expect(body.tool_choice).toEqual({
        type: "function",
        function: { name: "property_search_criteria" }
      });
      expect(body.tools).toEqual([
        {
          type: "function",
          function: {
            name: "property_search_criteria",
            description: "record criteria",
            parameters: { type: "object", properties: {} }
          }
        }
      ]);
      return toolCallResponse(
        JSON.stringify({ city: "Tampa", minBeds: 3, maxPriceDollars: 500_000 })
      );
    });

    const provider = new OpenAiAiProvider({ apiKey: "test-key", fetchImpl });
    const result = await provider.execute<StructuredExtractionInput, unknown>(request, "");

    expect(result.output).toEqual({ city: "Tampa", minBeds: 3, maxPriceDollars: 500_000 });
    expect(result.provider).toBe("openai");
    expect(result.requestId).toBe("chatcmpl-1");
    // 120 in + 40 out at the default rates is well under a cent; the charge is
    // still one integer cent, never a fabricated zero.
    expect(result.actualCostCents).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("never retries: one HTTP error is one thrown OpenAiApiError", async () => {
    const fetchImpl = vi.fn(async () => new Response("overloaded", { status: 429 }));
    const provider = new OpenAiAiProvider({ apiKey: "test-key", fetchImpl });

    await expect(
      provider.execute<StructuredExtractionInput, unknown>(request, "")
    ).rejects.toThrowError(OpenAiApiError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("surfaces a timeout as OpenAiTimeoutError so the caller can hold the reservation", async () => {
    const fetchImpl = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        })
    );
    const provider = new OpenAiAiProvider({ apiKey: "test-key", fetchImpl });

    await expect(
      provider.execute<StructuredExtractionInput, unknown>({ ...request, timeoutMs: 10 }, "")
    ).rejects.toThrowError(OpenAiTimeoutError);
  });

  it("returns null output when no tool call came back, leaving validation to the caller", async () => {
    const fetchImpl = vi.fn(async () =>
      okResponse({ id: "chatcmpl-2", choices: [{ message: { content: "hello" } }], usage: {} })
    );
    const provider = new OpenAiAiProvider({ apiKey: "test-key", fetchImpl });
    const result = await provider.execute<StructuredExtractionInput, unknown>(request, "");
    expect(result.output).toBeNull();
  });

  it("returns null output when the arguments are not parseable JSON", async () => {
    const fetchImpl = vi.fn(async () => toolCallResponse('{"city": "Tam'));
    const provider = new OpenAiAiProvider({ apiKey: "test-key", fetchImpl });
    const result = await provider.execute<StructuredExtractionInput, unknown>(request, "");
    expect(result.output).toBeNull();
  });

  it("refuses capabilities it does not provide", async () => {
    const fetchImpl = vi.fn();
    const provider = new OpenAiAiProvider({ apiKey: "test-key", fetchImpl });
    await expect(
      provider.execute({ ...request, capability: "image_generation" }, "")
    ).rejects.toThrow(/does not provide capability/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("estimates a whole-cent cost before any call is made", async () => {
    const provider = new OpenAiAiProvider({ apiKey: "test-key", fetchImpl: vi.fn() });
    const estimate = await provider.estimateCost(input);
    expect(Number.isInteger(estimate)).toBe(true);
    expect(estimate).toBeGreaterThanOrEqual(1);
  });
});
