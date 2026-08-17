"use client";

import { useMemo, useState } from "react";
import { disclosureFor, dollarsToCents, formatUsd, refinanceBreakEven } from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { NumberInput, ResultRow } from "./field";

/**
 * Refinance break-even.
 *
 * Break-even against the payment change is the headline, but total interest is
 * shown with equal weight — because the most common way a refinance is oversold
 * is a lower payment achieved by restarting a thirty-year amortization.
 */
export function RefinanceCalculator() {
  const [balance, setBalance] = useState(300_000);
  const [currentRate, setCurrentRate] = useState(7.5);
  const [remainingYears, setRemainingYears] = useState(28);
  const [newRate, setNewRate] = useState(6.0);
  const [newYears, setNewYears] = useState(30);
  const [costs, setCosts] = useState(6_000);
  const [financeCosts, setFinanceCosts] = useState(false);

  const result = useMemo(
    () =>
      refinanceBreakEven({
        currentBalanceCents: dollarsToCents(balance),
        currentAnnualRateBasisPoints: Math.round(currentRate * 100),
        currentRemainingTermMonths: Math.max(1, Math.round(remainingYears * 12)),
        newAnnualRateBasisPoints: Math.round(newRate * 100),
        newTermMonths: Math.max(1, Math.round(newYears * 12)),
        refinanceCostsCents: dollarsToCents(costs),
        financeCosts
      }),
    [balance, currentRate, remainingYears, newRate, newYears, costs, financeCosts]
  );

  const disclosure = disclosureFor("refinance");
  const interestIncrease = result.totalInterestNewCents - result.totalInterestCurrentCents;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold">Your current loan</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberInput
            id="ref-balance"
            label="Remaining balance"
            value={balance}
            onChange={setBalance}
            step={1000}
            prefix="$"
          />
          <NumberInput
            id="ref-rate"
            label="Current rate"
            value={currentRate}
            onChange={setCurrentRate}
            step={0.125}
            prefix="%"
          />
          <NumberInput
            id="ref-years"
            label="Years remaining"
            value={remainingYears}
            onChange={setRemainingYears}
            step={1}
            min={1}
          />
        </div>

        <h3 className="mt-8 text-lg font-semibold">The new loan</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberInput
            id="ref-newrate"
            label="New rate"
            value={newRate}
            onChange={setNewRate}
            step={0.125}
            prefix="%"
          />
          <NumberInput
            id="ref-newyears"
            label="New term in years"
            value={newYears}
            onChange={setNewYears}
            step={1}
            min={1}
          />
          <NumberInput
            id="ref-costs"
            label="Refinance costs"
            value={costs}
            onChange={setCosts}
            step={250}
            prefix="$"
            hint="Lender fees, title, recording, and prepaid items."
          />
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={financeCosts}
            onChange={(event) => setFinanceCosts(event.target.checked)}
            className="mt-1 size-4 accent-[var(--purple)]"
          />
          <span>
            Roll the costs into the new loan
            <span className="mt-1 block text-xs text-[var(--text-muted)]">
              This does not make the costs disappear. It moves them into the balance, where you pay
              interest on them for the life of the loan.
            </span>
          </span>
        </label>
      </div>

      <div>
        <div
          className="rounded-2xl border border-[var(--border)] bg-purple-950 p-6 text-white"
          aria-live="polite"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
            Break-even
          </p>
          <p className="mt-2 text-5xl font-bold tabular-nums text-white">
            {result.breakEvenMonths === null ? "Never" : `${result.breakEvenMonths} mo`}
          </p>
          <p className="mt-2 text-sm text-purple-200">
            {result.breakEvenMonths === null
              ? "The new payment is not lower, so there is nothing to recover."
              : `You reach break-even after about ${Math.round((result.breakEvenMonths / 12) * 10) / 10} years in the loan.`}
          </p>

          <dl className="mt-6 space-y-2.5 text-sm">
            <ResultRow label="Current payment" value={formatUsd(result.currentPaymentCents)} />
            <ResultRow label="New payment" value={formatUsd(result.newPaymentCents)} />
            <ResultRow
              label="Monthly change"
              value={`${result.monthlyPaymentChangeCents > 0 ? "+" : ""}${formatUsd(result.monthlyPaymentChangeCents)}`}
            />
            <ResultRow label="New loan amount" value={formatUsd(result.newLoanAmountCents)} />
            <ResultRow
              label="Total interest, current path"
              value={formatUsd(result.totalInterestCurrentCents)}
            />
            <ResultRow
              label="Total interest, new path"
              value={formatUsd(result.totalInterestNewCents)}
              emphasis
            />
          </dl>

          {interestIncrease > 0 && (
            <div className="mt-5 rounded-lg bg-purple-900 p-4">
              <p className="text-sm font-semibold text-purple-100">The tradeoff</p>
              <p className="mt-1.5 text-sm text-purple-200">
                This scenario lowers the payment but increases total interest by roughly{" "}
                {formatUsd(interestIncrease)} over the life of the loan. That can still be the right
                choice — but it should be a choice, not a surprise.
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-purple-300">
            Calculation version {result.calculationVersion}
          </p>
        </div>

        <Disclosure
          headline={disclosure.headline}
          body={disclosure.body}
          excludes={disclosure.excludes}
          version={disclosure.version}
        />
      </div>
    </div>
  );
}
