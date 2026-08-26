import "server-only";
import {
  AiProviderApiError,
  selectRoute,
  type AiProvider,
  type AiRequest,
  type QuotaPolicy,
  type StructuredExtractionInput
} from "@tract/integrations";
import { AREA_REPORT_TOOL, parseAreaReport, type AreaReport } from "@tract/schemas";
import type { County } from "./county-data";
import { AREA_REPORT_ROUTE, MODEL_ROUTES, ai } from "./ai";
import { aiBudgetStore } from "./ai-budget";
import { env, publicFeatures } from "./env";
import { log } from "./logger";

/**
 * AI-written county area report — orchestration and compliance layer.
 *
 * The narrative is PROSE the model writes around figures that are rendered
 * server-side from sourced data; the model never authors a number (invariant 6).
 * Three guardrails enforce that, in order: the tool schema carries zero numeric
 * fields (the model cannot express a figure through it), `AreaReportSchema`
 * re-validates the returned object, and `scrubReport` catches a figure or a
 * fabricated rating smuggled inside a prose string. A hit on any of them drops
 * the whole model answer for `buildAreaTemplate`, a deterministic fallback that
 * is figure-free by construction and therefore always safe.
 *
 * Spend is reserved before the provider is called and settled after (invariant
 * 8); an unknown outcome holds the reservation. With the budget env vars at their
 * zero default every paid reservation is refused and every county renders the
 * template — the same posture as the assistant and the interpret route.
 */

const FEATURE = "area_report";
const PROMPT_KEY = "area_report";
const PROMPT_VERSION = "1.0.0";
/** One short structured call on the standard tier is a few cents at most; cap hard. */
const MAX_COST_CENTS = 6;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type AreaReportResult = { sections: AreaReport; source: "ai" | "template" };

/* ---------------------------------------------------------------- *
 * Deterministic, always-safe fallback
 * ---------------------------------------------------------------- */

const LIFESTYLE_BY_EXPOSURE: Record<County["floodExposure"], string> = {
  "high-coastal":
    "Life here runs from the water out to the inland neighborhoods, and the coast is a real part of the appeal — as well as a real part of what it costs to insure a home near it.",
  mixed:
    "Life here spans higher-exposure waterfront and river areas and quieter, lower-risk inland ground, so two homes only a few miles apart can feel — and cost to carry — quite differently.",
  inland:
    "Life here is inland and largely out of reach of storm surge, with lakes and green space shaping where people choose to settle, though low or lakeside ground can still sit in a flood zone."
};

/**
 * Pure county → prose. Deterministic and total, assembled ONLY from the
 * categorical and place fields — never from `floodNote` / `localAssistanceNote`,
 * because those sourced notes legitimately quote a loan-structure figure (a "0%"
 * second mortgage) that scrubReport would, correctly, reject. The fallback must
 * never trip its own filter, so the template stays figure-free by construction.
 * The rich sourced notes are still shown, verbatim and in context, in the
 * server-rendered panels around this narrative.
 */
export function buildAreaTemplate(county: County): AreaReport {
  const cities = county.cities.join(", ");
  return {
    overview: `${county.county} centers on ${county.seat}, in the ${county.region} region, and takes in communities like ${cities}. Buying here, the loan itself is usually the ordinary part — what really shapes the monthly cost is insurance, flood exposure, and how the property-tax bill resets after a sale.`,
    lifestyle: LIFESTYLE_BY_EXPOSURE[county.floodExposure],
    buyingConsiderations: `Before you are under contract, get a flood determination and a real insurance quote on the exact property, and budget the property tax from the post-sale assessment reset rather than the seller's current bill — in Florida the homestead cap resets when a home changes hands.`,
    neighborhoodsProse: `Where a home sits matters as much as its list price here: the specific street, its elevation, and its flood determination can move the carrying cost more than the headline number does, so weigh the exact parcel and not just the town it is in.`
  };
}

/* ---------------------------------------------------------------- *
 * Scrub: second (and third) line of defense
 * ---------------------------------------------------------------- */

/**
 * Any dollar amount, percentage, comma-grouped or magnitude number, a bare
 * 4-plus-digit number that is not a year, or a market-figure phrase. A number is
 * the model's to omit, not to invent — a hit rejects the whole report.
 */
const FIGURE =
  /\$\s?\d|\b\d+(?:\.\d+)?\s?%|\b\d+(?:\.\d+)?\s*percent\b|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s?(?:k|m|mm|million|billion|thousand)\b|\b(?!(?:19|20)\d{2}\b)\d{4,}\b|\bmedian\s+(?:home\s+|sale\s+|list\s+)?price\b|\bdays\s+on\s+market\b|\bprice\s+per\s+square\s+foot\b/i;

/**
 * A fabricated rating, ranking, or score. A superset of the content linter's
 * fabrication patterns, extended for the neighborhood/school/crime claims a model
 * reaches for when asked what an area is "like".
 */
const FABRICATED_RATING =
  /\b\d{1,2}\s?\/\s?(?:10|5|100)\b|\b\d(?:\.\d)?\s?stars?\b|#\s?1\b|\bnumber\s+one\b|\btop[-\s]rated\b|\bhighly[-\s]rated\b|\bbest\s+(?:neighborhood|schools?|place|area|city|town|county)\b|\bschool\s+rating\b|\bgreat\s?schools?\b|\b[a-f][-+]?\s+rated\b|\bcrime\s+(?:rate|score|index)\b|\bsafety\s+(?:score|rating|index)\b|\baward[-\s]winning\b/i;

/** true = clean and safe to publish. A hit anywhere drops the whole report for the template. */
export function scrubReport(text: string): boolean {
  return !FIGURE.test(text) && !FABRICATED_RATING.test(text);
}

/* ---------------------------------------------------------------- *
 * Provider seam (mirrors __setAiForTesting in ./ai)
 * ---------------------------------------------------------------- */

let areaProviderOverride: AiProvider | undefined;

/**
 * Test seam so a test can inject an area-shaped fixture (or an adversarial one
 * that emits a figure) without touching the environment. Defaults to the shared
 * `ai()` provider, so AI_MODE=fixture/disabled/live all flow through unchanged.
 */
export function __setAreaAiForTesting(provider: AiProvider | undefined): void {
  areaProviderOverride = provider;
}

function areaAi(): AiProvider {
  return areaProviderOverride ?? ai();
}

/* ---------------------------------------------------------------- *
 * 24h in-process cache, keyed by county slug
 * ---------------------------------------------------------------- */

/**
 * Same posture as MemoryRateLimitStore / MemoryAiBudgetStore: the runtime is
 * single-instance, and an area report is public and identical for every viewer of
 * a county (no per-user data is ever in the prose), so a per-instance cache is
 * correct and one generation serves everyone for a day. A multi-instance
 * deployment swaps this Map for KV or a Durable Object behind the same two calls;
 * the worst case of a cold instance is one extra model call, itself budget-gated.
 */
type CacheEntry = { report: AreaReport; expiresAt: number };
const areaCache = new Map<string, CacheEntry>();

/** Test helper. Not used at runtime. */
export function __clearAreaCacheForTesting(): void {
  areaCache.clear();
}

/* ---------------------------------------------------------------- *
 * Prompt assembly
 * ---------------------------------------------------------------- */

const AREA_SYSTEM_PROMPT = [
  "You are writing a short, plain-language narrative about what it is like to buy a home in a Florida county. You are given sourced facts and a plain draft; rewrite them into warm, natural prose a first-time buyer would find genuinely helpful.",
  "",
  "Hard rules you must never break:",
  "- Never state any number, dollar amount, percentage, price, rate, rating, ranking, school score, or crime statistic. Every figure is shown separately from verified data — your job is the words around them, not the numbers.",
  "- Never invent a neighborhood, a school, a builder, or an assistance program. Refer only to the places named in the facts.",
  "- Stay general and educational. Do not tell anyone they qualify, and do not price anything.",
  "",
  "Style: four short prose sections, plain and friendly. If you are unsure about a detail, stay general rather than guessing.",
  "Always answer by calling the area_report tool."
].join("\n");

/**
 * The facts the model sees. Deliberately the categorical, figure-free fields plus
 * the deterministic draft — never the sourced `floodNote` / `localAssistanceNote`,
 * which carry figures and specific program names the model could echo or
 * over-rely on. Keeping the prompt figure-free is what lets a well-behaved model
 * produce figure-free prose without constantly tripping the scrub, and it keeps
 * the request honestly classified as public data (no consumer input reaches it).
 */
function serializeCountyFacts(county: County, template: AreaReport): string {
  return [
    `County: ${county.county}`,
    `County seat: ${county.seat}`,
    `Region: ${county.region}`,
    `Communities: ${county.cities.join(", ")}`,
    `Flood exposure: ${county.floodExposure}`,
    "",
    "Plain draft to improve (keep it figure-free):",
    `Overview: ${template.overview}`,
    `Lifestyle: ${template.lifestyle}`,
    `Buying considerations: ${template.buyingConsiderations}`,
    `Neighborhoods: ${template.neighborhoodsProse}`
  ].join("\n");
}

/* ---------------------------------------------------------------- *
 * Orchestration
 * ---------------------------------------------------------------- */

/**
 * Produce the county narrative: cache → reserve → one provider call → settle →
 * validate → scrub → cache. Returns a safe deterministic template on any refusal,
 * failure, or scrub hit — the caller always gets a usable report, and `source`
 * reports which producer it came from so the UI can be honest about provenance.
 * Never throws.
 */
export async function runAreaNarrative(
  county: County,
  deps: { requestId: string; subjectKey: string; now?: () => number }
): Promise<AreaReportResult> {
  const now = deps.now ?? Date.now;

  // Defense in depth: the route gates too, but the library must be safe standalone.
  if (!publicFeatures().aiSearch) {
    return { sections: buildAreaTemplate(county), source: "template" };
  }

  const cached = areaCache.get(county.slug);
  if (cached !== undefined && cached.expiresAt > now()) {
    return { sections: cached.report, source: "ai" };
  }

  const provider = areaAi();
  // A fixture provider returns one canned, county-agnostic stub — fine in dev and
  // preview, but in production it would render identical "AI overview" prose on
  // every county page, which is a provenance lie. Fall back to the deterministic
  // template there, mirroring the ATTOM surfaces that never serve fixture data in
  // production.
  const fixtureInProduction = provider.key === "fixture" && env().NODE_ENV === "production";
  if (provider.key === "disabled" || fixtureInProduction) {
    return { sections: buildAreaTemplate(county), source: "template" };
  }

  const template = buildAreaTemplate(county);
  const input: StructuredExtractionInput = {
    system: AREA_SYSTEM_PROMPT,
    user: serializeCountyFacts(county, template),
    toolName: AREA_REPORT_TOOL.name,
    toolDescription: AREA_REPORT_TOOL.description,
    inputSchema: AREA_REPORT_TOOL.inputSchema,
    maxOutputTokens: 700
  };

  const aiRequest: AiRequest<StructuredExtractionInput> = {
    capability: "structured_extraction",
    feature: FEATURE,
    input,
    outputSchemaKey: AREA_REPORT_TOOL.name,
    promptKey: PROMPT_KEY,
    promptVersion: PROMPT_VERSION,
    // Only sourced, public county facts and the figure-free draft are sent. No
    // consumer input ever reaches this route, so it is classified public.
    dataClass: "public",
    maxCostCents: MAX_COST_CENTS,
    timeoutMs: AREA_REPORT_ROUTE.timeoutMs,
    idempotencyKey: deps.requestId
  };

  let route;
  try {
    route = selectRoute(MODEL_ROUTES, AREA_REPORT_ROUTE.key, aiRequest);
  } catch {
    return { sections: template, source: "template" };
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
    return { sections: template, source: "template" };
  }

  // Reserve before the provider is called. At the zero-default budget any paid
  // estimate is refused here and the county stays on the template.
  const reserved = aiBudgetStore.reserve({
    feature: FEATURE,
    subjectKey: deps.subjectKey,
    subjectPolicy,
    platformPolicy,
    estimatedCostCents,
    maxCostCents: MAX_COST_CENTS
  });
  if (!reserved.allowed) {
    log.info("area report budget refused", {
      requestId: deps.requestId,
      reason: reserved.reason
    });
    return { sections: template, source: "template" };
  }

  try {
    const result = await provider.execute<StructuredExtractionInput, unknown>(
      aiRequest,
      route.providerModel
    );
    // The provider did billable work whether or not the answer is usable.
    reserved.reservation.settle({
      kind: "succeeded",
      actualCostCents: result.actualCostCents ?? estimatedCostCents
    });

    // First defense: the schema has zero numeric fields, so a numeric property
    // fails here rather than reaching the page.
    const validated = parseAreaReport(result.output);
    if (!validated.ok) {
      return { sections: template, source: "template" };
    }

    // Second defense: a figure or a fabricated rating hidden inside a prose
    // string. A hit drops the whole report — never rendered as written.
    const joined = [
      validated.value.overview,
      validated.value.lifestyle,
      validated.value.buyingConsiderations,
      validated.value.neighborhoodsProse,
      ...(validated.value.highlights ?? [])
    ].join("\n");
    if (!scrubReport(joined)) {
      log.info("area report scrubbed; using template", {
        requestId: deps.requestId,
        slug: county.slug
      });
      return { sections: template, source: "template" };
    }

    areaCache.set(county.slug, { report: validated.value, expiresAt: now() + CACHE_TTL_MS });
    return { sections: validated.value, source: "ai" };
  } catch (error) {
    if (error instanceof AiProviderApiError) {
      // The vendor answered with an error status; the request was not billed.
      reserved.reservation.settle({ kind: "failed_before_billable" });
    } else {
      // Timeout or transport failure with the request possibly in flight. Hold
      // the reservation for reconciliation rather than releasing money the
      // provider may still bill (invariant 8).
      const { requiresReconciliation } = reserved.reservation.settle({ kind: "unknown" });
      if (requiresReconciliation) {
        log.error("area report outcome unknown; reservation held", {
          requestId: deps.requestId
        });
      }
    }
    return { sections: template, source: "template" };
  }
}
