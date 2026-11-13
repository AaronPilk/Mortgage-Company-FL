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

/**
 * The only links the assistant may surface — keys the model picks from and the
 * deterministic router maps to, resolved to real routes here. The set spans the
 * whole TRACT product (homes, value, calculators, the loan portal, agents), not
 * only mortgages, so the assistant can route a visitor to anything the site does.
 */
const ASSISTANT_LINKS: Record<string, AssistantLink> = {
  payment: { label: "Payment calculator", href: "/calculators/mortgage-payment" },
  affordability: { label: "Affordability calculator", href: "/calculators/affordability" },
  calculators: { label: "All calculators", href: "/calculators" },
  down_payment_assistance: {
    label: "Down payment assistance",
    href: "/florida-down-payment-assistance"
  },
  first_time: { label: "First-time buyer guide", href: "/mortgage/first-time-home-buyers" },
  purchase: { label: "Buying a home", href: "/mortgage/purchase" },
  refinance: { label: "Refinancing", href: "/mortgage/refinance" },
  rates: { label: "Today's rates", href: "/mortgage-rates" },
  loan_options: { label: "Loan options", href: "/mortgage" },
  plan: { label: "Build a plan", href: "/plan" },
  properties: { label: "Search homes", href: "/properties" },
  home_lookup: { label: "Look up a home", href: "/home-lookup" },
  home_value: { label: "What's my home worth", href: "/what-is-my-home-worth" },
  agents: { label: "Find an agent", href: "/agents" },
  resources: { label: "Guides & resources", href: "/resources" },
  account: { label: "Client login", href: "/account" },
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

/**
 * The capability menu — the assistant's product-wide answer when nothing more
 * specific fits. It stands in for the AI path whenever that path is unavailable
 * or fails, so the visitor always gets a useful, TRACT-wide answer instead of a
 * dead end, and it is what the greeting-style intents reuse.
 */
const CAPABILITY_TEXT =
  "There's a lot here beyond the mortgage itself — you can search Florida homes with the true monthly cost shown, size up a payment or what you can afford, look at refinancing, track your home's value, or talk to a licensed officer. What would help most?";

const FALLBACK_REPLY: AssistantReply = {
  reply: CAPABILITY_TEXT,
  links: [
    ASSISTANT_LINKS.properties as AssistantLink,
    ASSISTANT_LINKS.payment as AssistantLink,
    ASSISTANT_LINKS.talk as AssistantLink
  ],
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

/**
 * Deterministic intent routing.
 *
 * This is the assistant's backend logic, and it runs BEFORE any paid model call.
 * Most visitors ask a handful of recognisable things — find a home, a payment, a
 * refinance, my home's value, talk to someone — and each gets a tailored,
 * compliant answer here for zero cost. Two things fall out of that:
 *
 *   - Coverage: the assistant speaks to the whole TRACT product, not just
 *     mortgages — property search, the value dashboard, calculators, the loan
 *     portal, agents — because those are the intents below.
 *   - Cost safety: a bot that spams the common questions never reaches the model,
 *     so it cannot run up the AI bill. The paid path is only ever touched by a
 *     genuinely novel message, and even then behind the rate limit and budget.
 *
 * Rules are ordered most-specific first; the first match wins. Every reply is
 * hand-written to satisfy the same compliance bar as the model output: no rate
 * quotes, no "you qualify", no individualized advice.
 */
type Intent = { match: RegExp; reply: string; links: string[]; offerConnect: boolean };

const INTENTS: Intent[] = [
  {
    // Wanting a person comes first: if they ask to talk, route them, whatever else they said.
    match:
      /\b(talk|speak|call me|connect me|human|real person|loan officer|representative|advisor|contact you)\b/,
    reply:
      "Happy to connect you. A licensed loan officer can talk through your situation and answer the specifics I'm not able to. Want me to set that up?",
    links: ["talk"],
    offerConnect: true
  },
  {
    match:
      /\b(find|search|searching|look(ing)?|browse|see|show me)\b[^.?!]*\b(house|home|homes|property|properties|listing|listings|place|neighborhood)\b|homes? for sale|house hunt/,
    reply:
      "Let's find your place. You can search Florida homes with the full monthly carrying cost shown — taxes, insurance and dues included, not just the list price. Want to browse, or figure out your budget first?",
    links: ["properties", "affordability", "plan"],
    offerConnect: false
  },
  {
    match:
      /home ?value|(what|how much).{0,20}(home|house|place).{0,12}worth|worth.{0,12}(home|house)|\bmy equity\b|how much equity|zestimate/,
    reply:
      "You can track your home's estimated value and equity over time here — handy whether you're weighing a refinance, a home-equity option, or just keeping an eye on it. Want to look yours up?",
    links: ["home_value", "home_lookup"],
    offerConnect: false
  },
  {
    match: /\b(refi|refinance|refinancing|cash.?out)\b|lower my (rate|payment)/,
    reply:
      "Refinancing only makes sense when the math works. I'll point you to the break-even calculator so you can see whether a new rate or term actually pays off, and a licensed officer can run your real numbers.",
    links: ["refinance", "payment"],
    offerConnect: true
  },
  {
    match: /first.?time|first home|never bought|new buyer|starter home/,
    reply:
      "First mortgages carry the most unknowns. There's a first-time-buyer guide that walks the sequence, plus Florida down-payment-assistance programs worth a look. Want to start with a quick plan?",
    links: ["first_time", "down_payment_assistance", "plan"],
    offerConnect: true
  },
  {
    match: /down.?payment|\bdpa\b|assistance program|closing cost help|\bgrant\b/,
    reply:
      "Florida has real down-payment-assistance programs, and there are ways to structure a smaller down payment. Here's the overview — a licensed officer can tell you which you'd actually use.",
    links: ["down_payment_assistance", "first_time"],
    offerConnect: true
  },
  {
    // Rates: never quote. Deflect to the market-average page and a human.
    match: /\b(rate|rates|apr|interest)\b/,
    reply:
      "I can't quote a rate — that's exactly what a licensed officer sorts out for your situation, since it turns on your credit, the property, and the loan. You can see today's market averages, or I can connect you.",
    links: ["rates", "talk"],
    offerConnect: true
  },
  {
    match:
      /\b(payment|afford|affordability|monthly|budget|price range)\b|how much.{0,16}(can i|home|house|mortgage)|pre.?qual/,
    reply:
      "Let's put real numbers on it. The payment calculator shows what a Florida payment is actually made of, and the affordability tool works backward from a comfortable monthly number — both run in your browser, nothing saved.",
    links: ["payment", "affordability", "plan"],
    offerConnect: false
  },
  {
    match: /calculator|calculators|calculate|run the numbers|\bestimate\b/,
    reply:
      "There's a full set of calculators — payment, affordability, refinance break-even, closing costs and more — all running on your device with nothing sent anywhere. Want the payment one to start?",
    links: ["calculators", "payment", "affordability"],
    offerConnect: false
  },
  {
    match:
      /\b(portal|log ?in|sign ?in|account|dashboard)\b|my (loan|application|file|documents)|application status|upload.{0,12}document/,
    reply:
      "If you're already working with us, your client portal is where your status, tasks and documents live — you can sign in there. If you're just getting started, tell me what you're after and I'll point you the right way.",
    links: ["account", "talk"],
    offerConnect: false
  },
  {
    match: /real estate agent|realtor|find an agent|listing agent|buyer.?s? agent/,
    reply:
      "We can connect you with a real-estate agent in our Florida network alongside the financing side. Want to see agents, or line up the mortgage piece first?",
    links: ["agents", "properties"],
    offerConnect: false
  },
  {
    match:
      /\bva loan\b|veteran|\bfha\b|\busda\b|jumbo|conventional|investment property|self.?employed|\bdscr\b|bank statement|heloc|home equity/,
    reply:
      "There's a plain-language page for each loan program — what it's for and where people get surprised. Here's the full set, and a licensed officer can tell you which fits your situation.",
    links: ["loan_options", "talk"],
    offerConnect: true
  },
  {
    match: /\b(buy|buying|purchase|purchasing)\b|get a mortgage|mortgage to buy/,
    reply:
      "Buying in Florida is more than the sticker price — taxes, insurance and dues drive the real monthly cost. I can help you search homes, size up a budget, or start a quick plan. Where do you want to begin?",
    links: ["properties", "affordability", "plan"],
    offerConnect: true
  },
  {
    match: /get started|where do i (start|begin)|\bplan\b|planning|next step/,
    reply:
      "Easiest start is a short plan — five quick questions to a payment range, right in your browser. From there I can point you to homes, calculators, or a licensed officer. Want to build it?",
    links: ["plan", "properties", "talk"],
    offerConnect: false
  },
  {
    match:
      /^\s*(hi|hey|hello|yo|sup|good (morning|afternoon|evening))\b|what can you do|what do you do|how can you help|\bhelp\b|\boptions\b|\bmenu\b/,
    reply: CAPABILITY_TEXT,
    links: ["properties", "payment", "home_value"],
    offerConnect: false
  }
];

/**
 * The most recent thing the visitor actually typed, matched against the intent
 * table. Returns a tailored reply, or null when nothing fits and the caller
 * should escalate (to the model, or to the capability menu).
 */
export function deterministicReply(messages: AssistantMessage[]): AssistantReply | null {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (lastUser === undefined) return null;
  const text = lastUser.content.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.match.test(text)) {
      return {
        reply: intent.reply,
        links: resolveLinks(intent.links),
        offerConnect: intent.offerConnect
      };
    }
  }
  return null;
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
  // Deterministic first: a recognised intent is answered here for free, so the
  // common questions — and any bot spamming them — never reach the paid model.
  const routed = deterministicReply(params.messages);
  if (routed !== null) return routed;

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
