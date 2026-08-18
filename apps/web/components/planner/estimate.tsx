"use client";

import { useMemo } from "react";
import {
  annualRateOfCents,
  debtToIncome,
  disclosureFor,
  dollarsToCents,
  formatRatioPercent,
  formatUsd,
  monthlyHousingCost,
  monthlyPrincipalAndInterest
} from "@tract/mortgage-math";
import { Badge, Disclosure } from "@/components/ui";
import {
  INCOME_BAND_MIDPOINT_DOLLARS,
  MONTHLY_DEBT_BAND_MIDPOINT_DOLLARS,
  MORTGAGE_RATE_BAND_MIDPOINT_BP,
  type IncomeBandValue,
  type MonthlyDebtBandValue,
  type MortgageRateBandValue
} from "./options";

/**
 * The live illustration.
 *
 * This is the part of the planner that exists for the visitor rather than for
 * us: it appears from the second question onward, long before anyone is asked
 * for a name. Nothing here is gated behind the contact step.
 *
 * Every figure is computed by @tract/mortgage-math from integer cents and
 * integer basis points. No arithmetic on money happens in this component, and
 * nothing here is a rate quote, an approval, or a statement that any lender will
 * do this. The words on screen say so plainly, and they say it near the number
 * rather than in a footnote.
 */

export type EstimateInput = {
  priceDollars: number;
  downPaymentDollars: number;
  annualRateBasisPoints: number;
  termMonths: number;
  propertyTaxRateBasisPoints: number;
  annualInsuranceDollars: number;
  monthlyHoaDollars: number;
  incomeBand: IncomeBandValue | "";
  monthlyDebtBand: MonthlyDebtBandValue | "";
  /** Refinance only: the existing balance and the band its rate falls in. */
  currentBalanceDollars: number;
  currentRateBand: MortgageRateBandValue | "";
  isRefinance: boolean;
};

/**
 * Mortgage insurance is assumed only above 80% loan-to-value, at a
 * mid-of-market annual rate. It is an assumption, shown as one, and a real
 * figure comes from the lender.
 */
const ASSUMED_MI_ANNUAL_RATE_BP = 55;

function Row({
  label,
  value,
  emphasis = false
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${emphasis ? "border-t pt-3" : ""}`}
      style={emphasis ? { borderColor: "var(--border)" } : undefined}
    >
      <dt className={emphasis ? "font-semibold text-[var(--text)]" : "text-[var(--text-muted)]"}>
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          emphasis ? "text-xl font-bold text-[var(--text)]" : "font-semibold text-[var(--text)]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * A number typed into a browser input can be empty, negative, or absurd. The
 * money primitives reject all three by design, so the value is made sane here
 * rather than the assertions being relaxed there.
 */
function clamp(value: number, maximum: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(Math.round(value), maximum);
}

export function EstimatePanel({ input }: { input: EstimateInput }) {
  const estimate = useMemo(() => {
    const priceDollars = clamp(input.priceDollars, 50_000_000);
    const financedDollars = input.isRefinance
      ? clamp(input.currentBalanceDollars, 50_000_000)
      : Math.max(priceDollars - clamp(input.downPaymentDollars, 50_000_000), 0);
    const loanAmountCents = dollarsToCents(financedDollars);
    const valueCents = dollarsToCents(priceDollars);

    const loanToValueBasisPoints =
      valueCents === 0 ? 0 : Math.round((loanAmountCents * 10_000) / valueCents);
    const mortgageInsuranceApplies = loanToValueBasisPoints > 8_000;

    const housing = monthlyHousingCost({
      loanAmountCents,
      annualRateBasisPoints: clamp(input.annualRateBasisPoints, 2_500),
      termMonths: input.termMonths,
      annualPropertyTaxCents: annualRateOfCents(
        valueCents,
        clamp(input.propertyTaxRateBasisPoints, 1_000)
      ),
      annualHomeownersInsuranceCents: dollarsToCents(
        clamp(input.annualInsuranceDollars, 1_000_000)
      ),
      monthlyHoaCents: dollarsToCents(clamp(input.monthlyHoaDollars, 100_000)),
      ...(mortgageInsuranceApplies
        ? { mortgageInsuranceAnnualRateBasisPoints: ASSUMED_MI_ANNUAL_RATE_BP }
        : {})
    });

    const currentRateBp =
      input.currentRateBand === "" ? null : MORTGAGE_RATE_BAND_MIDPOINT_BP[input.currentRateBand];
    const currentPaymentCents =
      input.isRefinance && currentRateBp !== null && loanAmountCents > 0
        ? monthlyPrincipalAndInterest({
            principalCents: loanAmountCents,
            annualRateBasisPoints: currentRateBp,
            termMonths: input.termMonths
          })
        : null;

    const incomeDollars =
      input.incomeBand === "" ? null : INCOME_BAND_MIDPOINT_DOLLARS[input.incomeBand];
    const debtDollars =
      input.monthlyDebtBand === ""
        ? null
        : MONTHLY_DEBT_BAND_MIDPOINT_DOLLARS[input.monthlyDebtBand];

    const ratios =
      incomeDollars === null
        ? null
        : debtToIncome({
            monthlyIncomeSourcesCents: [dollarsToCents(incomeDollars)],
            housingPaymentComponentsCents: [housing.totalMonthlyCents],
            monthlyDebtPaymentsCents: [dollarsToCents(debtDollars ?? 0)]
          });

    return {
      housing,
      mortgageInsuranceApplies,
      loanAmountCents,
      currentPaymentCents,
      ratios,
      incomeIsKnown: incomeDollars !== null
    };
  }, [input]);

  const disclosure = disclosureFor(estimate.ratios === null ? "payment" : "affordability");
  const { housing } = estimate;

  return (
    <div className="surface rounded-2xl p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-[var(--text)]">Your working estimate</h2>
        <Badge tone="neutral">Illustration</Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        It updates as you answer. It is arithmetic on the numbers on this page — not a quote, not an
        approval, and not a statement that any lender will do this.
      </p>

      <dl className="mt-6 space-y-3 text-sm">
        <Row label="Principal and interest" value={formatUsd(housing.principalAndInterestCents)} />
        <Row label="Property tax" value={formatUsd(housing.propertyTaxCents)} />
        <Row label="Homeowner's insurance" value={formatUsd(housing.homeownersInsuranceCents)} />
        {housing.hoaCents > 0 && (
          <Row label="Association dues" value={formatUsd(housing.hoaCents)} />
        )}
        {estimate.mortgageInsuranceApplies && (
          <Row
            label="Mortgage insurance (assumed)"
            value={formatUsd(housing.mortgageInsuranceCents)}
          />
        )}
        <Row
          label="Estimated monthly total"
          value={formatUsd(housing.totalMonthlyCents)}
          emphasis
        />
      </dl>

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Financed amount {formatUsd(estimate.loanAmountCents)}. Calculation version{" "}
        {housing.calculationVersion}.
      </p>

      {estimate.currentPaymentCents !== null && (
        <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold text-[var(--text)]">Against your current payment</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Using the middle of the rate range you selected, principal and interest on your current
            balance is about {formatUsd(estimate.currentPaymentCents)} a month. The comparison above
            is {formatUsd(housing.principalAndInterestCents)} on the same balance. A shorter or
            longer term changes both the payment and the total interest, so the two move together.
          </p>
        </div>
      )}

      {estimate.ratios !== null && (
        <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold text-[var(--text)]">Where this sits on the ratios</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row
              label="Housing share of the middle of your income range"
              value={formatRatioPercent(estimate.ratios.frontEndRatioBasisPoints)}
            />
            <Row
              label="With your other monthly obligations"
              value={formatRatioPercent(estimate.ratios.backEndRatioBasisPoints)}
            />
          </dl>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            The 28% and 43% figures these are usually compared against are common reference points,
            not thresholds any lender must apply, and nothing here evaluates your credit or approves
            you for anything.
          </p>
        </div>
      )}

      <Disclosure
        headline={disclosure.headline}
        body={disclosure.body}
        excludes={disclosure.excludes}
        version={disclosure.version}
      />
    </div>
  );
}
