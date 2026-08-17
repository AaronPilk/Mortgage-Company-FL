"use client";

import { useMemo, useState } from "react";
import {
  REFERENCE_BACK_END_RATIO_BP,
  REFERENCE_FRONT_END_RATIO_BP,
  debtToIncome,
  disclosureFor,
  dollarsToCents,
  formatRatioPercent,
  formatUsd
} from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { NumberInput, ResultRow } from "./field";

/**
 * Debt-to-income.
 *
 * Both ratios are shown, along with which one leaves less room, because that is
 * what tells someone whether to look at a smaller payment or at paying down a
 * card. The 28 and 43 figures are labelled as reference points throughout —
 * they are not thresholds, and this page approves nothing.
 */
export function DebtToIncomeCalculator() {
  const [primaryIncome, setPrimaryIncome] = useState(7_500);
  const [otherIncome, setOtherIncome] = useState(500);
  const [principalAndInterest, setPrincipalAndInterest] = useState(2_100);
  const [taxesAndInsurance, setTaxesAndInsurance] = useState(650);
  const [hoaDues, setHoaDues] = useState(0);
  const [autoPayments, setAutoPayments] = useState(450);
  const [studentLoans, setStudentLoans] = useState(180);
  const [cardMinimums, setCardMinimums] = useState(120);
  const [otherObligations, setOtherObligations] = useState(0);

  const result = useMemo(
    () =>
      debtToIncome({
        monthlyIncomeSourcesCents: [
          dollarsToCents(Math.max(0, primaryIncome)),
          dollarsToCents(Math.max(0, otherIncome))
        ],
        housingPaymentComponentsCents: [
          dollarsToCents(Math.max(0, principalAndInterest)),
          dollarsToCents(Math.max(0, taxesAndInsurance)),
          dollarsToCents(Math.max(0, hoaDues))
        ],
        monthlyDebtPaymentsCents: [
          dollarsToCents(Math.max(0, autoPayments)),
          dollarsToCents(Math.max(0, studentLoans)),
          dollarsToCents(Math.max(0, cardMinimums)),
          dollarsToCents(Math.max(0, otherObligations))
        ]
      }),
    [
      primaryIncome,
      otherIncome,
      principalAndInterest,
      taxesAndInsurance,
      hoaDues,
      autoPayments,
      studentLoans,
      cardMinimums,
      otherObligations
    ]
  );

  const disclosure = disclosureFor("debt_to_income");

  const bindingExplanation = {
    front_end:
      "The housing reference point leaves less room than the total-debt one. Under these inputs, a lower housing payment moves this more than paying down another obligation would.",
    back_end:
      "The total-debt reference point leaves less room than the housing one. Under these inputs, retiring a monthly obligation moves this more than trimming the housing payment would.",
    none: "Enter monthly income to see a ratio. Without income there is nothing to divide by."
  }[result.bindingRatio];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold">Your monthly figures</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          This runs entirely in your browser. Nothing you type is sent anywhere, stored, or used to
          contact you, and no credit inquiry of any kind takes place.
        </p>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-[var(--text)]">Gross monthly income</legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="dti-income-primary"
              label="Primary income"
              value={primaryIncome}
              onChange={setPrimaryIncome}
              step={100}
              prefix="$"
              hint="Before taxes and deductions."
            />
            <NumberInput
              id="dti-income-other"
              label="Other income"
              value={otherIncome}
              onChange={setOtherIncome}
              step={50}
              prefix="$"
              hint="A co-borrower, a second job, or documented recurring income."
            />
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-[var(--text)]">
            Proposed housing payment
          </legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="dti-pi"
              label="Principal and interest"
              value={principalAndInterest}
              onChange={setPrincipalAndInterest}
              step={25}
              prefix="$"
            />
            <NumberInput
              id="dti-ti"
              label="Taxes and insurance"
              value={taxesAndInsurance}
              onChange={setTaxesAndInsurance}
              step={25}
              prefix="$"
              hint="The monthly escrow portion, plus mortgage insurance if it applies."
            />
            <NumberInput
              id="dti-hoa"
              label="HOA or condo dues"
              value={hoaDues}
              onChange={setHoaDues}
              step={25}
              prefix="$"
            />
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-[var(--text)]">Other monthly debts</legend>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Recurring obligations only. Not utilities, groceries, or insurance you pay outside the
            mortgage.
          </p>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="dti-auto"
              label="Auto loans and leases"
              value={autoPayments}
              onChange={setAutoPayments}
              step={25}
              prefix="$"
            />
            <NumberInput
              id="dti-student"
              label="Student loans"
              value={studentLoans}
              onChange={setStudentLoans}
              step={25}
              prefix="$"
            />
            <NumberInput
              id="dti-cards"
              label="Credit card minimums"
              value={cardMinimums}
              onChange={setCardMinimums}
              step={10}
              prefix="$"
            />
            <NumberInput
              id="dti-other"
              label="Other obligations"
              value={otherObligations}
              onChange={setOtherObligations}
              step={25}
              prefix="$"
              hint="Personal loans, child support, alimony."
            />
          </div>
        </fieldset>
      </div>

      <div>
        <div
          className="rounded-2xl border border-[var(--border)] bg-purple-950 p-6 text-white"
          aria-live="polite"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
                Front-end
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-white">
                {formatRatioPercent(result.frontEndRatioBasisPoints)}
              </p>
              <p className="mt-1 text-xs text-purple-200">housing payment over income</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
                Back-end
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-white">
                {formatRatioPercent(result.backEndRatioBasisPoints)}
              </p>
              <p className="mt-1 text-xs text-purple-200">all obligations over income</p>
            </div>
          </div>

          <dl className="mt-6 space-y-2.5 text-sm">
            <ResultRow
              label="Gross monthly income"
              value={formatUsd(result.grossMonthlyIncomeCents)}
            />
            <ResultRow label="Housing payment" value={formatUsd(result.housingPaymentCents)} />
            <ResultRow label="Other debts" value={formatUsd(result.otherDebtPaymentsCents)} />
            <ResultRow
              label="Total monthly obligations"
              value={formatUsd(result.totalObligationsCents)}
              emphasis
            />
          </dl>

          <div className="mt-6 rounded-lg bg-purple-900 p-4">
            <p className="text-sm font-semibold text-purple-100">
              {result.bindingRatio === "back_end"
                ? "The back-end ratio is the tighter of the two"
                : result.bindingRatio === "front_end"
                  ? "The front-end ratio is the tighter of the two"
                  : "No ratio to compare yet"}
            </p>
            <p className="mt-1.5 text-sm text-purple-200">{bindingExplanation}</p>
          </div>

          <p className="mt-4 text-xs text-purple-300">
            Calculation version {result.calculationVersion}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-semibold text-[var(--text)]">
            The 28 and 43 reference points
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {formatRatioPercent(REFERENCE_FRONT_END_RATIO_BP)} of income toward housing and{" "}
            {formatRatioPercent(REFERENCE_BACK_END_RATIO_BP)} toward all obligations are figures the
            industry quotes often. They are reference points for orientation, not approval
            thresholds. Real limits vary by loan program, lender overlay, credit profile, reserves,
            and property type, and plenty of loans are made outside them.
          </p>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)]">
                Housing payment at the {formatRatioPercent(result.frontEndReferenceBasisPoints)}{" "}
                reference
              </dt>
              <dd className="font-semibold tabular-nums text-[var(--text)]">
                {formatUsd(result.frontEndReferenceHousingCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)]">
                Housing payment left at the {formatRatioPercent(result.backEndReferenceBasisPoints)}{" "}
                reference, after your other debts
              </dt>
              <dd className="font-semibold tabular-nums text-[var(--text)]">
                {formatUsd(result.backEndReferenceHousingCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-[var(--border)] pt-3">
              <dt className="text-[var(--text-muted)]">
                Room left under the tighter reference, negative if you are over it
              </dt>
              <dd className="font-semibold tabular-nums text-[var(--text)]">
                {formatUsd(
                  result.bindingRatio === "back_end"
                    ? result.backEndHeadroomCents
                    : result.frontEndHeadroomCents
                )}
              </dd>
            </div>
          </dl>
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
