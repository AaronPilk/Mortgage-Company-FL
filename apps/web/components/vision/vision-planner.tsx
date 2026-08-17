"use client";

import { useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY, safeLandingPath } from "@tract/analytics";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { resetTurnstile } from "@/lib/turnstile-browser";
import type { LeadAttributionTouch } from "@tract/schemas";
import type { ListingSummary } from "@tract/integrations";
import { dollarsToCents, formatRate, formatUsd, visionPlanningPreview } from "@tract/mortgage-math";

type PlannerValues = {
  purchasePrice: number;
  downPayment: number;
  annualRatePercent: number;
  termYears: number;
  annualPropertyTax: number;
  annualInsurance: number;
  monthlyHoa: number;
  acquisitionCosts: number;
  improvementBudget: number;
  contingencyPercent: number;
  expectedAfterImprovementValue: number;
  costRangePercent: number;
  valueRangePercent: number;
};

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; fields: Record<string, string[]> }
  | { kind: "success"; receiptId: string };

function dollars(cents: number): number {
  return Math.round(cents / 100);
}

export function VisionPlanner({
  listing,
  disclosureText,
  disclosureVersion,
  smsConsentText,
  emailConsentText,
  turnstileSiteKey
}: {
  listing: ListingSummary;
  disclosureText: string;
  disclosureVersion: string;
  smsConsentText: string;
  emailConsentText: string;
  turnstileSiteKey?: string | undefined;
}) {
  const seed = listing.demoPlanningSeed;
  if (seed === undefined) throw new Error("Vision demo requires an explicit planning seed");
  const purchasePrice = dollars(listing.listPriceCents ?? 0);
  const [goal, setGoal] = useState(seed.goal);
  const [values, setValues] = useState<PlannerValues>({
    purchasePrice,
    downPayment: Math.round(purchasePrice * 0.2),
    annualRatePercent: 6.5,
    termYears: 30,
    annualPropertyTax: dollars(seed.annualPropertyTaxCents),
    annualInsurance: dollars(seed.annualInsuranceCents),
    monthlyHoa: dollars(seed.monthlyHoaCents),
    acquisitionCosts: Math.round(purchasePrice * 0.03),
    improvementBudget: dollars(seed.improvementBudgetCents),
    contingencyPercent: 10,
    expectedAfterImprovementValue: dollars(seed.expectedAfterImprovementValueCents),
    costRangePercent: 15,
    valueRangePercent: 5
  });
  const [formState, setFormState] = useState<FormState>({ kind: "idle" });
  const submissionRef = useRef<{
    id: string;
    fingerprint: string;
    firstTouch: LeadAttributionTouch;
    lastTouch: LeadAttributionTouch;
    conversionTouch: LeadAttributionTouch;
  } | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const idFor = (name: string) => `${baseId}-${name}`;

  const assumptions = useMemo(
    () => ({
      purchasePriceCents: dollarsToCents(values.purchasePrice),
      downPaymentCents: dollarsToCents(values.downPayment),
      annualRateBasisPoints: Math.round(values.annualRatePercent * 100),
      termMonths: Math.round(values.termYears * 12),
      annualPropertyTaxCents: dollarsToCents(values.annualPropertyTax),
      annualInsuranceCents: dollarsToCents(values.annualInsurance),
      monthlyHoaCents: dollarsToCents(values.monthlyHoa),
      acquisitionCostsCents: dollarsToCents(values.acquisitionCosts),
      improvementBudgetCents: dollarsToCents(values.improvementBudget),
      contingencyRateBasisPoints: Math.round(values.contingencyPercent * 100),
      expectedAfterImprovementValueCents: dollarsToCents(values.expectedAfterImprovementValue),
      costRangeBasisPoints: Math.round(values.costRangePercent * 100),
      valueRangeBasisPoints: Math.round(values.valueRangePercent * 100)
    }),
    [values]
  );

  const calculation = useMemo(() => {
    try {
      return { result: visionPlanningPreview(assumptions), error: null };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Check the assumptions and try again."
      };
    }
  }, [assumptions]);

  function update(name: keyof PlannerValues, value: string) {
    const parsed = Number(value);
    setValues((current) => ({ ...current, [name]: Number.isFinite(parsed) ? parsed : 0 }));
  }

  async function submitReportRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formState.kind === "submitting" || calculation.result === null) return;
    setFormState({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    const preferredContact = form.get("preferredContact")
      ? String(form.get("preferredContact"))
      : undefined;
    const timeline = form.get("timeline") ? String(form.get("timeline")) : undefined;
    const consent = {
      privacyAccepted: form.get("privacyAccepted") === "on",
      contactRequested: true as const,
      smsMarketing: form.get("smsMarketing") === "on",
      emailMarketing: form.get("emailMarketing") === "on",
      disclosureVersion
    };
    const core = {
      listingKey: listing.listingKey,
      goal,
      assumptions,
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      preferredContact,
      timeline,
      consent
    };
    const fingerprint = JSON.stringify(core);
    if (submissionRef.current === null || submissionRef.current.fingerprint !== fingerprint) {
      const fallbackPath = safeLandingPath(window.location.pathname);
      submissionRef.current = {
        id: window.crypto.randomUUID(),
        fingerprint,
        firstTouch: attributionTouch(readStoredTouch(FIRST_TOUCH_STORAGE_KEY), fallbackPath),
        lastTouch: attributionTouch(readStoredTouch(LAST_TOUCH_STORAGE_KEY), fallbackPath),
        conversionTouch: currentAttributionTouch(window.location.pathname)
      };
    }
    const submission = submissionRef.current;

    const payload = {
      submissionId: submission.id,
      listingKey: listing.listingKey,
      propertyTitle: `${listing.address.city ?? "Florida"} planning demo`,
      propertyAddress: {
        line1: listing.address.line1 ?? "Example property",
        city: listing.address.city ?? "Florida",
        state: listing.address.state ?? "FL",
        postalCode: listing.address.postalCode ?? "00000"
      },
      goal,
      assumptions,
      firstName: core.firstName,
      lastName: core.lastName,
      email: core.email,
      phone: core.phone,
      preferredContact,
      timeline,
      consent,
      firstTouch: submission.firstTouch,
      lastTouch: submission.lastTouch,
      conversionTouch: submission.conversionTouch,
      turnstileToken: String(form.get("cf-turnstile-response") ?? "no-challenge-configured"),
      honeypot: String(form.get("company") ?? "")
    };

    try {
      const response = await fetch("/api/v1/vision/report-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as
        | { ok: true; data: { receiptId: string } }
        | { ok: false; error: { message: string; fields?: Record<string, string[]> } };
      if (result.ok) {
        setFormState({ kind: "success", receiptId: result.data.receiptId });
        return;
      }
      setFormState({
        kind: "error",
        message: result.error.message,
        fields: result.error.fields ?? {}
      });
      resetTurnstile();
      queueMicrotask(() => errorRef.current?.focus());
    } catch {
      setFormState({
        kind: "error",
        message: "We could not reach the server, so the report request was not confirmed as saved.",
        fields: {}
      });
      resetTurnstile();
      queueMicrotask(() => errorRef.current?.focus());
    }
  }

  const inputClass =
    "mt-1.5 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base focus:border-[var(--purple)]";
  const fieldError = (field: string) =>
    formState.kind === "error" ? formState.fields[field]?.[0] : undefined;

  return (
    <div data-testid="vision-planner">
      <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            {listing.primaryImage !== undefined && (
              <div className="relative aspect-[8/5] bg-[var(--surface-2)]">
                <Image
                  src={listing.primaryImage.url}
                  alt={`Generated illustration for the ${listing.address.city} planning example`}
                  fill
                  sizes="(max-width: 1280px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--purple)]">
                Synthetic planning source
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {listing.address.line1}, {listing.address.city}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{listing.attributionText}</p>
              <Link
                href={`/properties/${listing.listingKey}`}
                className="mt-4 inline-block text-sm font-semibold text-[var(--purple)] underline underline-offset-4"
              >
                Review property demo details
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold">1. Confirm the plan</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              These fields are assumptions, not facts. Change them before relying on the preview.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Planning goal
                <select
                  data-testid="vision-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value as typeof goal)}
                  className={inputClass}
                >
                  <option value="renovate">Renovate</option>
                  <option value="expand">Expand</option>
                  <option value="build">Build</option>
                  <option value="flip">Flip scenario</option>
                  <option value="long_term_rental">Long-term rental</option>
                  <option value="explore">Explore</option>
                </select>
              </label>
              <MoneyField
                label="Purchase price assumption"
                value={values.purchasePrice}
                onChange={(value) => update("purchasePrice", value)}
                inputClass={inputClass}
              />
              <MoneyField
                label="Down payment"
                value={values.downPayment}
                onChange={(value) => update("downPayment", value)}
                inputClass={inputClass}
              />
              <NumberField
                label="Illustrative annual rate (%)"
                value={values.annualRatePercent}
                step="0.125"
                onChange={(value) => update("annualRatePercent", value)}
                inputClass={inputClass}
                help="Editable planning input—not a current rate or quote."
              />
              <NumberField
                label="Loan term (years)"
                value={values.termYears}
                step="1"
                onChange={(value) => update("termYears", value)}
                inputClass={inputClass}
              />
              <MoneyField
                label="Annual property tax"
                value={values.annualPropertyTax}
                onChange={(value) => update("annualPropertyTax", value)}
                inputClass={inputClass}
              />
              <MoneyField
                label="Annual insurance"
                value={values.annualInsurance}
                onChange={(value) => update("annualInsurance", value)}
                inputClass={inputClass}
              />
              <MoneyField
                label="Monthly HOA"
                value={values.monthlyHoa}
                onChange={(value) => update("monthlyHoa", value)}
                inputClass={inputClass}
              />
              <MoneyField
                label="Acquisition costs"
                value={values.acquisitionCosts}
                onChange={(value) => update("acquisitionCosts", value)}
                inputClass={inputClass}
              />
              <MoneyField
                label="Base improvement budget"
                value={values.improvementBudget}
                onChange={(value) => update("improvementBudget", value)}
                inputClass={inputClass}
                testId="vision-improvement-budget"
              />
              <NumberField
                label="Contingency (%)"
                value={values.contingencyPercent}
                step="1"
                onChange={(value) => update("contingencyPercent", value)}
                inputClass={inputClass}
              />
              <MoneyField
                label="Post-improvement value assumption"
                value={values.expectedAfterImprovementValue}
                onChange={(value) => update("expectedAfterImprovementValue", value)}
                inputClass={inputClass}
              />
              <NumberField
                label="Cost range (+/− %)"
                value={values.costRangePercent}
                step="1"
                onChange={(value) => update("costRangePercent", value)}
                inputClass={inputClass}
              />
              <NumberField
                label="Value range (+/− %)"
                value={values.valueRangePercent}
                step="1"
                onChange={(value) => update("valueRangePercent", value)}
                inputClass={inputClass}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-[var(--purple)]" dataTestId="vision-preview">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--purple)]">2. Report preview</p>
                <h2 className="mt-1 text-3xl font-bold">Your editable planning range</h2>
              </div>
              {calculation.result !== null && (
                <span className="rounded-full bg-[var(--purple-subtle)] px-3 py-1 text-xs font-semibold text-[var(--purple)]">
                  {calculation.result.calculationVersion}
                </span>
              )}
            </div>

            {calculation.error !== null && (
              <div role="alert" className="mt-6 rounded-xl border border-danger/40 bg-danger/5 p-4">
                <p className="font-semibold text-danger">Check the assumptions</p>
                <p className="mt-1 text-sm text-danger">{calculation.error}</p>
              </div>
            )}

            {calculation.result !== null && (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <ResultCard
                    label="Illustrative monthly housing cost"
                    value={formatUsd(calculation.result.monthlyHousing.totalMonthlyCents)}
                    detail="Principal, interest, entered taxes, insurance, and HOA"
                  />
                  <ResultCard
                    label="Planning loan amount"
                    value={formatUsd(calculation.result.loanAmountCents)}
                    detail="Purchase price less entered down payment"
                  />
                </div>

                <div className="mt-8 overflow-x-auto">
                  <table className="w-full min-w-[620px] border-separate border-spacing-0 text-left text-sm">
                    <caption className="mb-3 text-left text-lg font-bold">
                      Cost and value cases
                    </caption>
                    <thead>
                      <tr className="text-[var(--text-muted)]">
                        <th className="border-b border-[var(--border)] px-3 py-3">Case</th>
                        <th className="border-b border-[var(--border)] px-3 py-3">
                          Improvement cost
                        </th>
                        <th className="border-b border-[var(--border)] px-3 py-3">
                          Post-improvement value
                        </th>
                        <th className="border-b border-[var(--border)] px-3 py-3">Cash required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculation.result.cases.map((scenario) => (
                        <tr key={scenario.key}>
                          <th className="border-b border-[var(--border)] px-3 py-4 capitalize">
                            {scenario.key}
                          </th>
                          <td className="border-b border-[var(--border)] px-3 py-4">
                            {formatUsd(scenario.improvementCostCents)}
                          </td>
                          <td className="border-b border-[var(--border)] px-3 py-4">
                            {formatUsd(scenario.postImprovementValueCents)}
                          </td>
                          <td className="border-b border-[var(--border)] px-3 py-4">
                            {formatUsd(scenario.cashRequiredCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold">Payment sensitivity</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <ResultCard
                      label={formatRate(
                        calculation.result.monthlyPaymentSensitivity.lowerRateBasisPoints
                      )}
                      value={formatUsd(
                        calculation.result.monthlyPaymentSensitivity.lowerTotalMonthlyCents
                      )}
                      detail="1 point below the input"
                    />
                    <ResultCard
                      label={formatRate(
                        calculation.result.monthlyPaymentSensitivity.planningRateBasisPoints
                      )}
                      value={formatUsd(
                        calculation.result.monthlyPaymentSensitivity.planningTotalMonthlyCents
                      )}
                      detail="Entered planning rate"
                    />
                    <ResultCard
                      label={formatRate(
                        calculation.result.monthlyPaymentSensitivity.higherRateBasisPoints
                      )}
                      value={formatUsd(
                        calculation.result.monthlyPaymentSensitivity.higherTotalMonthlyCents
                      )}
                      detail="1 point above the input"
                    />
                  </div>
                </div>

                <div className="mt-8 rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--text-muted)]">
                  <p className="font-semibold text-[var(--text)]">What cash required includes</p>
                  <p className="mt-1">
                    Entered down payment, acquisition costs, and the case-specific improvement
                    budget with contingency. It excludes reserves, prepaids, moving costs, utility
                    work, unknown site conditions, and financing costs not entered here.
                  </p>
                </div>
              </>
            )}
          </Card>

          <Card>
            <p className="text-sm font-semibold text-[var(--purple)]">3. Optional follow-up</p>
            {formState.kind === "success" ? (
              <div role="status" className="mt-3" data-testid="vision-request-success">
                <h2 className="text-2xl font-bold">The request is saved</h2>
                <p className="mt-3 text-[var(--text-muted)]">
                  TRACT retained the assumptions and calculation snapshot for staff review. This did
                  not submit a credit application or trigger a credit inquiry.
                </p>
                <p className="mt-4 text-sm text-[var(--text-muted)]">
                  Reference <span className="font-mono">{formState.receiptId.slice(0, 8)}</span>
                </p>
              </div>
            ) : (
              <form onSubmit={submitReportRequest} noValidate className="mt-3">
                <h2 className="text-2xl font-bold">Ask TRACT to review this scenario</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Your preview is already visible above. Share contact details only if you want this
                  exact snapshot retained for a human follow-up. This is not a loan application.
                </p>

                {formState.kind === "error" && (
                  <div
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    data-testid="vision-request-error"
                    className="mt-5 rounded-xl border border-danger/40 bg-danger/5 p-4"
                  >
                    <p className="font-semibold text-danger">{formState.message}</p>
                  </div>
                )}

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {(
                    [
                      ["firstName", "First name", "given-name", "text"],
                      ["lastName", "Last name", "family-name", "text"],
                      ["email", "Email", "email", "email"],
                      ["phone", "Phone", "tel", "tel"]
                    ] as const
                  ).map(([name, label, autoComplete, type]) => (
                    <label key={name} htmlFor={idFor(name)} className="text-sm font-semibold">
                      {label}
                      <input
                        id={idFor(name)}
                        name={name}
                        type={type}
                        autoComplete={autoComplete}
                        required
                        aria-invalid={fieldError(name) !== undefined}
                        className={inputClass}
                      />
                      {fieldError(name) !== undefined && (
                        <span className="mt-1 block font-normal text-danger">
                          {fieldError(name)}
                        </span>
                      )}
                    </label>
                  ))}
                  <label className="text-sm font-semibold">
                    Timeline{" "}
                    <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                    <select name="timeline" className={inputClass}>
                      <option value="">Not sure yet</option>
                      <option value="now">Ready now</option>
                      <option value="0_3_months">Within 3 months</option>
                      <option value="3_6_months">3 to 6 months</option>
                      <option value="6_plus">More than 6 months</option>
                      <option value="researching">Just researching</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Best way to reach you{" "}
                    <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                    <select name="preferredContact" className={inputClass}>
                      <option value="">No preference</option>
                      <option value="phone">Phone</option>
                      <option value="sms">Text</option>
                      <option value="email">Email</option>
                    </select>
                  </label>
                </div>

                <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor={idFor("company")}>Company</label>
                  <input id={idFor("company")} name="company" tabIndex={-1} autoComplete="off" />
                </div>

                <fieldset className="mt-7 space-y-3 border-t border-[var(--border)] pt-6">
                  <legend className="sr-only">Consent</legend>
                  <label className="flex gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="privacyAccepted"
                      required
                      className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
                    />
                    <span>
                      {disclosureText}{" "}
                      <Link
                        href="/privacy"
                        className="text-[var(--purple)] underline underline-offset-2"
                      >
                        Privacy policy
                      </Link>
                      .
                    </span>
                  </label>
                  <label className="flex gap-3 text-sm text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      name="smsMarketing"
                      className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
                    />
                    <span>{smsConsentText}</span>
                  </label>
                  <label className="flex gap-3 text-sm text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      name="emailMarketing"
                      className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
                    />
                    <span>{emailConsentText}</span>
                  </label>
                </fieldset>

                {turnstileSiteKey !== undefined && (
                  <div
                    className="mt-6 cf-turnstile"
                    data-sitekey={turnstileSiteKey}
                    data-action="vision_report"
                    data-theme="light"
                  />
                )}
                <div className="mt-7">
                  <Button
                    type="submit"
                    data-testid="vision-request-submit"
                    disabled={formState.kind === "submitting" || calculation.result === null}
                  >
                    {formState.kind === "submitting" ? "Saving request…" : "Request human review"}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  inputClass,
  help,
  testId
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  inputClass: string;
  help?: string;
  testId?: string;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-[18px] text-[var(--text-muted)]">
          $
        </span>
        <input
          type="number"
          min="0"
          step="100"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} pl-7`}
          data-testid={testId}
        />
      </span>
      {help !== undefined && (
        <span className="mt-1 block font-normal text-[var(--text-muted)]">{help}</span>
      )}
    </label>
  );
}

function NumberField({
  label,
  value,
  step,
  onChange,
  inputClass,
  help
}: {
  label: string;
  value: number;
  step: string;
  onChange: (value: string) => void;
  inputClass: string;
  help?: string;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
      {help !== undefined && (
        <span className="mt-1 block font-normal text-[var(--text-muted)]">{help}</span>
      )}
    </label>
  );
}

function ResultCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[var(--text)]">{value}</p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}
