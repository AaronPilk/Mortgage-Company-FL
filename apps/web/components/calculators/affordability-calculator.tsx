"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_BACK_END_RATIO_BP,
  DEFAULT_FRONT_END_RATIO_BP,
  affordability,
  disclosureFor,
  dollarsToCents,
  formatUsd
} from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";

/**
 * Affordability calculator.
 *
 * The ratios are exposed and adjustable rather than hidden behind a single
 * "how much house can I afford" number, because the ratio is the entire answer.
 * Which constraint binds is shown explicitly, since that is what tells someone
 * whether to save more or pay down a card.
 */

const usd = (dollars: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(dollars);

function Field({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  hint
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        <output htmlFor={id} className="text-sm font-semibold tabular-nums text-purple-800">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-purple-700"
      />
      {hint !== undefined && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function AffordabilityCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState(9_000);
  const [monthlyDebts, setMonthlyDebts] = useState(600);
  const [downPayment, setDownPayment] = useState(45_000);
  const [rateBp, setRateBp] = useState(650);
  const [termMonths, setTermMonths] = useState(360);
  const [taxRateBp, setTaxRateBp] = useState(110);
  const [annualInsurance, setAnnualInsurance] = useState(4_200);
  const [monthlyHoa, setMonthlyHoa] = useState(0);
  const [frontBp, setFrontBp] = useState(DEFAULT_FRONT_END_RATIO_BP);
  const [backBp, setBackBp] = useState(DEFAULT_BACK_END_RATIO_BP);

  const result = useMemo(
    () =>
      affordability({
        grossMonthlyIncomeCents: dollarsToCents(monthlyIncome),
        monthlyDebtObligationsCents: dollarsToCents(monthlyDebts),
        downPaymentCents: dollarsToCents(downPayment),
        annualRateBasisPoints: rateBp,
        termMonths,
        frontEndRatioBasisPoints: frontBp,
        backEndRatioBasisPoints: backBp,
        propertyTaxAnnualRateBasisPoints: taxRateBp,
        annualHomeownersInsuranceCents: dollarsToCents(annualInsurance),
        monthlyHoaCents: dollarsToCents(monthlyHoa)
      }),
    [
      monthlyIncome,
      monthlyDebts,
      downPayment,
      rateBp,
      termMonths,
      taxRateBp,
      annualInsurance,
      monthlyHoa,
      frontBp,
      backBp
    ]
  );

  const disclosure = disclosureFor("affordability");

  const constraintExplanation = {
    front_end:
      "Your housing ratio is the limit here. Reducing other debts will not raise this number — a larger down payment or a lower-cost property will.",
    back_end:
      "Your total debt ratio is the limit here. Paying down an existing monthly obligation would raise this number, sometimes by more than an equivalent amount of extra down payment.",
    none: "With these inputs there is no housing payment capacity left after existing obligations."
  }[result.bindingConstraint];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-[--radius-lg] border border-line bg-white p-6 shadow-[--shadow-card]">
        <h3 className="text-lg font-semibold">Your inputs</h3>
        <p className="mt-1 text-xs text-muted">
          Nothing you enter here leaves your device. There is no credit inquiry of any kind.
        </p>
        <div className="mt-6 space-y-6">
          <Field
            id="aff-income"
            label="Gross monthly income"
            value={monthlyIncome}
            onChange={setMonthlyIncome}
            min={2_000}
            max={60_000}
            step={250}
            format={usd}
            hint="Before taxes. Household total if more than one borrower."
          />
          <Field
            id="aff-debts"
            label="Existing monthly obligations"
            value={monthlyDebts}
            onChange={setMonthlyDebts}
            min={0}
            max={15_000}
            step={50}
            format={usd}
            hint="Car payments, student loans, minimum card payments, child support. Not utilities or groceries."
          />
          <Field
            id="aff-down"
            label="Available down payment"
            value={downPayment}
            onChange={setDownPayment}
            min={0}
            max={500_000}
            step={2_500}
            format={usd}
          />
          <Field
            id="aff-rate"
            label="Assumed interest rate"
            value={rateBp}
            onChange={setRateBp}
            min={200}
            max={1_200}
            step={5}
            format={(value) => `${(value / 100).toFixed(2)}%`}
            hint="An assumption, not a quote. No rate is being offered."
          />
          <div>
            <label htmlFor="aff-term" className="text-sm font-semibold text-ink">
              Loan term
            </label>
            <select
              id="aff-term"
              value={termMonths}
              onChange={(event) => setTermMonths(Number(event.target.value))}
              className="mt-2 w-full rounded-[--radius-sm] border border-line bg-white px-3 py-2.5 text-sm"
            >
              <option value={360}>30 years</option>
              <option value={240}>20 years</option>
              <option value={180}>15 years</option>
            </select>
          </div>
          <Field
            id="aff-tax"
            label="Property tax rate"
            value={taxRateBp}
            onChange={setTaxRateBp}
            min={0}
            max={300}
            step={5}
            format={(value) => `${(value / 100).toFixed(2)}% of price per year`}
            hint="Florida millage varies by county. Check the county property appraiser for the real figure."
          />
          <Field
            id="aff-insurance"
            label="Annual homeowners insurance"
            value={annualInsurance}
            onChange={setAnnualInsurance}
            min={0}
            max={30_000}
            step={100}
            format={usd}
          />
          <Field
            id="aff-hoa"
            label="Monthly HOA dues"
            value={monthlyHoa}
            onChange={setMonthlyHoa}
            min={0}
            max={2_000}
            step={10}
            format={usd}
          />

          <fieldset className="rounded-[--radius-md] border border-line p-4">
            <legend className="px-2 text-sm font-semibold">Qualifying ratios</legend>
            <p className="mb-4 text-xs text-muted">
              These are illustrative defaults, not any lender&rsquo;s actual limits. Real limits
              vary by program, lender overlay, credit profile, and reserves.
            </p>
            <div className="space-y-5">
              <Field
                id="aff-front"
                label="Housing ratio ceiling"
                value={frontBp}
                onChange={setFrontBp}
                min={2_000}
                max={5_000}
                step={100}
                format={(value) => `${(value / 100).toFixed(0)}%`}
              />
              <Field
                id="aff-back"
                label="Total debt ratio ceiling"
                value={backBp}
                onChange={setBackBp}
                min={2_500}
                max={5_500}
                step={100}
                format={(value) => `${(value / 100).toFixed(0)}%`}
              />
            </div>
          </fieldset>
        </div>
      </div>

      <div>
        <div
          className="rounded-[--radius-lg] border border-line bg-purple-950 p-6 text-white"
          aria-live="polite"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
            Illustrative purchase price
          </p>
          <p className="mt-2 text-5xl font-bold tabular-nums text-white">
            {formatUsd(result.estimatedPurchasePriceCents)}
          </p>
          <p className="mt-2 text-sm text-purple-200">
            with a {formatUsd(result.housingBreakdown.totalMonthlyCents)} monthly housing payment
          </p>

          <dl className="mt-6 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-purple-100">Maximum housing payment</dt>
              <dd className="font-semibold tabular-nums">
                {formatUsd(result.maxHousingPaymentCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-purple-100">Estimated loan amount</dt>
              <dd className="font-semibold tabular-nums">
                {formatUsd(result.estimatedLoanAmountCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-purple-100">Principal and interest</dt>
              <dd className="font-semibold tabular-nums">
                {formatUsd(result.housingBreakdown.principalAndInterestCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-purple-100">Taxes and insurance</dt>
              <dd className="font-semibold tabular-nums">
                {formatUsd(
                  result.housingBreakdown.propertyTaxCents +
                    result.housingBreakdown.homeownersInsuranceCents
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-6 rounded-[--radius-sm] bg-purple-900 p-4">
            <p className="text-sm font-semibold text-purple-100">
              {result.bindingConstraint === "back_end"
                ? "Your total debt ratio is the binding constraint"
                : result.bindingConstraint === "front_end"
                  ? "Your housing ratio is the binding constraint"
                  : "No capacity under these inputs"}
            </p>
            <p className="mt-1.5 text-sm text-purple-200">{constraintExplanation}</p>
          </div>

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
