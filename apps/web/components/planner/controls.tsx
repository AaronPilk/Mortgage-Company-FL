"use client";

import type { ReactNode } from "react";
import type { Option } from "./options";

/**
 * Planner form controls.
 *
 * Native radios, selects, and inputs — no custom widget pretending to be one.
 * That is what makes the whole wizard keyboard operable without a roving
 * tabindex implementation of our own, and it is what makes a screen reader
 * announce the group, the position in it, and the error without help.
 *
 * Every control takes its error text as a prop and wires `aria-invalid` and
 * `aria-describedby` itself, so a field cannot be added without its error
 * message being reachable.
 */

function describedBy(hintId: string | null, errorId: string | null): string | undefined {
  const ids = [hintId, errorId].filter((id): id is string => id !== null);
  return ids.length === 0 ? undefined : ids.join(" ");
}

export function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (message === undefined) return null;
  return (
    <p id={id} className="mt-2 text-sm font-medium text-danger">
      {message}
    </p>
  );
}

export function RadioGroup<T extends string>({
  name,
  legend,
  description,
  options,
  value,
  onChange,
  error,
  idPrefix,
  columns = 1
}: {
  name: string;
  legend: string;
  description?: string;
  options: Option<T>[];
  value: string;
  onChange: (value: T) => void;
  error?: string | undefined;
  idPrefix: string;
  columns?: 1 | 2;
}) {
  const errorId = `${idPrefix}-${name}-error`;
  const hintId = description === undefined ? null : `${idPrefix}-${name}-hint`;
  return (
    <fieldset
      aria-invalid={error !== undefined}
      aria-describedby={describedBy(hintId, error === undefined ? null : errorId)}
      aria-errormessage={error === undefined ? undefined : errorId}
    >
      <legend className="text-base font-semibold text-[var(--text)]">{legend}</legend>
      {description !== undefined && (
        <p id={hintId ?? undefined} className="mt-1 text-sm text-[var(--text-muted)]">
          {description}
        </p>
      )}
      <div className={`mt-4 grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className="flex min-h-[48px] cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors"
              style={{
                borderColor: selected ? "var(--purple)" : "var(--border)",
                background: selected ? "var(--purple-subtle)" : "var(--bg)"
              }}
            >
              <input
                // The first control carries the group's id so an error summary
                // link lands on something focusable rather than near it.
                id={index === 0 ? `${idPrefix}-${name}` : undefined}
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
              />
              <span>
                <span className="block text-sm font-semibold text-[var(--text)]">
                  {option.label}
                </span>
                {option.hint !== undefined && (
                  <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                    {option.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

export function SelectField<T extends string>({
  id,
  name,
  label,
  options,
  value,
  onChange,
  error,
  hint,
  placeholder
}: {
  id: string;
  name: string;
  label: string;
  options: Option<T>[];
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: string;
  placeholder?: string;
}) {
  const errorId = `${id}-error`;
  const hintId = hint === undefined ? null : `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text)]">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(hintId, error === undefined ? null : errorId)}
        className="mt-1.5 min-h-[48px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] focus:border-[var(--purple)]"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint !== undefined && (
        <p id={hintId ?? undefined} className="mt-1 text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function TextField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
  optional = false
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  placeholder?: string;
  maxLength?: number;
  optional?: boolean;
}) {
  const errorId = `${id}-error`;
  const hintId = hint === undefined ? null : `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text)]">
        {label}
        {optional && <span className="font-normal text-[var(--text-muted)]"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(hintId, error === undefined ? null : errorId)}
        className="mt-1.5 min-h-[48px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)] focus:border-[var(--purple)]"
      />
      {hint !== undefined && (
        <p id={hintId ?? undefined} className="mt-1 text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function CheckboxField({
  id,
  name,
  children,
  checked,
  onChange,
  error,
  tone = "muted"
}: {
  id: string;
  name: string;
  children: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | undefined;
  tone?: "default" | "muted";
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label
        htmlFor={id}
        className={`flex gap-3 text-sm ${tone === "muted" ? "text-[var(--text-muted)]" : "text-[var(--text)]"}`}
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : errorId}
          className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
        />
        <span>{children}</span>
      </label>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
