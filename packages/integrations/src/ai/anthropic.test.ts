import { describe, expect, it, vi } from "vitest";
import {
  AnthropicAiProvider,
  AnthropicApiError,
  AnthropicTimeoutError,
  DEFAULT_ANTHROPIC_STRUCTURED_MODEL,
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

describe("AnthropicAiProvider", () => {
  it("posts a forced tool call and returns the tool input as output", async () => {
    const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.anthropic.com/v1/messages");
      const headers = init?.headers as Record<string, string>;
      expect(headers["x-api-key"]).toBe("test-key");
      expect(headers["anthropic-version"]).toBe("2023-06-01");
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body.model).toBe(DEFAULT_ANTHROPIC_STRUCTURED_MODEL);
      expect(body.tool_choice).toEqual({ type: "tool", name: "property_search_criteria" });
      return okResponse({
        id: "msg_1",
        content: [
          { type: "tool_use", input: { city: "Tampa", minBeds: 3, maxPriceDollars: 500_000 } }
        ],
        usage: { input_tokens: 120, output_tokens: 40 }
      });
    });

    const provider = new AnthropicAiProvider({ apiKey: "test-key", fetchImpl });
    const result = await provider.execute<StructuredExtractionInput, unknown>(request, "");

    expect(result.output).toEqual({ city: "Tampa", minBeds: 3, maxPriceDollars: 500_000 });
    expect(result.provider).toBe("anthropic");
    expect(result.requestId).toBe("msg_1");
    // 120 in + 40 out at the default rates is well under a cent; the charge is
    // still one integer cent, never a fabricated zero.
    expect(result.actualCostCents).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("never retries: one HTTP error is one thrown AnthropicApiError", async () => {
    const fetchImpl = vi.fn(async () => new Response("overloaded", { status: 529 }));
    const provider = new AnthropicAiProvider({ apiKey: "test-key", fetchImpl });

    await expect(
      provider.execute<StructuredExtractionInput, unknown>(request, "")
    ).rejects.toThrowError(AnthropicApiError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("surfaces a timeout as AnthropicTimeoutError so the caller can hold the reservation", async () => {
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
    const provider = new AnthropicAiProvider({ apiKey: "test-key", fetchImpl });

    await expect(
      provider.execute<StructuredExtractionInput, unknown>({ ...request, timeoutMs: 10 }, "")
    ).rejects.toThrowError(AnthropicTimeoutError);
  });

  it("returns null output when no tool call came back, leaving validation to the caller", async () => {
    const fetchImpl = vi.fn(async () =>
      okResponse({ id: "msg_2", content: [{ type: "text", text: "hello" }], usage: {} })
    );
    const provider = new AnthropicAiProvider({ apiKey: "test-key", fetchImpl });
    const result = await provider.execute<StructuredExtractionInput, unknown>(request, "");
    expect(result.output).toBeNull();
  });

  it("refuses capabilities it does not provide", async () => {
    const fetchImpl = vi.fn();
    const provider = new AnthropicAiProvider({ apiKey: "test-key", fetchImpl });
    await expect(
      provider.execute({ ...request, capability: "image_generation" }, "")
    ).rejects.toThrow(/does not provide capability/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("estimates a whole-cent cost before any call is made", async () => {
    const provider = new AnthropicAiProvider({ apiKey: "test-key", fetchImpl: vi.fn() });
    const estimate = await provider.estimateCost(input);
    expect(Number.isInteger(estimate)).toBe(true);
    expect(estimate).toBeGreaterThanOrEqual(1);
  });
});
