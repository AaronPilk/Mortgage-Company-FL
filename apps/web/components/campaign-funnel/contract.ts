import type { LeadIntent } from "@tract/schemas";
import {
  downPaymentBandFor,
  mortgageBalanceBandFor,
  priceBandFor,
  PRICE_BAND_LABEL,
  type CreditBandValue,
  type EmploymentValue,
  type IncomeBandValue,
  type MonthlyDebtBandValue,
  type MortgageBalanceBandValue,
  type MortgageRateBandValue,
  type PropertyStageValue,
  type PropertyTypeValue,
  type TimingValue
} from "../planner/options";

/**
 * Campaign funnel contract: the question vocabulary and the pure mapping from
 * a visitor's answers to the payload fields /api/v1/leads accepts.
 *
 * This file has no React in it on purpose. The unit contract tests drive this
 * exact code with every option a campaign can offer, so what the tests prove
 * is what the browser submits — not a parallel reimplementation.
 *
 * The rules that bind every marketing surface bind here:
 *
 *   - Every financial answer is a BAND. Sliders exist for feel, but only the
 *     band a figure falls into leaves the browser, derived through the
 *     @tract/mortgage-math-backed helpers in components/planner/options.ts —
 *     never computed inline.
 *   - Answers with a schema home travel in that home: the optional `planner`
 *     object (LeadPlannerSchema) or the top-level timeline / credit band.
 *   - Answers with no schema home (military service, working with an agent,
 *     a refinance goal, a HELOC product preference) travel in the bounded
 *     `message` field as a compact labelled summary assembled ONLY from
 *     server-authored option labels. No visitor free text ever enters it.
 *   - Nothing here is an application, and no answer implies approval.
 */

/** Choice questions the engine knows how to route. Adding an id means adding its routing below. */
export type CampaignChoiceQuestionId =
  | "propertyStage"
  | "propertyType"
  | "homeUse"
  | "military"
  | "militaryBranch"
  | "agent"
  | "employment"
  | "incomeBand"
  | "monthlyDebtBand"
  | "creditBand"
  | "timing"
  | "timeline"
  | "rateBand"
  | "refinanceGoal"
  | "helocKind";

/** Slider questions. Each maps to a band helper; the dollar figure never leaves the browser. */
export type CampaignSliderQuestionId =
  "price" | "downPayment" | "homeValue" | "currentBalance" | "equityAmount";

/**
 * Free-text questions. Exactly one exists: the property's city or ZIP, which
 * has its own bounded home in LeadPlannerSchema (`propertyLocation`, never a
 * street address). Visitor-typed text routes ONLY into that schema field —
 * it never enters the message summary, which stays server-authored.
 */
export type CampaignTextQuestionId = "propertyLocation";

export type CampaignChoiceOption = { value: string; label: string; hint?: string };

export type CampaignChoiceQuestion = {
  kind: "choice";
  id: CampaignChoiceQuestionId;
  heading: string;
  /** Optional factual context under the heading. Never a promise. */
  help?: string;
  options: CampaignChoiceOption[];
  twoColumns?: boolean;
  /** Ask only when an earlier answer matches, e.g. the branch question after military = yes. */
  showIf?: { id: CampaignChoiceQuestionId; equals: string };
};

export type CampaignSliderQuestion = {
  kind: "slider";
  id: CampaignSliderQuestionId;
  heading: string;
  help?: string;
  /** Whole dollars. Content configuration, not arithmetic. */
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  /** Renders a skip control; a skipped slider contributes nothing to the payload. */
  optional?: boolean;
};

export type CampaignTextQuestion = {
  kind: "text";
  id: CampaignTextQuestionId;
  heading: string;
  help?: string;
  placeholder?: string;
  /** Client-side cap, mirroring the schema bound on the destination field. */
  maxLength: number;
  /** A location question is always skippable — an ad click owes us nothing. */
  optional: true;
};

export type CampaignQuestion =
  CampaignChoiceQuestion | CampaignSliderQuestion | CampaignTextQuestion;

export type CampaignFunnelConfig = {
  /** Intent the campaign page already established. The funnel never asks it again. */
  intent: LeadIntent;
  /** Fixed campaign context the loan officer sees. Server-authored, never visitor input. */
  message: string;
  questions: CampaignQuestion[];
  /**
   * Present when the campaign's answers have a home in LeadPlannerSchema. The
   * goal is the campaign's honest mapping; a purchase goal is upgraded to
   * `investment` when the visitor says the home will be an investment property.
   */
  planner?: {
    goal: "purchase" | "refinance" | "investment";
    /**
     * `own_it` on refinance funnels only: a person refinancing a mortgage they
     * hold necessarily owns the property, so the stage is entailed, not asked.
     */
    presetPropertyStage?: "own_it";
  };
  /** The reassurance line above the contact fields. */
  contactHint?: string;
  /** Success-state body, where the default mortgage framing would mislead. */
  successBody?: string;
  submitLabel?: string;
};

export type CampaignAnswers = {
  choices: Partial<Record<CampaignChoiceQuestionId, string>>;
  /** Whole dollars from sliders. A skipped optional slider is simply absent. */
  sliders: Partial<Record<CampaignSliderQuestionId, number>>;
  /** Visitor-typed text. Routed only into its bounded schema field, never the message. */
  text: Partial<Record<CampaignTextQuestionId, string>>;
};

/**
 * Choice answers that live in the message summary, with the label the loan
 * officer reads. Everything else routes to a schema field.
 */
const MESSAGE_LABEL: Partial<Record<CampaignChoiceQuestionId, string>> = {
  homeUse: "Home use",
  military: "Military service",
  militaryBranch: "Branch",
  agent: "Working with an agent",
  refinanceGoal: "Refinance goal",
  helocKind: "Product interest"
};

/** Slider answers that live in the message summary when no planner carries them. */
const SLIDER_MESSAGE_LABEL: Record<CampaignSliderQuestionId, string> = {
  price: "Price band",
  downPayment: "Down payment band",
  homeValue: "Home value band",
  currentBalance: "First mortgage balance band",
  equityAmount: "Equity amount band"
};

/** Read alongside PRICE_BAND_LABEL; both exist so a message carries a band, never a figure. */
export const MORTGAGE_BALANCE_BAND_LABEL: Record<MortgageBalanceBandValue, string> = {
  under_100k: "under $100k",
  "100k_250k": "$100k to $250k",
  "250k_500k": "$250k to $500k",
  "500k_750k": "$500k to $750k",
  "750k_plus": "$750k and above",
  not_sure: "not sure"
};

/** The questions a config must answer before it can honestly submit a planner object. */
export function visibleQuestions(
  config: CampaignFunnelConfig,
  answers: CampaignAnswers
): CampaignQuestion[] {
  return config.questions.filter(
    (question) =>
      question.kind !== "choice" ||
      question.showIf === undefined ||
      answers.choices[question.showIf.id] === question.showIf.equals
  );
}

function answered<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    // The engine cannot reach the contact step with a visible question
    // unanswered, so this firing means the config and the routing disagree —
    // a build-time bug the contract tests exist to catch, not a user error.
    throw new Error(`Campaign funnel answer missing: ${what}`);
  }
  return value;
}

export type CampaignLeadFields = {
  stateCode: string;
  timeline?: string;
  estimatedCreditBand?: string;
  message: string;
  planner?: Record<string, unknown>;
};

/**
 * Map a completed funnel onto the fields CreateLeadSchema accepts.
 *
 * `propertyState` comes from the contact screen's state selector, which every
 * campaign now shows (FL preselected). A planner campaign must have it; a
 * non-planner caller that passes nothing falls back to the FL default the
 * select would have shown anyway.
 */
export function campaignLeadFields(
  config: CampaignFunnelConfig,
  answers: CampaignAnswers,
  propertyState?: string
): CampaignLeadFields {
  const visible = visibleQuestions(config, answers);
  const summaryParts: string[] = [];

  for (const question of visible) {
    if (question.kind === "choice") {
      const label = MESSAGE_LABEL[question.id];
      if (label === undefined) continue;
      const value = answers.choices[question.id];
      if (value === undefined) continue;
      const option = question.options.find((candidate) => candidate.value === value);
      // Only a label authored in the campaign config can enter the message.
      if (option !== undefined) summaryParts.push(`${label}: ${option.label}`);
      continue;
    }
    // A text answer is visitor-typed and therefore NEVER summarised: its only
    // destination is the bounded planner field it belongs to.
    if (question.kind === "text") continue;
    // Sliders route into the planner when one exists; otherwise the band —
    // and only the band — is summarised for the loan officer.
    if (config.planner !== undefined) continue;
    const dollars = answers.sliders[question.id];
    if (dollars === undefined) continue;
    const bandLabel =
      question.id === "homeValue" || question.id === "price"
        ? PRICE_BAND_LABEL[priceBandFor(dollars)]
        : MORTGAGE_BALANCE_BAND_LABEL[mortgageBalanceBandFor(dollars)];
    summaryParts.push(`${SLIDER_MESSAGE_LABEL[question.id]}: ${bandLabel}`);
  }

  const message =
    summaryParts.length === 0 ? config.message : `${config.message} ${summaryParts.join(" · ")}`;

  if (config.planner === undefined) {
    return {
      // The selected property state, not a hardcoded FL: a Georgia seller is
      // a Georgia lead.
      stateCode: propertyState ?? "FL",
      // Non-planner funnels ask timing in the lead table's own vocabulary.
      ...(answers.choices.timeline === undefined ? {} : { timeline: answers.choices.timeline }),
      ...(answers.choices.creditBand === undefined
        ? {}
        : { estimatedCreditBand: answers.choices.creditBand }),
      message
    };
  }

  const isRefinance = config.planner.goal === "refinance";
  // A purchase-goal visitor who says the home will be an investment property
  // has told us the honest planner goal; the campaign intent is unchanged.
  const goal =
    config.planner.goal === "purchase" && answers.choices.homeUse === "investment"
      ? "investment"
      : config.planner.goal;

  const priceDollars = answered(
    answers.sliders.price ?? answers.sliders.homeValue,
    "price or home value"
  );

  // Optional by design and by schema: an empty or skipped location question
  // contributes nothing. The slice mirrors the schema's bound so an
  // over-length paste degrades to truncation rather than a field error.
  const propertyLocation = answers.text.propertyLocation?.trim().slice(0, 80);

  const planner: Record<string, unknown> = {
    goal,
    propertyState: answered(propertyState, "property state"),
    ...(propertyLocation === undefined || propertyLocation.length === 0
      ? {}
      : { propertyLocation }),
    propertyType: answered(answers.choices.propertyType, "property type") as PropertyTypeValue,
    propertyStage:
      config.planner.presetPropertyStage ??
      (answered(answers.choices.propertyStage, "property stage") as PropertyStageValue),
    priceBand: priceBandFor(priceDollars),
    // Mirrors components/planner/planner.tsx: a refinance has no down payment,
    // and "not_sure" is the schema's value for a band that was never a question.
    downPaymentBand: isRefinance
      ? "not_sure"
      : downPaymentBandFor(answered(answers.sliders.downPayment, "down payment"), priceDollars),
    ...(isRefinance
      ? {
          currentMortgageBalanceBand: mortgageBalanceBandFor(
            answered(answers.sliders.currentBalance, "current balance")
          ),
          currentMortgageRateBand: answered(
            answers.choices.rateBand,
            "current rate band"
          ) as MortgageRateBandValue
        }
      : {}),
    creditBand: answered(answers.choices.creditBand, "credit band") as CreditBandValue,
    employment: answered(answers.choices.employment, "employment") as EmploymentValue,
    incomeBand: answered(answers.choices.incomeBand, "income band") as IncomeBandValue,
    monthlyDebtBand: answered(
      answers.choices.monthlyDebtBand,
      "monthly debt band"
    ) as MonthlyDebtBandValue,
    timing: answered(answers.choices.timing, "timing") as TimingValue
  };

  return {
    // The planner's property state is the lead's state, exactly as /plan does.
    stateCode: answered(propertyState, "property state"),
    // Top-level timeline and credit band are deliberately absent: the API
    // derives both from the planner answers, so one answer has one source.
    message,
    planner
  };
}
