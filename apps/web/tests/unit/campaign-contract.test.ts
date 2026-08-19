import { describe, expect, it } from "vitest";
import {
  CreateLeadSchema,
  CreditBandSchema,
  LeadIntentSchema,
  LeadPlannerSchema,
  PlannerEmploymentSchema,
  PlannerIncomeBandSchema,
  PlannerMonthlyDebtBandSchema,
  PlannerMortgageRateBandSchema,
  PlannerPropertyStageSchema,
  PlannerPropertyTypeSchema,
  PlannerTimingSchema,
  TimelineSchema
} from "@tract/schemas";
import type { z } from "zod";
import { assertCrmPayloadSafe } from "@tract/integrations";
import { CAMPAIGNS, campaignBySlug, type CampaignDefinition } from "../../content/campaigns";
import { ROUTE_REGISTRY } from "../../content/routes";
import {
  campaignLeadFields,
  visibleQuestions,
  type CampaignAnswers,
  type CampaignChoiceQuestionId,
  type CampaignFunnelConfig,
  type CampaignSliderQuestionId
} from "../../components/campaign-funnel/contract";

/**
 * Campaign landing pages are marketing surfaces for paid traffic. This
 * contract keeps four things from drifting: the routes stay registered and
 * non-indexable, every answer a campaign funnel can produce maps onto a
 * payload the lead API accepts, the message summary stays a bounded set of
 * server-authored labels, and the copy never grows approval language or a
 * rate promise.
 *
 * The tests drive the exact mapping code the browser runs
 * (components/campaign-funnel/contract.ts), not a reimplementation.
 */

/**
 * Answer every visible question: overrides first, then the first option or
 * the slider default — which is exactly what a visitor who taps the first
 * card on every screen submits. Visibility is re-evaluated as answers land so
 * conditional questions (the branch screen after military = yes) join in.
 */
function simulate(
  config: CampaignFunnelConfig,
  overrides: {
    choices?: Partial<Record<CampaignChoiceQuestionId, string>>;
    sliders?: Partial<Record<CampaignSliderQuestionId, number>>;
    text?: CampaignAnswers["text"];
  } = {}
): CampaignAnswers {
  const answers: CampaignAnswers = {
    choices: { ...overrides.choices },
    sliders: {},
    text: { ...overrides.text }
  };
  for (const question of config.questions) {
    if (question.kind === "slider") {
      answers.sliders[question.id] = overrides.sliders?.[question.id] ?? question.defaultValue;
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const question of visibleQuestions(config, answers)) {
      if (question.kind !== "choice" || answers.choices[question.id] !== undefined) continue;
      answers.choices[question.id] = question.options[0]?.value ?? "";
      changed = true;
    }
  }
  return answers;
}

/** The full payload shape the funnel component posts, around the tested mapping. */
function apiPayload(campaign: CampaignDefinition, answers: CampaignAnswers, propertyState = "FL") {
  const fields = campaignLeadFields(campaign.funnel, answers, propertyState);
  return {
    submissionId: "00000000-0000-4000-8000-000000000010",
    intent: campaign.funnel.intent,
    firstName: "Dana",
    lastName: "Reyes",
    email: "dana@example.com",
    phone: "(813) 555-0147",
    ...fields,
    consent: {
      privacyAccepted: true,
      contactRequested: true,
      smsMarketing: false,
      emailMarketing: false,
      disclosureVersion: "lead-disclosure@2026-08-17"
    },
    firstTouch: {
      landingPath: `/get-started/${campaign.slug}`,
      occurredAt: "2026-08-18T12:00:00.000Z"
    },
    lastTouch: {
      landingPath: `/get-started/${campaign.slug}`,
      occurredAt: "2026-08-18T12:00:00.000Z"
    },
    conversionTouch: {
      landingPath: `/get-started/${campaign.slug}`,
      occurredAt: "2026-08-18T12:01:00.000Z"
    },
    turnstileToken: "test-token"
  };
}

describe("campaign route registration", () => {
  it("registers every campaign page, non-indexable, so ads never compete with organic", () => {
    for (const campaign of CAMPAIGNS) {
      const entry = ROUTE_REGISTRY.find((route) => route.path === `/get-started/${campaign.slug}`);
      expect(entry, `/get-started/${campaign.slug} is not registered`).toBeDefined();
      expect(entry?.indexable, `/get-started/${campaign.slug} must be noindex`).toBe(false);
    }
  });

  it("registers the /talk chooser, non-indexable", () => {
    const entry = ROUTE_REGISTRY.find((route) => route.path === "/talk");
    expect(entry).toBeDefined();
    expect(entry?.indexable).toBe(false);
  });

  it("covers exactly the campaigns the ads run", () => {
    expect(CAMPAIGNS.map((campaign) => campaign.slug).sort()).toEqual(
      ["fha", "first-home", "heloc", "investment", "purchase", "refinance", "sell", "va"].sort()
    );
    expect(campaignBySlug("purchase")?.funnel.intent).toBe("purchase");
    expect(campaignBySlug("nope")).toBeUndefined();
  });
});

describe("campaign funnel answers map onto the lead schema", () => {
  it("presets only intents the lead schema accepts", () => {
    for (const campaign of CAMPAIGNS) {
      expect(
        LeadIntentSchema.safeParse(campaign.funnel.intent).success,
        `${campaign.slug} presets intent "${campaign.funnel.intent}"`
      ).toBe(true);
    }
  });

  it("offers only schema-vocabulary values on every schema-routed question", () => {
    // Questions whose answers land in a checked column must offer exactly
    // values that column's schema accepts — a label typo is caught by the
    // full-payload test below, a value typo is caught right here with the
    // question and option named.
    const schemaByQuestion: Partial<Record<CampaignChoiceQuestionId, z.ZodTypeAny>> = {
      propertyStage: PlannerPropertyStageSchema,
      propertyType: PlannerPropertyTypeSchema,
      employment: PlannerEmploymentSchema,
      incomeBand: PlannerIncomeBandSchema,
      monthlyDebtBand: PlannerMonthlyDebtBandSchema,
      creditBand: CreditBandSchema,
      timing: PlannerTimingSchema,
      timeline: TimelineSchema,
      rateBand: PlannerMortgageRateBandSchema
    };
    for (const campaign of CAMPAIGNS) {
      for (const question of campaign.funnel.questions) {
        if (question.kind !== "choice") continue;
        const schema = schemaByQuestion[question.id];
        if (schema === undefined) continue;
        for (const option of question.options) {
          expect(
            schema.safeParse(option.value).success,
            `${campaign.slug} · ${question.id} offers "${option.value}"`
          ).toBe(true);
        }
      }
    }
  });

  it("builds a payload the API accepts from every option of every question", () => {
    for (const campaign of CAMPAIGNS) {
      for (const question of campaign.funnel.questions) {
        if (question.kind !== "choice") continue;
        for (const option of question.options) {
          const overrides: Partial<Record<CampaignChoiceQuestionId, string>> = {
            [question.id]: option.value
          };
          // A conditional question's options are reachable only through the
          // answer that reveals the screen.
          if (question.showIf !== undefined) overrides[question.showIf.id] = question.showIf.equals;
          const answers = simulate(campaign.funnel, { choices: overrides });
          const result = CreateLeadSchema.safeParse(apiPayload(campaign, answers));
          expect(
            result.success,
            `${campaign.slug} · ${question.id}="${option.value}" fails CreateLeadSchema: ${
              result.success ? "" : JSON.stringify(result.error.issues)
            }`
          ).toBe(true);
        }
      }
    }
  });

  it("derives an acceptable band from every slider across its boundary values", () => {
    // Band edges from components/planner/options.ts, exercised one dollar to
    // each side, clamped to what each slider can actually produce.
    const edges = [
      0, 1, 5_000, 50_000, 99_999, 100_000, 199_999, 200_000, 249_999, 250_000, 349_999, 350_000,
      499_999, 500_000, 749_999, 750_000, 999_999, 1_000_000, 1_500_000, 2_000_000
    ];
    for (const campaign of CAMPAIGNS) {
      for (const question of campaign.funnel.questions) {
        if (question.kind !== "slider") continue;
        for (const dollars of edges) {
          if (dollars < question.min || dollars > question.max) continue;
          const answers = simulate(campaign.funnel, { sliders: { [question.id]: dollars } });
          const result = CreateLeadSchema.safeParse(apiPayload(campaign, answers));
          expect(
            result.success,
            `${campaign.slug} · ${question.id}=$${dollars} fails: ${
              result.success ? "" : JSON.stringify(result.error.issues)
            }`
          ).toBe(true);
        }
      }
    }
  });

  it("submits planner answers the planner schema accepts, on exactly the planner campaigns", () => {
    for (const campaign of CAMPAIGNS) {
      const fields = campaignLeadFields(
        campaign.funnel,
        simulate(campaign.funnel),
        campaign.funnel.planner === undefined ? undefined : "FL"
      );
      if (campaign.funnel.planner === undefined) {
        expect(fields.planner, `${campaign.slug} must not submit a planner object`).toBeUndefined();
        continue;
      }
      const result = LeadPlannerSchema.safeParse(fields.planner);
      expect(
        result.success,
        `${campaign.slug} planner fails LeadPlannerSchema: ${
          result.success ? "" : JSON.stringify(result.error.issues)
        }`
      ).toBe(true);
    }
  });

  it("stores the selected property state on every campaign, planner or not", () => {
    // The contact screen's state select feeds stateCode everywhere. A Georgia
    // seller on the non-planner sell funnel must be stored as GA, not as a
    // hardcoded FL; a caller that passes nothing keeps the FL default the
    // select preselects.
    for (const campaign of CAMPAIGNS) {
      const answers = simulate(campaign.funnel);
      const fields = campaignLeadFields(campaign.funnel, answers, "GA");
      expect(fields.stateCode, campaign.slug).toBe("GA");
      if (campaign.funnel.planner !== undefined) {
        expect(fields.planner?.propertyState, campaign.slug).toBe("GA");
      } else {
        expect(campaignLeadFields(campaign.funnel, answers).stateCode, campaign.slug).toBe("FL");
      }
      const result = CreateLeadSchema.safeParse(apiPayload(campaign, answers, "GA"));
      expect(result.success, `${campaign.slug} GA payload fails CreateLeadSchema`).toBe(true);
    }
  });

  it("upgrades a purchase goal honestly when the visitor says investment use", () => {
    const purchase = campaignBySlug("purchase");
    expect(purchase).toBeDefined();
    if (purchase === undefined) return;
    const answers = simulate(purchase.funnel, { choices: { homeUse: "investment" } });
    const fields = campaignLeadFields(purchase.funnel, answers, "FL");
    expect(fields.planner?.goal).toBe("investment");
    // The campaign intent — what the ad established — is not rewritten.
    expect(purchase.funnel.intent).toBe("purchase");
  });

  it("routes the optional city-or-ZIP text into planner.propertyLocation, never the message", () => {
    for (const campaign of CAMPAIGNS) {
      const asksLocation = campaign.funnel.questions.some(
        (question) => question.kind === "text" && question.id === "propertyLocation"
      );
      if (campaign.funnel.planner === undefined) {
        // Free text is only ever collected where it has a bounded schema home.
        expect(asksLocation, `${campaign.slug} must not ask a location it cannot store`).toBe(
          false
        );
        continue;
      }
      expect(asksLocation, `${campaign.slug} should ask city or ZIP`).toBe(true);

      const answers = simulate(campaign.funnel, { text: { propertyLocation: "  Tampa  " } });
      const fields = campaignLeadFields(campaign.funnel, answers, "FL");
      expect(fields.planner?.propertyLocation, campaign.slug).toBe("Tampa");
      // Visitor-typed text never enters the server-authored message summary.
      expect(fields.message, campaign.slug).not.toContain("Tampa");
      expect(CreateLeadSchema.safeParse(apiPayload(campaign, answers)).success).toBe(true);
    }
  });

  it("omits a blank location and truncates an over-length paste to the schema bound", () => {
    const purchase = campaignBySlug("purchase");
    expect(purchase).toBeDefined();
    if (purchase === undefined) return;

    const blank = campaignLeadFields(
      purchase.funnel,
      simulate(purchase.funnel, { text: { propertyLocation: "   " } }),
      "FL"
    );
    expect(blank.planner?.propertyLocation).toBeUndefined();

    const oversize = campaignLeadFields(
      purchase.funnel,
      simulate(purchase.funnel, { text: { propertyLocation: "x".repeat(200) } }),
      "FL"
    );
    expect(oversize.planner?.propertyLocation).toBe("x".repeat(80));
    expect(LeadPlannerSchema.safeParse(oversize.planner).success).toBe(true);
  });

  it("pairs current-mortgage bands with the refinance goal only", () => {
    for (const campaign of CAMPAIGNS) {
      if (campaign.funnel.planner === undefined) continue;
      const fields = campaignLeadFields(campaign.funnel, simulate(campaign.funnel), "FL");
      const isRefinance = campaign.funnel.planner.goal === "refinance";
      expect(
        fields.planner?.currentMortgageBalanceBand !== undefined,
        `${campaign.slug} balance band pairing`
      ).toBe(isRefinance);
      expect(
        fields.planner?.currentMortgageRateBand !== undefined,
        `${campaign.slug} rate band pairing`
      ).toBe(isRefinance);
    }
  });

  it("leaves timeline and credit to the planner on planner campaigns, top-level otherwise", () => {
    for (const campaign of CAMPAIGNS) {
      const fields = campaignLeadFields(
        campaign.funnel,
        simulate(campaign.funnel),
        campaign.funnel.planner === undefined ? undefined : "FL"
      );
      if (campaign.funnel.planner !== undefined) {
        // The API derives both from the planner answers; sending them twice
        // would create a second source of truth.
        expect(fields.timeline, campaign.slug).toBeUndefined();
        expect(fields.estimatedCreditBand, campaign.slug).toBeUndefined();
        expect(fields.planner?.timing).toBeDefined();
        expect(fields.planner?.creditBand).toBeDefined();
      } else if (campaign.slug !== "sell") {
        expect(fields.timeline, campaign.slug).toBeDefined();
        expect(fields.estimatedCreditBand, campaign.slug).toBeDefined();
      }
    }
  });

  it("asks a seller for timing only — no credit, income, employment, or debt", () => {
    for (const campaign of CAMPAIGNS) {
      const financingIds = ["creditBand", "incomeBand", "employment", "monthlyDebtBand"];
      const asked = campaign.funnel.questions
        .filter((question) => question.kind === "choice")
        .map((question) => question.id);
      if (campaign.slug === "sell") {
        for (const id of financingIds) {
          expect(asked, `sell must not ask ${id}`).not.toContain(id);
        }
        expect(campaign.funnel.planner).toBeUndefined();
      } else {
        expect(asked, `${campaign.slug} asks a credit band`).toContain("creditBand");
      }
    }
  });

  it("keeps the VA branch question early and conditional on service", () => {
    const va = campaignBySlug("va");
    expect(va?.funnel.questions[0]).toMatchObject({ id: "military" });
    expect(va?.funnel.questions[1]).toMatchObject({
      id: "militaryBranch",
      showIf: { id: "military", equals: "yes" }
    });
    // No service means no branch screen and no branch line in the summary.
    if (va === undefined) return;
    const answers = simulate(va.funnel, { choices: { military: "no" } });
    const fields = campaignLeadFields(va.funnel, answers, "FL");
    expect(fields.message).not.toContain("Branch:");
    expect(fields.message).toContain("Military service: No");
  });

  it("drops military questions from the investment funnel, where VA framing would mislead", () => {
    const investment = campaignBySlug("investment");
    const ids = investment?.funnel.questions.map((question) => question.id);
    expect(ids).not.toContain("military");
    expect(ids).toContain("monthlyDebtBand");
    expect(investment?.funnel.planner?.goal).toBe("investment");
  });
});

describe("the message summary stays bounded and server-authored", () => {
  it("always starts with the fixed campaign label and stays inside the schema bound", () => {
    for (const campaign of CAMPAIGNS) {
      // Worst case: every choice question takes its longest label, which also
      // opens any conditional screens whose trigger is the longer option.
      const longest: Partial<Record<CampaignChoiceQuestionId, string>> = {};
      for (const question of campaign.funnel.questions) {
        if (question.kind !== "choice") continue;
        const byLength = [...question.options].sort((a, b) => b.label.length - a.label.length);
        longest[question.id] = byLength[0]?.value ?? "";
      }
      // The branch screen is the longest summary this funnel can produce.
      if (campaign.funnel.questions.some((question) => question.id === "militaryBranch")) {
        longest.military = "yes";
      }
      const answers = simulate(campaign.funnel, { choices: longest });
      const fields = campaignLeadFields(
        campaign.funnel,
        answers,
        campaign.funnel.planner === undefined ? undefined : "FL"
      );
      expect(fields.message.startsWith(campaign.funnel.message), campaign.slug).toBe(true);
      expect(
        fields.message.length,
        `${campaign.slug} message exceeds the bound`
      ).toBeLessThanOrEqual(1500);
    }
  });

  it("summarises the HELOC funnel as labelled bands, never the slider figures", () => {
    const heloc = campaignBySlug("heloc");
    expect(heloc).toBeDefined();
    if (heloc === undefined) return;
    const answers = simulate(heloc.funnel, {
      sliders: { equityAmount: 50_000, homeValue: 400_000, currentBalance: 250_000 }
    });
    const fields = campaignLeadFields(heloc.funnel, answers);
    // Exact string: every character is a server-authored label. The dollar
    // figures the visitor saw ($50,000 / $400,000 / $250,000) never appear.
    expect(fields.message).toBe(
      "Arrived via the HELOC campaign page. " +
        "Product interest: A home equity line of credit · " +
        "Equity amount band: under $100k · " +
        "Home value band: $350k to $500k · " +
        "First mortgage balance band: $250k to $500k"
    );
    expect(fields.planner).toBeUndefined();
    expect(fields.estimatedCreditBand).toBeDefined();
    expect(fields.timeline).toBeDefined();
  });

  it("omits a skipped optional slider from the summary instead of inventing a band", () => {
    const sell = campaignBySlug("sell");
    expect(sell).toBeDefined();
    if (sell === undefined) return;
    const answers = simulate(sell.funnel);
    delete answers.sliders.homeValue;
    const fields = campaignLeadFields(sell.funnel, answers);
    expect(fields.message).toBe(sell.funnel.message);
    expect(CreateLeadSchema.safeParse(apiPayload(sell, answers)).success).toBe(true);
  });
});

describe("every lead intent survives the CRM projection", () => {
  it("derives a screenable tag payload from each intent, new values included", () => {
    // There is no Record<LeadIntent, tag> to fall out of date — the lead route
    // derives tags as `intent:${intent}` — so the coverage check is that the
    // derived projection for EVERY vocabulary value passes the CRM payload
    // screen the route applies before sync.
    for (const intent of LeadIntentSchema.options) {
      expect(
        () =>
          assertCrmPayloadSafe({
            externalId: "receipt",
            intent,
            tags: ["web-lead", `intent:${intent}`],
            sourcePath: "/get-started/purchase"
          }),
        intent
      ).not.toThrow();
    }
  });
});

describe("campaign copy stays inside the marketing rules", () => {
  // The same promise-shaped patterns the program content test enforces. A
  // campaign page is the most tempting place to slip in approval language,
  // which is exactly why it gets the same gate. As there, the patterns target
  // the promise, not the word: "VA-guaranteed loans" is a factual description
  // of the program; "guaranteed approval" is the forbidden thing.
  const forbidden = [
    /\bpre-?qualif/i,
    /\bpre-?approv/i,
    /\bapproved?\b/i,
    /\byou qualify\b/i,
    /\bwe guarantee\b/i,
    /\bguarantee[sd]? (?:you|your|approval|the (?:lowest|best)|a (?:lower|better))/i,
    /\bguaranteed (?:approval|rate|savings|lowest)/i,
    /\binstant (?:approval|decision)\b/i,
    /\brates? as low as\b/i,
    /\b\d+(?:\.\d+)? ?%/,
    /\bAPR\b/,
    /\bno[- ](?:cost|fee) (?:loan|refinance|mortgage|closing)\b/i
  ];

  function campaignProse(campaign: CampaignDefinition): string {
    const questionCopy = campaign.funnel.questions.flatMap((question) => [
      question.heading,
      question.help ?? "",
      ...(question.kind === "text" ? [question.placeholder ?? ""] : []),
      ...(question.kind === "choice" && question.id !== "rateBand"
        ? question.options.flatMap((option) => [option.label, option.hint ?? ""])
        : [])
      // The rateBand options are excluded because they ARE percentages: the
      // visitor's own current rate, self-reported as a range — the same
      // vocabulary /plan uses. They are never a rate this site quotes or
      // promises. The question's heading still goes through every pattern.
    ]);
    return [
      campaign.metaTitle,
      campaign.metaDescription,
      campaign.eyebrow,
      campaign.headline,
      campaign.subhead,
      ...campaign.chips,
      ...campaign.whatHappensNext,
      ...questionCopy,
      campaign.funnel.contactHint ?? "",
      campaign.funnel.successBody ?? "",
      campaign.funnel.message,
      campaign.educationLink?.label ?? ""
    ].join(" \n ");
  }

  it("never promises an outcome, a rate, or an approval — question copy included", () => {
    for (const campaign of CAMPAIGNS) {
      const prose = campaignProse(campaign);
      for (const pattern of forbidden) {
        const match = prose.match(pattern);
        expect(match, `${campaign.slug} contains prohibited phrasing: ${match?.[0]}`).toBeNull();
      }
      // The built message is copy too — a default walk-through must not grow
      // a promise either.
      const built = campaignLeadFields(
        campaign.funnel,
        simulate(campaign.funnel),
        campaign.funnel.planner === undefined ? undefined : "FL"
      ).message;
      for (const pattern of forbidden) {
        expect(built.match(pattern), `${campaign.slug} message: ${built}`).toBeNull();
      }
    }
  });

  it("keeps the seller campaign as a handoff, never a listing claim", () => {
    const sell = campaignBySlug("sell");
    expect(sell).toBeDefined();
    const prose = [sell?.subhead, sell?.funnel.successBody, ...(sell?.whatHappensNext ?? [])]
      .join(" ")
      .toLowerCase();
    // The page must say out loud that TRACT does not list homes.
    expect(prose).toContain("don't list homes");
    expect(prose).toContain("connect");
  });

  it("points every education link at a registered indexable route", () => {
    // The content linter only scans .tsx literals, so a campaign's education
    // link — data rendered by the template — needs its own resolution check.
    for (const campaign of CAMPAIGNS) {
      if (campaign.educationLink === undefined) continue;
      const entry = ROUTE_REGISTRY.find((route) => route.path === campaign.educationLink?.href);
      expect(entry, `${campaign.slug} education link is not a registered route`).toBeDefined();
      expect(entry?.indexable, `${campaign.slug} education link points at a noindex page`).toBe(
        true
      );
    }
  });

  it("meets the metadata length budget the content linter enforces", () => {
    for (const campaign of CAMPAIGNS) {
      expect(campaign.metaTitle.length, campaign.slug).toBeLessThanOrEqual(60);
      expect(campaign.metaDescription.length, campaign.slug).toBeLessThanOrEqual(165);
    }
  });
});
