/**
 * The assumption catalogue.
 *
 * Read this before reading anything else in the package.
 *
 * Not one value here is market data. There is no comparable-sales feed, no
 * construction cost database, no rent index, and no appraisal behind any of it.
 * Every entry is a configurable planning placeholder that exists so the model
 * can run at all, and every entry is overridable by the person using it.
 *
 * That is why each resolved assumption carries `marketDataBacked: false` and the
 * `NOT_MARKET_DATA` note. The flag is a type-level `false`, not a boolean, so a
 * future adapter cannot quietly flip it without the type system noticing that
 * the provenance model needs to change with it.
 */

export const NOT_MARKET_DATA = "Modelled assumption — not market data.";

export type AssumptionUnit =
  "basis_points" | "cents" | "cents_per_square_foot" | "months" | "cents_per_night";

export type AssumptionSource = "user" | "company_default";

export type AssumptionDefinition = {
  key: AssumptionKey;
  label: string;
  unit: AssumptionUnit;
  defaultValue: number;
  /** Bounds exist so an override cannot drive the model somewhere meaningless. */
  min: number;
  max: number;
  /** Why the placeholder is what it is, and what would be needed to replace it. */
  note: string;
};

export const ASSUMPTION_KEYS = [
  // Cost placeholders
  "renovationCostPerSquareFootCents",
  "additionCostPerSquareFootCents",
  "interiorUpgradeBudgetCents",
  "newConstructionCostPerSquareFootCents",
  "softCostRateBasisPoints",
  "contingencyRateBasisPoints",
  "acquisitionCostRateBasisPoints",
  "sellingCostRateBasisPoints",
  "financingPointsBasisPoints",

  // Value placeholders
  "valueUpliftShareOfSpendBasisPoints",
  "completedValueToCostRatioBasisPoints",
  "annualAppreciationBasisPoints",

  // Carrying placeholders
  "annualPropertyTaxRateBasisPoints",
  "annualInsuranceRateBasisPoints",
  "monthlyUtilitiesCents",
  "improvementHoldMonths",
  "constructionMonths",
  "flipHoldMonths",
  "buyAndHoldMonths",

  // Income placeholders
  "monthlyRentToValueBasisPoints",
  "longTermVacancyRateBasisPoints",
  "longTermManagementRateBasisPoints",
  "maintenanceRateBasisPoints",
  "capitalReserveRateBasisPoints",
  "shortTermVacancyRateBasisPoints",
  "shortTermManagementRateBasisPoints",
  "shortTermPlatformFeeRateBasisPoints",
  "shortTermTurnoverCostRateBasisPoints",
  "shortTermNightlyPremiumBasisPoints",

  // Case spread — how far the conservative and optimistic runs move
  "costSpreadDownBasisPoints",
  "costSpreadUpBasisPoints",
  "valueSpreadDownBasisPoints",
  "valueSpreadUpBasisPoints",
  "incomeSpreadDownBasisPoints",
  "incomeSpreadUpBasisPoints",
  "rateSpreadBasisPoints",
  "vacancySpreadBasisPoints"
] as const;

export type AssumptionKey = (typeof ASSUMPTION_KEYS)[number];

const definition = (
  key: AssumptionKey,
  label: string,
  unit: AssumptionUnit,
  defaultValue: number,
  min: number,
  max: number,
  note: string
): AssumptionDefinition => ({ key, label, unit, defaultValue, min, max, note });

export const ASSUMPTION_CATALOGUE: Readonly<Record<AssumptionKey, AssumptionDefinition>> = {
  renovationCostPerSquareFootCents: definition(
    "renovationCostPerSquareFootCents",
    "Renovation cost per square foot",
    "cents_per_square_foot",
    15_000,
    1_000,
    120_000,
    "A placeholder used only when you do not enter a budget. Replace it with a contractor's bid — scope, finish level, and trade availability move this figure more than any other input."
  ),
  additionCostPerSquareFootCents: definition(
    "additionCostPerSquareFootCents",
    "Addition cost per square foot",
    "cents_per_square_foot",
    30_000,
    5_000,
    200_000,
    "A placeholder for new conditioned space attached to an existing structure. Foundation, roof tie-in, and structural work vary enormously. Replace it with a bid."
  ),
  interiorUpgradeBudgetCents: definition(
    "interiorUpgradeBudgetCents",
    "Interior upgrade budget",
    "cents",
    6_500_000,
    100_000,
    100_000_000,
    "A placeholder for a kitchen or interior refresh when you do not enter your own budget. Replace it with a quote."
  ),
  newConstructionCostPerSquareFootCents: definition(
    "newConstructionCostPerSquareFootCents",
    "New construction hard cost per square foot",
    "cents_per_square_foot",
    25_000,
    5_000,
    200_000,
    "Vertical construction only. Excludes land, site work, utility connections, and impact fees. A placeholder, not a builder's number."
  ),
  softCostRateBasisPoints: definition(
    "softCostRateBasisPoints",
    "Soft costs as a share of hard cost",
    "basis_points",
    2_000,
    0,
    6_000,
    "Design, engineering, surveys, permits, impact fees, and construction-period fees, modelled as a share of hard cost because the individual amounts are jurisdiction specific."
  ),
  contingencyRateBasisPoints: definition(
    "contingencyRateBasisPoints",
    "Contingency",
    "basis_points",
    1_500,
    0,
    5_000,
    "Money set aside for what the scope does not yet cover. Older structures and anything opening walls justify more."
  ),
  acquisitionCostRateBasisPoints: definition(
    "acquisitionCostRateBasisPoints",
    "Acquisition costs as a share of price",
    "basis_points",
    300,
    0,
    1_500,
    "Inspection, title, survey, and closing costs on the purchase. Real figures arrive on a Loan Estimate and a title quote, not from here."
  ),
  sellingCostRateBasisPoints: definition(
    "sellingCostRateBasisPoints",
    "Selling costs as a share of resale",
    "basis_points",
    700,
    0,
    1_500,
    "Commission, doc stamps, title, and concessions on the way out. Negotiable and transaction specific."
  ),
  financingPointsBasisPoints: definition(
    "financingPointsBasisPoints",
    "Points and lender fees on the project loan",
    "basis_points",
    200,
    0,
    1_000,
    "A placeholder. No lender has quoted this scenario and nothing here is an offer of credit."
  ),
  valueUpliftShareOfSpendBasisPoints: definition(
    "valueUpliftShareOfSpendBasisPoints",
    "Share of spend that shows up in value",
    "basis_points",
    7_000,
    0,
    15_000,
    "The single most consequential assumption in this model, and the one with the least behind it. It is not derived from comparable sales, a cost-versus-value study, or an appraisal. Move it and watch every value figure move with it."
  ),
  completedValueToCostRatioBasisPoints: definition(
    "completedValueToCostRatioBasisPoints",
    "Completed value as a share of delivered cost",
    "basis_points",
    11_000,
    5_000,
    20_000,
    "Used for new construction when you do not supply an expected completed value. It is a ratio, not a valuation, and it is not drawn from comparable sales."
  ),
  annualAppreciationBasisPoints: definition(
    "annualAppreciationBasisPoints",
    "Annual value change",
    "basis_points",
    300,
    -2_000,
    2_000,
    "A flat annual rate applied over the hold. Property values do not move at a constant rate and can fall. This is a planning placeholder, not a forecast."
  ),
  annualPropertyTaxRateBasisPoints: definition(
    "annualPropertyTaxRateBasisPoints",
    "Annual property tax as a share of value",
    "basis_points",
    150,
    0,
    500,
    "Florida millage varies by county and by taxing district, and a purchase usually resets the assessed value. Verify with the county property appraiser and tax collector."
  ),
  annualInsuranceRateBasisPoints: definition(
    "annualInsuranceRateBasisPoints",
    "Annual property insurance as a share of value",
    "basis_points",
    120,
    0,
    800,
    "Florida wind, roof age, and flood exposure move this so much that a placeholder is close to meaningless. Get a real quote before relying on any figure that includes it."
  ),
  monthlyUtilitiesCents: definition(
    "monthlyUtilitiesCents",
    "Monthly utilities and other carrying costs",
    "cents",
    25_000,
    0,
    500_000,
    "Power, water, waste, lawn, and pest while the property is held or under construction."
  ),
  improvementHoldMonths: definition(
    "improvementHoldMonths",
    "Months of work and carrying",
    "months",
    6,
    1,
    120,
    "How long you carry the property while the work happens. Permitting timelines are the usual reason this slips."
  ),
  constructionMonths: definition(
    "constructionMonths",
    "Months from permit to certificate of occupancy",
    "months",
    12,
    1,
    120,
    "Excludes entitlement and permit review time, which is jurisdiction specific and must be verified."
  ),
  flipHoldMonths: definition(
    "flipHoldMonths",
    "Months held before resale",
    "months",
    6,
    1,
    60,
    "Acquisition through closed resale, including time on market."
  ),
  buyAndHoldMonths: definition(
    "buyAndHoldMonths",
    "Months held",
    "months",
    60,
    1,
    480,
    "The horizon over which value change and loan paydown are projected."
  ),
  monthlyRentToValueBasisPoints: definition(
    "monthlyRentToValueBasisPoints",
    "Monthly rent as a share of value",
    "basis_points",
    70,
    10,
    300,
    "Used only when you do not enter a rent. It is not a rent estimate, not a rent index, and not a rent schedule. Enter a real rent from comparable listings or an appraiser's rent schedule."
  ),
  longTermVacancyRateBasisPoints: definition(
    "longTermVacancyRateBasisPoints",
    "Vacancy and credit loss",
    "basis_points",
    800,
    0,
    5_000,
    "Time between tenants plus rent that is billed and never collected."
  ),
  longTermManagementRateBasisPoints: definition(
    "longTermManagementRateBasisPoints",
    "Property management",
    "basis_points",
    1_000,
    0,
    4_000,
    "Set it to zero only if you genuinely intend to self-manage, and remember that your time is the cost you are substituting."
  ),
  maintenanceRateBasisPoints: definition(
    "maintenanceRateBasisPoints",
    "Repairs and maintenance",
    "basis_points",
    800,
    0,
    4_000,
    "Ongoing repairs as a share of gross rent. Older properties justify more."
  ),
  capitalReserveRateBasisPoints: definition(
    "capitalReserveRateBasisPoints",
    "Capital reserves",
    "basis_points",
    500,
    0,
    4_000,
    "Money set aside for roof, HVAC, and other replacements that do not happen every year but do happen."
  ),
  shortTermVacancyRateBasisPoints: definition(
    "shortTermVacancyRateBasisPoints",
    "Nights unbooked",
    "basis_points",
    3_500,
    0,
    9_000,
    "The inverse of occupancy. Short-term occupancy is seasonal and highly location specific; this placeholder is not a market occupancy figure."
  ),
  shortTermManagementRateBasisPoints: definition(
    "shortTermManagementRateBasisPoints",
    "Short-term management",
    "basis_points",
    2_000,
    0,
    5_000,
    "Full-service short-term management typically costs several times long-term management."
  ),
  shortTermPlatformFeeRateBasisPoints: definition(
    "shortTermPlatformFeeRateBasisPoints",
    "Booking platform fees",
    "basis_points",
    300,
    0,
    2_000,
    "The host-side share only. Platform terms change and are not modelled from a rate card."
  ),
  shortTermTurnoverCostRateBasisPoints: definition(
    "shortTermTurnoverCostRateBasisPoints",
    "Cleaning, linens, and supplies",
    "basis_points",
    1_200,
    0,
    4_000,
    "Modelled as a share of gross booking income rather than per turnover, because stay length is unknown."
  ),
  shortTermNightlyPremiumBasisPoints: definition(
    "shortTermNightlyPremiumBasisPoints",
    "Nightly rate versus the daily equivalent of long-term rent",
    "basis_points",
    25_000,
    10_000,
    100_000,
    "Used only when you do not enter a nightly rate. It is a placeholder multiple, not a rate observed anywhere."
  ),
  costSpreadDownBasisPoints: definition(
    "costSpreadDownBasisPoints",
    "How far costs move down in the favourable case",
    "basis_points",
    700,
    0,
    5_000,
    "Costs are modelled as skewing upward: the favourable case moves less than the unfavourable one, because overruns are more common than underruns."
  ),
  costSpreadUpBasisPoints: definition(
    "costSpreadUpBasisPoints",
    "How far costs move up in the unfavourable case",
    "basis_points",
    2_000,
    0,
    8_000,
    "The unfavourable case. Widen it for older structures, structural work, or anything that opens a wall or a roof."
  ),
  valueSpreadDownBasisPoints: definition(
    "valueSpreadDownBasisPoints",
    "How far value moves down in the unfavourable case",
    "basis_points",
    1_000,
    0,
    5_000,
    "Applied to every modelled value figure. Without comparable sales the honest band is wide."
  ),
  valueSpreadUpBasisPoints: definition(
    "valueSpreadUpBasisPoints",
    "How far value moves up in the favourable case",
    "basis_points",
    800,
    0,
    5_000,
    "Applied to every modelled value figure. It is not a probability that value lands there."
  ),
  incomeSpreadDownBasisPoints: definition(
    "incomeSpreadDownBasisPoints",
    "How far income moves down in the unfavourable case",
    "basis_points",
    1_200,
    0,
    5_000,
    "Applied to rent and booking income across the whole hold, not just the first year."
  ),
  incomeSpreadUpBasisPoints: definition(
    "incomeSpreadUpBasisPoints",
    "How far income moves up in the favourable case",
    "basis_points",
    800,
    0,
    5_000,
    "Applied to rent and booking income. Widen it if the income figure itself is a placeholder."
  ),
  rateSpreadBasisPoints: definition(
    "rateSpreadBasisPoints",
    "Interest rate band around the rate you entered",
    "basis_points",
    75,
    0,
    500,
    "No rate is being quoted or offered. The band exists so the result does not depend on one rate holding exactly."
  ),
  vacancySpreadBasisPoints: definition(
    "vacancySpreadBasisPoints",
    "How far vacancy moves between cases",
    "basis_points",
    2_500,
    0,
    8_000,
    "A proportional move applied to the vacancy assumption in each case."
  )
};

export type ResolvedAssumption = {
  key: AssumptionKey;
  label: string;
  unit: AssumptionUnit;
  value: number;
  source: AssumptionSource;
  /** Permanently false. No value in this package is traceable to a dated market source. */
  marketDataBacked: false;
  note: string;
};

export type ResolvedAssumptions = Readonly<Record<AssumptionKey, ResolvedAssumption>>;

export type AssumptionOverrides = Partial<Record<AssumptionKey, number>>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Applies the caller's overrides over the catalogue defaults, clamping each to
 * its declared bounds and recording which of the two the value came from. The
 * provenance is what lets the UI show "you chose this" beside "we made this up".
 */
export function resolveAssumptions(overrides: AssumptionOverrides = {}): ResolvedAssumptions {
  const out = {} as Record<AssumptionKey, ResolvedAssumption>;
  for (const key of ASSUMPTION_KEYS) {
    const spec = ASSUMPTION_CATALOGUE[key];
    const override = overrides[key];
    const supplied = override !== undefined && Number.isFinite(override);
    const raw = supplied ? (override as number) : spec.defaultValue;
    out[key] = {
      key,
      label: spec.label,
      unit: spec.unit,
      value: Math.round(clamp(raw, spec.min, spec.max)),
      source: supplied ? "user" : "company_default",
      marketDataBacked: false,
      note: `${NOT_MARKET_DATA} ${spec.note}`
    };
  }
  return out;
}

/** Narrows a resolved set to the keys a given scenario actually used. */
export function usedAssumptions(
  resolved: ResolvedAssumptions,
  keys: readonly AssumptionKey[]
): ResolvedAssumption[] {
  const seen = new Set<AssumptionKey>();
  const out: ResolvedAssumption[] = [];
  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(resolved[key]);
  }
  return out;
}
