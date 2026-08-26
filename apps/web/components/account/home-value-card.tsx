"use client";

import { useState } from "react";
import { basisPointChange, dollarsToCents, formatUsd, homeEquity } from "@tract/mortgage-math";
import { ButtonLink } from "@/components/ui";
import type { HomeLookupAddress } from "@/lib/home-lookup-types";
import type { HomeValueDashboard, HomeValueResponse } from "@/lib/home-value-types";

/**
 * Homeowner value dashboard.
 *
 * Track a home's automated value over time and the equity it implies. The
 * valuation is an AVM — an estimate, never an appraisal or an offer — and every
 * figure says so. Equity recomputes on the device through `@tract/mortgage-math`
 * as the owner edits their balance (invariant 1); "Refresh" and the balance save
 * are the only writes, and the balance save never re-bills the valuation.
 */

const SAMPLE_NOTICE =
  "These figures are illustrative sample data, not a real valuation — invented numbers, not facts about an actual home.";

/** Show the equity-tap prompt once estimated equity is a meaningful share of value. */
const EQUITY_PROMPT_THRESHOLD_BP = 2000; // 20%

/** Surface the refi signal once the market average sits at least this far below the owner's rate. */
const REFI_SIGNAL_THRESHOLD_BP = 50; // 0.50%

function ValueSparkline({ dashboard }: { dashboard: HomeValueDashboard }) {
  const values = dashboard.history.map((point) => point.estimatedValueCents);
  if (values.length < 2) {
    return (
      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        We&apos;ll chart your value here as new estimates come in.
      </p>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 260;
  const height = 52;
  const pad = 4;
  const points = values
    .map((value, index) => {
      const x = pad + (index * (width - 2 * pad)) / (values.length - 1);
      const y = height - pad - ((value - min) / range) * (height - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const firstValue = values[0] ?? 0;
  const lastValue = values.at(-1) ?? 0;
  const label = `Estimated value trend from ${formatUsd(firstValue)} to ${formatUsd(lastValue)}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 h-14 w-full max-w-[260px]"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <polyline points={points} fill="none" stroke="var(--purple)" strokeWidth="2" />
    </svg>
  );
}

export function HomeValueCard({
  initial,
  canLookup,
  marketThirtyYearBp
}: {
  initial: HomeValueDashboard | null;
  canLookup: boolean;
  /** Today's national 30-year fixed average in basis points, for the refi signal; null when the feed is off. */
  marketThirtyYearBp: number | null;
}) {
  const [dashboard, setDashboard] = useState<HomeValueDashboard | null>(initial);
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [balanceDollars, setBalanceDollars] = useState(
    initial === null ? 0 : Math.round(initial.estimatedBalanceCents / 100)
  );
  const [currentRatePercent, setCurrentRatePercent] = useState<string>(
    initial?.currentRateBp != null ? String(initial.currentRateBp / 100) : ""
  );
  const [lookupStatus, setLookupStatus] = useState<
    "idle" | "looking" | "error" | "not_found" | "invalid"
  >("idle");
  const [balanceStatus, setBalanceStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function requestValue(address: HomeLookupAddress): Promise<void> {
    setLookupStatus("looking");
    try {
      const response = await fetch("/api/v1/account/home-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, estimatedBalance: Math.round(balanceDollars) })
      });
      const json = (await response.json()) as { ok: boolean; data?: HomeValueResponse };
      if (!response.ok || json.ok !== true || json.data === undefined) {
        setLookupStatus("error");
        return;
      }
      if (json.data.status === "not_found") {
        setLookupStatus("not_found");
        return;
      }
      setDashboard(json.data.dashboard);
      setBalanceDollars(Math.round(json.data.dashboard.estimatedBalanceCents / 100));
      setLookupStatus("idle");
      setBalanceStatus("idle");
    } catch {
      setLookupStatus("error");
    }
  }

  function submitNewHome(): void {
    if (line1.trim() === "" || city.trim() === "" || !/^\d{5}$/.test(postalCode.trim())) {
      setLookupStatus("invalid");
      return;
    }
    if (!/^[A-Za-z]{2}$/.test(state.trim())) {
      setLookupStatus("invalid");
      return;
    }
    void requestValue({
      line1: line1.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      postalCode: postalCode.trim()
    });
  }

  async function saveBalance(): Promise<void> {
    setBalanceStatus("saving");
    const parsedRate = Number(currentRatePercent);
    const body: { estimatedBalance: number; currentRatePercent?: number } = {
      estimatedBalance: Math.round(balanceDollars)
    };
    if (currentRatePercent.trim() !== "" && Number.isFinite(parsedRate) && parsedRate > 0) {
      body.currentRatePercent = parsedRate;
    }
    try {
      const response = await fetch("/api/v1/account/home-value", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = (await response.json()) as { ok: boolean; data?: HomeValueResponse };
      if (
        !response.ok ||
        json.ok !== true ||
        json.data === undefined ||
        json.data.status !== "saved"
      ) {
        setBalanceStatus("error");
        return;
      }
      setDashboard(json.data.dashboard);
      setBalanceStatus("saved");
    } catch {
      setBalanceStatus("error");
    }
  }

  // ---- The "add my home" prompt, shown until the first estimate lands. ----
  if (dashboard === null) {
    return (
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="hv-line1"
            label="Street address"
            value={line1}
            onChange={setLine1}
            placeholder="123 Bayshore Blvd"
            className="sm:col-span-2"
          />
          <TextField
            id="hv-city"
            label="City"
            value={city}
            onChange={setCity}
            placeholder="Tampa"
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="hv-state"
              label="State"
              value={state}
              onChange={setState}
              placeholder="FL"
              maxLength={2}
            />
            <TextField
              id="hv-zip"
              label="ZIP"
              value={postalCode}
              onChange={setPostalCode}
              placeholder="33606"
              maxLength={5}
            />
          </div>
          <div>
            <label htmlFor="hv-balance" className="text-sm font-semibold text-[var(--text)]">
              Mortgage balance you still owe
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 focus-within:border-[var(--purple)]">
              <span className="text-sm text-[var(--text-muted)]">$</span>
              <input
                id="hv-balance"
                type="number"
                inputMode="decimal"
                min={0}
                step={1000}
                value={balanceDollars}
                onChange={(event) => setBalanceDollars(Number(event.target.value))}
                className="min-h-[44px] w-full bg-transparent py-2 text-base outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Optional — powers your equity estimate. Leave 0 if you own it outright.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={submitNewHome}
            disabled={lookupStatus === "looking" || !canLookup}
            className="min-h-[44px] rounded-lg px-5 text-base font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--purple)" }}
          >
            {lookupStatus === "looking" ? "Checking…" : "Get my estimate"}
          </button>
          {lookupStatus === "invalid" && (
            <span className="text-sm" style={{ color: "var(--color-warning)" }}>
              Enter a street, city, 2-letter state, and 5-digit ZIP.
            </span>
          )}
          {lookupStatus === "not_found" && (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              No automated value for that address — double-check it, or{" "}
              <a href="/talk" className="underline">
                talk to a licensed officer
              </a>
              .
            </span>
          )}
          {lookupStatus === "error" && (
            <span className="text-sm" style={{ color: "var(--color-warning)" }}>
              Couldn&apos;t get an estimate right now — try again.
            </span>
          )}
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          We use an automated valuation model (AVM). It&apos;s an estimate, not an appraisal or an
          offer, and it&apos;s never a credit decision.
        </p>
      </div>
    );
  }

  // ---- The dashboard, once a value exists. ----
  const liveEquity = homeEquity(
    dashboard.current.estimatedValueCents,
    dollarsToCents(balanceDollars)
  );
  const equityPercent = (liveEquity.equityShareBasisPoints / 100).toFixed(0);
  const showEquityPrompt =
    liveEquity.equityCents > 0 && liveEquity.equityShareBasisPoints >= EQUITY_PROMPT_THRESHOLD_BP;

  // Refi signal: how far the market average sits below the rate the owner entered.
  // Positive dropBp means the market is lower — the direction worth a conversation.
  const enteredRateBp = (() => {
    const n = Number(currentRatePercent);
    return currentRatePercent.trim() !== "" && Number.isFinite(n) && n > 0
      ? Math.round(n * 100)
      : null;
  })();
  const refi =
    enteredRateBp !== null && marketThirtyYearBp !== null
      ? {
          dropBp: basisPointChange(enteredRateBp, marketThirtyYearBp),
          enteredRateBp,
          marketBp: marketThirtyYearBp
        }
      : null;
  const showRefiSignal = refi !== null && refi.dropBp >= REFI_SIGNAL_THRESHOLD_BP;

  const change = dashboard.changeSinceFirstCents;
  const displayAddress = `${dashboard.address.line1}, ${dashboard.address.city}, ${dashboard.address.state} ${dashboard.address.postalCode}`;

  return (
    <div>
      {dashboard.sampleData && (
        <p
          className="mb-4 rounded-lg border p-3 text-xs"
          style={{ borderColor: "var(--color-warning)", color: "var(--text-muted)" }}
          role="note"
        >
          {SAMPLE_NOTICE}
        </p>
      )}

      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        {displayAddress}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Estimated value
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--purple)" }}>
            {formatUsd(dashboard.current.estimatedValueCents)}
          </p>
          {dashboard.current.valueLowCents !== null &&
            dashboard.current.valueHighCents !== null && (
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Model range {formatUsd(dashboard.current.valueLowCents)} –{" "}
                {formatUsd(dashboard.current.valueHighCents)}
              </p>
            )}
          {change !== null && change !== 0 && (
            <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {change > 0 ? "▲" : "▼"} {formatUsd(Math.abs(change))} since your first estimate
            </p>
          )}
          <ValueSparkline dashboard={dashboard} />
        </div>

        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Estimated equity
          </p>
          <p className="text-3xl font-bold text-[var(--text)]">
            {formatUsd(liveEquity.equityCents)}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            About {equityPercent}% of the estimated value. Estimated value minus the balance you
            entered.
          </p>

          <label
            htmlFor="hv-balance-edit"
            className="mt-4 block text-sm font-semibold text-[var(--text)]"
          >
            Mortgage balance you still owe
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 focus-within:border-[var(--purple)]">
              <span className="text-sm text-[var(--text-muted)]">$</span>
              <input
                id="hv-balance-edit"
                type="number"
                inputMode="decimal"
                min={0}
                step={1000}
                value={balanceDollars}
                onChange={(event) => {
                  setBalanceDollars(Number(event.target.value));
                  setBalanceStatus("idle");
                }}
                className="min-h-[44px] w-full bg-transparent py-2 text-base outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => void saveBalance()}
              disabled={balanceStatus === "saving"}
              className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 text-sm font-semibold disabled:opacity-50"
            >
              {balanceStatus === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
          {balanceStatus === "saved" && (
            <span className="mt-1 block text-xs font-medium" style={{ color: "var(--purple)" }}>
              Saved.
            </span>
          )}
          {balanceStatus === "error" && (
            <span className="mt-1 block text-xs" style={{ color: "var(--color-warning)" }}>
              Couldn&apos;t save — try again.
            </span>
          )}

          <label htmlFor="hv-rate" className="mt-4 block text-sm font-semibold text-[var(--text)]">
            Your current mortgage rate (optional)
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 focus-within:border-[var(--purple)]">
            <input
              id="hv-rate"
              type="number"
              inputMode="decimal"
              min={0}
              max={20}
              step={0.125}
              value={currentRatePercent}
              placeholder="e.g. 7.25"
              onChange={(event) => {
                setCurrentRatePercent(event.target.value);
                setBalanceStatus("idle");
              }}
              className="min-h-[44px] w-full bg-transparent py-2 text-base outline-none"
            />
            <span className="text-sm text-[var(--text-muted)]">%</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Powers the refi check below. &ldquo;Save&rdquo; stores your balance and rate together.
          </p>
        </div>
      </div>

      {showRefiSignal && refi !== null && (
        <div
          className="mt-5 rounded-xl border p-4"
          style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
        >
          <p className="font-semibold text-[var(--text)]">
            The 30-year average is about {(refi.dropBp / 100).toFixed(2)}% below the rate you
            entered.
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Today&apos;s national average 30-year fixed is {(refi.marketBp / 100).toFixed(2)}%,
            against the {(refi.enteredRateBp / 100).toFixed(2)}% you entered. When the gap opens up
            like this, a refinance is often worth pricing out — a licensed officer can run your real
            numbers, including the break-even on closing costs. It&apos;s a market average, not a
            quote or an offer.
          </p>
          <div className="mt-3">
            <ButtonLink href="/talk" variant="primary">
              See if a refi makes sense
            </ButtonLink>
          </div>
        </div>
      )}

      {showEquityPrompt && (
        <div
          className="mt-5 rounded-xl border p-4"
          style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
        >
          <p className="font-semibold text-[var(--text)]">
            You&apos;re sitting on an estimated {formatUsd(liveEquity.equityCents)} in equity.
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Homeowners put equity to work with a cash-out refinance or a HELOC — to renovate,
            consolidate debt, or invest. Want to see what makes sense for you? A licensed loan
            officer can walk through the options. No pressure, and no credit pull to start the
            conversation.
          </p>
          <div className="mt-3">
            <ButtonLink href="/talk" variant="primary">
              Talk about my equity options
            </ButtonLink>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void requestValue(dashboard.address)}
          disabled={lookupStatus === "looking" || !canLookup}
          className="min-h-[44px] rounded-lg border border-[var(--border)] px-5 text-base font-semibold disabled:opacity-50"
        >
          {lookupStatus === "looking" ? "Refreshing…" : "Refresh estimate"}
        </button>
        {lookupStatus === "error" && (
          <span className="text-sm" style={{ color: "var(--color-warning)" }}>
            Couldn&apos;t refresh right now — try again.
          </span>
        )}
        {!canLookup && (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Value refresh is paused right now.
          </span>
        )}
      </div>

      <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
        Values come from an automated valuation model (AVM) and are estimates only — not an
        appraisal, an offer, or a credit decision. A licensed officer or appraiser confirms a real
        number.
      </p>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  className
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text)]">
        {label}
      </label>
      <div className="mt-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 focus-within:border-[var(--purple)]">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="min-h-[44px] w-full bg-transparent py-2 text-base outline-none"
        />
      </div>
    </div>
  );
}
