import { describe, expect, it } from "vitest";
import {
  type IntakeAnswers,
  type IntakeAnswersInput,
  outstandingRequired,
  requiredDocuments
} from "./loan-intake";

const ids = (answers: IntakeAnswersInput): string[] => requiredDocuments(answers).map((r) => r.id);

describe("requiredDocuments", () => {
  it("always asks for a government ID", () => {
    const list = requiredDocuments({ loanPurpose: "purchase", employmentType: "w2" });
    expect(list.some((r) => r.id === "identity.gov_id" && r.required)).toBe(true);
  });

  it("W-2 purchase asks for W-2s, paystubs, bank statements, and purchase docs", () => {
    const got = ids({
      loanPurpose: "purchase",
      employmentType: "w2",
      incomeSources: ["base_or_hourly"],
      assetSources: ["checking_savings"]
    });
    expect(got).toEqual(
      expect.arrayContaining([
        "income.w2_2yr",
        "income.paystubs_30d",
        "assets.bank_statements_2mo",
        "purpose.purchase_contract",
        "purpose.earnest_money"
      ])
    );
    // A salaried W-2 borrower is not asked for tax returns.
    expect(got).not.toContain("income.tax_returns_personal_2yr");
  });

  it("self-employed refinance qualifies on returns, not paystubs", () => {
    const got = ids({
      loanPurpose: "refinance",
      employmentType: "self_employed",
      incomeSources: ["self_employment"]
    });
    expect(got).toEqual(
      expect.arrayContaining([
        "income.tax_returns_personal_2yr",
        "income.ytd_profit_loss",
        "purpose.mortgage_statement",
        "purpose.homeowners_insurance"
      ])
    );
    expect(got).not.toContain("income.paystubs_30d");
    expect(got).not.toContain("purpose.purchase_contract");
  });

  it("retiree on social security asks for the award letter, not W-2s", () => {
    const got = ids({
      loanPurpose: "purchase",
      employmentType: "retired",
      incomeSources: ["social_security"]
    });
    expect(got).toContain("income.social_security_award");
    expect(got).not.toContain("income.w2_2yr");
  });

  it("overtime income triggers the 2-year-history explanation (the $10k→$34k trap)", () => {
    const got = requiredDocuments({
      loanPurpose: "purchase",
      employmentType: "w2",
      incomeSources: ["base_or_hourly", "overtime"]
    });
    const loe = got.find((r) => r.id === "income.loe_overtime");
    expect(loe).toBeDefined();
    expect(loe?.required).toBe(true);
    expect(loe?.why).toContain("2-year");
  });

  it("gift funds require a gift letter", () => {
    expect(
      ids({ loanPurpose: "purchase", employmentType: "w2", assetSources: ["gift_funds"] })
    ).toContain("assets.gift_letter");
  });

  it("cash-out refinance asks how the cash will be used", () => {
    expect(ids({ loanPurpose: "cash_out_refinance", employmentType: "w2" })).toContain(
      "purpose.loe_cash_out"
    );
  });

  it("condos need HOA documents", () => {
    expect(ids({ loanPurpose: "purchase", employmentType: "w2", propertyType: "condo" })).toContain(
      "property.hoa_docs"
    );
  });

  it("bankruptcy and employment gaps surface the right explanations", () => {
    const got = ids({
      loanPurpose: "purchase",
      employmentType: "w2",
      creditEvents: ["bankruptcy"],
      employmentGapLast2Years: true
    });
    expect(got).toEqual(
      expect.arrayContaining(["credit.bankruptcy_discharge", "explanation.employment_gap"])
    );
  });

  it("a co-borrower adds a matching document set", () => {
    expect(ids({ loanPurpose: "purchase", employmentType: "w2", hasCoBorrower: true })).toContain(
      "identity.coborrower_set"
    );
  });

  it("is deterministic and never repeats an id", () => {
    const answers: IntakeAnswers = {
      loanPurpose: "purchase",
      occupancy: "primary",
      propertyType: "condo",
      employmentType: "self_employed",
      incomeSources: ["self_employment", "rental_income"],
      assetSources: ["checking_savings", "gift_funds"],
      creditEvents: ["collections"],
      hasCoBorrower: true,
      isVeteran: true,
      ownsOtherRealEstate: true,
      employmentGapLast2Years: true,
      recentLargeDeposits: true
    };
    const first = requiredDocuments(answers);
    const second = requiredDocuments(answers);
    expect(first).toEqual(second);
    const seen = first.map((r) => r.id);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("every requirement maps to a storable document type", () => {
    const valid = new Set(["w2", "paystub", "bank_statement", "tax_return", "id", "other"]);
    for (const r of requiredDocuments({
      loanPurpose: "purchase",
      employmentType: "self_employed"
    })) {
      expect(valid.has(r.storageDocType)).toBe(true);
    }
  });
});

describe("outstandingRequired", () => {
  it("returns only required items not yet provided", () => {
    const answers: IntakeAnswersInput = { loanPurpose: "purchase", employmentType: "w2" };
    const all = outstandingRequired(answers);
    expect(all.every((r) => r.required)).toBe(true);

    const withId = outstandingRequired(answers, ["identity.gov_id"]);
    expect(withId.some((r) => r.id === "identity.gov_id")).toBe(false);
    expect(withId.length).toBe(all.length - 1);
  });
});
