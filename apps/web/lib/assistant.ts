import "server-only";
import {
  AiProviderApiError,
  selectRoute,
  type AiRequest,
  type QuotaPolicy,
  type StructuredExtractionInput
} from "@tract/integrations";
import { ASSISTANT_ROUTE, MODEL_ROUTES, ai } from "./ai";
import { aiBudgetStore } from "./ai-budget";
import { env, publicFeatures } from "./env";
import { log } from "./logger";
import type { AssistantLink, AssistantMessage, AssistantReply } from "./assistant-types";

/**
 * Site assistant — orchestration and compliance layer.
 *
 * The assistant educates about mortgage concepts and points to the right tool or
 * page; it never quotes a rate, never says anyone is approved or qualifies, and
 * never collects application data. Two guardrails enforce that: the system
 * prompt below, and a post-filter (`scrubReply`) that catches a rate quote or a
 * decision phrase and replaces it with a safe deflection — defense in depth over
 * the model. The model's links are chosen from a fixed whitelist of real routes,
 * so it cannot invent a URL. Spend is reserved before the provider is called and
 * settled after (invariant 8); any failure returns a safe canned reply, so the
 * visitor is never left hanging.
 */

const FEATURE = "site_assistant";
const PROMPT_KEY = "site_assistant";
const PROMPT_VERSION = "1.0.0";
/** A short constrained reply is a fraction of a cent; cap hard anyway. */
const MAX_COST_CENTS = 3;
const MAX_REPLY_CHARS = 900;

/** The only links the assistant may surface — keys the model picks from, mapped to real routes here. */
const ASSISTANT_LINKS: Record<string, AssistantLink> = {
  payment: { label: "Payment calculator", href: "/calculators/mortgage-payment" },
  affordability: { label: "Affordability calculator", href: "/calculators/affordability" },
  down_payment_assistance: {
    label: "Down payment assistance",
    href: "/florida-down-payment-assistance"
  },
  first_time: { label: "First-time buyer guide", href: "/mortgage/first-time-home-buyers" },
  refinance: { label: "Refinancing", href: "/mortgage/refinance" },
  rates: { label: "Today's rates", href: "/mortgage-rates" },
  loan_options: { label: "Loan options", href: "/mortgage" },
  properties: { label: "Property search", href: "/properties" },
  home_lookup: { label: "Look up a home", href: "/home-lookup" },
  talk: { label: "Talk to a licensed officer", href: "/talk" }
};
const ASSISTANT_LINK_KEYS = Object.keys(ASSISTANT_LINKS);

const ASSISTANT_TOOL = {
  name: "assistant_reply",
  description:
    "Record the assistant's reply to the visitor, any relevant site links, and whether to offer a licensed-officer connection.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["reply"],
    properties: {
      reply: { type: "string", maxLength: MAX_REPLY_CHARS },
      suggestedLinks: {
        type: "array",
        maxItems: 3,
        items: { type: "string", enum: ASSISTANT_LINK_KEYS }
      },
      offerConnect: { type: "boolean" }
    }
  } as Record<string, unknown>
} as const;

const ASSISTANT_SYSTEM_PROMPT = [
  "You are the assistant on the website of a Florida mortgage brokerage. You help visitors understand mortgage concepts in plain language, point them to the right calculator, program, or page on the site, and offer to connect them with a licensed loan officer.",
  "",
  "Hard rules you must never break:",
  "- Never quote or estimate an interest rate or APR, and never say what rate someone would get. You do not price loans.",
  '- Never tell someone they are "approved", "pre-approved", "qualified", or "eligible", and never guarantee an outcome. You do not make lending or credit decisions.',
  "- Never give individualized financial, legal, or tax advice. Stay general and educational.",
  "- Never ask for or accept a Social Security number, income documents, account numbers, or a date of birth.",
  '- If a visitor asks for a rate, a decision, personalized numbers, or "do I qualify", explain that only a licensed loan officer can do that, set offerConnect true, and offer to connect them.',
  "",
  "Style: keep replies short — two or three sentences — plain and friendly, like a helpful human. Use suggestedLinks only from the allowed keys and only when genuinely relevant. Set offerConnect true whenever the visitor wants to start, wants a rate or a decision, or wants numbers for their own situation.",
  "Always answer by calling the assistant_reply tool."
].join("\n");

/** Shown whenever the AI path is unavailable or fails, so the visitor always gets a useful answer. */
const FALLBACK_REPLY: AssistantReply = {
  reply:
    "I can point you to our calculators and program guides, or connect you with a licensed loan officer who can talk through your situation. What are you working on — buying, refinancing, or just exploring?",
  links: [ASSISTANT_LINKS.payment as AssistantLink, ASSISTANT_LINKS.talk as AssistantLink],
  offerConnect: true
};

const RATE_QUOTE =
  /(rate|apr|interest)[^.?!]{0,40}\d{1,2}(?:\.\d+)?\s?%|\d{1,2}(?:\.\d+)?\s?%[^.?!]{0,20}(rate|apr|interest)/i;
const DECISION_PHRASE =
  /\b(you(?:'re| are)?\s+(?:pre-?)?approved|you\s+(?:would\s+|will\s+|'ll\s+)?qualify|you\s+are\s+eligible|guaranteed\s+approval|your\s+rate\s+(?:is|would be))\b/i;

/**
 * Compliance post-filter. If the model's reply slips a rate quote or a decision
 * phrase past the system prompt, drop the whole reply for a safe deflection and
 * force the officer offer — the reply is never shown as written in that case.
 */
export function scrubReply(reply: string): { reply: string; forceConnect: boolean } {
  if (RATE_QUOTE.test(reply) || DECISION_PHRASE.test(reply)) {
    return {
      reply:
        "That's exactly what a licensed loan officer should answer for your situation — I can't quote rates or say what you'd qualify for. Want me to connect you with someone who can?",
      forceConnect: true
    };
  }
  return { reply, forceConnect: false };
}

function resolveLinks(keys: unknown): AssistantLink[] {
  if (!Array.isArray(keys)) return [];
  const seen = new Set<string>();
  const out: AssistantLink[] = [];
  for (const key of keys) {
    if (typeof key !== "string" || seen.has(key)) continue;
    const link = ASSISTANT_LINKS[key];
    if (link !== undefined) {
      seen.add(key);
      out.push(link);
    }
    if (out.length >= 3) break;
  }
  return out;
}

function serializeConversation(messages: AssistantMessage[]): string {
  const transcript = messages
    .map((message) => `${message.role === "user" ? "Visitor" : "Assistant"}: ${message.content}`)
    .join("\n");
  return `Conversation so far:\n${transcript}\n\nWrite the assistant's next reply.`;
}

/** Whether the assistant surface may serve. The public flag already requires a live AI mode. */
export function assistantAvailable(): boolean {
  return publicFeatures().assistant;
}

/**
 * Run one assistant turn: reserve budget, one provider call, validate and scrub
 * the output, settle. Returns a safe fallback on any refusal or failure — the
 * caller always gets a usable reply.
 */
export async function runAssistant(params: {
  messages: AssistantMessage[];
  subjectKey: string;
  requestId: string;
}): Promise<AssistantReply> {
  const provider = ai();
  if (provider.key === "disabled") return FALLBACK_REPLY;

  const input: StructuredExtractionInput = {
    system: ASSISTANT_SYSTEM_PROMPT,
    user: serializeConversation(params.messages),
    toolName: ASSISTANT_TOOL.name,
    toolDescription: ASSISTANT_TOOL.description,
    inputSchema: ASSISTANT_TOOL.inputSchema,
    maxOutputTokens: 400
  };

  const aiRequest: AiRequest<StructuredExtractionInput> = {
    capability: "structured_extraction",
    feature: FEATURE,
    input,
    outputSchemaKey: ASSISTANT_TOOL.name,
    promptKey: PROMPT_KEY,
    promptVersion: PROMPT_VERSION,
    dataClass: "consumer_contact",
    maxCostCents: MAX_COST_CENTS,
    timeoutMs: ASSISTANT_ROUTE.timeoutMs,
    idempotencyKey: params.requestId
  };

  let route;
  try {
    route = selectRoute(MODEL_ROUTES, ASSISTANT_ROUTE.key, aiRequest);
  } catch {
    return FALLBACK_REPLY;
  }

  const configuration = env();
  const subjectPolicy: QuotaPolicy = {
    subjectKind: "consumer",
    feature: FEATURE,
    period: "day",
    requestLimit: 60,
    costLimitCents: configuration.AI_DEFAULT_USER_DAILY_BUDGET_CENTS,
    concurrencyLimit: 2,
    enabled: true
  };
  const platformPolicy: QuotaPolicy = {
    subjectKind: "platform",
    feature: FEATURE,
    period: "day",
    requestLimit: null,
    costLimitCents: configuration.AI_DAILY_PLATFORM_BUDGET_CENTS,
    concurrencyLimit: null,
    enabled: true
  };

  let estimatedCostCents: number;
  try {
    estimatedCostCents = await provider.estimateCost(input, route.providerModel);
  } catch {
    return FALLBACK_REPLY;
  }

  const reserved = aiBudgetStore.reserve({
    feature: FEATURE,
    subjectKey: params.subjectKey,
    subjectPolicy,
    platformPolicy,
    estimatedCostCents,
    maxCostCents: MAX_COST_CENTS
  });
  if (!reserved.allowed) {
    log.info("assistant budget refused", { requestId: params.requestId, reason: reserved.reason });
    return FALLBACK_REPLY;
  }

  try {
    const result = await provider.execute<StructuredExtractionInput, unknown>(
      aiRequest,
      route.providerModel
    );
    reserved.reservation.settle({
      kind: "succeeded",
      actualCostCents: result.actualCostCents ?? estimatedCostCents
    });
    return shapeReply(result.output);
  } catch (error) {
    if (error instanceof AiProviderApiError) {
      reserved.reservation.settle({ kind: "failed_before_billable" });
    } else {
      const { requiresReconciliation } = reserved.reservation.settle({ kind: "unknown" });
      if (requiresReconciliation) {
        log.error("assistant outcome unknown; reservation held", { requestId: params.requestId });
      }
    }
    return FALLBACK_REPLY;
  }
}

/** Validate the model's structured output into a safe reply. Anything malformed falls back. */
function shapeReply(output: unknown): AssistantReply {
  if (typeof output !== "object" || output === null) return FALLBACK_REPLY;
  const record = output as Record<string, unknown>;
  const rawReply = typeof record.reply === "string" ? record.reply.trim() : "";
  if (rawReply === "") return FALLBACK_REPLY;

  const scrubbed = scrubReply(rawReply.slice(0, MAX_REPLY_CHARS));
  const links = resolveLinks(record.suggestedLinks);
  const offerConnect = record.offerConnect === true || scrubbed.forceConnect;
  // A deflection always offers the officer link; make sure it is present.
  if (scrubbed.forceConnect && !links.some((link) => link.href === "/talk")) {
    links.push(ASSISTANT_LINKS.talk as AssistantLink);
  }
  return { reply: scrubbed.reply, links: links.slice(0, 3), offerConnect };
}
