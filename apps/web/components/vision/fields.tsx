"use client";

import type { ReactNode } from "react";

/**
 * Wizard inputs.
 *
 * Every field keeps its value as a string rather than a number, because an empty
 * field has to stay empty. Coercing a blank to zero would silently tell the
 * model that the rent is nothing, or that the budget is nothing, and the model
 * would answer confidently. Blank means "not supplied", and the engine treats
 * that as a gap it has to declare.
 */

const controlClass =
  "mt-1.5 w-full rounded-lg border px-3 py-2.5 text-base min-h-[44px] " +
  "focus:border-[var(--purple)] focus:outline-none";

const controlStyle: React.CSSProperties = {
  borderColor: "var(--border)",
  background: "var(--bg)",
  color: "var(--text)"
};

export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function FieldShell({
  id,
  label,
  hint,
  optional,
  children
}: {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text)]">
        {label}
        {optional === true && (
          <span className="ml-1.5 font-normal text-[var(--text-muted)]">(optional)</span>
        )}
      </label>
      {children}
      {hint !== undefined && hint !== "" && (
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  optional
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      {...(hint === undefined ? {} : { hint })}
      {...(optional === undefined ? {} : { optional })}
    >
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={controlClass}
        style={controlStyle}
      />
    </FieldShell>
  );
}

export function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = 0,
  optional
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  optional?: boolean;
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      {...(hint === undefined ? {} : { hint })}
      {...(optional === undefined ? {} : { optional })}
    >
      <div
        className="mt-1.5 flex items-center gap-2 rounded-lg border px-3 focus-within:border-[var(--purple)]"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      >
        {prefix !== undefined && <span className="text-sm text-[var(--text-muted)]">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[44px] w-full bg-transparent py-2 text-base text-[var(--text)] outline-none"
        />
        {suffix !== undefined && <span className="text-sm text-[var(--text-muted)]">{suffix}</span>}
      </div>
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  id,
  label,
  hint,
  value,
  onChange,
  options
}: {
  id: string;
  label: string;
  hint?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <FieldShell id={id} label={label} {...(hint === undefined ? {} : { hint })}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={controlClass}
        style={controlStyle}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
