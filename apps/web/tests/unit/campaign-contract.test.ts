import { describe, expect, it } from "vitest";
import { CreateLeadSchema, LeadIntentSchema } from "@tract/schemas";
import { assertCrmPayloadSafe } from "@tract/integrations";
import { CAMPAIGNS, campaignBySlug } from "../../content/campaigns";
import { ROUTE_REGISTRY } from "../../content/routes";

/**
 * Campaign landing pages are marketing surfaces for paid traffic. This
 * contract keeps three things from drifting: the routes stay registered and
 * non-indexable, the funnel presets stay inside the schema the API accepts,
 * and the copy never grows approval language or a rate promise.
 */

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

describe("campaign funnel presets", () => {
  it("presets only intents the lead schema accepts", () => {
    for (const campaign of CAMPAIGNS) {
      expect(
        LeadIntentSchema.safeParse(campaign.funnel.intent).success,
        `${campaign.slug} presets intent "${campaign.funnel.intent}"`
      ).toBe(true);
    }
  });

  it("keeps every campaign message inside the schema's free-text bound", () => {
    for (const campaign of CAMPAIGNS) {
      const message = campaign.funnel.message;
      expect(
        message,
        `${campaign.slug} has no campaign message for the loan officer`
      ).toBeDefined();
      expect((message ?? "").length).toBeLessThanOrEqual(1500);
    }
  });

  it("builds a payload the API accepts from every campaign preset", () => {
    // The exact shape the funnel component submits when a preset drives it:
    // intent and message from the page, timeline from the visitor, credit band
    // possibly absent (the sell funnel skips that step entirely).
    for (const campaign of CAMPAIGNS) {
      const result = CreateLeadSchema.safeParse({
        submissionId: "00000000-0000-4000-8000-000000000010",
        intent: campaign.funnel.intent,
        firstName: "Dana",
        lastName: "Reyes",
        email: "dana@example.com",
        phone: "(813) 555-0147",
        stateCode: "FL",
        timeline: "0_3_months",
        estimatedCreditBand: campaign.funnel.skipCreditStep === true ? undefined : "unknown",
        message: campaign.funnel.message,
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
      });
      expect(result.success, `${campaign.slug} preset does not satisfy CreateLeadSchema`).toBe(
        true
      );
    }
  });

  it("drops the credit question for sellers only", () => {
    for (const campaign of CAMPAIGNS) {
      const expectSkip = campaign.funnel.intent === "sell_home";
      expect(campaign.funnel.skipCreditStep === true, campaign.slug).toBe(expectSkip);
    }
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

  it("never promises an outcome, a rate, or an approval", () => {
    for (const campaign of CAMPAIGNS) {
      const prose = [
        campaign.metaTitle,
        campaign.metaDescription,
        campaign.eyebrow,
        campaign.headline,
        campaign.subhead,
        ...campaign.chips,
        ...campaign.whatHappensNext,
        campaign.funnel.timelineHeading ?? "",
        campaign.funnel.contactHint ?? "",
        campaign.funnel.successBody ?? "",
        campaign.funnel.message ?? "",
        campaign.educationLink?.label ?? ""
      ].join(" \n ");
      for (const pattern of forbidden) {
        const match = prose.match(pattern);
        expect(match, `${campaign.slug} contains prohibited phrasing: ${match?.[0]}`).toBeNull();
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
