"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  dollarsToCents,
  formatUsd,
  monthlyHousingCost,
  type HousingCostBreakdown
} from "@tract/mortgage-math";

/**
 * Hero payment estimator.
 *
 * The argument this site needs to make is that a national payment calculator
 * understates a Florida payment, because it shows principal and interest and
 * stops. Rather than assert that with a statistic we would have to source and
 * keep current, this computes it from the reader's own numbers and shows the
 * share. The tool makes the argument.
 *
 * No rate is quoted. The rate is an input the reader chooses, defaulted to a
 * visible illustrative figure and labelled as their assumption — which is the
 * only honest way to show a payment without a lender, a lock, and a file.
 */

const TERM_MONTHS = 360;

/**
 * Carrying-cost assumptions, expressed as rates on price so they scale with the
 * scenario. Deliberately conservative mid-range figures a Florida buyer can
 * override — never presented as a quote or as market data for a given address.
 */
const ASSUMED_TAX_RATE_OF_PRICE = 0.0115;
const ASSUMED_HOME_INSURANCE_RATE_OF_PRICE = 0.009;
const ASSUMED_MORTGAGE_INSURANCE_RATE_BASIS_POINTS = 55;

type Segment = { key: string; label: string; cents: number; color: string };

function segmentsOf(breakdown: HousingCostBreakdown): Segment[] {
  return [
    {
      key: "pi",
      label: "Principal & interest",
      cents: breakdown.principalAndInterestCents,
      color: "var(--purple)"
    },
    {
      key: "tax",
      label: "Property tax",
      cents: breakdown.propertyTaxCents,
      color: "var(--purple-light)"
    },
    {
      key: "ins",
      label: "Insurance",
      cents: breakdown.homeownersInsuranceCents,
      color: "#f59e0b"
    },
    {
      key: "mi",
      label: "Mortgage insurance",
      cents: breakdown.mortgageInsuranceCents,
      color: "#0ea5e9"
    },
    { key: "hoa", label: "HOA", cents: breakdown.hoaCents, color: "#64748b" }
  ].filter((segment) => segment.cents > 0);
}

export function HeroEstimator() {
  const [price, setPrice] = useState(425_000);
  const [downPercent, setDownPercent] = useState(10);
  const [ratePercent, setRatePercent] = useState(6.5);
  const [monthlyHoa, setMonthlyHoa] = useState(0);

  const breakdown = useMemo(() => {
    const priceCents = dollarsToCents(price);
    const downCents = Math.round((priceCents * downPercent) / 100);
    return monthlyHousingCost({
      loanAmountCents: Math.max(priceCents - downCents, 0),
      annualRateBasisPoints: Math.round(ratePercent * 100),
      termMonths: TERM_MONTHS,
      annualPropertyTaxCents: Math.round(priceCents * ASSUMED_TAX_RATE_OF_PRICE),
      annualHomeownersInsuranceCents: Math.round(priceCents * ASSUMED_HOME_INSURANCE_RATE_OF_PRICE),
      monthlyHoaCents: dollarsToCents(monthlyHoa),
      ...(downPercent < 20
        ? {
            mortgageInsuranceAnnualRateBasisPoints: ASSUMED_MORTGAGE_INSURANCE_RATE_BASIS_POINTS
          }
        : {})
    });
  }, [price, downPercent, ratePercent, monthlyHoa]);

  const segments = segmentsOf(breakdown);
  const total = breakdown.totalMonthlyCents;
  const piShare = total > 0 ? Math.round((breakdown.principalAndInterestCents / total) * 100) : 0;
  const everythingElse = total - breakdown.principalAndInterestCents;

  return (
    <div
      className="surface-raised rounded-3xl p-6 sm:p-7"
      style={{ boxShadow: "0 24px 70px rgb(0 0 0 / 0.18)" }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold">Estimate a Florida housing payment</h2>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          No signup
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <Slider
          label="Home price"
          value={`$${price.toLocaleString("en-US")}`}
          min={100_000}
          max={1_500_000}
          step={5_000}
          current={price}
          onChange={setPrice}
        />
        <Slider
          label="Down payment"
          value={`${downPercent}%`}
          min={0}
          max={50}
          step={1}
          current={downPercent}
          onChange={setDownPercent}
        />
        <Slider
          label="Rate you want to model"
          value={`${ratePercent.toFixed(2)}%`}
          min={3}
          max={12}
          step={0.125}
          current={ratePercent}
          onChange={setRatePercent}
        />
        <Slider
          label="Monthly HOA or condo dues"
          value={monthlyHoa === 0 ? "None" : `$${monthlyHoa.toLocaleString("en-US")}`}
          min={0}
          max={1_500}
          step={25}
          current={monthlyHoa}
          onChange={setMonthlyHoa}
        />
      </div>

      <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--border)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Estimated monthly housing payment
        </p>
        <p className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-gradient">{formatUsd(total)}</span>
        </p>

        {/* The whole point of the component: what share is actually the loan. */}
        <div
          className="mt-4 flex h-3 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={`Principal and interest is ${piShare} percent of the estimated payment`}
        >
          {segments.map((segment) => (
            <div
              key={segment.key}
              style={{
                width: `${(segment.cents / total) * 100}%`,
                background: segment.color
              }}
            />
          ))}
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {segments.map((segment) => (
            <li key={segment.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: segment.color }}
                />
                {segment.label}
              </span>
              <span className="font-semibold tabular-nums">{formatUsd(segment.cents)}</span>
            </li>
          ))}
        </ul>

        <p
          className="mt-5 rounded-xl px-4 py-3 text-sm leading-relaxed"
          style={{ background: "var(--purple-subtle)", color: "var(--text)" }}
        >
          <strong>The loan itself is {piShare}% of this payment.</strong> The other{" "}
          {formatUsd(everythingElse)} a month is modeled tax, homeowners insurance, mortgage
          insurance when the down payment is below 20%, and dues. Add condo or HOA fees above and
          watch that share fall — which is why two homes at the same price can be very different to
          carry.
        </p>

        <Link
          href={`/plan?price=${price}&down=${downPercent}`}
          data-cta="hero-estimator-continue"
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "var(--purple)", boxShadow: "0 4px 14px var(--purple-glow)" }}
        >
          Build this into a full plan
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          An illustration from figures you chose — not an offer of credit, a rate quote, a
          preapproval, or a commitment to lend. Tax and insurance are modelled from the price; your
          actual numbers depend on the county, the property, and your coverage. Flood insurance,
          utilities, maintenance, lender-specific escrow adjustments, and other ownership costs are
          not included.
        </p>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (next: number) => void;
}) {
  const id = `hero-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </label>
        <span className="text-sm font-bold tabular-nums">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full"
      />
    </div>
  );
}
