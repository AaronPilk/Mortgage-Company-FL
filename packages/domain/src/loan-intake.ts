import { z } from "zod";

/**
 * TRACT intake → document-requirements engine.
 *
 * Given a borrower's answers, this returns the exact list of documents
 * underwriting will ask for — so the borrower is guided instead of guessing,
 * and the loan officer isn't chasing paper. It encodes the standard agency
 * documentation logic (Fannie/Freddie-style) as a sensible first pass that Dan
 * refines with 18 years of specifics.
 *
 * Compliance boundary (ECOA / Reg B): this determines which DOCUMENTS are
 * needed and which EXPLANATIONS underwriting typically asks for. It never
 * decides — or implies — whether anyone is approved or denied. It is a
 * checklist generator, not a credit decision.
 */

export const LOAN_PURPOSES = [
  "purchase",
  "refinance",
  "cash_out_refinance",
  "heloc",
  "construction"
] as const;

export const OCCUPANCIES = ["primary", "second_home", "investment"] as const;

export const PROPERTY_TYPES = [
  "single_family",
  "condo",
  "townhouse",
  "multi_unit_2_4",
  "manufactured"
] as const;

export const EMPLOYMENT_TYPES = [
  "w2",
  "self_employed",
  "contractor_1099",
  "retired",
  "not_employed"
] as const;

export const INCOME_SOURCES = [
  "base_or_hourly",
  "overtime",
  "bonus",
  "commission",
  "self_employment",
  "social_security",
  "pension",
  "retirement_distribution",
  "rental_income",
  "child_support_alimony",
  "disability"
] as const;

export const ASSET_SOURCES = [
  "checking_savings",
  "retirement_account",
  "gift_funds",
  "sale_of_asset",
  "stocks_bonds"
] as const;

export const CREDIT_EVENTS = ["bankruptcy", "foreclosure", "collections", "late_payments"] as const;

export type LoanPurpose = (typeof LOAN_PURPOSES)[number];

/** Borrower-facing purpose labels, shared by the portal and the LO workspace. */
export const LOAN_PURPOSE_LABELS: Record<LoanPurpose, string> = {
  purchase: "Home purchase",
  refinance: "Refinance",
  cash_out_refinance: "Cash-out refinance",
  heloc: "Home equity line",
  construction: "Construction / renovation"
};

export type Occupancy = (typeof OCCUPANCIES)[number];
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type IncomeSource = (typeof INCOME_SOURCES)[number];
export type AssetSource = (typeof ASSET_SOURCES)[number];
export type CreditEvent = (typeof CREDIT_EVENTS)[number];

export const IntakeAnswersSchema = z.object({
  loanPurpose: z.enum(LOAN_PURPOSES),
  occupancy: z.enum(OCCUPANCIES).default("primary"),
  propertyType: z.enum(PROPERTY_TYPES).default("single_family"),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  incomeSources: z.array(z.enum(INCOME_SOURCES)).default([]),
  assetSources: z.array(z.enum(ASSET_SOURCES)).default([]),
  creditEvents: z.array(z.enum(CREDIT_EVENTS)).default([]),
  hasCoBorrower: z.boolean().default(false),
  isVeteran: z.boolean().default(false),
  ownsOtherRealEstate: z.boolean().default(false),
  employmentGapLast2Years: z.boolean().default(false),
  recentLargeDeposits: z.boolean().default(false)
});

export type IntakeAnswers = z.infer<typeof IntakeAnswersSchema>;

/** Pre-parse shape: fields carrying a default are optional. Accept this at the edge. */
export type IntakeAnswersInput = z.input<typeof IntakeAnswersSchema>;

/** The storage bucket categories the `loan.loan_documents` table understands. */
export type StorageDocType = "w2" | "paystub" | "bank_statement" | "tax_return" | "id" | "other";

export type RequirementCategory =
  "identity" | "income" | "assets" | "purpose" | "property" | "credit" | "explanation";

export interface DocumentRequirement {
  /** Stable id, safe to key UI and dedupe on. */
  id: string;
  /** Borrower-facing name of the document. */
  label: string;
  /** Plain-English reason. Written to reassure, not to intimidate. */
  why: string;
  category: RequirementCategory;
  storageDocType: StorageDocType;
  /** true = underwriting will require it; false = only if it applies to you. */
  required: boolean;
}

const has = <T>(list: readonly T[], value: T): boolean => list.includes(value);

/**
 * Build the borrower's document checklist from their answers. Deterministic and
 * order-stable; ids are unique (later rules that repeat an id are ignored).
 */
export function requiredDocuments(input: IntakeAnswersInput): DocumentRequirement[] {
  const a = IntakeAnswersSchema.parse(input);
  const out: DocumentRequirement[] = [];
  const add = (r: DocumentRequirement): void => {
    if (!out.some((existing) => existing.id === r.id)) out.push(r);
  };

  // --- Identity (always) --------------------------------------------------
  add({
    id: "identity.gov_id",
    label: "Government-issued photo ID",
    why: "Confirms who you are — a quick snap of your driver's license or passport.",
    category: "identity",
    storageDocType: "id",
    required: true
  });

  // --- Income -------------------------------------------------------------
  if (a.employmentType === "w2") {
    add({
      id: "income.w2_2yr",
      label: "W-2s — last 2 years",
      why: "Shows your income history the same way underwriting reads it. The single biggest thing that speeds up your approval.",
      category: "income",
      storageDocType: "w2",
      required: true
    });
    add({
      id: "income.paystubs_30d",
      label: "Pay stubs — most recent 30 days",
      why: "Confirms you're still employed and what you're earning right now.",
      category: "income",
      storageDocType: "paystub",
      required: true
    });
  }

  if (a.employmentType === "self_employed" || has(a.incomeSources, "self_employment")) {
    add({
      id: "income.tax_returns_personal_2yr",
      label: "Personal tax returns — last 2 years (all pages)",
      why: "For self-employment, underwriting qualifies you on your returns, not a pay stub.",
      category: "income",
      storageDocType: "tax_return",
      required: true
    });
    add({
      id: "income.tax_returns_business_2yr",
      label: "Business tax returns — last 2 years",
      why: "Applies if your business files its own return (S-corp, partnership, or C-corp).",
      category: "income",
      storageDocType: "tax_return",
      required: false
    });
    add({
      id: "income.ytd_profit_loss",
      label: "Year-to-date profit & loss statement",
      why: "Bridges the gap from last year's return to today so we can use current income.",
      category: "income",
      storageDocType: "other",
      required: true
    });
  }

  if (a.employmentType === "contractor_1099" || has(a.incomeSources, "self_employment")) {
    add({
      id: "income.form_1099_2yr",
      label: "1099 forms — last 2 years",
      why: "Documents contract income underwriting can count.",
      category: "income",
      storageDocType: "tax_return",
      required: false
    });
  }

  // Variable income needs a 2-year track record to be usable.
  for (const [source, id, label] of [
    ["overtime", "income.loe_overtime", "Explanation of overtime history"],
    ["bonus", "income.loe_bonus", "Explanation of bonus history"],
    ["commission", "income.loe_commission", "Explanation of commission history"]
  ] as const) {
    if (has(a.incomeSources, source)) {
      add({
        id,
        label,
        why: "Overtime, bonus, and commission only count when there's a steady 2-year history — this is exactly the trap that turns a $10k down payment into $34k at closing, so we settle it up front.",
        category: "income",
        storageDocType: "other",
        required: true
      });
    }
  }

  if (a.employmentType === "retired" || has(a.incomeSources, "social_security")) {
    add({
      id: "income.social_security_award",
      label: "Social Security award / benefit letter",
      why: "Verifies your benefit amount — one letter covers it.",
      category: "income",
      storageDocType: "other",
      required: has(a.incomeSources, "social_security")
    });
  }
  if (has(a.incomeSources, "pension") || has(a.incomeSources, "retirement_distribution")) {
    add({
      id: "income.pension_1099r",
      label: "Pension / retirement 1099-R and statements",
      why: "Confirms retirement income and that it continues.",
      category: "income",
      storageDocType: "other",
      required: true
    });
  }
  if (has(a.incomeSources, "rental_income") || a.ownsOtherRealEstate) {
    add({
      id: "income.leases",
      label: "Lease agreements for rental property",
      why: "Documents rental income and the payments on any property you already own.",
      category: "income",
      storageDocType: "other",
      required: has(a.incomeSources, "rental_income")
    });
  }
  if (has(a.incomeSources, "child_support_alimony")) {
    add({
      id: "income.support_order",
      label: "Support order / divorce decree",
      why: "Needed only if you want child support or alimony counted as income.",
      category: "income",
      storageDocType: "other",
      required: false
    });
  }
  if (has(a.incomeSources, "disability")) {
    add({
      id: "income.disability_award",
      label: "Disability award letter",
      why: "Verifies the benefit and that it continues.",
      category: "income",
      storageDocType: "other",
      required: true
    });
  }

  // --- Assets -------------------------------------------------------------
  add({
    id: "assets.bank_statements_2mo",
    label: "Bank statements — last 2 months (all pages)",
    why: "Shows the funds for your down payment and closing — all pages, even the blank one.",
    category: "assets",
    storageDocType: "bank_statement",
    required: true
  });
  if (has(a.assetSources, "retirement_account")) {
    add({
      id: "assets.retirement_statement",
      label: "Retirement / 401(k) statement — most recent",
      why: "Counts toward reserves and can source funds if you're pulling from it.",
      category: "assets",
      storageDocType: "bank_statement",
      required: false
    });
  }
  if (has(a.assetSources, "gift_funds")) {
    add({
      id: "assets.gift_letter",
      label: "Gift letter + proof of transfer",
      why: "If any funds are a gift, a short signed letter plus the transfer keeps closing clean.",
      category: "assets",
      storageDocType: "other",
      required: true
    });
  }
  if (has(a.assetSources, "sale_of_asset")) {
    add({
      id: "assets.sale_proceeds",
      label: "Proof of sale + receipt of funds",
      why: "Documents money coming from selling a car, property, or other asset.",
      category: "assets",
      storageDocType: "other",
      required: true
    });
  }
  if (has(a.assetSources, "stocks_bonds")) {
    add({
      id: "assets.brokerage_statement",
      label: "Brokerage / investment statement",
      why: "Sources funds held in stocks or bonds.",
      category: "assets",
      storageDocType: "bank_statement",
      required: false
    });
  }

  // --- Purpose ------------------------------------------------------------
  if (a.loanPurpose === "purchase") {
    add({
      id: "purpose.purchase_contract",
      label: "Signed purchase contract",
      why: "Once you're under contract, this kicks the loan into gear.",
      category: "purpose",
      storageDocType: "other",
      required: false
    });
    add({
      id: "purpose.earnest_money",
      label: "Earnest money proof",
      why: "The deposit you put down with your offer — a copy of the check or transfer.",
      category: "purpose",
      storageDocType: "other",
      required: false
    });
  }
  if (
    a.loanPurpose === "refinance" ||
    a.loanPurpose === "cash_out_refinance" ||
    a.loanPurpose === "heloc"
  ) {
    add({
      id: "purpose.mortgage_statement",
      label: "Current mortgage statement",
      why: "Shows your current loan so we can beat it or pull equity.",
      category: "purpose",
      storageDocType: "other",
      required: true
    });
    add({
      id: "purpose.homeowners_insurance",
      label: "Homeowners insurance declaration page",
      why: "Confirms the property is insured.",
      category: "purpose",
      storageDocType: "other",
      required: true
    });
  }
  if (a.loanPurpose === "cash_out_refinance") {
    add({
      id: "purpose.loe_cash_out",
      label: "Note on how you'll use the cash",
      why: "A sentence on the plan — home improvements, debt, investment — is all underwriting needs.",
      category: "explanation",
      storageDocType: "other",
      required: true
    });
  }

  // --- Property -----------------------------------------------------------
  if (a.propertyType === "condo") {
    add({
      id: "property.hoa_docs",
      label: "HOA / condo association documents",
      why: "Condos need the association's insurance and a short questionnaire — your agent or the HOA can send these.",
      category: "property",
      storageDocType: "other",
      required: true
    });
  }
  if (a.propertyType === "multi_unit_2_4" || a.occupancy === "investment") {
    add({
      id: "property.rent_roll",
      label: "Leases / rent roll for the units",
      why: "Rental income on the property can help you qualify.",
      category: "property",
      storageDocType: "other",
      required: false
    });
  }

  // --- VA -----------------------------------------------------------------
  if (a.isVeteran) {
    add({
      id: "identity.va_coe",
      label: "VA Certificate of Eligibility (and DD-214)",
      why: "Unlocks your VA loan benefit — often no down payment.",
      category: "identity",
      storageDocType: "other",
      required: false
    });
  }

  // --- Explanations underwriting routinely asks for -----------------------
  if (has(a.creditEvents, "bankruptcy")) {
    add({
      id: "credit.bankruptcy_discharge",
      label: "Bankruptcy discharge papers + brief explanation",
      why: "Once enough time has passed, a bankruptcy doesn't stop you — this clears it.",
      category: "credit",
      storageDocType: "other",
      required: true
    });
  }
  if (has(a.creditEvents, "foreclosure")) {
    add({
      id: "credit.foreclosure_loe",
      label: "Explanation of the foreclosure",
      why: "A short, honest note on what happened and when.",
      category: "credit",
      storageDocType: "other",
      required: true
    });
  }
  if (has(a.creditEvents, "collections") || has(a.creditEvents, "late_payments")) {
    add({
      id: "credit.loe_credit",
      label: "Explanation of collections / late payments",
      why: "A quick note on anything on your credit keeps underwriting from stalling on it.",
      category: "credit",
      storageDocType: "other",
      required: true
    });
  }
  if (a.employmentGapLast2Years) {
    add({
      id: "explanation.employment_gap",
      label: "Explanation of employment gap",
      why: "A sentence on any gap in the last 2 years — school, family, between jobs.",
      category: "explanation",
      storageDocType: "other",
      required: true
    });
  }
  if (a.recentLargeDeposits) {
    add({
      id: "explanation.large_deposits",
      label: "Source of any large recent deposits",
      why: "Underwriting flags deposits that aren't payroll — showing where they came from clears it fast.",
      category: "explanation",
      storageDocType: "other",
      required: true
    });
  }

  // --- Co-borrower --------------------------------------------------------
  if (a.hasCoBorrower) {
    add({
      id: "identity.coborrower_set",
      label: "Same income + ID documents for your co-borrower",
      why: "Your co-borrower provides the same income and identity items you do.",
      category: "identity",
      storageDocType: "other",
      required: true
    });
  }

  return out;
}

/** Convenience: just the must-have items, for the "you still need these" nudge. */
export function outstandingRequired(
  input: IntakeAnswersInput,
  providedIds: readonly string[] = []
): DocumentRequirement[] {
  return requiredDocuments(input).filter((r) => r.required && !providedIds.includes(r.id));
}
