"use client";

import { useMemo, useState } from "react";
import { affordability, centsToDollars, dollarsToCents } from "@tract/mortgage-math";
import { ButtonLink } from "@/components/ui";
import { NumberInput, usd } from "@/components/calculators/field";
import type { CreditBand } from "@/lib/affordability";

/**
 * Affordability profile.
 *
 * The one canonical set of estimate inputs the visitor keeps. It computes a
 * comfortable price range on the device and offers to filter the search to it.
 * Saving persists the inputs to the account (PUT); the credit band is stored as
 * context for a licensed officer, not used to price a rate here. Nothing on this
 * card is a decision — the range is an estimate under standard 28/43 guidelines.
 */

/** A single illustrative planning rate — not a quote, and not varied by credit here. */
const ILLUSTRATIVE_RATE_BP = 675;

const CREDIT_BANDS: { value: CreditBand; label: string }[] = [
  { value: "excellent", label: "Excellent (740+)" },
  { value: "good", label: "Good (680–739)" },
  { value: "fair", label: "Fair (620–679)" },
  { value: "building", label: "Building (under 620)" }
];

export type AffordabilityInitial = {
  annualIncome: number;
  downPayment: number;
  monthlyDebts: number;
  creditBand: CreditBand;
};

export function AffordabilityCard({ initial }: { initial: AffordabilityInitial | null }) {
  const [annualIncome, setAnnualIncome] = useState(initial?.annualIncome ?? 95_000);
  const [downPayment, setDownPayment] = useState(initial?.downPayment ?? 40_000);
  const [monthlyDebts, setMonthlyDebts] = useState(initial?.monthlyDebts ?? 500);
  const [creditBand, setCreditBand] = useState<CreditBand>(initial?.creditBand ?? "good");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const affordablePrice = useMemo(() => {
    const result = affordability({
      grossMonthlyIncomeCents: dollarsToCents(Math.round(annualIncome / 12)),
      monthlyDebtObligationsCents: dollarsToCents(monthlyDebts),
      downPaymentCents: dollarsToCents(downPayment),
      annualRateBasisPoints: ILLUSTRATIVE_RATE_BP,
      termMonths: 360
    });
    return Math.round(centsToDollars(result.estimatedPurchasePriceCents));
  }, [annualIncome, monthlyDebts, downPayment]);

  async function save(): Promise<void> {
    setStatus("saving");
    try {
      const response = await fetch("/api/v1/account/affordability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annualIncome, downPayment, monthlyDebts, creditBand })
      });
      setStatus(response.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberInput
          id="aff-income"
          label="Annual income"
          value={annualIncome}
          onChange={(v) => {
            setAnnualIncome(v);
            setStatus("idle");
          }}
          prefix="$"
          step={1000}
        />
        <NumberInput
          id="aff-down"
          label="Down payment saved"
          value={downPayment}
          onChange={(v) => {
            setDownPayment(v);
            setStatus("idle");
          }}
          prefix="$"
          step={1000}
        />
        <NumberInput
          id="aff-debts"
          label="Monthly debts"
          value={monthlyDebts}
          onChange={(v) => {
            setMonthlyDebts(v);
            setStatus("idle");
          }}
          prefix="$"
          hint="Cards, car, student loans"
        />
        <div>
          <label htmlFor="aff-credit" className="text-sm font-semibold text-[var(--text)]">
            Credit (your estimate)
          </label>
          <select
            id="aff-credit"
            value={creditBand}
            onChange={(event) => {
              setCreditBand(event.target.value as CreditBand);
              setStatus("idle");
            }}
            className="mt-1.5 min-h-[44px] w-full rounded-lg border px-3 text-base outline-none focus:border-[var(--purple)]"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          >
            {CREDIT_BANDS.map((band) => (
              <option key={band.value} value={band.value}>
                {band.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="mt-5 rounded-xl border p-4"
        style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          A comfortable range to look in
        </p>
        <p className="text-3xl font-bold" style={{ color: "var(--purple)" }}>
          up to {usd(affordablePrice)}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Standard 28/43 guidelines at an illustrative {(ILLUSTRATIVE_RATE_BP / 100).toFixed(2)}%.
          An estimate, not a pre-approval — a licensed officer prices your real rate.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void save()}
          disabled={status === "saving"}
          className="min-h-[44px] rounded-lg px-5 text-base font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--purple)" }}
        >
          {status === "saving" ? "Saving…" : "Save my profile"}
        </button>
        <ButtonLink
          href={`/properties?maxPrice=${affordablePrice}`}
          variant="secondary"
          className="!min-h-[44px]"
        >
          See homes in my range
        </ButtonLink>
        {status === "saved" && (
          <span className="text-sm font-medium" style={{ color: "var(--purple)" }}>
            Saved.
          </span>
        )}
        {status === "error" && (
          <span className="text-sm" style={{ color: "var(--color-warning)" }}>
            Couldn&apos;t save — try again.
          </span>
        )}
      </div>
    </div>
  );
}
