"use client";

import { useMemo, useState } from "react";
import { disclosureFor, dollarsToCents, formatUsd, monthlyHousingCost } from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { ScenarioActions } from "@/components/calculators/scenario-actions";

/**
 * Payment calculator.
 *
 * Runs entirely on the device. No value typed here is transmitted, logged, or
 * stored, which is why the component can ask about price and down payment
 * without any of the consent machinery a lead form needs.
 *
 * All arithmetic is delegated to @tract/mortgage-math so the numbers rendered
 * here are the numbers covered by the unit tests.
 */

type NumericFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  hint?: string;
};

function NumericField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  hint
}: NumericFieldProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-[var(--text)]">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            aria-label={`Precise ${label}`}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="min-h-[40px] w-28 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 text-right text-sm tabular-nums"
          />
          <output
            htmlFor={id}
            className="min-w-24 text-right text-sm font-semibold tabular-nums text-[var(--purple)]"
          >
            {format(value)}
          </output>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-[var(--purple)]"
      />
      {hint !== undefined && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

const usd = (dollars: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(dollars);

export function PaymentCalculator() {
  const [price, setPrice] = useState(425_000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(10);
  const [rateBp, setRateBp] = useState(650);
  const [termMonths, setTermMonths] = useState(360);
  const [annualTax, setAnnualTax] = useState(5_000);
  const [annualInsurance, setAnnualInsurance] = useState(4_200);
  const [monthlyHoa, setMonthlyHoa] = useState(0);
  const [miRateBp, setMiRateBp] = useState(55);

  const downPayment = Math.round((price * downPaymentPercent) / 100);
  const loanAmount = price - downPayment;
  const appliesMortgageInsurance = downPaymentPercent < 20;

  const breakdown = useMemo(
    () =>
      monthlyHousingCost({
        loanAmountCents: dollarsToCents(loanAmount),
        annualRateBasisPoints: rateBp,
        termMonths,
        annualPropertyTaxCents: dollarsToCents(annualTax),
        annualHomeownersInsuranceCents: dollarsToCents(annualInsurance),
        monthlyHoaCents: dollarsToCents(monthlyHoa),
        ...(appliesMortgageInsurance ? { mortgageInsuranceAnnualRateBasisPoints: miRateBp } : {})
      }),
    [
      loanAmount,
      rateBp,
      termMonths,
      annualTax,
      annualInsurance,
      monthlyHoa,
      miRateBp,
      appliesMortgageInsurance
    ]
  );

  const disclosure = disclosureFor("payment");

  const rows: { label: string; cents: number; note?: string }[] = [
    { label: "Principal and interest", cents: breakdown.principalAndInterestCents },
    { label: "Property taxes", cents: breakdown.propertyTaxCents },
    { label: "Homeowners insurance", cents: breakdown.homeownersInsuranceCents },
    ...(breakdown.mortgageInsuranceCents > 0
      ? [
          {
            label: "Mortgage insurance",
            cents: breakdown.mortgageInsuranceCents,
            note: "Rate you entered — not a quoted premium"
          }
        ]
      : []),
    ...(breakdown.hoaCents > 0 ? [{ label: "HOA dues", cents: breakdown.hoaCents }] : [])
  ];

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">Your inputs</h3>
          <div className="mt-6 space-y-6">
            <NumericField
              id="calc-price"
              label="Purchase price"
              value={price}
              onChange={setPrice}
              min={75_000}
              max={2_000_000}
              step={5_000}
              format={usd}
            />
            <NumericField
              id="calc-down"
              label="Down payment"
              value={downPaymentPercent}
              onChange={setDownPaymentPercent}
              min={0}
              max={50}
              step={1}
              format={(value) => `${value}% · ${usd(Math.round((price * value) / 100))}`}
            />
            <NumericField
              id="calc-rate"
              label="Interest rate"
              value={rateBp}
              onChange={setRateBp}
              min={200}
              max={1_200}
              step={5}
              format={(value) => `${(value / 100).toFixed(2)}%`}
              hint="An assumption you control. This is not a quoted rate and no rate is being offered."
            />
            <div>
              <label htmlFor="calc-term" className="text-sm font-semibold text-[var(--text)]">
                Loan term
              </label>
              <select
                id="calc-term"
                value={termMonths}
                onChange={(event) => setTermMonths(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm"
              >
                <option value={360}>30 years</option>
                <option value={240}>20 years</option>
                <option value={180}>15 years</option>
                <option value={120}>10 years</option>
              </select>
            </div>
            <NumericField
              id="calc-tax"
              label="Annual property tax"
              value={annualTax}
              onChange={setAnnualTax}
              min={0}
              max={40_000}
              step={100}
              format={usd}
              hint="Florida millage varies by county. Use the county property appraiser's figure when you have it."
            />
            <NumericField
              id="calc-insurance"
              label="Annual homeowners insurance"
              value={annualInsurance}
              onChange={setAnnualInsurance}
              min={0}
              max={30_000}
              step={100}
              format={usd}
              hint="Get a real quote early. Florida premiums vary sharply by county, roof age, and carrier."
            />
            <NumericField
              id="calc-hoa"
              label="Monthly HOA dues"
              value={monthlyHoa}
              onChange={setMonthlyHoa}
              min={0}
              max={2_000}
              step={10}
              format={usd}
            />
            {appliesMortgageInsurance && (
              <NumericField
                id="calc-mi"
                label="Mortgage insurance rate"
                value={miRateBp}
                onChange={setMiRateBp}
                min={0}
                max={200}
                step={5}
                format={(value) => `${(value / 100).toFixed(2)}% of the loan per year`}
                hint="Enter the rate your lender quotes. This calculator does not estimate one for you."
              />
            )}
          </div>
        </div>

        <div>
          <div
            className="rounded-2xl border border-[var(--border)] bg-purple-950 p-6 text-white"
            aria-live="polite"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
              Estimated monthly payment
            </p>
            <p className="mt-2 text-5xl font-bold tabular-nums text-white">
              {formatUsd(breakdown.totalMonthlyCents)}
            </p>
            <p className="mt-2 text-sm text-purple-200">
              on a {usd(loanAmount)} loan · {usd(downPayment)} down
            </p>

            <table className="mt-6 w-full text-sm">
              <caption className="sr-only">Monthly payment breakdown by component</caption>
              <tbody className="divide-y divide-purple-800">
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="py-2.5 text-left font-normal text-purple-100">
                      {row.label}
                      {row.note !== undefined && (
                        <span className="block text-xs text-purple-300">{row.note}</span>
                      )}
                    </th>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-white">
                      {formatUsd(row.cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-purple-700">
                  <th scope="row" className="pt-3 text-left font-semibold text-white">
                    Total
                  </th>
                  <td className="pt-3 text-right text-lg font-bold tabular-nums text-white">
                    {formatUsd(breakdown.totalMonthlyCents)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <p className="mt-4 text-xs text-purple-300">
              Calculation version {breakdown.calculationVersion}
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
      <ScenarioActions
        intent="purchase"
        compareTargetId="calc-price"
        snapshot={{
          source: "mortgage_payment",
          version: "payment-calculator@1.0.0",
          calculationVersion: breakdown.calculationVersion,
          inputSnapshot: {
            priceDollars: price,
            downPaymentPercent,
            rateBasisPoints: rateBp,
            termMonths,
            annualTaxDollars: annualTax,
            annualInsuranceDollars: annualInsurance,
            monthlyHoaDollars: monthlyHoa,
            mortgageInsuranceRateBasisPoints: appliesMortgageInsurance ? miRateBp : null
          },
          resultSnapshot: {
            loanAmountDollars: loanAmount,
            downPaymentDollars: downPayment,
            totalMonthlyDollars: Math.round(breakdown.totalMonthlyCents / 100)
          },
          summary: `${usd(price)} purchase · ${downPaymentPercent}% down · ${formatUsd(breakdown.totalMonthlyCents)} estimated monthly housing`
        }}
      />
    </>
  );
}
