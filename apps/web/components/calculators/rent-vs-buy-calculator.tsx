"use client";

import { useMemo, useState } from "react";
import { disclosureFor, dollarsToCents, formatUsd, rentVsBuy } from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { NumberInput, ResultRow } from "./field";

/**
 * Rent versus buy.
 *
 * There is no verdict here on purpose. Every assumption is exposed and editable,
 * and the result is stated as "under these assumptions" rather than as an
 * answer, because rent growth and appreciation are guesses and small changes to
 * them flip the outcome.
 */
export function RentVsBuyCalculator() {
  const [horizonYears, setHorizonYears] = useState(7);
  const [monthlyRent, setMonthlyRent] = useState(2_400);
  const [rentGrowth, setRentGrowth] = useState(3);
  const [price, setPrice] = useState(420_000);
  const [downPayment, setDownPayment] = useState(42_000);
  const [rate, setRate] = useState(6.5);
  const [annualTax, setAnnualTax] = useState(4_600);
  const [annualInsurance, setAnnualInsurance] = useState(4_800);
  const [monthlyHoa, setMonthlyHoa] = useState(0);
  const [maintenance, setMaintenance] = useState(1);
  const [appreciation, setAppreciation] = useState(3);
  const [sellingCost, setSellingCost] = useState(7);
  const [closingCosts, setClosingCosts] = useState(9_000);

  const result = useMemo(
    () =>
      rentVsBuy({
        horizonYears: Math.max(1, horizonYears),
        monthlyRentCents: dollarsToCents(monthlyRent),
        annualRentGrowthBasisPoints: Math.round(rentGrowth * 100),
        purchasePriceCents: dollarsToCents(price),
        downPaymentCents: dollarsToCents(downPayment),
        annualRateBasisPoints: Math.round(rate * 100),
        termMonths: 360,
        annualPropertyTaxCents: dollarsToCents(annualTax),
        annualHomeownersInsuranceCents: dollarsToCents(annualInsurance),
        monthlyHoaCents: dollarsToCents(monthlyHoa),
        annualMaintenanceRateBasisPoints: Math.round(maintenance * 100),
        annualAppreciationBasisPoints: Math.round(appreciation * 100),
        sellingCostRateBasisPoints: Math.round(sellingCost * 100),
        closingCostsCents: dollarsToCents(closingCosts)
      }),
    [
      horizonYears,
      monthlyRent,
      rentGrowth,
      price,
      downPayment,
      rate,
      annualTax,
      annualInsurance,
      monthlyHoa,
      maintenance,
      appreciation,
      sellingCost,
      closingCosts
    ]
  );

  const disclosure = disclosureFor("rent_vs_buy");
  const favoursBuying = result.buyingAdvantageCents > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-[--radius-lg] border border-line bg-white p-6 shadow-[--shadow-card]">
        <h3 className="text-lg font-semibold">Renting</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberInput
            id="rvb-rent"
            label="Monthly rent"
            value={monthlyRent}
            onChange={setMonthlyRent}
            step={50}
            prefix="$"
          />
          <NumberInput
            id="rvb-growth"
            label="Annual rent growth"
            value={rentGrowth}
            onChange={setRentGrowth}
            step={0.5}
            prefix="%"
          />
        </div>

        <h3 className="mt-8 text-lg font-semibold">Buying</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberInput
            id="rvb-price"
            label="Purchase price"
            value={price}
            onChange={setPrice}
            step={5000}
            prefix="$"
          />
          <NumberInput
            id="rvb-down"
            label="Down payment"
            value={downPayment}
            onChange={setDownPayment}
            step={2500}
            prefix="$"
          />
          <NumberInput
            id="rvb-rate"
            label="Interest rate"
            value={rate}
            onChange={setRate}
            step={0.125}
            prefix="%"
          />
          <NumberInput
            id="rvb-closing"
            label="Closing costs"
            value={closingCosts}
            onChange={setClosingCosts}
            step={500}
            prefix="$"
          />
          <NumberInput
            id="rvb-tax"
            label="Annual property tax"
            value={annualTax}
            onChange={setAnnualTax}
            step={100}
            prefix="$"
          />
          <NumberInput
            id="rvb-ins"
            label="Annual insurance"
            value={annualInsurance}
            onChange={setAnnualInsurance}
            step={100}
            prefix="$"
          />
          <NumberInput
            id="rvb-hoa"
            label="Monthly HOA"
            value={monthlyHoa}
            onChange={setMonthlyHoa}
            step={10}
            prefix="$"
          />
          <NumberInput
            id="rvb-maint"
            label="Annual maintenance"
            value={maintenance}
            onChange={setMaintenance}
            step={0.25}
            prefix="%"
            hint="Percent of purchase price per year. One percent is a common starting assumption, not a rule."
          />
        </div>

        <h3 className="mt-8 text-lg font-semibold">Your assumptions</h3>
        <p className="mt-1 text-xs text-muted">
          These two are guesses about the future. They move the result more than anything else on
          this page, so try a pessimistic set as well as an optimistic one.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberInput
            id="rvb-appr"
            label="Annual appreciation"
            value={appreciation}
            onChange={setAppreciation}
            step={0.5}
            prefix="%"
          />
          <NumberInput
            id="rvb-sell"
            label="Cost to sell"
            value={sellingCost}
            onChange={setSellingCost}
            step={0.5}
            prefix="%"
          />
          <NumberInput
            id="rvb-horizon"
            label="Years you will stay"
            value={horizonYears}
            onChange={setHorizonYears}
            step={1}
            min={1}
          />
        </div>
      </div>

      <div>
        <div
          className="rounded-[--radius-lg] border border-line bg-purple-950 p-6 text-white"
          aria-live="polite"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
            Over {Math.round(result.horizonMonths / 12)} years, under these assumptions
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-white">
            {favoursBuying ? "Buying costs less" : "Renting costs less"}
          </p>
          <p className="mt-2 text-sm text-purple-200">
            by roughly {formatUsd(Math.abs(result.buyingAdvantageCents))} in total cash, before any
            tax treatment
          </p>

          <dl className="mt-6 space-y-2.5 text-sm">
            <ResultRow label="Total rent paid" value={formatUsd(result.totalRentPaidCents)} />
            <ResultRow
              label="Total ownership outflow"
              value={formatUsd(result.totalOwnershipOutflowCents)}
            />
            <ResultRow
              label="Estimated home value"
              value={formatUsd(result.estimatedHomeValueCents)}
            />
            <ResultRow
              label="Estimated loan balance"
              value={formatUsd(result.estimatedLoanBalanceCents)}
            />
            <ResultRow
              label="Net proceeds if you sell"
              value={formatUsd(result.estimatedNetSaleProceedsCents)}
              emphasis
            />
          </dl>

          <div className="mt-5 rounded-[--radius-sm] bg-purple-900 p-4">
            <p className="text-sm text-purple-200">
              This is a cash comparison, not a recommendation. It deliberately omits tax treatment,
              which is individual and belongs with a tax professional. Change appreciation by a
              point in either direction and see how far the answer moves.
            </p>
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
