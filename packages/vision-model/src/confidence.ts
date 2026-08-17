/**
 * Confidence.
 *
 * The score answers one question only: how much of this result rests on numbers
 * the person actually supplied, versus placeholders we invented so the model
 * could run? It is not a probability, it is not calibrated against outcomes, and
 * it deliberately cannot reach "high" — no input to this package is traceable to
 * a dated market source, so a high-confidence label would be a lie regardless of
 * how carefully the user filled the form in.
 */

import type { ResolvedAssumptions } from "./assumptions";
import { improvementSpendBasis } from "./improvement";
import { hardCostBasis } from "./construction";
import { incomeBasis } from "./rental";
import { nonNegativeCents, positiveCount } from "./cases";
import type { Confidence, ConfidenceDriver, UnverifiedItem, VisionInput } from "./types";

export const CONFIDENCE_CEILING_REASON =
  "No figure in this model is drawn from comparable sales, a construction cost database, or rent data. Confidence is capped at moderate for that reason alone, and no set of inputs can raise it further.";

/** Comparative bands only. The thresholds are a presentation choice, not a statistic. */
const MODERATE_AT = 62;
const LOW_AT = 36;
const CEILING_SCORE = 85;

export function assessConfidence(
  input: VisionInput,
  assumptions: ResolvedAssumptions,
  unverified: readonly UnverifiedItem[]
): Confidence {
  const drivers: ConfidenceDriver[] = [];
  let score = 38;

  const add = (points: number, label: string, detail: string): void => {
    score += points;
    drivers.push({ label, direction: points >= 0 ? "raises" : "lowers", detail });
  };

  const type = input.analysisType;
  const isImprovement =
    type === "existing_home_renovation" || type === "addition" || type === "interior_upgrade";
  const isFlip = type === "fix_and_flip";
  const isConstruction = type === "land_new_construction";
  const isRental =
    type === "long_term_rental" || type === "short_term_rental" || type === "buy_and_hold";

  if (nonNegativeCents(input.purchasePriceCents) > 0) {
    add(
      8,
      "A price or value was entered",
      "Every figure that scales with the property has a real anchor."
    );
  } else {
    add(
      -25,
      "No price or value was entered",
      "Nothing in the result can mean anything without one."
    );
  }

  if (isImprovement || isFlip) {
    const spend = improvementSpendBasis(input, assumptions);
    if (spend.suppliedByUser) {
      add(
        14,
        "You entered your own budget",
        "Cost figures follow your number rather than a placeholder rate."
      );
    } else {
      add(
        -12,
        "The budget came from a placeholder",
        "A cost per square foot we invented is driving every cost figure. Replace it with a bid."
      );
    }
  }

  if (isConstruction) {
    const hard = hardCostBasis(input, assumptions);
    if (hard.suppliedByUser) {
      add(14, "You entered your own construction budget", "Hard cost follows your number.");
    } else {
      add(
        -12,
        "The construction budget came from a placeholder",
        "Replace it with a builder's number."
      );
    }
  }

  if (isRental) {
    const income = incomeBasis(input, assumptions);
    if (income.suppliedByUser) {
      add(
        16,
        "You entered the income figure",
        "Cash flow, coverage, and yield all follow a rent you chose."
      );
    } else {
      add(
        -18,
        "The income figure is a placeholder",
        "Rent is the single largest driver of every rental figure, and this one was invented."
      );
    }
  }

  if (input.expectedAfterValueCents !== undefined) {
    add(
      10,
      "You supplied the after value",
      "The value figure is yours, not a share-of-spend model."
    );
  } else if (isImprovement || isFlip || isConstruction) {
    add(
      -12,
      "The after value is modelled from spend",
      "It assumes a fixed share of what you spend shows up in value. No appraiser or comparable sale supports it."
    );
  }

  if (positiveCount(input.squareFeet) !== null || positiveCount(input.buildSquareFeet) !== null) {
    add(
      5,
      "Square footage was entered",
      "Per-square-foot figures have something real to divide by."
    );
  }

  if (input.annualPropertyTaxCents !== undefined) {
    add(
      5,
      "Property tax was entered",
      "Carrying costs use your figure rather than a millage placeholder."
    );
  }
  if (input.annualInsuranceCents !== undefined) {
    add(6, "Insurance was entered", "The least reliable Florida placeholder has been replaced.");
  }
  if (input.annualRateBasisPoints !== undefined) {
    add(
      6,
      "An interest rate was entered",
      "Debt service reflects a rate you chose. It is still not a quote."
    );
  }
  if (positiveCount(input.holdMonths) !== null) {
    add(
      4,
      "A hold period was entered",
      "Carrying costs run over your timeline rather than a default."
    );
  }

  const blocking = unverified.filter((item) => item.severity === "blocking").length;
  if (blocking > 0) {
    add(
      -Math.min(18, blocking * 3),
      `${blocking} unverified item${blocking === 1 ? "" : "s"} could change the answer entirely`,
      "Each one is something no arithmetic can settle. They are listed in full below."
    );
  }

  const bounded = Math.max(0, Math.min(CEILING_SCORE, Math.round(score)));
  const level = bounded >= MODERATE_AT ? "moderate" : bounded >= LOW_AT ? "low" : "very_low";

  return {
    level,
    score: bounded,
    ceiling: "moderate",
    ceilingReason: CONFIDENCE_CEILING_REASON,
    drivers
  };
}

export function confidenceLabel(level: Confidence["level"]): string {
  switch (level) {
    case "moderate":
      return "Moderate";
    case "low":
      return "Low";
    case "very_low":
      return "Very low";
  }
}
