/**
 * What is missing or unverified.
 *
 * This list is not a footnote. It is a first-class part of every result, it is
 * built from the same inputs the figures are, and an item that is `blocking`
 * means the figure it supports should not be relied on for a decision at all.
 *
 * Nothing here asserts a zoning, permitting, flood, or insurance fact. Every
 * item points at the authority that can establish it.
 */

import type { VisionInput, AnalysisType, UnverifiedItem } from "./types";
import { improvementSpendBasis } from "./improvement";
import { hardCostBasis } from "./construction";
import { incomeBasis } from "./rental";
import type { ResolvedAssumptions } from "./assumptions";
import { carryingCosts, nonNegativeCents } from "./cases";

const ALWAYS: readonly UnverifiedItem[] = [
  {
    key: "not_an_appraisal",
    label: "No appraisal, valuation, or broker price opinion",
    detail:
      "Nothing here establishes what the property is worth. Any value figure is derived from assumptions you can see and change. A licensed appraiser is the only person who can produce a valuation.",
    severity: "blocking"
  },
  {
    key: "no_comparable_sales",
    label: "No comparable sales were used",
    detail:
      "This model has no access to sold comparables. Value figures are modelled from spend or from a cost ratio, which is a different thing entirely and a weaker one.",
    severity: "blocking"
  },
  {
    key: "no_lender_terms",
    label: "No lender has priced this",
    detail:
      "Rate, points, term, and whether the scenario is financeable at all are assumptions you entered or placeholders we supplied. Nothing here is an offer of credit, a rate quote, or a preapproval.",
    severity: "material"
  },
  {
    key: "insurance_availability",
    label: "Property insurance availability and cost are unverified",
    detail:
      "Florida wind exposure, roof age, and flood zone drive insurance more than any other factor, and a policy may not be available at any modelled price. Get a real quote from a licensed agent.",
    severity: "material"
  },
  {
    key: "property_condition",
    label: "Nobody has inspected the property",
    detail:
      "Structure, roof, electrical, plumbing, HVAC, and environmental condition are unknown to this model. An inspection can move every cost figure here.",
    severity: "material"
  },
  {
    key: "tax_treatment",
    label: "Tax treatment is not modelled",
    detail:
      "Income tax, depreciation, capital gains, homestead status, Save Our Homes portability, and entity structure are excluded. Those belong with a tax professional.",
    severity: "note"
  }
];

const ZONING: UnverifiedItem = {
  key: "zoning_and_land_use",
  label: "Zoning and permitted use must be verified",
  detail:
    "Whether the work is allowed at all — use, density, height, setbacks, lot coverage, and any overlay or deed restriction — must be verified with the applicable city or county planning authority. This model does not check it and does not assert it.",
  severity: "blocking"
};

const PERMITTING: UnverifiedItem = {
  key: "permitting",
  label: "Permitting, fees, and timelines must be verified",
  detail:
    "Permit feasibility, review times, impact fees, and connection fees must be verified with the building department having jurisdiction. Permitting delay is the most common reason a hold period runs long.",
  severity: "blocking"
};

const FLOOD: UnverifiedItem = {
  key: "flood_and_elevation",
  label: "Flood zone and elevation must be verified",
  detail:
    "Flood zone, base flood elevation, elevation certificate requirements, and substantial-improvement rules must be verified with FEMA and the local floodplain administrator. In a coastal county these can change what may be built and what it costs.",
  severity: "blocking"
};

const CONSTRUCTION_COSTS: UnverifiedItem = {
  key: "construction_costs",
  label: "No contractor bid and no cost database",
  detail:
    "Any cost per square foot in this model is a placeholder, not a quote and not a cost index. A licensed contractor's bid is what makes a construction budget real.",
  severity: "blocking"
};

const CONSTRUCTION_AND_STRUCTURAL: readonly UnverifiedItem[] = [
  ZONING,
  PERMITTING,
  FLOOD,
  CONSTRUCTION_COSTS
];

function byType(analysisType: AnalysisType): readonly UnverifiedItem[] {
  switch (analysisType) {
    case "existing_home_renovation":
    case "addition":
      return CONSTRUCTION_AND_STRUCTURAL;
    case "interior_upgrade":
      return [PERMITTING, CONSTRUCTION_COSTS];
    case "land_new_construction":
      return [
        ...CONSTRUCTION_AND_STRUCTURAL,
        {
          key: "site_and_utilities",
          label: "Site conditions and utility availability are unknown",
          detail:
            "Soil bearing, wetlands, protected species and trees, septic or sewer availability, well or municipal water, and power service must be established by survey and by the applicable utility and environmental authorities.",
          severity: "blocking"
        },
        {
          key: "construction_financing",
          label: "Construction financing is modelled as a simple carry",
          detail:
            "A real construction loan draws progressively, charges interest on the drawn balance, and converts on completion. This model carries the land loan at a flat payment instead, which understates the complexity and may understate the cost.",
          severity: "material"
        }
      ];
    case "fix_and_flip":
      return [
        ...CONSTRUCTION_AND_STRUCTURAL,
        {
          key: "resale_timing",
          label: "Time on market is an assumption",
          detail:
            "The hold period assumes the property sells when the work finishes. Every extra month of marketing adds carrying cost and interest that this model only counts if you extend the hold.",
          severity: "material"
        }
      ];
    case "long_term_rental":
    case "buy_and_hold":
      return [
        {
          key: "rent_data",
          label: "No rent data was used",
          detail:
            "There is no rent index or comparable-rent feed behind this model. Support the rent with current comparable listings, a signed lease, or an appraiser's rent schedule.",
          severity: "blocking"
        },
        {
          key: "landlord_tenant_rules",
          label: "Landlord and tenant obligations are not modelled",
          detail:
            "Florida landlord-tenant requirements, association rental restrictions, and any local registration or inspection regime must be verified before letting the property.",
          severity: "material"
        },
        {
          key: "utility_responsibility",
          label: "Utilities are assumed to be tenant-paid",
          detail:
            "If you pay any utility, water, or lawn service, add it as a carrying cost — it comes straight off the cash flow.",
          severity: "note"
        }
      ];
    case "short_term_rental":
      return [
        {
          key: "str_regulation",
          label: "Short-term rental may not be permitted",
          detail:
            "Many Florida municipalities and counties restrict, license, or prohibit short-term rental, and associations frequently ban it outright. Whether you may operate at all must be verified with the local government and the association before anything else in this model matters.",
          severity: "blocking"
        },
        {
          key: "occupancy_data",
          label: "No occupancy or nightly rate data was used",
          detail:
            "Occupancy and nightly rate are seasonal, location specific, and heavily dependent on the individual listing. The placeholders here are not observed market figures.",
          severity: "blocking"
        },
        {
          key: "lodging_taxes",
          label: "Tourist development and sales tax are not modelled",
          detail:
            "State sales tax and county tourist development tax on transient rentals, plus registration requirements, are excluded from these figures.",
          severity: "material"
        },
        {
          key: "furnishing_and_startup",
          label: "Furnishing and start-up costs are excluded",
          detail:
            "Furniture, linens, photography, listing setup, and the first weeks with no bookings are not in the invested-cash figure unless you entered them as a budget.",
          severity: "material"
        }
      ];
  }
}

/** Items that exist only because the person left something out. */
function fromGaps(input: VisionInput, assumptions: ResolvedAssumptions): UnverifiedItem[] {
  const out: UnverifiedItem[] = [];
  const type = input.analysisType;

  if (nonNegativeCents(input.purchasePriceCents) === 0) {
    out.push({
      key: "no_price",
      label: "No purchase price or current value was entered",
      detail:
        "Without a value to work from, every figure that scales with the property is zero or meaningless.",
      severity: "blocking"
    });
  }

  const isImprovement =
    type === "existing_home_renovation" || type === "addition" || type === "interior_upgrade";
  const isFlip = type === "fix_and_flip";
  const isConstruction = type === "land_new_construction";
  const isRental =
    type === "long_term_rental" || type === "short_term_rental" || type === "buy_and_hold";

  if (isImprovement || isFlip) {
    const spend = improvementSpendBasis(input, assumptions);
    if (!spend.suppliedByUser) {
      out.push({
        key: "modelled_budget",
        label: "The budget is modelled, not yours",
        detail: `${spend.basis} Enter your own budget or a contractor's bid and every cost figure changes.`,
        severity: spend.cents === 0 ? "blocking" : "material"
      });
    }
  }

  if (isConstruction) {
    const hard = hardCostBasis(input, assumptions);
    if (!hard.suppliedByUser) {
      out.push({
        key: "modelled_hard_cost",
        label: "The construction budget is modelled, not yours",
        detail: `${hard.basis} Replace it with a builder's number.`,
        severity: hard.cents === 0 ? "blocking" : "material"
      });
    }
  }

  if (isRental) {
    const income = incomeBasis(input, assumptions);
    if (!income.suppliedByUser) {
      out.push({
        key: "modelled_income",
        label: "The income figure is a placeholder",
        detail: `${income.basis}`,
        severity: "blocking"
      });
    }
  }

  if (input.expectedAfterValueCents === undefined && (isImprovement || isFlip || isConstruction)) {
    out.push({
      key: "modelled_after_value",
      label: "The after-improvement value is modelled from your spend",
      detail:
        "It assumes a fixed share of what you spend appears in value. That is an assumption you control, not a market observation, and no appraiser has looked at it.",
      severity: "blocking"
    });
  }

  const carry = carryingCosts(input, assumptions, nonNegativeCents(input.purchasePriceCents));
  if (!carry.taxesSuppliedByUser) {
    out.push({
      key: "modelled_property_tax",
      label: "Property tax is modelled from a rate, not an assessment",
      detail:
        "Florida millage varies by county and taxing district, and a sale usually resets the assessed value. Check the county property appraiser and tax collector for the figure that will actually apply to you.",
      severity: "material"
    });
  }
  if (!carry.insuranceSuppliedByUser) {
    out.push({
      key: "modelled_insurance",
      label: "Insurance is modelled from a rate, not a quote",
      detail:
        "This is the least reliable placeholder in the model for a Florida property. Replace it with a real quote before relying on any carrying cost or cash-flow figure.",
      severity: "material"
    });
  }

  if (input.annualRateBasisPoints === undefined) {
    out.push({
      key: "modelled_rate",
      label: "No interest rate was entered",
      detail:
        "A placeholder rate was used so the model could run. It is not a rate that is quoted, offered, or available to anyone.",
      severity: "material"
    });
  }

  return out;
}

export function buildUnverified(
  input: VisionInput,
  assumptions: ResolvedAssumptions
): UnverifiedItem[] {
  const order: Record<UnverifiedItem["severity"], number> = { blocking: 0, material: 1, note: 2 };
  const merged = [...fromGaps(input, assumptions), ...byType(input.analysisType), ...ALWAYS];
  const seen = new Set<string>();
  const deduped = merged.filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
  return deduped.sort((left, right) => order[left.severity] - order[right.severity]);
}
