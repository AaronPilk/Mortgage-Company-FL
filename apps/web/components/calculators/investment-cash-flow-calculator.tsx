"use client";

import { useMemo, useState } from "react";
import {
  disclosureFor,
  dollarsToCents,
  formatRate,
  formatUsd,
  rentalCashFlow
} from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { NumberInput, ResultRow } from "./field";

/**
 * Investment property cash flow.
 *
 * Vacancy, management, maintenance, and a capital reserve are separate inputs
 * with non-zero defaults on purpose. A model that omits them reports a cash flow
 * the property will not produce, and the reserve line is the one most often left
 * out entirely.
 */
export function InvestmentCashFlowCalculator() {
  const [price, setPrice] = useState(385_000);
  const [downPayment, setDownPayment] = useState(96_250);
  const [ratePercent, setRatePercent] = useState(7.25);
  const [termMonths, setTermMonths] = useState(360);
  const [monthlyRent, setMonthlyRent] = useState(3_100);
  const [vacancyPercent, setVacancyPercent] = useState(6);
  const [managementPercent, setManagementPercent] = useState(8);
  const [maintenancePercent, setMaintenancePercent] = useState(5);
  const [capexPercent, setCapexPercent] = useState(5);
  const [annualTax, setAnnualTax] = useState(5_400);
  const [annualInsurance, setAnnualInsurance] = useState(3_900);
  const [monthlyHoa, setMonthlyHoa] = useState(0);
  const [monthlyUtilities, setMonthlyUtilities] = useState(0);
  const [closingCosts, setClosingCosts] = useState(9_500);
  const [rehab, setRehab] = useState(6_000);

  const percentToBp = (value: number) => Math.min(10_000, Math.max(0, Math.round(value * 100)));

  const result = useMemo(
    () =>
      rentalCashFlow({
        purchasePriceCents: dollarsToCents(Math.max(0, price)),
        downPaymentCents: dollarsToCents(Math.max(0, downPayment)),
        annualRateBasisPoints: Math.min(2_000, Math.max(0, Math.round(ratePercent * 100))),
        termMonths,
        grossMonthlyRentCents: dollarsToCents(Math.max(0, monthlyRent)),
        vacancyRateBasisPoints: percentToBp(vacancyPercent),
        managementRateBasisPoints: percentToBp(managementPercent),
        maintenanceRateBasisPoints: percentToBp(maintenancePercent),
        capitalReserveRateBasisPoints: percentToBp(capexPercent),
        annualPropertyTaxCents: dollarsToCents(Math.max(0, annualTax)),
        annualInsuranceCents: dollarsToCents(Math.max(0, annualInsurance)),
        monthlyHoaCents: dollarsToCents(Math.max(0, monthlyHoa)),
        monthlyUtilitiesCents: dollarsToCents(Math.max(0, monthlyUtilities)),
        closingCostsCents: dollarsToCents(Math.max(0, closingCosts)),
        rehabCents: dollarsToCents(Math.max(0, rehab))
      }),
    [
      price,
      downPayment,
      ratePercent,
      termMonths,
      monthlyRent,
      vacancyPercent,
      managementPercent,
      maintenancePercent,
      capexPercent,
      annualTax,
      annualInsurance,
      monthlyHoa,
      monthlyUtilities,
      closingCosts,
      rehab
    ]
  );

  const disclosure = disclosureFor("investment");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold">The property</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          This runs entirely in your browser. Nothing you type is sent anywhere, stored, or used to
          contact you.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberInput
            id="ip-price"
            label="Purchase price"
            value={price}
            onChange={setPrice}
            step={5_000}
            prefix="$"
          />
          <NumberInput
            id="ip-down"
            label="Down payment"
            value={downPayment}
            onChange={setDownPayment}
            step={5_000}
            prefix="$"
            hint="Investment property down payments are typically larger than owner-occupied ones."
          />
          <NumberInput
            id="ip-rate"
            label="Interest rate"
            value={ratePercent}
            onChange={setRatePercent}
            step={0.125}
            prefix="%"
            hint="An assumption you choose. No rate is being quoted or offered."
          />
          <div>
            <label htmlFor="ip-term" className="text-sm font-semibold text-[var(--text)]">
              Loan term
            </label>
            <select
              id="ip-term"
              value={termMonths}
              onChange={(event) => setTermMonths(Number(event.target.value))}
              className="mt-1.5 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm"
            >
              <option value={360}>30 years</option>
              <option value={240}>20 years</option>
              <option value={180}>15 years</option>
            </select>
          </div>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-[var(--text)]">Income</legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="ip-rent"
              label="Gross monthly rent"
              value={monthlyRent}
              onChange={setMonthlyRent}
              step={50}
              prefix="$"
            />
            <NumberInput
              id="ip-vacancy"
              label="Vacancy allowance"
              value={vacancyPercent}
              onChange={setVacancyPercent}
              step={0.5}
              prefix="%"
              hint="Of gross rent. Taken off before anything else."
            />
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-[var(--text)]">Operating expenses</legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="ip-management"
              label="Property management"
              value={managementPercent}
              onChange={setManagementPercent}
              step={0.5}
              prefix="%"
              hint="Of collected rent. Enter 0 if you self-manage."
            />
            <NumberInput
              id="ip-maintenance"
              label="Maintenance"
              value={maintenancePercent}
              onChange={setMaintenancePercent}
              step={0.5}
              prefix="%"
              hint="Of gross rent."
            />
            <NumberInput
              id="ip-capex"
              label="Capital reserve"
              value={capexPercent}
              onChange={setCapexPercent}
              step={0.5}
              prefix="%"
              hint="Of gross rent, set aside for the roof, the HVAC, and the water heater."
            />
            <NumberInput
              id="ip-tax"
              label="Annual property tax"
              value={annualTax}
              onChange={setAnnualTax}
              step={100}
              prefix="$"
            />
            <NumberInput
              id="ip-insurance"
              label="Annual insurance"
              value={annualInsurance}
              onChange={setAnnualInsurance}
              step={100}
              prefix="$"
            />
            <NumberInput
              id="ip-hoa"
              label="Monthly HOA dues"
              value={monthlyHoa}
              onChange={setMonthlyHoa}
              step={25}
              prefix="$"
            />
            <NumberInput
              id="ip-utilities"
              label="Monthly utilities you pay"
              value={monthlyUtilities}
              onChange={setMonthlyUtilities}
              step={25}
              prefix="$"
              hint="Water, sewer, trash, or lawn care if they are not the tenant's."
            />
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-[var(--text)]">Cash invested</legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="ip-closing"
              label="Closing costs"
              value={closingCosts}
              onChange={setClosingCosts}
              step={500}
              prefix="$"
            />
            <NumberInput
              id="ip-rehab"
              label="Upfront repairs"
              value={rehab}
              onChange={setRehab}
              step={500}
              prefix="$"
            />
          </div>
        </fieldset>
      </div>

      <div>
        <div
          className="rounded-2xl border border-[var(--border)] bg-purple-950 p-6 text-white"
          aria-live="polite"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
            Monthly cash flow
          </p>
          <p className="mt-2 text-5xl font-bold tabular-nums text-white">
            {formatUsd(result.monthlyCashFlowCents)}
          </p>
          <p className="mt-2 text-sm text-purple-200">
            {formatUsd(result.annualCashFlowCents)} a year on{" "}
            {formatUsd(result.totalCashInvestedCents)} of cash invested
          </p>

          <dl className="mt-6 space-y-2.5 text-sm">
            <ResultRow
              label="Effective gross income"
              value={formatUsd(result.effectiveGrossIncomeCents)}
            />
            <ResultRow
              label="Operating expenses"
              value={`-${formatUsd(result.operatingExpensesCents)}`}
            />
            <ResultRow
              label="Net operating income"
              value={formatUsd(result.netOperatingIncomeCents)}
            />
            <ResultRow label="Debt service" value={`-${formatUsd(result.debtServiceCents)}`} />
            <ResultRow
              label="Monthly cash flow"
              value={formatUsd(result.monthlyCashFlowCents)}
              emphasis
            />
          </dl>

          <div className="mt-6 grid gap-4 rounded-lg bg-purple-900 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Cash-on-cash return
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {result.cashOnCashReturnBasisPoints === null
                  ? "—"
                  : formatRate(result.cashOnCashReturnBasisPoints)}
              </p>
              <p className="mt-1 text-xs text-purple-200">
                annual cash flow over the cash you put in
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Cap rate
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {result.capRateBasisPoints === null ? "—" : formatRate(result.capRateBasisPoints)}
              </p>
              <p className="mt-1 text-xs text-purple-200">
                net operating income over price, before financing
              </p>
            </div>
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
