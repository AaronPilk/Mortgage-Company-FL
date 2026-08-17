"use client";

import { useMemo, useState } from "react";
import { cashToClose, disclosureFor, dollarsToCents, formatUsd } from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { NumberInput, ResultRow } from "./field";

/**
 * Cash to close.
 *
 * The gap between "down payment" and "money you actually need on closing day"
 * is the single most common surprise for first-time buyers, which is why this
 * calculator itemizes rather than returning one number.
 */
export function ClosingCostCalculator() {
  const [price, setPrice] = useState(425_000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(10);
  const [closingCosts, setClosingCosts] = useState(9_500);
  const [prepaids, setPrepaids] = useState(4_800);
  const [sellerCredits, setSellerCredits] = useState(0);
  const [lenderCredits, setLenderCredits] = useState(0);
  const [earnestMoney, setEarnestMoney] = useState(5_000);

  const downPayment = Math.round((price * downPaymentPercent) / 100);

  const result = useMemo(
    () =>
      cashToClose({
        purchasePriceCents: dollarsToCents(price),
        downPaymentCents: dollarsToCents(downPayment),
        estimatedClosingCostsCents: dollarsToCents(closingCosts),
        estimatedPrepaidsAndEscrowCents: dollarsToCents(prepaids),
        sellerCreditsCents: dollarsToCents(sellerCredits),
        lenderCreditsCents: dollarsToCents(lenderCredits),
        earnestMoneyAlreadyPaidCents: dollarsToCents(earnestMoney)
      }),
    [price, downPayment, closingCosts, prepaids, sellerCredits, lenderCredits, earnestMoney]
  );

  const disclosure = disclosureFor("closing_cost");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold">Your transaction</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberInput
            id="cc-price"
            label="Purchase price"
            value={price}
            onChange={setPrice}
            step={5000}
            prefix="$"
          />
          <NumberInput
            id="cc-down"
            label="Down payment percent"
            value={downPaymentPercent}
            onChange={setDownPaymentPercent}
            step={0.5}
            prefix="%"
            hint={`That is ${formatUsd(dollarsToCents(downPayment))}.`}
          />
          <NumberInput
            id="cc-costs"
            label="Estimated closing costs"
            value={closingCosts}
            onChange={setClosingCosts}
            step={250}
            prefix="$"
            hint="Lender, title, settlement, recording, and government fees."
          />
          <NumberInput
            id="cc-prepaids"
            label="Prepaid items and escrow"
            value={prepaids}
            onChange={setPrepaids}
            step={250}
            prefix="$"
            hint="Prepaid interest, the first insurance premium, and the initial escrow deposit."
          />
          <NumberInput
            id="cc-seller"
            label="Seller credits"
            value={sellerCredits}
            onChange={setSellerCredits}
            step={500}
            prefix="$"
          />
          <NumberInput
            id="cc-lender"
            label="Lender credits"
            value={lenderCredits}
            onChange={setLenderCredits}
            step={500}
            prefix="$"
          />
          <NumberInput
            id="cc-earnest"
            label="Earnest money already paid"
            value={earnestMoney}
            onChange={setEarnestMoney}
            step={500}
            prefix="$"
            hint="Credited back to you at closing, so it reduces what you bring."
          />
        </div>
      </div>

      <div>
        <div
          className="rounded-2xl border border-[var(--border)] bg-purple-950 p-6 text-white"
          aria-live="polite"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
            Estimated cash to close
          </p>
          <p className="mt-2 text-5xl font-bold tabular-nums text-white">
            {formatUsd(result.estimatedCashToCloseCents)}
          </p>
          <p className="mt-2 text-sm text-purple-200">
            {formatUsd(result.estimatedCashToCloseCents - result.downPaymentCents)} more than the
            down payment alone
          </p>

          <dl className="mt-6 space-y-2.5 text-sm">
            <ResultRow label="Down payment" value={formatUsd(result.downPaymentCents)} />
            <ResultRow label="Closing costs" value={formatUsd(result.closingCostsCents)} />
            <ResultRow label="Prepaid items and escrow" value={formatUsd(result.prepaidsCents)} />
            <ResultRow label="Credits" value={`-${formatUsd(result.creditsCents)}`} />
            <ResultRow
              label="Earnest money credit"
              value={`-${formatUsd(result.earnestMoneyCreditCents)}`}
            />
            <ResultRow
              label="Cash to close"
              value={formatUsd(result.estimatedCashToCloseCents)}
              emphasis
            />
          </dl>

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
