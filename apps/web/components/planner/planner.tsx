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
import { TurnstileWidget } from "@/components/turnstile-widget";
import { AccountSignIn } from "@/components/account/account-sign-in";
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
 * The progressive planner, behind a lightweight sign-up gate.
 *
 * The gate asks who you are — name, phone, email — and the standing consent
 * checkboxes, and posts that as a lead immediately, so someone who starts
 * planning and walks away is still captured. The four steps then run exactly
 * as before, with the final Contact step acting as a review of the details the
 * gate collected: everything stays editable, and the full submission posts the
 * complete planner payload as its own richer lead. Once the gate is open,
 * nothing computed here is withheld — the estimate builds as you answer and is
 * never held hostage to another form.
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

type StepKey = "goal" | "property" | "numbers" | "contact";

const STEPS: { key: StepKey; label: string; heading: string }[] = [
  { key: "goal", label: "Goal", heading: "What are you trying to do, and when?" },
  { key: "property", label: "Property", heading: "Tell us about the property" },
  { key: "numbers", label: "Numbers", heading: "The shape of the financing" },
  { key: "contact", label: "Contact", heading: "Confirm who we should get back to" }
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
  | { kind: "failed"; message: string; fieldMessages: string[] }
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

/**
 * Friendly text for the server's field-level rejections. Keys the map does not
 * know fall through to the server's own message, which is still more actionable
 * than a generic "check your answers".
 */
const SERVER_FIELD_TEXT: Record<string, string> = {
  turnstileToken:
    "The security check didn't complete. Please wait for the checkbox to load and try again.",
  firstName: "Enter your first name.",
  lastName: "Enter your last name.",
  email: "Enter an email address we can reply to.",
  phone: "Enter a phone number with at least 10 digits.",
  consent: "Please confirm the permission checkbox so a licensed professional can contact you.",
  submissionId: "Something went wrong preparing the submission. Reload the page and try again."
};

function serverFieldMessages(fields: Record<string, string[]> | undefined): string[] {
  if (fields === undefined) return [];
  const messages = new Set<string>();
  for (const [key, texts] of Object.entries(fields)) {
    const friendly = SERVER_FIELD_TEXT[key] ?? SERVER_FIELD_TEXT[key.split(".")[0] ?? ""];
    if (friendly !== undefined) {
      messages.add(friendly);
      continue;
    }
    for (const text of texts) {
      if (text.trim().length > 0) messages.add(text);
    }
  }
  return [...messages];
}

type SubmissionIdentity = {
  id: string;
  fingerprint: string;
  firstTouch: LeadAttributionTouch;
  lastTouch: LeadAttributionTouch;
  conversionTouch: LeadAttributionTouch;
};

/**
 * A stable submission identity for one specific payload. The id is minted once
 * per distinct content fingerprint, so an exact retry after a server failure
 * reuses the same submissionId and the server's idempotency dedupe holds.
 */
function ensureSubmissionIdentity(
  ref: React.MutableRefObject<SubmissionIdentity | null>,
  fingerprint: string
): SubmissionIdentity {
  if (ref.current === null || ref.current.fingerprint !== fingerprint) {
    const fallbackPath = window.location.pathname;
    ref.current = {
      id: window.crypto.randomUUID(),
      fingerprint,
      firstTouch: attributionTouch(readStoredTouch(FIRST_TOUCH_STORAGE_KEY), fallbackPath),
      lastTouch: attributionTouch(readStoredTouch(LAST_TOUCH_STORAGE_KEY), fallbackPath),
      conversionTouch: currentAttributionTouch(fallbackPath)
    };
  }
  return ref.current;
}

export function Planner({
  initialGoal,
  disclosureText,
  smsConsentText,
  emailConsentText,
  disclosureVersion,
  turnstileSiteKey,
  accountsConfigured = false,
  supabaseUrl,
  anonKey
}: {
  initialGoal: PlannerGoalValue | "";
  disclosureText: string;
  smsConsentText: string;
  emailConsentText: string;
  disclosureVersion: string;
  turnstileSiteKey?: string | undefined;
  /** Whether the optional save-to-account offer can work in this environment. */
  accountsConfigured?: boolean;
  supabaseUrl?: string | undefined;
  anonKey?: string | undefined;
}) {
  const [state, setState] = useState<State>(() => initialState(initialGoal));
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<Submission>({ kind: "idle" });
  const [announcement, setAnnouncement] = useState("");
  const [startTracked, setStartTracked] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [gateSubmission, setGateSubmission] = useState<Submission>({ kind: "idle" });
  const [signInOpen, setSignInOpen] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const gateFormRef = useRef<HTMLFormElement>(null);
  const shouldFocusHeading = useRef(false);
  const submissionIdentityRef = useRef<SubmissionIdentity | null>(null);
  const gateIdentityRef = useRef<SubmissionIdentity | null>(null);

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
  // the document and a screen reader user hears nothing at all. Unlocking the
  // gate is the same kind of navigation, so it participates too.
  useEffect(() => {
    if (!shouldFocusHeading.current) return;
    shouldFocusHeading.current = false;
    headingRef.current?.focus();
  }, [stepIndex, gateUnlocked]);

  useEffect(() => {
    if (state.goal === "" || startTracked) return;
    setStartTracked(true);
    trackPlannerStarted(state.goal);
  }, [state.goal, startTracked]);

  /**
   * Who-you-are validation, shared by the sign-up gate and the final confirm
   * step so the two screens can never drift apart on what a valid contact is.
   */
  function contactFieldErrors(): Record<string, string> {
    const found: Record<string, string> = {};
    if (state.firstName.trim() === "") found.firstName = "Enter your first name.";
    if (state.lastName.trim() === "") found.lastName = "Enter your last name.";
    if (!EMAIL_SHAPE.test(state.email.trim()))
      found.email = "Enter an email address we can reply to.";
    if (!looksLikePhone(state.phone)) found.phone = "Enter a phone number with at least 10 digits.";
    if (!state.privacyAccepted) {
      found.privacyAccepted = "We need your agreement before a licensed professional contacts you.";
    }
    return found;
  }

  function validate(key: StepKey): Record<string, string> {
    const found: Record<string, string> = {};
    if (key === "goal") {
      if (state.goal === "") {
        found.goal = "Choose what you are trying to do so the estimate has something to work with.";
      }
      if (state.timing === "") {
        found.timing = "Choose a timeframe. Just researching is a real answer.";
      }
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
    if (key === "numbers") {
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
    if (key === "contact") {
      Object.assign(found, contactFieldErrors());
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

  /**
   * The sign-up gate posts a lead immediately, before the four steps, so a
   * visitor who starts planning and abandons is still a durable first-party
   * record. It is the same endpoint and the same consent model as the full
   * submission — the only difference is that no planner answers exist yet.
   */
  async function handleGateSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (gateSubmission.kind === "submitting") return;

    const found = contactFieldErrors();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      queueMicrotask(() => errorSummaryRef.current?.focus());
      return;
    }

    setErrors({});
    setGateSubmission({ kind: "submitting" });

    const form = gateFormRef.current === null ? null : new FormData(gateFormRef.current);
    const identity = ensureSubmissionIdentity(
      gateIdentityRef,
      JSON.stringify({
        gate: true,
        goal: state.goal,
        firstName: state.firstName,
        lastName: state.lastName,
        email: state.email,
        phone: state.phone,
        privacyAccepted: state.privacyAccepted,
        smsMarketing: state.smsMarketing,
        emailMarketing: state.emailMarketing
      })
    );

    const payload = {
      submissionId: identity.id,
      // A deep link like /plan?goal=refinance already told us the intent; a
      // plain visit has not answered anything yet, so "general" is the honest value.
      intent: state.goal === "" ? "general" : INTENT_BY_GOAL[state.goal],
      firstName: state.firstName.trim(),
      lastName: state.lastName.trim(),
      email: state.email.trim(),
      phone: state.phone.trim(),
      stateCode: state.propertyState,
      message: "Planner started — full answers may follow.",
      consent: {
        privacyAccepted: state.privacyAccepted,
        contactRequested: true,
        smsMarketing: state.smsMarketing,
        emailMarketing: state.emailMarketing,
        disclosureVersion
      },
      firstTouch: identity.firstTouch,
      lastTouch: identity.lastTouch,
      conversionTouch: identity.conversionTouch,
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
        setGateSubmission({ kind: "received", receiptId: result.data.receiptId });
        shouldFocusHeading.current = true;
        setGateUnlocked(true);
        setAnnouncement(
          `Planner unlocked. Step 1 of ${STEPS.length}. ${STEPS[0]?.label}. ${STEPS[0]?.heading}`
        );
        return;
      }
      setGateSubmission({
        kind: "failed",
        message: result.error.message,
        fieldMessages: serverFieldMessages(result.error.fields)
      });
      queueMicrotask(() => errorSummaryRef.current?.focus());
    } catch {
      setGateSubmission({
        kind: "failed",
        message: "We could not reach the server. Please check your connection and try again.",
        fieldMessages: []
      });
      queueMicrotask(() => errorSummaryRef.current?.focus());
    }
  }

  async function send(): Promise<void> {
    if (state.goal === "") return;
    setSubmission({ kind: "submitting" });

    const form = formRef.current === null ? null : new FormData(formRef.current);
    const submissionIdentity = ensureSubmissionIdentity(
      submissionIdentityRef,
      JSON.stringify(state)
    );

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
      setSubmission({
        kind: "failed",
        message: result.error.message,
        fieldMessages: serverFieldMessages(result.error.fields)
      });
      queueMicrotask(() => errorSummaryRef.current?.focus());
    } catch {
      setSubmission({
        kind: "failed",
        message: "We could not reach the server. Please check your connection and try again.",
        fieldMessages: []
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

  // The sign-up gate. Name, phone, email, and the same three separate consent
  // decisions every lead form on this site uses — nothing else, and no planner
  // question is asked before it. The estimate promise stays visible alongside.
  if (!gateUnlocked) {
    const gateFailed = gateSubmission.kind === "failed";
    return (
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <form ref={gateFormRef} onSubmit={handleGateSubmit} noValidate>
            {(errorList.length > 0 || gateFailed) && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                className="mb-6 rounded-lg border border-danger/40 bg-danger/5 p-4"
              >
                <p className="font-semibold text-danger">
                  {gateFailed
                    ? gateSubmission.message
                    : errorList.length === 1
                      ? "One answer needs attention before you continue."
                      : `${errorList.length} answers need attention before you continue.`}
                </p>
                {gateFailed && gateSubmission.fieldMessages.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger">
                    {gateSubmission.fieldMessages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                )}
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

            <h2 className="text-2xl font-bold text-[var(--text)]">Sign up to start planning</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Tell us who you are and the four planning steps open right up. This is not an
              application, no credit is pulled at any point, and the estimate builds from your own
              numbers as you answer.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
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

            <fieldset
              className="mt-6 space-y-4 border-t pt-5"
              style={{ borderColor: "var(--border)" }}
            >
              <legend className="sr-only">Consent</legend>
              {/* The same three separate permissions as everywhere else. Only the
                  privacy/contact one is required — the marketing opt-ins are
                  never a condition of using the planner. */}
              <CheckboxField
                id={fieldId("privacyAccepted")}
                name="privacyAccepted"
                checked={state.privacyAccepted}
                onChange={(checked) => set("privacyAccepted", checked)}
                error={errors.privacyAccepted}
                tone="default"
              >
                {disclosureText}{" "}
                <a className="text-[var(--purple)] underline underline-offset-2" href="/privacy">
                  Privacy policy
                </a>
                .
              </CheckboxField>
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
                <TurnstileWidget siteKey={turnstileSiteKey} action="lead" />
              )}
            </fieldset>

            {/* Honeypot. Out of the tab order and hidden from assistive technology. */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label htmlFor={fieldId("company")}>Company</label>
              <input id={fieldId("company")} name="company" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="mt-8">
              <Button type="submit" disabled={gateSubmission.kind === "submitting"}>
                {gateSubmission.kind === "submitting" ? "Saving…" : "Start planning"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                What opens up when you sign up
              </h2>
              <Badge tone="neutral">No credit pull</Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Four short steps, and a live payment estimate that appears from the second question
              and keeps updating as you answer. It is an illustration built from your own numbers —
              not a quote, an approval, or a decision — and answering the planner questions after
              this is entirely up to you.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const submitFailed = submission.kind === "failed";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <Progress current={stepIndex} />

        {/* Politely spoken on every step change, so the move is not silent. */}
        <p aria-live="polite" role="status" className="sr-only">
          {announcement}
        </p>

        {/* Quiet, optional, and non-blocking: the planner works identically
            whether or not an account is ever created. */}
        {accountsConfigured && (
          <div
            className="mt-4 rounded-xl border px-4 py-3 text-sm text-[var(--text-muted)]"
            style={{ borderColor: "var(--border)" }}
          >
            <p>
              Want your plan saved to an account? Create a free account or sign in.{" "}
              <button
                type="button"
                onClick={() => setSignInOpen((open) => !open)}
                aria-expanded={signInOpen}
                className="font-semibold text-[var(--purple)] underline underline-offset-2"
              >
                {signInOpen ? "Hide" : "Open the account form"}
              </button>
            </p>
            {signInOpen && (
              <div className="mt-4">
                <AccountSignIn
                  configured={accountsConfigured}
                  supabaseUrl={supabaseUrl}
                  anonKey={anonKey}
                  initialEmail={state.email.trim()}
                />
              </div>
            )}
          </div>
        )}

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
              {/* The server's field-level rejections, translated where we can.
                  More useful than the generic message alone. */}
              {submission.kind === "failed" && submission.fieldMessages.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger">
                  {submission.fieldMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
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
              <>
                <RadioGroup
                  idPrefix={baseId}
                  name="goal"
                  legend="What brings you here?"
                  options={GOAL_OPTIONS}
                  value={state.goal}
                  onChange={(value) => set("goal", value)}
                  error={errors.goal}
                />
                <RadioGroup
                  idPrefix={baseId}
                  name="timing"
                  legend="When would this happen?"
                  options={TIMING_OPTIONS}
                  value={state.timing}
                  onChange={(value) => set("timing", value)}
                  error={errors.timing}
                  columns={2}
                />
              </>
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
                    hint="Never a street address."
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
                  hint={`Approximate is fine — only the range it falls in (${
                    PRICE_BAND_LABEL[priceBandFor(sanitizeNumber(state.priceDollars))]
                  }) is submitted.`}
                />
                {errors.priceDollars !== undefined && (
                  <p className="mt-2 text-sm font-medium text-danger">{errors.priceDollars}</p>
                )}
              </>
            )}

            {stepKey === "numbers" && (
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
                      hint="Approximate is fine — only the range it falls in is submitted."
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
                      hint={`Only the share it represents (${
                        DOWN_PAYMENT_BAND_LABEL[
                          downPaymentBandFor(
                            sanitizeNumber(state.downPaymentDollars),
                            sanitizeNumber(state.priceDollars)
                          )
                        ]
                      }) is submitted — not the amount.`}
                    />
                    {errors.downPaymentDollars !== undefined && (
                      <p className="mt-2 text-sm font-medium text-danger">
                        {errors.downPaymentDollars}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <SelectField
                    id={fieldId("creditBand")}
                    name="creditBand"
                    label="Where you think your credit sits"
                    placeholder="Choose a range"
                    options={CREDIT_BAND_OPTIONS}
                    value={state.creditBand}
                    onChange={(value) => set("creditBand", value as CreditBandValue | "")}
                    error={errors.creditBand}
                    hint="Your own estimate is enough — never treated as a score."
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
                    hint="Car, student, card minimums."
                  />
                </div>
              </>
            )}

            {stepKey === "contact" && (
              <>
                <p
                  className="rounded-xl border p-4 text-sm text-[var(--text-muted)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  These are the details you gave when you unlocked the planner. Check they are still
                  right — everything here is editable — and send, so a licensed professional can
                  talk the plan through with you.
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

                <fieldset
                  className="space-y-4 border-t pt-5"
                  style={{ borderColor: "var(--border)" }}
                >
                  <legend className="sr-only">Consent</legend>
                  {/* Three separate permissions. Bundling them would make the marketing
                      consents unreliable, which is the point of separating them. */}
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
                    <TurnstileWidget siteKey={turnstileSiteKey} action="lead" />
                  )}
                </fieldset>
              </>
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
