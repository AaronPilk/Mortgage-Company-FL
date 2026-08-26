"use client";

import { useState } from "react";
import { MarketRates } from "@/components/rates/market-rates";
import type { MarketRatesView, RateTerm, RateWatchView } from "@/lib/market-rates-types";

/**
 * Rate watch.
 *
 * Shows the current market average and lets a signed-in visitor track a term and
 * optionally set a target they'd like to see, with an email toggle. The target
 * is their own aspiration; nothing here quotes a rate or implies an offer. The
 * numbers shown are a published survey average, labelled as such.
 */

const TERMS: { value: RateTerm; label: string }[] = [
  { value: "thirtyYearFixed", label: "30-year fixed" },
  { value: "fifteenYearFixed", label: "15-year fixed" }
];

export function RateWatchCard({
  rates,
  initial
}: {
  rates: MarketRatesView | null;
  initial: RateWatchView | null;
}) {
  const [term, setTerm] = useState<RateTerm>(initial?.term ?? "thirtyYearFixed");
  const [target, setTarget] = useState<string>(
    initial?.targetRatePercent != null ? String(initial.targetRatePercent) : ""
  );
  const [notifyEmail, setNotifyEmail] = useState<boolean>(initial?.notifyEmail ?? true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(): Promise<void> {
    setStatus("saving");
    const parsed = Number(target);
    const body: {
      term: RateTerm;
      notifyEmail: boolean;
      targetRatePercent?: number;
    } = { term, notifyEmail };
    if (target.trim() !== "" && Number.isFinite(parsed) && parsed > 0) {
      body.targetRatePercent = parsed;
    }
    try {
      const response = await fetch("/api/v1/account/rate-watch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      setStatus(response.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      {rates !== null ? (
        <MarketRates rates={rates} />
      ) : (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Live rates are unavailable right now — you can still set your watch and we&apos;ll use it
          when the feed is back.
        </p>
      )}

      <div className="mt-5">
        <p className="text-sm font-semibold text-[var(--text)]">Which term are you watching?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TERMS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setTerm(option.value);
                setStatus("idle");
              }}
              aria-pressed={term === option.value}
              className="min-h-[44px] rounded-lg border px-4 text-sm font-semibold"
              style={{
                borderColor: term === option.value ? "var(--purple)" : "var(--border)",
                background: term === option.value ? "var(--purple)" : "var(--bg)",
                color: term === option.value ? "#fff" : "var(--text)"
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rw-target" className="text-sm font-semibold text-[var(--text)]">
            Tell me if it reaches (optional)
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 focus-within:border-[var(--purple)]">
            <input
              id="rw-target"
              type="number"
              inputMode="decimal"
              min={0}
              max={20}
              step={0.125}
              value={target}
              placeholder="e.g. 6.0"
              onChange={(event) => {
                setTarget(event.target.value);
                setStatus("idle");
              }}
              className="min-h-[44px] w-full bg-transparent py-2 text-base outline-none"
            />
            <span className="text-sm text-[var(--text-muted)]">%</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Your target — a number you&apos;d like to see, not a rate we quote.
          </p>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(event) => {
                setNotifyEmail(event.target.checked);
                setStatus("idle");
              }}
              className="h-4 w-4"
            />
            Email me when the average moves
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void save()}
          disabled={status === "saving"}
          className="min-h-[44px] rounded-lg px-5 text-base font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--purple)" }}
        >
          {status === "saving" ? "Saving…" : "Save my rate watch"}
        </button>
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
      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        We&apos;ll use the published weekly average to decide when to nudge you. This is market
        information, not a commitment to lend or a rate you&apos;re being offered.
      </p>
    </div>
  );
}
