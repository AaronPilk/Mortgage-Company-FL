"use client";

import { useMemo, useState } from "react";
import {
  disclosureFor,
  dollarsToCents,
  formatRate,
  formatSignedUsd,
  formatUsd,
  rateImpact
} from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { NumberInput, ResultRow } from "./field";

/**
 * Rate impact.
 *
 * Every rate in the table is a value the reader typed for comparison. None is
 * quoted, offered, or implied to be available, which is why the base rate is
 * chosen explicitly rather than defaulting to something that looks like a
 * market rate the site is publishing.
 */
export function RateImpactCalculator() {
  const [loanAmount, setLoanAmount] = useState(400_000);
  const [termMonths, setTermMonths] = useState(360);
  const [rates, setRates] = useState<number[]>([6, 6.5, 7, 7.5]);
  const [compareCount, setCompareCount] = useState(4);
  const [baseIndex, setBaseIndex] = useState(0);

  const activeBaseIndex = Math.min(baseIndex, compareCount - 1);

  const result = useMemo(
    () =>
      rateImpact({
        principalCents: dollarsToCents(Math.max(0, loanAmount)),
        termMonths,
        annualRatesBasisPoints: rates
          .slice(0, compareCount)
          .map((rate) => Math.min(2_000, Math.max(0, Math.round(rate * 100)))),
        baseIndex: activeBaseIndex
      }),
    [loanAmount, termMonths, rates, compareCount, activeBaseIndex]
  );

  const disclosure = disclosureFor("rate_impact");

  const setRateAt = (index: number, value: number) =>
    setRates((current) => current.map((rate, position) => (position === index ? value : rate)));

  const highest = result.rows.reduce(
    (worst, row) => (row.totalInterestCents > worst.totalInterestCents ? row : worst),
    result.rows[0] ?? { totalInterestCents: 0, totalInterestDeltaCents: 0 }
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">The same loan at different rates</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            This runs entirely in your browser. Nothing you type is sent anywhere, stored, or used
            to contact you. The rates below are values you choose for comparison — none of them is
            quoted, offered, or available here.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="ri-loan"
              label="Loan amount"
              value={loanAmount}
              onChange={setLoanAmount}
              step={5_000}
              prefix="$"
            />
            <div>
              <label htmlFor="ri-term" className="text-sm font-semibold text-[var(--text)]">
                Loan term
              </label>
              <select
                id="ri-term"
                value={termMonths}
                onChange={(event) => setTermMonths(Number(event.target.value))}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm"
              >
                <option value={360}>30 years</option>
                <option value={240}>20 years</option>
                <option value={180}>15 years</option>
                <option value={120}>10 years</option>
              </select>
            </div>
            <div>
              <label htmlFor="ri-count" className="text-sm font-semibold text-[var(--text)]">
                Rates to compare
              </label>
              <select
                id="ri-count"
                value={compareCount}
                onChange={(event) => setCompareCount(Number(event.target.value))}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-[var(--text)]">
              Comparison rates and the base
            </legend>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Every difference in the table is measured against the base rate you select.
            </p>
            <div className="mt-3 space-y-4">
              {rates.slice(0, compareCount).map((rate, index) => (
                <div key={index} className="flex items-end gap-4">
                  <div className="flex-1">
                    <NumberInput
                      id={`ri-rate-${index}`}
                      label={`Rate ${index + 1}`}
                      value={rate}
                      onChange={(value) => setRateAt(index, value)}
                      step={0.125}
                      prefix="%"
                    />
                  </div>
                  <label className="mb-3 flex items-center gap-2 text-sm text-[var(--text)]">
                    <input
                      type="radio"
                      name="ri-base"
                      checked={activeBaseIndex === index}
                      onChange={() => setBaseIndex(index)}
                      className="h-4 w-4 accent-[var(--purple)]"
                    />
                    Base
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <div
            className="rounded-2xl border border-[var(--border)] bg-purple-950 p-6 text-white"
            aria-live="polite"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
              Spread across the rates compared
            </p>
            <p className="mt-2 text-5xl font-bold tabular-nums text-white">
              {formatUsd(highest.totalInterestDeltaCents)}
            </p>
            <p className="mt-2 text-sm text-purple-200">
              more total interest at the highest rate shown than at your base rate of{" "}
              {formatRate(result.baseAnnualRateBasisPoints)}
            </p>

            <dl className="mt-6 space-y-2.5 text-sm">
              <ResultRow label="Loan amount" value={formatUsd(result.principalCents)} />
              <ResultRow
                label={`Payment at ${formatRate(result.baseAnnualRateBasisPoints)}`}
                value={formatUsd(result.rows[result.baseIndex]?.monthlyPaymentCents ?? 0)}
              />
              <ResultRow
                label={`Total interest at ${formatRate(result.baseAnnualRateBasisPoints)}`}
                value={formatUsd(result.rows[result.baseIndex]?.totalInterestCents ?? 0)}
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

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold">Side by side</h3>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">
              Monthly payment and total interest at each comparison rate, with the difference
              against the base rate
            </caption>
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                <th scope="col" className="py-2 font-semibold">
                  Rate
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Monthly payment
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  vs base
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Total interest
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  vs base
                </th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-[var(--border)]"
                  style={row.isBase ? { background: "var(--purple-subtle)" } : undefined}
                >
                  <th scope="row" className="py-2.5 text-left font-semibold text-[var(--text)]">
                    {formatRate(row.annualRateBasisPoints)}
                    {row.isBase && (
                      <span className="ml-2 text-xs font-normal text-[var(--purple)]">base</span>
                    )}
                  </th>
                  <td className="py-2.5 text-right tabular-nums text-[var(--text)]">
                    {formatUsd(row.monthlyPaymentCents)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[var(--text-muted)]">
                    {formatSignedUsd(row.monthlyPaymentDeltaCents, (value) => formatUsd(value))}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[var(--text)]">
                    {formatUsd(row.totalInterestCents)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[var(--text-muted)]">
                    {formatSignedUsd(row.totalInterestDeltaCents, (value) => formatUsd(value))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Total interest assumes every scheduled payment is made and the loan is held to term. No
          rate shown here is quoted, offered, or available — each one is a figure you entered so the
          arithmetic can be compared.
        </p>
      </div>
    </div>
  );
}
