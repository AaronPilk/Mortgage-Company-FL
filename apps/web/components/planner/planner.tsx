"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY } from "@tract/analytics";
import type { LeadAttributionTouch } from "@tract/schemas";
import { Badge, Button, Card } from "@/components/ui";
import { NumberInput } from "@/components/calculators/field";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { CheckboxField, RadioGroup, SelectField, TextField } from "./controls";
import { EstimatePanel } from "./estimate";
import { trackEstimateShown, trackPlannerLead, trackPlannerStarted } from "./analytics";
import {
  CREDIT_BAND_OPTIONS,
  DOWN_PAYMENT_BAND_LABEL,
  EMPLOYMENT_OPTIONS,
  GOAL_OPTIONS,
  INCOME_BAND_OPTIONS,
  INTENT_BY_GOAL,
  MONTHLY_DEBT_BAND_OPTIONS,
  MORTGAGE_RATE_BAND_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
  PRICE_BAND_LABEL,
  PROPERTY_STAGE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  STATE_OPTIONS,
  TIMING_OPTIONS,
  type CreditBandValue,
  type DownPaymentBandValue,
  type EmploymentValue,
  type IncomeBandValue,
  type MonthlyDebtBandValue,
  type MortgageBalanceBandValue,
  type MortgageRateBandValue,
  type PlannerGoalValue,
  type PropertyStageValue,
  type PropertyTypeValue,
  type TimingValue,
  downPaymentBandFor,
  mortgageBalanceBandFor,
  priceBandFor
} from "./options";

/**
 * The progressive planner.
 *
 * The order of the six steps is the whole point. Four steps of context come
 * first and each one makes the estimate on the right more useful; only then does
 * step five ask who you are. Nothing computed here is withheld until you hand
 * over a phone number, because a tool that holds its own output hostage is an
 * advertisement wearing a calculator costume.
 *
 * What it is not: an application. No Social Security number, no date of birth,
 * no account number, no income documentation, no upload — not here and not
 * anywhere else on this site. Income and debt are ranges. Credit is a band the
 * visitor reports, never a score and never a pull. No screen here says
 * preapproved, approved, or qualified, because a marketing form cannot know any
 * of those things.
 *
 * It posts to /api/v1/leads, the same endpoint the contact form uses. A second
 * endpoint would mean a second copy of the consent, dedupe, rate-limit,
 * challenge, and outbox guarantees.
 */

type StepKey = "goal" | "property" | "financing" | "timing" | "contact" | "consent";

const STEPS: { key: StepKey; label: string; heading: string }[] = [
  { key: "goal", label: "Goal", heading: "What are you trying to do?" },
  { key: "property", label: "Property", heading: "Tell us about the property" },
  { key: "financing", label: "Financing", heading: "The shape of the financing" },
  { key: "timing", label: "Timing", heading: "When would this happen?" },
  { key: "contact", label: "Contact", heading: "Who should we get back to?" },
  { key: "consent", label: "Consent", heading: "Your permission, in three parts" }
];

type State = {
  goal: PlannerGoalValue | "";
  propertyState: string;
  propertyLocation: string;
  propertyType: PropertyTypeValue | "";
  propertyStage: PropertyStageValue | "";
  priceDollars: number;
  downPaymentDollars: number;
  currentBalanceDollars: number;
  currentRateBand: MortgageRateBandValue | "";
  creditBand: CreditBandValue | "";
  employment: EmploymentValue | "";
  incomeBand: IncomeBandValue | "";
  monthlyDebtBand: MonthlyDebtBandValue | "";
  timing: TimingValue | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: string;
  privacyAccepted: boolean;
  smsMarketing: boolean;
  emailMarketing: boolean;
  // Assumptions behind the illustration. Adjustable, and labelled as assumptions.
  rateBasisPoints: number;
  termMonths: number;
  propertyTaxRateBasisPoints: number;
  annualInsuranceDollars: number;
  monthlyHoaDollars: number;
};

function initialState(goal: PlannerGoalValue | ""): State {
  return {
    goal,
    propertyState: "FL",
    propertyLocation: "",
    propertyType: "",
    propertyStage: "",
    priceDollars: 425_000,
    downPaymentDollars: 42_500,
    currentBalanceDollars: 300_000,
    currentRateBand: "",
    creditBand: "",
    employment: "",
    incomeBand: "",
    monthlyDebtBand: "",
    timing: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredContact: "",
    privacyAccepted: false,
    smsMarketing: false,
    emailMarketing: false,
    rateBasisPoints: 650,
    termMonths: 360,
    propertyTaxRateBasisPoints: 110,
    annualInsuranceDollars: 4_200,
    monthlyHoaDollars: 0
  };
}

type Submission =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "failed"; message: string }
  | { kind: "received"; receiptId: string };

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Ten digits is the shortest thing that can be a real US number. */
function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function sanitizeNumber(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function Planner({
  initialGoal,
  disclosureText,
  smsConsentText,
  emailConsentText,
  disclosureVersion,
  turnstileSiteKey
}: {
  initialGoal: PlannerGoalValue | "";
  disclosureText: string;
  smsConsentText: string;
  emailConsentText: string;
  disclosureVersion: string;
  turnstileSiteKey?: string | undefined;
}) {
  const [state, setState] = useState<State>(() => initialState(initialGoal));
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<Submission>({ kind: "idle" });
  const [announcement, setAnnouncement] = useState("");
  const [startTracked, setStartTracked] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const shouldFocusHeading = useRef(false);
  const submissionIdentityRef = useRef<{
    id: string;
    fingerprint: string;
    firstTouch: LeadAttributionTouch;
    lastTouch: LeadAttributionTouch;
    conversionTouch: LeadAttributionTouch;
  } | null>(null);

  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;

  const step = STEPS[stepIndex] ?? STEPS[0];
  const stepKey = step?.key ?? "goal";
  const isRefinance = state.goal === "refinance";
  const set = <K extends keyof State>(key: K, value: State[K]): void => {
    setState((previous) => ({ ...previous, [key]: value }));
  };

  // Moving to a step is a navigation, so the new step's heading takes focus and
  // the change is spoken. Without both, a keyboard user lands back at the top of
  // the document and a screen reader user hears nothing at all.
  useEffect(() => {
    if (!shouldFocusHeading.current) return;
    shouldFocusHeading.current = false;
    headingRef.current?.focus();
  }, [stepIndex]);

  useEffect(() => {
    if (state.goal === "" || startTracked) return;
    setStartTracked(true);
    trackPlannerStarted(state.goal);
  }, [state.goal, startTracked]);

  function validate(key: StepKey): Record<string, string> {
    const found: Record<string, string> = {};
    if (key === "goal" && state.goal === "") {
      found.goal = "Choose what you are trying to do so the estimate has something to work with.";
    }
    if (key === "property") {
      if (state.propertyState === "") found.propertyState = "Choose the state the property is in.";
      if (state.propertyType === "") found.propertyType = "Choose the kind of property.";
      if (state.propertyStage === "") {
        found.propertyStage = "Let us know how far along you are.";
      }
      if (sanitizeNumber(state.priceDollars) < 10_000) {
        found.priceDollars = "Enter an approximate value of at least $10,000.";
      }
    }
    if (key === "financing") {
      if (isRefinance) {
        if (sanitizeNumber(state.currentBalanceDollars) < 1_000) {
          found.currentBalanceDollars = "Enter roughly what you still owe.";
        }
        if (state.currentRateBand === "") {
          found.currentRateBand = "Choose the range your current rate falls in.";
        }
      } else if (sanitizeNumber(state.downPaymentDollars) > sanitizeNumber(state.priceDollars)) {
        found.downPaymentDollars = "A down payment cannot be larger than the price.";
      }
      if (state.creditBand === "") found.creditBand = "Choose the range you believe you are in.";
      if (state.employment === "") found.employment = "Choose how you are paid.";
      if (state.incomeBand === "") found.incomeBand = "Choose a range.";
      if (state.monthlyDebtBand === "") found.monthlyDebtBand = "Choose a range.";
    }
    if (key === "timing" && state.timing === "") {
      found.timing = "Choose a timeframe. Just researching is a real answer.";
    }
    if (key === "contact") {
      if (state.firstName.trim() === "") found.firstName = "Enter your first name.";
      if (state.lastName.trim() === "") found.lastName = "Enter your last name.";
      if (!EMAIL_SHAPE.test(state.email.trim()))
        found.email = "Enter an email address we can reply to.";
      if (!looksLikePhone(state.phone))
        found.phone = "Enter a phone number with at least 10 digits.";
    }
    if (key === "consent" && !state.privacyAccepted) {
      found.privacyAccepted = "We need your agreement before a licensed professional contacts you.";
    }
    return found;
  }

  function announce(index: number): void {
    const target = STEPS[index];
    if (target === undefined) return;
    setAnnouncement(`Step ${index + 1} of ${STEPS.length}. ${target.label}. ${target.heading}`);
  }

  function goTo(index: number): void {
    setErrors({});
    shouldFocusHeading.current = true;
    setStepIndex(index);
    announce(index);
    if (index >= 1 && state.goal !== "") trackEstimateShown(state.goal);
  }

  function handleBack(): void {
    if (stepIndex === 0) return;
    goTo(stepIndex - 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submission.kind === "submitting") return;

    const found = validate(stepKey);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      queueMicrotask(() => errorSummaryRef.current?.focus());
      return;
    }

    if (stepIndex < STEPS.length - 1) {
      goTo(stepIndex + 1);
      return;
    }

    await send();
  }

  async function send(): Promise<void> {
    if (state.goal === "") return;
    setSubmission({ kind: "submitting" });

    const form = formRef.current === null ? null : new FormData(formRef.current);
    const fingerprint = JSON.stringify(state);
    if (
      submissionIdentityRef.current === null ||
      submissionIdentityRef.current.fingerprint !== fingerprint
    ) {
      const fallbackPath = window.location.pathname;
      submissionIdentityRef.current = {
        id: window.crypto.randomUUID(),
        fingerprint,
        firstTouch: attributionTouch(readStoredTouch(FIRST_TOUCH_STORAGE_KEY), fallbackPath),
        lastTouch: attributionTouch(readStoredTouch(LAST_TOUCH_STORAGE_KEY), fallbackPath),
        conversionTouch: currentAttributionTouch(fallbackPath)
      };
    }
    const submissionIdentity = submissionIdentityRef.current;

    const price = sanitizeNumber(state.priceDollars);
    const downPaymentBand: DownPaymentBandValue = isRefinance
      ? "not_sure"
      : downPaymentBandFor(sanitizeNumber(state.downPaymentDollars), price);
    const balanceBand: MortgageBalanceBandValue = mortgageBalanceBandFor(
      sanitizeNumber(state.currentBalanceDollars)
    );

    const payload = {
      submissionId: submissionIdentity.id,
      intent: INTENT_BY_GOAL[state.goal],
      firstName: state.firstName.trim(),
      lastName: state.lastName.trim(),
      email: state.email.trim(),
      phone: state.phone.trim(),
      ...(state.preferredContact === "" ? {} : { preferredContact: state.preferredContact }),
      stateCode: state.propertyState,
      consent: {
        privacyAccepted: state.privacyAccepted,
        contactRequested: true,
        smsMarketing: state.smsMarketing,
        emailMarketing: state.emailMarketing,
        disclosureVersion
      },
      // Bands only. The exact figures on this page never leave the browser.
      planner: {
        goal: state.goal,
        propertyState: state.propertyState,
        ...(state.propertyLocation.trim() === ""
          ? {}
          : { propertyLocation: state.propertyLocation.trim() }),
        propertyType: state.propertyType,
        propertyStage: state.propertyStage,
        priceBand: priceBandFor(price),
        downPaymentBand,
        ...(isRefinance
          ? {
              currentMortgageBalanceBand: balanceBand,
              currentMortgageRateBand: state.currentRateBand
            }
          : {}),
        creditBand: state.creditBand,
        employment: state.employment,
        incomeBand: state.incomeBand,
        monthlyDebtBand: state.monthlyDebtBand,
        timing: state.timing
      },
      firstTouch: submissionIdentity.firstTouch,
      lastTouch: submissionIdentity.lastTouch,
      conversionTouch: submissionIdentity.conversionTouch,
      turnstileToken: String(form?.get("cf-turnstile-response") ?? "no-challenge-configured"),
      honeypot: String(form?.get("company") ?? "")
    };

    try {
      const response = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as
        | { ok: true; data: { receiptId: string } }
        | { ok: false; error: { message: string; fields?: Record<string, string[]> } };

      if (result.ok) {
        setSubmission({ kind: "received", receiptId: result.data.receiptId });
        trackPlannerLead(state.goal, result.data.receiptId);
        return;
      }
      setSubmission({ kind: "failed", message: result.error.message });
      queueMicrotask(() => errorSummaryRef.current?.focus());
    } catch {
      setSubmission({
        kind: "failed",
        message: "We could not reach the server. Please check your connection and try again."
      });
      queueMicrotask(() => errorSummaryRef.current?.focus());
    }
  }

  if (submission.kind === "received") {
    return (
      <Card>
        <div role="status">
          <h2 className="text-2xl font-bold text-[var(--text)]">We have your plan</h2>
          <p className="mt-3 text-[var(--text-muted)]">
            A licensed mortgage professional will reach out to talk it through. Nothing has been
            submitted to a lender, no credit inquiry has been made, and you are not obligated to
            anything.
          </p>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Reference{" "}
            <span className="font-mono text-[var(--text)]">{submission.receiptId.slice(0, 8)}</span>{" "}
            — keep this if you need to follow up.
          </p>
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            The{" "}
            <a className="text-[var(--purple)] underline underline-offset-2" href="/calculators">
              calculators
            </a>{" "}
            run entirely in your browser if you want to keep exploring in the meantime.
          </p>
        </div>
      </Card>
    );
  }

  const errorList = Object.entries(errors);
  const submitFailed = submission.kind === "failed";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <Progress current={stepIndex} />

        {/* Politely spoken on every step change, so the move is not silent. */}
        <p aria-live="polite" role="status" className="sr-only">
          {announcement}
        </p>

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-8">
          {(errorList.length > 0 || submitFailed) && (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              role="alert"
              className="mb-6 rounded-lg border border-danger/40 bg-danger/5 p-4"
            >
              <p className="font-semibold text-danger">
                {submission.kind === "failed"
                  ? submission.message
                  : errorList.length === 1
                    ? "One answer needs attention before you continue."
                    : `${errorList.length} answers need attention before you continue.`}
              </p>
              {errorList.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger">
                  {errorList.map(([field, message]) => (
                    <li key={field}>
                      <a href={`#${fieldId(field)}`} className="underline underline-offset-2">
                        {message}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold text-[var(--text)] outline-none"
          >
            {step?.heading}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Step {stepIndex + 1} of {STEPS.length} — {step?.label}. This is not an application, and
            no credit is pulled at any point on this page.
          </p>

          <div className="mt-6 space-y-6">
            {stepKey === "goal" && (
              <RadioGroup
                idPrefix={baseId}
                name="goal"
                legend="What brings you here?"
                description="Everything after this adapts to your answer."
                options={GOAL_OPTIONS}
                value={state.goal}
                onChange={(value) => set("goal", value)}
                error={errors.goal}
              />
            )}

            {stepKey === "property" && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <SelectField
                    id={fieldId("propertyState")}
                    name="propertyState"
                    label="State"
                    options={STATE_OPTIONS}
                    value={state.propertyState}
                    onChange={(value) => set("propertyState", value)}
                    error={errors.propertyState}
                  />
                  <TextField
                    id={fieldId("propertyLocation")}
                    name="propertyLocation"
                    label="City or ZIP"
                    optional
                    value={state.propertyLocation}
                    onChange={(value) => set("propertyLocation", value)}
                    maxLength={80}
                    placeholder="Tampa"
                    hint="A city or postal code only. Never a street address."
                  />
                </div>
                <RadioGroup
                  idPrefix={baseId}
                  name="propertyType"
                  legend="What kind of property?"
                  options={PROPERTY_TYPE_OPTIONS}
                  value={state.propertyType}
                  onChange={(value) => set("propertyType", value)}
                  error={errors.propertyType}
                  columns={2}
                />
                <RadioGroup
                  idPrefix={baseId}
                  name="propertyStage"
                  legend="How far along are you?"
                  options={PROPERTY_STAGE_OPTIONS}
                  value={state.propertyStage}
                  onChange={(value) => set("propertyStage", value)}
                  error={errors.propertyStage}
                  columns={2}
                />
                <NumberInput
                  id={fieldId("priceDollars")}
                  label={isRefinance ? "Estimated value today" : "Estimated price"}
                  value={state.priceDollars}
                  onChange={(value) => set("priceDollars", value)}
                  min={0}
                  step={5_000}
                  prefix="$"
                  hint={`An approximation is fine. We pass along the range it falls in — ${
                    PRICE_BAND_LABEL[priceBandFor(sanitizeNumber(state.priceDollars))]
                  } — not the figure you typed.`}
                />
                {errors.priceDollars !== undefined && (
                  <p className="mt-2 text-sm font-medium text-danger">{errors.priceDollars}</p>
                )}
              </>
            )}

            {stepKey === "financing" && (
              <>
                {isRefinance ? (
                  <>
                    <NumberInput
                      id={fieldId("currentBalanceDollars")}
                      label="Roughly what you still owe"
                      value={state.currentBalanceDollars}
                      onChange={(value) => set("currentBalanceDollars", value)}
                      min={0}
                      step={5_000}
                      prefix="$"
                      hint="An approximation. Only the range it falls in is submitted."
                    />
                    {errors.currentBalanceDollars !== undefined && (
                      <p className="mt-2 text-sm font-medium text-danger">
                        {errors.currentBalanceDollars}
                      </p>
                    )}
                    <SelectField
                      id={fieldId("currentRateBand")}
                      name="currentRateBand"
                      label="Your current interest rate"
                      placeholder="Choose a range"
                      options={MORTGAGE_RATE_BAND_OPTIONS}
                      value={state.currentRateBand}
                      onChange={(value) =>
                        set("currentRateBand", value as MortgageRateBandValue | "")
                      }
                      error={errors.currentRateBand}
                    />
                  </>
                ) : (
                  <div>
                    <NumberInput
                      id={fieldId("downPaymentDollars")}
                      label="Down payment you have in mind"
                      value={state.downPaymentDollars}
                      onChange={(value) => set("downPaymentDollars", value)}
                      min={0}
                      step={2_500}
                      prefix="$"
                      hint={`We pass along the share it represents — ${
                        DOWN_PAYMENT_BAND_LABEL[
                          downPaymentBandFor(
                            sanitizeNumber(state.downPaymentDollars),
                            sanitizeNumber(state.priceDollars)
                          )
                        ]
                      } — not the amount you typed.`}
                    />
                    {errors.downPaymentDollars !== undefined && (
                      <p className="mt-2 text-sm font-medium text-danger">
                        {errors.downPaymentDollars}
                      </p>
                    )}
                  </div>
                )}

                <SelectField
                  id={fieldId("creditBand")}
                  name="creditBand"
                  label="Where you think your credit sits"
                  placeholder="Choose a range"
                  options={CREDIT_BAND_OPTIONS}
                  value={state.creditBand}
                  onChange={(value) => set("creditBand", value as CreditBandValue | "")}
                  error={errors.creditBand}
                  hint="Your own estimate is enough. No credit is pulled, and this is never treated as a score."
                />
                <SelectField
                  id={fieldId("employment")}
                  name="employment"
                  label="How you are paid"
                  placeholder="Choose one"
                  options={EMPLOYMENT_OPTIONS}
                  value={state.employment}
                  onChange={(value) => set("employment", value as EmploymentValue | "")}
                  error={errors.employment}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <SelectField
                    id={fieldId("incomeBand")}
                    name="incomeBand"
                    label="Gross monthly household income"
                    placeholder="Choose a range"
                    options={INCOME_BAND_OPTIONS}
                    value={state.incomeBand}
                    onChange={(value) => set("incomeBand", value as IncomeBandValue | "")}
                    error={errors.incomeBand}
                    hint="A range, never an exact figure."
                  />
                  <SelectField
                    id={fieldId("monthlyDebtBand")}
                    name="monthlyDebtBand"
                    label="Other monthly obligations"
                    placeholder="Choose a range"
                    options={MONTHLY_DEBT_BAND_OPTIONS}
                    value={state.monthlyDebtBand}
                    onChange={(value) => set("monthlyDebtBand", value as MonthlyDebtBandValue | "")}
                    error={errors.monthlyDebtBand}
                    hint="Car, student, card minimums. Not groceries or utilities."
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  We never ask for a Social Security number, a date of birth, an account number, or
                  a document. Those belong in a secure application system, and this is not one.
                </p>
              </>
            )}

            {stepKey === "timing" && (
              <RadioGroup
                idPrefix={baseId}
                name="timing"
                legend="When would you want this to happen?"
                description="There is no wrong answer, and researching does not put you in a queue."
                options={TIMING_OPTIONS}
                value={state.timing}
                onChange={(value) => set("timing", value)}
                error={errors.timing}
              />
            )}

            {stepKey === "contact" && (
              <>
                <p
                  className="rounded-xl border p-4 text-sm text-[var(--text-muted)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  Your estimate is already on this page and stays there whether or not you fill this
                  in. This step exists so a licensed professional can talk it through with you.
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    id={fieldId("firstName")}
                    name="firstName"
                    label="First name"
                    autoComplete="given-name"
                    value={state.firstName}
                    onChange={(value) => set("firstName", value)}
                    error={errors.firstName}
                    maxLength={80}
                  />
                  <TextField
                    id={fieldId("lastName")}
                    name="lastName"
                    label="Last name"
                    autoComplete="family-name"
                    value={state.lastName}
                    onChange={(value) => set("lastName", value)}
                    error={errors.lastName}
                    maxLength={80}
                  />
                  <TextField
                    id={fieldId("email")}
                    name="email"
                    type="email"
                    inputMode="email"
                    label="Email"
                    autoComplete="email"
                    value={state.email}
                    onChange={(value) => set("email", value)}
                    error={errors.email}
                    maxLength={320}
                  />
                  <TextField
                    id={fieldId("phone")}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    label="Phone"
                    autoComplete="tel"
                    placeholder="(813) 555-0147"
                    value={state.phone}
                    onChange={(value) => set("phone", value)}
                    error={errors.phone}
                    maxLength={32}
                  />
                </div>
                <SelectField
                  id={fieldId("preferredContact")}
                  name="preferredContact"
                  label="Best way to reach you"
                  placeholder="No preference"
                  options={PREFERRED_CONTACT_OPTIONS}
                  value={state.preferredContact}
                  onChange={(value) => set("preferredContact", value)}
                />
              </>
            )}

            {stepKey === "consent" && (
              <fieldset className="space-y-4">
                <legend className="sr-only">Consent</legend>
                {/* Three separate permissions. Bundling them would make the marketing
                    consents unreliable, which is the point of separating them. */}
                <div>
                  <CheckboxField
                    id={fieldId("privacyAccepted")}
                    name="privacyAccepted"
                    checked={state.privacyAccepted}
                    onChange={(checked) => set("privacyAccepted", checked)}
                    error={errors.privacyAccepted}
                    tone="default"
                  >
                    {disclosureText}{" "}
                    <a
                      className="text-[var(--purple)] underline underline-offset-2"
                      href="/privacy"
                    >
                      Privacy policy
                    </a>
                    .
                  </CheckboxField>
                </div>
                <CheckboxField
                  id={fieldId("smsMarketing")}
                  name="smsMarketing"
                  checked={state.smsMarketing}
                  onChange={(checked) => set("smsMarketing", checked)}
                >
                  {smsConsentText}
                </CheckboxField>
                <CheckboxField
                  id={fieldId("emailMarketing")}
                  name="emailMarketing"
                  checked={state.emailMarketing}
                  onChange={(checked) => set("emailMarketing", checked)}
                >
                  {emailConsentText}
                </CheckboxField>

                {turnstileSiteKey !== undefined && (
                  <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
                )}
              </fieldset>
            )}
          </div>

          {/* Honeypot. Out of the tab order and hidden from assistive technology. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor={fieldId("company")}>Company</label>
            <input id={fieldId("company")} name="company" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {stepIndex > 0 && (
              <Button type="button" variant="secondary" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button type="submit" disabled={submission.kind === "submitting"}>
              {stepIndex === STEPS.length - 1
                ? submission.kind === "submitting"
                  ? "Sending…"
                  : "Send my plan"
                : "Continue"}
            </Button>
          </div>
        </form>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        {stepIndex === 0 ? (
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                What you get, before we ask anything
              </h2>
              <Badge tone="neutral">No credit pull</Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Answer the next question and a live payment estimate appears here and keeps updating
              as you go. It is yours whether or not you ever fill in the contact step, and it is an
              illustration built from your own numbers — not a quote, an approval, or a decision.
            </p>
          </Card>
        ) : (
          <>
            <EstimatePanel
              input={{
                priceDollars: state.priceDollars,
                downPaymentDollars: state.downPaymentDollars,
                annualRateBasisPoints: state.rateBasisPoints,
                termMonths: state.termMonths,
                propertyTaxRateBasisPoints: state.propertyTaxRateBasisPoints,
                annualInsuranceDollars: state.annualInsuranceDollars,
                monthlyHoaDollars: state.monthlyHoaDollars,
                incomeBand: state.incomeBand,
                monthlyDebtBand: state.monthlyDebtBand,
                currentBalanceDollars: state.currentBalanceDollars,
                currentRateBand: state.currentRateBand,
                isRefinance
              }}
            />
            <details className="surface mt-4 rounded-2xl px-6 py-5">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--text)]">
                Assumptions behind the estimate
              </summary>
              <div className="mt-5 space-y-5">
                <NumberInput
                  id={fieldId("rate")}
                  label="Assumed interest rate"
                  value={state.rateBasisPoints / 100}
                  onChange={(value) =>
                    set("rateBasisPoints", Math.round(sanitizeNumber(value) * 100))
                  }
                  min={0}
                  step={0.125}
                  hint="A number you chose for comparison. No rate is quoted or offered here."
                />
                <div>
                  <label
                    htmlFor={fieldId("term")}
                    className="text-sm font-semibold text-[var(--text)]"
                  >
                    Loan term
                  </label>
                  <select
                    id={fieldId("term")}
                    value={state.termMonths}
                    onChange={(event) => set("termMonths", Number(event.target.value))}
                    className="mt-1.5 min-h-[48px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text)]"
                  >
                    <option value={360}>30 years</option>
                    <option value={240}>20 years</option>
                    <option value={180}>15 years</option>
                  </select>
                </div>
                <NumberInput
                  id={fieldId("taxRate")}
                  label="Property tax rate"
                  value={state.propertyTaxRateBasisPoints / 100}
                  onChange={(value) =>
                    set("propertyTaxRateBasisPoints", Math.round(sanitizeNumber(value) * 100))
                  }
                  min={0}
                  step={0.05}
                  hint="Percent of value per year. Counties differ; your own bill is the real number."
                />
                <NumberInput
                  id={fieldId("insurance")}
                  label="Annual insurance"
                  value={state.annualInsuranceDollars}
                  onChange={(value) => set("annualInsuranceDollars", value)}
                  min={0}
                  step={100}
                  prefix="$"
                  hint="Florida premiums vary widely by location and construction."
                />
                <NumberInput
                  id={fieldId("hoa")}
                  label="Monthly association dues"
                  value={state.monthlyHoaDollars}
                  onChange={(value) => set("monthlyHoaDollars", value)}
                  min={0}
                  step={25}
                  prefix="$"
                />
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

function Progress({ current }: { current: number }) {
  return (
    <nav aria-label="Planner progress">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step.key}>
              <span
                aria-current={active ? "step" : undefined}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: active || done ? "var(--purple)" : "var(--border)",
                  background: active ? "var(--purple-subtle)" : "transparent",
                  color: active || done ? "var(--purple)" : "var(--text-muted)"
                }}
              >
                <span aria-hidden="true">{index + 1}</span>
                {step.label}
                <span className="sr-only">
                  {active ? " (current step)" : done ? " (completed)" : " (not started)"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
