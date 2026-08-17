"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type CalendarMonth,
  addCalendarMonths,
  amortizationSummary,
  disclosureFor,
  dollarsToCents,
  formatCalendarMonth,
  formatMonthSpan,
  formatUsd
} from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { NumberInput, ResultRow, usd } from "./field";

/**
 * Amortization schedule.
 *
 * The yearly roll-up is the default view because a 360-row table answers no
 * question on its own. A year expands to its months for the reader who wants to
 * see a specific payment, and the extra-principal comparison is stated against
 * the same loan with no extra, so the saving is attributable to one change.
 */

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export function AmortizationCalculator() {
  const [loanAmount, setLoanAmount] = useState(360_000);
  const [ratePercent, setRatePercent] = useState(6.5);
  const [termMonths, setTermMonths] = useState(360);
  const [extraPrincipal, setExtraPrincipal] = useState(200);
  const [expandedYears, setExpandedYears] = useState<number[]>([]);

  // Resolved after mount so the rendered markup does not depend on the clock
  // during server rendering, which would mismatch on hydration.
  const [firstPaymentMonth, setFirstPaymentMonth] = useState<CalendarMonth | null>(null);
  useEffect(() => {
    const now = new Date();
    setFirstPaymentMonth(
      addCalendarMonths({ year: now.getFullYear(), month: now.getMonth() + 1 }, 1)
    );
  }, []);

  const summary = useMemo(
    () =>
      amortizationSummary({
        principalCents: dollarsToCents(Math.max(0, loanAmount)),
        annualRateBasisPoints: Math.min(2_000, Math.max(0, Math.round(ratePercent * 100))),
        termMonths,
        extraMonthlyPrincipalCents: dollarsToCents(Math.max(0, extraPrincipal)),
        ...(firstPaymentMonth === null ? {} : { firstPaymentMonth })
      }),
    [loanAmount, ratePercent, termMonths, extraPrincipal, firstPaymentMonth]
  );

  const disclosure = disclosureFor("amortization");

  const toggleYear = (year: number) =>
    setExpandedYears((current) =>
      current.includes(year) ? current.filter((value) => value !== year) : [...current, year]
    );

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">Your loan</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            This runs entirely in your browser. Nothing you type is sent anywhere, stored, or used
            to contact you.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="am-loan"
              label="Loan amount"
              value={loanAmount}
              onChange={setLoanAmount}
              step={5_000}
              prefix="$"
            />
            <NumberInput
              id="am-rate"
              label="Interest rate"
              value={ratePercent}
              onChange={setRatePercent}
              step={0.125}
              prefix="%"
              hint="An assumption you choose. No rate is being quoted or offered."
            />
            <div>
              <label htmlFor="am-term" className="text-sm font-semibold text-[var(--text)]">
                Loan term
              </label>
              <select
                id="am-term"
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
            <NumberInput
              id="am-extra"
              label="Extra principal each month"
              value={extraPrincipal}
              onChange={setExtraPrincipal}
              step={50}
              prefix="$"
              hint="Applied on top of the scheduled payment. Confirm with your servicer how extra principal is posted."
            />
            {firstPaymentMonth !== null && (
              <>
                <div>
                  <label htmlFor="am-month" className="text-sm font-semibold text-[var(--text)]">
                    First payment month
                  </label>
                  <select
                    id="am-month"
                    value={firstPaymentMonth.month}
                    onChange={(event) =>
                      setFirstPaymentMonth({
                        year: firstPaymentMonth.year,
                        month: Number(event.target.value)
                      })
                    }
                    className="mt-1.5 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm"
                  >
                    {MONTH_OPTIONS.map((name, index) => (
                      <option key={name} value={index + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <NumberInput
                  id="am-year"
                  label="First payment year"
                  value={firstPaymentMonth.year}
                  onChange={(year) =>
                    setFirstPaymentMonth({
                      year: Number.isFinite(year) ? Math.round(year) : firstPaymentMonth.year,
                      month: firstPaymentMonth.month
                    })
                  }
                  step={1}
                  min={1900}
                />
              </>
            )}
          </div>
        </div>

        <div>
          <div
            className="rounded-2xl border border-[var(--border)] bg-purple-950 p-6 text-white"
            aria-live="polite"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
              Total interest over the loan
            </p>
            <p className="mt-2 text-5xl font-bold tabular-nums text-white">
              {formatUsd(summary.totalInterestCents)}
            </p>
            <p className="mt-2 text-sm text-purple-200">
              on a {usd(Math.max(0, loanAmount))} loan paid off in{" "}
              {formatMonthSpan(summary.monthsToPayoff)}
            </p>

            <dl className="mt-6 space-y-2.5 text-sm">
              <ResultRow
                label="Scheduled principal and interest"
                value={formatUsd(summary.scheduledPaymentCents)}
              />
              <ResultRow
                label="Extra principal"
                value={formatUsd(summary.extraMonthlyPrincipalCents)}
              />
              <ResultRow
                label="Total paid each month"
                value={formatUsd(summary.totalMonthlyOutlayCents)}
              />
              <ResultRow
                label="Total paid over the loan"
                value={formatUsd(summary.totalPaidCents)}
              />
              <ResultRow
                label="Payoff"
                value={
                  summary.payoffMonth === null
                    ? formatMonthSpan(summary.monthsToPayoff)
                    : formatCalendarMonth(summary.payoffMonth)
                }
                emphasis
              />
            </dl>

            {summary.extraMonthlyPrincipalCents > 0 && (
              <div className="mt-6 rounded-lg bg-purple-900 p-4">
                <p className="text-sm font-semibold text-purple-100">
                  What the extra principal changes
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-purple-100">Interest not paid</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatUsd(summary.interestSavedCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-purple-100">Time removed</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatMonthSpan(summary.monthsSaved)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-purple-100">Payoff without extra</dt>
                    <dd className="font-semibold tabular-nums">
                      {summary.baselinePayoffMonth === null
                        ? formatMonthSpan(summary.baselineMonthsToPayoff)
                        : formatCalendarMonth(summary.baselinePayoffMonth)}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <p className="mt-4 text-xs text-purple-300">
              Calculation version {summary.calculationVersion}
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
        <h3 className="text-lg font-semibold">Schedule by year</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Each year totals its twelve scheduled payments. Open a year to see the individual months.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">
              Amortization schedule grouped by payment year, expandable to individual months
            </caption>
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                <th scope="col" className="py-2 font-semibold">
                  Year
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Interest
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Principal
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Extra
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Balance
                </th>
              </tr>
            </thead>
            {summary.years.map((year) => {
              const open = expandedYears.includes(year.year);
              return (
                <tbody key={year.year} className="border-b border-[var(--border)]">
                  <tr>
                    <th scope="row" className="py-2.5 text-left font-normal text-[var(--text)]">
                      <button
                        type="button"
                        onClick={() => toggleYear(year.year)}
                        aria-expanded={open}
                        className="inline-flex items-center gap-2 font-semibold text-[var(--purple)]"
                      >
                        <span aria-hidden="true">{open ? "−" : "+"}</span>
                        Year {year.year}
                      </button>
                    </th>
                    <td className="py-2.5 text-right tabular-nums text-[var(--text)]">
                      {formatUsd(year.interestCents)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--text)]">
                      {formatUsd(year.principalCents)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--text)]">
                      {formatUsd(year.extraPrincipalCents)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--text)]">
                      {formatUsd(year.endingBalanceCents)}
                    </td>
                  </tr>
                  {open &&
                    year.rows.map((row) => (
                      <tr key={row.monthIndex} style={{ background: "var(--surface)" }}>
                        <th
                          scope="row"
                          className="py-2 pl-6 text-left font-normal text-[var(--text-muted)]"
                        >
                          Month {row.monthIndex}
                        </th>
                        <td className="py-2 text-right tabular-nums text-[var(--text-muted)]">
                          {formatUsd(row.interestCents, { cents: true })}
                        </td>
                        <td className="py-2 text-right tabular-nums text-[var(--text-muted)]">
                          {formatUsd(row.principalCents, { cents: true })}
                        </td>
                        <td className="py-2 text-right tabular-nums text-[var(--text-muted)]">
                          {formatUsd(row.extraPrincipalCents, { cents: true })}
                        </td>
                        <td className="py-2 text-right tabular-nums text-[var(--text-muted)]">
                          {formatUsd(row.balanceCents, { cents: true })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              );
            })}
          </table>
        </div>
      </div>
    </div>
  );
}
