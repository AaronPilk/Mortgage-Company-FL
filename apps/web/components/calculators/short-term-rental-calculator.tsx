"use client";

import { useMemo, useState } from "react";
import {
  disclosureFor,
  dollarsToCents,
  dscrReferenceBand,
  estimateShortTermMonthlyRevenue,
  formatCoverageRatio,
  formatRate,
  formatUsd,
  investorSnapshot
} from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { NumberInput, ResultRow } from "./field";

type Strategy = "short-term" | "long-term";

/**
 * Short-term rental vs long-term rental.
 *
 * One property, two ways to rent it. In short-term mode the income line is a
 * nightly rate and an occupancy, which `estimateShortTermMonthlyRevenue` turns
 * into the monthly figure the shared cash-flow engine already understands;
 * vacancy is folded into occupancy so it is not counted twice. Everything else —
 * cash flow, coverage, cap rate — comes from the same audited engines the other
 * calculators use. Platform fees, cleaning and furnishing are their own lines
 * because leaving them out is how a short-term rental looks better on paper
 * than it is.
 */
export function ShortTermRentalCalculator() {
  const [strategy, setStrategy] = useState<Strategy>("short-term");
  const [price, setPrice] = useState(450_000);
  const [downPayment, setDownPayment] = useState(112_500);
  const [ratePercent, setRatePercent] = useState(7.25);
  const [termMonths, setTermMonths] = useState(360);

  // Short-term income
  const [nightlyRate, setNightlyRate] = useState(265);
  const [occupancyPercent, setOccupancyPercent] = useState(62);
  const [platformFeePercent, setPlatformFeePercent] = useState(3);
  const [monthlyCleaningAndSupplies, setMonthlyCleaningAndSupplies] = useState(350);
  const [furnishing, setFurnishing] = useState(18_000);

  // Long-term income
  const [monthlyRent, setMonthlyRent] = useState(3_200);
  const [vacancyPercent, setVacancyPercent] = useState(6);

  // Shared expenses
  const [managementPercent, setManagementPercent] = useState(20);
  const [maintenancePercent, setMaintenancePercent] = useState(5);
  const [capexPercent, setCapexPercent] = useState(5);
  const [annualTax, setAnnualTax] = useState(6_300);
  const [annualInsurance, setAnnualInsurance] = useState(4_800);
  const [monthlyHoa, setMonthlyHoa] = useState(0);
  const [monthlyUtilities, setMonthlyUtilities] = useState(280);
  const [closingCosts, setClosingCosts] = useState(11_000);

  const percentToBp = (value: number) => Math.min(10_000, Math.max(0, Math.round(value * 100)));
  const isShortTerm = strategy === "short-term";

  const revenue = useMemo(
    () =>
      estimateShortTermMonthlyRevenue({
        averageDailyRateCents: dollarsToCents(Math.max(0, nightlyRate)),
        occupancyRateBasisPoints: percentToBp(occupancyPercent)
      }),
    [nightlyRate, occupancyPercent]
  );

  const grossMonthlyRentCents = isShortTerm
    ? revenue.monthlyRevenueCents
    : dollarsToCents(Math.max(0, monthlyRent));

  // Platform fees and cleaning are short-term costs the long-term model has no
  // line for. Fees come off the top like vacancy would; cleaning and supplies
  // ride on the utilities line, which is the "owner-paid monthly costs" bucket.
  const platformFeeCents = isShortTerm
    ? Math.round((grossMonthlyRentCents * percentToBp(platformFeePercent)) / 10_000)
    : 0;
  const ownerMonthlyCostsCents =
    dollarsToCents(Math.max(0, monthlyUtilities)) +
    (isShortTerm ? dollarsToCents(Math.max(0, monthlyCleaningAndSupplies)) : 0);

  const snapshot = useMemo(
    () =>
      investorSnapshot({
        purchasePriceCents: dollarsToCents(Math.max(0, price)),
        downPaymentCents: dollarsToCents(Math.max(0, downPayment)),
        annualRateBasisPoints: Math.min(2_000, Math.max(0, Math.round(ratePercent * 100))),
        termMonths,
        grossMonthlyRentCents: grossMonthlyRentCents - platformFeeCents,
        vacancyRateBasisPoints: isShortTerm ? 0 : percentToBp(vacancyPercent),
        managementRateBasisPoints: percentToBp(managementPercent),
        maintenanceRateBasisPoints: percentToBp(maintenancePercent),
        capitalReserveRateBasisPoints: percentToBp(capexPercent),
        annualPropertyTaxCents: dollarsToCents(Math.max(0, annualTax)),
        annualInsuranceCents: dollarsToCents(Math.max(0, annualInsurance)),
        monthlyHoaCents: dollarsToCents(Math.max(0, monthlyHoa)),
        monthlyUtilitiesCents: ownerMonthlyCostsCents,
        closingCostsCents: dollarsToCents(Math.max(0, closingCosts)),
        rehabCents: isShortTerm ? dollarsToCents(Math.max(0, furnishing)) : 0
      }),
    [
      price,
      downPayment,
      ratePercent,
      termMonths,
      grossMonthlyRentCents,
      platformFeeCents,
      isShortTerm,
      vacancyPercent,
      managementPercent,
      maintenancePercent,
      capexPercent,
      annualTax,
      annualInsurance,
      monthlyHoa,
      ownerMonthlyCostsCents,
      closingCosts,
      furnishing
    ]
  );

  const { cashFlow, coverage } = snapshot;
  const band = dscrReferenceBand(coverage.ratioBasisPoints);
  const disclosure = disclosureFor("investment");

  const toggleClass = (active: boolean) =>
    `min-h-[44px] flex-1 rounded-lg px-4 text-sm font-semibold transition ${
      active
        ? "bg-[var(--text)] text-[var(--bg)]"
        : "border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold">The property</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          This runs entirely in your browser. Nothing you type is sent anywhere, stored, or used to
          contact you.
        </p>

        <div
          role="group"
          aria-label="Rental strategy"
          className="mt-5 flex gap-2"
          data-testid="str-strategy"
        >
          <button
            type="button"
            aria-pressed={isShortTerm}
            className={toggleClass(isShortTerm)}
            onClick={() => setStrategy("short-term")}
          >
            Short-term rental
          </button>
          <button
            type="button"
            aria-pressed={!isShortTerm}
            className={toggleClass(!isShortTerm)}
            onClick={() => setStrategy("long-term")}
          >
            Long-term rental
          </button>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberInput
            id="str-price"
            label="Purchase price"
            value={price}
            onChange={setPrice}
            step={5_000}
            prefix="$"
          />
          <NumberInput
            id="str-down"
            label="Down payment"
            value={downPayment}
            onChange={setDownPayment}
            step={5_000}
            prefix="$"
            hint="Investment property down payments are typically larger than owner-occupied ones."
          />
          <NumberInput
            id="str-rate"
            label="Interest rate"
            value={ratePercent}
            onChange={setRatePercent}
            step={0.125}
            prefix="%"
            hint="An assumption you choose. No rate is being quoted or offered."
          />
          <div>
            <label htmlFor="str-term" className="text-sm font-semibold text-[var(--text)]">
              Loan term
            </label>
            <select
              id="str-term"
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

        {isShortTerm ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-[var(--text)]">Short-term income</legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <NumberInput
                id="str-adr"
                label="Average nightly rate"
                value={nightlyRate}
                onChange={setNightlyRate}
                step={5}
                prefix="$"
                hint="What you expect to collect per booked night, before platform fees."
              />
              <NumberInput
                id="str-occupancy"
                label="Occupancy"
                value={occupancyPercent}
                onChange={setOccupancyPercent}
                step={1}
                prefix="%"
                hint="Share of nights booked across the year. This replaces the vacancy line."
              />
              <NumberInput
                id="str-platform"
                label="Platform fees"
                value={platformFeePercent}
                onChange={setPlatformFeePercent}
                step={0.5}
                prefix="%"
                hint="The host-side fee the booking platform keeps."
              />
              <NumberInput
                id="str-cleaning"
                label="Monthly cleaning and supplies"
                value={monthlyCleaningAndSupplies}
                onChange={setMonthlyCleaningAndSupplies}
                step={25}
                prefix="$"
                hint="Turnover cleaning not passed to guests, linens, consumables."
              />
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              About {formatUsd(revenue.monthlyRevenueCents)} a month from{" "}
              {revenue.bookedNightsPerYear} booked nights a year, before fees. Check that short-term
              rentals are allowed at this address: many Florida cities, counties and associations
              restrict or license them.
            </p>
          </fieldset>
        ) : (
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-[var(--text)]">Long-term income</legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <NumberInput
                id="str-rent"
                label="Gross monthly rent"
                value={monthlyRent}
                onChange={setMonthlyRent}
                step={50}
                prefix="$"
              />
              <NumberInput
                id="str-vacancy"
                label="Vacancy allowance"
                value={vacancyPercent}
                onChange={setVacancyPercent}
                step={0.5}
                prefix="%"
                hint="Of gross rent. Taken off before anything else."
              />
            </div>
          </fieldset>
        )}

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-[var(--text)]">Operating expenses</legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="str-management"
              label="Property management"
              value={managementPercent}
              onChange={setManagementPercent}
              step={0.5}
              prefix="%"
              hint={
                isShortTerm
                  ? "Of collected revenue. Short-term managers commonly charge far more than long-term ones. Enter 0 if you self-manage."
                  : "Of collected rent. Enter 0 if you self-manage."
              }
            />
            <NumberInput
              id="str-maintenance"
              label="Maintenance"
              value={maintenancePercent}
              onChange={setMaintenancePercent}
              step={0.5}
              prefix="%"
              hint="Of gross income."
            />
            <NumberInput
              id="str-capex"
              label="Capital reserve"
              value={capexPercent}
              onChange={setCapexPercent}
              step={0.5}
              prefix="%"
              hint="Of gross income, set aside for the roof, the HVAC, and the water heater."
            />
            <NumberInput
              id="str-tax"
              label="Annual property tax"
              value={annualTax}
              onChange={setAnnualTax}
              step={100}
              prefix="$"
              hint="A rental has no homestead exemption, so expect more than the seller paid."
            />
            <NumberInput
              id="str-insurance"
              label="Annual insurance"
              value={annualInsurance}
              onChange={setAnnualInsurance}
              step={100}
              prefix="$"
              hint="Landlord or short-term-rental policy plus flood, if the home needs it."
            />
            <NumberInput
              id="str-hoa"
              label="Monthly HOA dues"
              value={monthlyHoa}
              onChange={setMonthlyHoa}
              step={25}
              prefix="$"
            />
            <NumberInput
              id="str-utilities"
              label="Monthly utilities you pay"
              value={monthlyUtilities}
              onChange={setMonthlyUtilities}
              step={25}
              prefix="$"
              hint={
                isShortTerm
                  ? "Guests rarely pay utilities: power, water, internet, streaming, lawn and pool."
                  : "Water, sewer, trash, or lawn care if they are not the tenant's."
              }
            />
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-[var(--text)]">Cash invested</legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <NumberInput
              id="str-closing"
              label="Closing costs"
              value={closingCosts}
              onChange={setClosingCosts}
              step={500}
              prefix="$"
            />
            {isShortTerm && (
              <NumberInput
                id="str-furnishing"
                label="Furnishing and setup"
                value={furnishing}
                onChange={setFurnishing}
                step={500}
                prefix="$"
                hint="Furniture, kitchen, linens, smart lock, photography."
              />
            )}
          </div>
        </fieldset>
      </div>

      <div>
        <div
          className="rounded-2xl border border-[var(--border)] bg-purple-950 p-6 text-white"
          aria-live="polite"
          data-testid="str-results"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
            Monthly cash flow, {isShortTerm ? "short-term" : "long-term"}
          </p>
          <p className="mt-2 text-5xl font-bold tabular-nums text-white">
            {formatUsd(cashFlow.monthlyCashFlowCents)}
          </p>
          <p className="mt-2 text-sm text-purple-200">
            {formatUsd(cashFlow.annualCashFlowCents)} a year on{" "}
            {formatUsd(cashFlow.totalCashInvestedCents)} of cash invested
          </p>

          <dl className="mt-6 space-y-2.5 text-sm">
            <ResultRow
              label={isShortTerm ? "Revenue after platform fees" : "Effective gross income"}
              value={formatUsd(cashFlow.effectiveGrossIncomeCents)}
            />
            <ResultRow
              label="Operating expenses"
              value={`-${formatUsd(cashFlow.operatingExpensesCents)}`}
            />
            <ResultRow
              label="Net operating income"
              value={formatUsd(cashFlow.netOperatingIncomeCents)}
            />
            <ResultRow label="Debt service" value={`-${formatUsd(cashFlow.debtServiceCents)}`} />
            <ResultRow
              label="Monthly cash flow"
              value={formatUsd(cashFlow.monthlyCashFlowCents)}
              emphasis
            />
          </dl>

          <div className="mt-6 grid gap-4 rounded-lg bg-purple-900 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Cash-on-cash return
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {cashFlow.cashOnCashReturnBasisPoints === null
                  ? "—"
                  : formatRate(cashFlow.cashOnCashReturnBasisPoints)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Cap rate
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {cashFlow.capRateBasisPoints === null
                  ? "—"
                  : formatRate(cashFlow.capRateBasisPoints)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Debt-service coverage
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {formatCoverageRatio(coverage.ratioBasisPoints)}
              </p>
              {band !== null && <p className="mt-1 text-xs text-purple-200">{band.note}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Gross rent multiplier
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {snapshot.grossRentMultiplier === null ? "—" : `${snapshot.grossRentMultiplier}x`}
              </p>
              <p className="mt-1 text-xs text-purple-200">
                {snapshot.rentToPriceBasisPoints === null
                  ? "price over annual income"
                  : `income is ${formatRate(snapshot.rentToPriceBasisPoints)} of price per month`}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-purple-300">
            Coverage uses gross income over the full payment, the way the DSCR calculator does.
            Reference bands describe how the ratio is commonly discussed; they are not any lender's
            guideline. Calculation version {snapshot.calculationVersion}
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
