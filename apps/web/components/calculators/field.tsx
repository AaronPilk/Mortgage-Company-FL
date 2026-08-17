"use client";

/** Shared numeric controls for the calculators. Labels are real labels, always above the input. */

export const usd = (dollars: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(dollars);

export function NumberInput({
  id,
  label,
  value,
  onChange,
  hint,
  min = 0,
  step = 1,
  prefix
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  min?: number;
  step?: number;
  prefix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text)]">
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 focus-within:border-[var(--purple)]">
        {prefix !== undefined && <span className="text-sm text-[var(--text-muted)]">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-h-[44px] w-full bg-transparent py-2 text-base outline-none"
        />
      </div>
      {hint !== undefined && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

export function ResultRow({
  label,
  value,
  emphasis
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${emphasis === true ? "border-t-2 border-purple-700 pt-3" : ""}`}
    >
      <dt className={emphasis === true ? "font-semibold text-white" : "text-purple-100"}>
        {label}
      </dt>
      <dd
        className={`tabular-nums ${emphasis === true ? "text-lg font-bold text-white" : "font-semibold text-white"}`}
      >
        {value}
      </dd>
    </div>
  );
}
