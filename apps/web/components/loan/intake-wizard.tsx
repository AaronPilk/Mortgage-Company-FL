"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requiredDocuments,
  type AssetSource,
  type CreditEvent,
  type EmploymentType,
  type IncomeSource,
  type LoanPurpose,
  type Occupancy,
  type PropertyType
} from "@tract/domain";
import { Button } from "@/components/ui";

/**
 * TRACT intake — the guided pre-application.
 *
 * Plain-language questions that build the borrower's exact document checklist as
 * they go. No figures, no SSN, no account numbers are collected here: the answers
 * are structured and banded, which is all a broker needs to pre-qualify. The
 * logic decides which QUESTIONS to ask and which DOCUMENTS to prepare — never who
 * qualifies (ECOA / Reg B).
 */

type Labeled<T extends string> = { value: T; label: string; hint?: string };

const PURPOSE_OPTIONS: Labeled<LoanPurpose>[] = [
  { value: "purchase", label: "Buy a home", hint: "Purchase a new place" },
  { value: "refinance", label: "Refinance", hint: "Replace my current mortgage" },
  { value: "cash_out_refinance", label: "Cash-out refinance", hint: "Tap my equity for cash" },
  { value: "heloc", label: "Home equity line", hint: "A line of credit on my equity" },
  { value: "construction", label: "Build or renovate", hint: "Construction or major reno" }
];

const OCCUPANCY_OPTIONS: Labeled<Occupancy>[] = [
  { value: "primary", label: "Primary home", hint: "Where I'll live" },
  { value: "second_home", label: "Second home", hint: "A vacation or part-time place" },
  { value: "investment", label: "Investment", hint: "A rental or investment property" }
];

const PROPERTY_TYPE_OPTIONS: Labeled<PropertyType>[] = [
  { value: "single_family", label: "Single-family house" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_unit_2_4", label: "2–4 unit property" },
  { value: "manufactured", label: "Manufactured home" }
];

const EMPLOYMENT_OPTIONS: Labeled<EmploymentType>[] = [
  { value: "w2", label: "Employee (W-2)", hint: "I get a W-2 and pay stubs" },
  { value: "self_employed", label: "Self-employed", hint: "I own a business or freelance" },
  { value: "contractor_1099", label: "1099 contractor", hint: "I'm paid on a 1099" },
  { value: "retired", label: "Retired" },
  { value: "not_employed", label: "Not currently employed" }
];

const INCOME_OPTIONS: Labeled<IncomeSource>[] = [
  { value: "base_or_hourly", label: "Salary or hourly pay" },
  { value: "overtime", label: "Overtime" },
  { value: "bonus", label: "Bonus" },
  { value: "commission", label: "Commission" },
  { value: "self_employment", label: "Business / self-employment" },
  { value: "social_security", label: "Social Security" },
  { value: "pension", label: "Pension" },
  { value: "retirement_distribution", label: "Retirement withdrawals" },
  { value: "rental_income", label: "Rental income" },
  { value: "child_support_alimony", label: "Child support or alimony" },
  { value: "disability", label: "Disability income" }
];

const ASSET_OPTIONS: Labeled<AssetSource>[] = [
  { value: "checking_savings", label: "Checking / savings" },
  { value: "retirement_account", label: "401(k) / IRA / retirement" },
  { value: "gift_funds", label: "A gift from family" },
  { value: "sale_of_asset", label: "Money from selling something" },
  { value: "stocks_bonds", label: "Stocks or investments" }
];

const CREDIT_OPTIONS: Labeled<CreditEvent>[] = [
  { value: "bankruptcy", label: "Bankruptcy" },
  { value: "foreclosure", label: "Foreclosure" },
  { value: "collections", label: "Accounts in collections" },
  { value: "late_payments", label: "Some late payments" }
];

type Answers = {
  loanPurpose: LoanPurpose | null;
  occupancy: Occupancy;
  propertyType: PropertyType;
  employmentType: EmploymentType | null;
  incomeSources: IncomeSource[];
  assetSources: AssetSource[];
  creditEvents: CreditEvent[];
  hasCoBorrower: boolean;
  isVeteran: boolean;
  ownsOtherRealEstate: boolean;
  employmentGapLast2Years: boolean;
  recentLargeDeposits: boolean;
};

const INITIAL: Answers = {
  loanPurpose: null,
  occupancy: "primary",
  propertyType: "single_family",
  employmentType: null,
  incomeSources: [],
  assetSources: [],
  creditEvents: [],
  hasCoBorrower: false,
  isVeteran: false,
  ownsOtherRealEstate: false,
  employmentGapLast2Years: false,
  recentLargeDeposits: false
};

function OptionCard<T extends string>({
  option,
  selected,
  onSelect
}: {
  option: Labeled<T>;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="flex w-full flex-col items-start rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-0.5"
      style={{
        borderColor: selected ? "var(--purple)" : "var(--border)",
        background: selected ? "var(--purple-subtle)" : "var(--surface)"
      }}
    >
      <span className="font-semibold" style={{ color: "var(--text)" }}>
        {option.label}
      </span>
      {option.hint !== undefined && (
        <span className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
          {option.hint}
        </span>
      )}
    </button>
  );
}

function Chip<T extends string>({
  option,
  selected,
  onToggle
}: {
  option: Labeled<T>;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className="rounded-full border-2 px-4 py-2 text-sm font-medium transition-all"
      style={{
        borderColor: selected ? "var(--purple)" : "var(--border)",
        background: selected ? "var(--purple)" : "var(--surface)",
        color: selected ? "#fff" : "var(--text)"
      }}
    >
      {option.label}
    </button>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <span>
        <span className="font-semibold" style={{ color: "var(--text)" }}>
          {label}
        </span>
        {hint !== undefined && (
          <span className="mt-0.5 block text-sm" style={{ color: "var(--text-muted)" }}>
            {hint}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 shrink-0"
      />
    </label>
  );
}

const STEP_COUNT = 6;

export function IntakeWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  const previewDocs = useMemo(() => {
    if (answers.loanPurpose === null || answers.employmentType === null) return [];
    return requiredDocuments({
      loanPurpose: answers.loanPurpose,
      occupancy: answers.occupancy,
      propertyType: answers.propertyType,
      employmentType: answers.employmentType,
      incomeSources: answers.incomeSources,
      assetSources: answers.assetSources,
      creditEvents: answers.creditEvents,
      hasCoBorrower: answers.hasCoBorrower,
      isVeteran: answers.isVeteran,
      ownsOtherRealEstate: answers.ownsOtherRealEstate,
      employmentGapLast2Years: answers.employmentGapLast2Years,
      recentLargeDeposits: answers.recentLargeDeposits
    });
  }, [answers]);

  const canAdvance =
    (step === 0 && answers.loanPurpose !== null) ||
    step === 1 ||
    (step === 2 && answers.employmentType !== null) ||
    step === 3 ||
    step === 4 ||
    step === 5;

  async function submit() {
    if (answers.loanPurpose === null || answers.employmentType === null) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/v1/loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: {
            loanPurpose: answers.loanPurpose,
            occupancy: answers.occupancy,
            propertyType: answers.propertyType,
            employmentType: answers.employmentType,
            incomeSources: answers.incomeSources,
            assetSources: answers.assetSources,
            creditEvents: answers.creditEvents,
            hasCoBorrower: answers.hasCoBorrower,
            isVeteran: answers.isVeteran,
            ownsOtherRealEstate: answers.ownsOtherRealEstate,
            employmentGapLast2Years: answers.employmentGapLast2Years,
            recentLargeDeposits: answers.recentLargeDeposits
          }
        })
      });
      if (!response.ok) {
        setError("We couldn't start your application just now. Please try again.");
        setSubmitting(false);
        return;
      }
      const payload = (await response.json()) as { data?: { loanFileId?: string } };
      const id = payload.data?.loanFileId;
      if (id === undefined) {
        setError("We couldn't start your application just now. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/loan/${id}`);
    } catch {
      setError("We couldn't start your application just now. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div
          className="flex items-center justify-between text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <span>
            Step {step + 1} of {STEP_COUNT}
          </span>
          <span>
            {previewDocs.length > 0 ? `${previewDocs.length} documents on your list so far` : ""}
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full"
          style={{ background: "var(--surface-2)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / STEP_COUNT) * 100}%`, background: "var(--purple)" }}
          />
        </div>
      </div>

      {step === 0 && (
        <Step title="What brings you here?" subtitle="Pick the option that fits best.">
          <div className="grid gap-3 sm:grid-cols-2">
            {PURPOSE_OPTIONS.map((o) => (
              <OptionCard
                key={o.value}
                option={o}
                selected={answers.loanPurpose === o.value}
                onSelect={() => setAnswers((a) => ({ ...a, loanPurpose: o.value }))}
              />
            ))}
          </div>
        </Step>
      )}

      {step === 1 && (
        <Step
          title="Tell us about the property"
          subtitle="This helps us line up the right paperwork."
        >
          <FieldLabel>How will you use it?</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-3">
            {OCCUPANCY_OPTIONS.map((o) => (
              <OptionCard
                key={o.value}
                option={o}
                selected={answers.occupancy === o.value}
                onSelect={() => setAnswers((a) => ({ ...a, occupancy: o.value }))}
              />
            ))}
          </div>
          <FieldLabel className="mt-6">What kind of property is it?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPE_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                option={o}
                selected={answers.propertyType === o.value}
                onToggle={() => setAnswers((a) => ({ ...a, propertyType: o.value }))}
              />
            ))}
          </div>
        </Step>
      )}

      {step === 2 && (
        <Step
          title="How do you earn?"
          subtitle="Different income types just need different paperwork — none is better or worse."
        >
          <FieldLabel>Your main work situation</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {EMPLOYMENT_OPTIONS.map((o) => (
              <OptionCard
                key={o.value}
                option={o}
                selected={answers.employmentType === o.value}
                onSelect={() => setAnswers((a) => ({ ...a, employmentType: o.value }))}
              />
            ))}
          </div>
          <FieldLabel className="mt-6">
            Which of these income types do you have? (Pick all that apply)
          </FieldLabel>
          <div className="flex flex-wrap gap-2">
            {INCOME_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                option={o}
                selected={answers.incomeSources.includes(o.value)}
                onToggle={() =>
                  setAnswers((a) => ({ ...a, incomeSources: toggle(a.incomeSources, o.value) }))
                }
              />
            ))}
          </div>
        </Step>
      )}

      {step === 3 && (
        <Step
          title="Where will your down payment and savings come from?"
          subtitle="Pick all that apply."
        >
          <div className="flex flex-wrap gap-2">
            {ASSET_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                option={o}
                selected={answers.assetSources.includes(o.value)}
                onToggle={() =>
                  setAnswers((a) => ({ ...a, assetSources: toggle(a.assetSources, o.value) }))
                }
              />
            ))}
          </div>
          <FieldLabel className="mt-6">A few quick specifics</FieldLabel>
          <div className="space-y-3">
            <SwitchRow
              label="I'll have a co-borrower"
              hint="A spouse or partner applying with you"
              checked={answers.hasCoBorrower}
              onChange={(v) => setAnswers((a) => ({ ...a, hasCoBorrower: v }))}
            />
            <SwitchRow
              label="I'm a veteran or active military"
              hint="May unlock a VA loan — often no down payment"
              checked={answers.isVeteran}
              onChange={(v) => setAnswers((a) => ({ ...a, isVeteran: v }))}
            />
            <SwitchRow
              label="I already own other real estate"
              checked={answers.ownsOtherRealEstate}
              onChange={(v) => setAnswers((a) => ({ ...a, ownsOtherRealEstate: v }))}
            />
          </div>
        </Step>
      )}

      {step === 4 && (
        <Step
          title="Anything you'd want to explain up front?"
          subtitle="None of these disqualify you. Telling us now just means we prepare the right note and nothing stalls later."
        >
          <FieldLabel>Has any of this happened? (Pick all that apply)</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {CREDIT_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                option={o}
                selected={answers.creditEvents.includes(o.value)}
                onToggle={() =>
                  setAnswers((a) => ({ ...a, creditEvents: toggle(a.creditEvents, o.value) }))
                }
              />
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <SwitchRow
              label="I had a gap in employment in the last 2 years"
              hint="School, family, between jobs — all fine"
              checked={answers.employmentGapLast2Years}
              onChange={(v) => setAnswers((a) => ({ ...a, employmentGapLast2Years: v }))}
            />
            <SwitchRow
              label="I've had a large deposit recently that wasn't payroll"
              hint="A one-off deposit underwriting may ask about"
              checked={answers.recentLargeDeposits}
              onChange={(v) => setAnswers((a) => ({ ...a, recentLargeDeposits: v }))}
            />
          </div>
        </Step>
      )}

      {step === 5 && (
        <Step
          title="Here's your personalized checklist"
          subtitle="Based on your answers, these are the documents your loan will need. Start your file and upload them at your own pace."
        >
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {previewDocs.filter((d) => d.required).length} required ·{" "}
              {previewDocs.filter((d) => !d.required).length} if they apply to you
            </p>
            <ul className="mt-3 space-y-2">
              {previewDocs.slice(0, 8).map((d) => (
                <li
                  key={d.id}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span aria-hidden="true" style={{ color: "var(--purple)" }}>
                    •
                  </span>
                  {d.label}
                </li>
              ))}
              {previewDocs.length > 8 && (
                <li className="text-sm" style={{ color: "var(--text-muted)" }}>
                  …and {previewDocs.length - 8} more, waiting for you in your file.
                </li>
              )}
            </ul>
          </div>
          {error !== "" && (
            <p
              className="mt-4 text-sm"
              style={{ color: "var(--color-warning-text, var(--color-warning))" }}
              role="alert"
            >
              {error}
            </p>
          )}
        </Step>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={step === 0 ? "invisible" : ""}
        >
          Back
        </Button>
        {step < STEP_COUNT - 1 ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
          >
            Continue
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={submit} disabled={submitting}>
            {submitting ? "Starting…" : "Start my file"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      {subtitle !== undefined && <p className="mt-2 text-[var(--text-muted)]">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function FieldLabel({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`mb-3 text-sm font-semibold ${className}`} style={{ color: "var(--text)" }}>
      {children}
    </p>
  );
}
