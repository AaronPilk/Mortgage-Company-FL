"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY, safeLandingPath } from "@tract/analytics";
import type { LeadAttributionTouch } from "@tract/schemas";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { resetTurnstile } from "@/lib/turnstile-browser";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { STATE_OPTIONS } from "@/components/planner/options";
import {
  campaignLeadFields,
  visibleQuestions,
  type CampaignAnswers,
  type CampaignChoiceQuestion,
  type CampaignFunnelConfig,
  type CampaignSliderQuestion,
  type CampaignTextQuestion
} from "./contract";

/**
 * Campaign landing funnel: one question per screen at the depth the ad
 * campaigns run at, modeled on the chunked ad funnels the owner asked for.
 *
 * Where the homepage hero funnel (components/home-funnel.tsx) deliberately
 * asks almost nothing, a campaign page already knows the visitor's intent —
 * the ad told us — and asks the qualifying questions whose answers have a
 * home in the lead schema. The question list, its copy, and its routing live
 * in content/campaigns.ts and components/campaign-funnel/contract.ts; this
 * component is only the screen-by-screen engine.
 *
 * It is a MARKETING form, and every rule that binds lead-form.tsx binds here:
 * no government identifier, no date of birth, no account number, no income
 * documentation, no file upload — ever. Sliders display a dollar figure for
 * feel, but only the enumerated band it falls into is submitted. Credit is a
 * self-reported band, never a score, and nothing here implies approval.
 *
 * Submission mechanics mirror lead-form.tsx exactly: same endpoint, same
 * idempotent submissionId, same attribution touches, same honeypot, same
 * explicitly rendered Turnstile widget.
 */

const AUTO_ADVANCE_MS = 220;

/** Display formatting only. No arithmetic happens on this figure in the browser. */
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

/**
 * Friendly text for the server's field-level rejections, mirroring the map in
 * components/home-funnel.tsx. Unknown keys fall through to the server's own
 * message, which is still more actionable than a generic retry line.
 */
const SERVER_FIELD_TEXT: Record<string, string> = {
  turnstileToken: "The security check didn't complete. Please wait a moment and try again.",
  firstName: "Enter your first name.",
  lastName: "Enter your last name.",
  email: "Enter an email address we can reply to.",
  phone: "Enter a phone number with at least 10 digits.",
  consent: "Please confirm the permission checkbox so a licensed professional can contact you.",
  submissionId: "Something went wrong preparing the submission. Reload the page and try again.",
  timeline: "Choose a timeframe on the timing screen.",
  estimatedCreditBand: "Choose a credit range — “Not sure” is fine.",
  planner: "One of your earlier answers didn't go through. Use Back to check them and try again.",
  stateCode: "Choose the state the property is in."
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

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; fieldMessages: string[] }
  | { kind: "success"; receiptId: string };

export function CampaignFunnel({
  formId,
  disclosureText,
  smsConsentText,
  emailConsentText,
  disclosureVersion,
  turnstileSiteKey,
  config
}: {
  formId: string;
  disclosureText: string;
  smsConsentText: string;
  emailConsentText: string;
  disclosureVersion: string;
  turnstileSiteKey?: string | undefined;
  config: CampaignFunnelConfig;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CampaignAnswers>(() => ({
    choices: {},
    // Every slider starts at its configured default so a visitor who taps
    // Continue without moving it still submits the band they were shown.
    sliders: Object.fromEntries(
      config.questions
        .filter((question) => question.kind === "slider")
        .map((question) => [question.id, (question as CampaignSliderQuestion).defaultValue])
    ),
    text: {}
  }));
  const [state, setState] = useState<FormState>({ kind: "idle" });
  // The state the property is in, asked on the contact screen of planner
  // campaigns. FL first because that is where this brokerage is licensed —
  // a fact the page states rather than something the list implies.
  const [propertyState, setPropertyState] = useState("FL");

  // The step list is derived from the answers, so the progress bar, the back
  // button, and conditional questions (the branch screen after military = yes)
  // can never disagree about which screens this funnel actually shows.
  const questionSteps = visibleQuestions(config, answers);
  const stepCount = questionSteps.length + 1; // + contact
  const contactStep = step >= questionSteps.length;
  const activeQuestion = contactStep ? undefined : questionSteps[step];

  const submissionRef = useRef<{
    id: string;
    fingerprint: string;
    firstTouch: LeadAttributionTouch;
    lastTouch: LeadAttributionTouch;
    conversionTouch: LeadAttributionTouch;
  } | null>(null);
  const rootRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const visitedRef = useRef(false);
  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;

  // Focus the new question and keep the card in view on every step change —
  // but not on first paint, where stealing focus from the page would be rude.
  useEffect(() => {
    if (!visitedRef.current) {
      visitedRef.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    const root = rootRef.current;
    if (root === null) return;
    const rect = root.getBoundingClientRect();
    if (rect.top < 0 || rect.top > window.innerHeight - 160) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }, [step]);

  useEffect(
    () => () => {
      if (advanceTimer.current !== undefined) window.clearTimeout(advanceTimer.current);
    },
    []
  );

  function scheduleAdvance() {
    if (advanceTimer.current !== undefined) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = undefined;
      setStep((current) => Math.min(current + 1, stepCount - 1));
    }, AUTO_ADVANCE_MS);
  }

  function advanceNow() {
    if (advanceTimer.current !== undefined) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = undefined;
    }
    setStep((current) => Math.min(current + 1, stepCount - 1));
  }

  function goBack() {
    if (advanceTimer.current !== undefined) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = undefined;
    }
    setStep((current) => Math.max(current - 1, 0));
  }

  function chooseAnswer(question: CampaignChoiceQuestion, value: string) {
    setAnswers((current) => ({
      ...current,
      choices: { ...current.choices, [question.id]: value }
    }));
    scheduleAdvance();
  }

  function setSlider(question: CampaignSliderQuestion, dollars: number) {
    setAnswers((current) => ({
      ...current,
      sliders: { ...current.sliders, [question.id]: dollars }
    }));
  }

  function setText(question: CampaignTextQuestion, value: string) {
    setAnswers((current) => ({
      ...current,
      text: { ...current.text, [question.id]: value }
    }));
  }

  function skipSlider(question: CampaignSliderQuestion) {
    setAnswers((current) => {
      const sliders = { ...current.sliders };
      delete sliders[question.id];
      return { ...current, sliders };
    });
    advanceNow();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Enter on an earlier screen means "next", not "submit".
    if (!contactStep) {
      const question = activeQuestion;
      // A slider always shows an answer, and the one text question is
      // optional by contract — so only an unanswered choice blocks Enter.
      const ready =
        question !== undefined &&
        (question.kind !== "choice" || answers.choices[question.id] !== undefined);
      if (ready) advanceNow();
      return;
    }
    if (state.kind === "submitting") return;
    setState({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    const consent = {
      privacyAccepted: form.get("privacyAccepted") === "on",
      contactRequested: true as const,
      smsMarketing: form.get("smsMarketing") === "on",
      emailMarketing: form.get("emailMarketing") === "on",
      disclosureVersion
    };
    // Bands and enumerated answers only; the mapping is the tested contract.
    const leadFields = campaignLeadFields(
      config,
      answers,
      config.planner === undefined ? undefined : propertyState
    );
    const core = {
      intent: config.intent,
      leadFields,
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      consent
    };
    // Same idempotency shape as lead-form.tsx: a retry of identical content
    // reuses the submissionId, an edit gets a fresh one.
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
      intent: config.intent,
      firstName: core.firstName,
      lastName: core.lastName,
      email: core.email,
      phone: core.phone,
      ...leadFields,
      consent,
      firstTouch: submission.firstTouch,
      lastTouch: submission.lastTouch,
      conversionTouch: submission.conversionTouch,
      turnstileToken: String(form.get("cf-turnstile-response") ?? "no-challenge-configured"),
      honeypot: String(form.get("company") ?? "")
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
        setState({ kind: "success", receiptId: result.data.receiptId });
        return;
      }
      setState({
        kind: "error",
        message: result.error.message,
        fieldMessages: serverFieldMessages(result.error.fields)
      });
      resetTurnstile();
      queueMicrotask(() => errorSummaryRef.current?.focus());
    } catch {
      setState({
        kind: "error",
        message: "We could not reach the server. Please check your connection and try again.",
        fieldMessages: []
      });
      resetTurnstile();
      queueMicrotask(() => errorSummaryRef.current?.focus());
    }
  }

  if (state.kind === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8 shadow-[var(--shadow-card)]"
      >
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full"
          style={{ background: "var(--purple-subtle)", color: "var(--purple)" }}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-[var(--text)]">We have your request</h2>
        <p className="mt-3 text-[var(--text-muted)]">
          {config.successBody ??
            "A licensed mortgage professional will reach out. Nothing has been submitted to a lender, no credit inquiry has been made, and you are not obligated to anything."}
        </p>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Reference{" "}
          <span className="font-mono text-[var(--text)]">{state.receiptId.slice(0, 8)}</span> — keep
          this if you need to follow up.
        </p>
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          In the meantime, the{" "}
          <a className="text-[var(--purple)] underline underline-offset-2" href="/calculators">
            calculators
          </a>{" "}
          run entirely in your browser if you want to explore scenarios.
        </p>
      </div>
    );
  }

  const progressPct = Math.round(((step + 1) / stepCount) * 100);
  const heading = contactStep
    ? "Where should we send your answer?"
    : (activeQuestion?.heading ?? "");
  const help = contactStep
    ? (config.contactHint ?? "A licensed mortgage professional will reach out about your options.")
    : activeQuestion?.help;

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base " +
    "min-h-[44px] focus:border-[var(--purple)]";

  const choiceCards = (question: CampaignChoiceQuestion) => {
    const selectedValue = answers.choices[question.id] ?? "";
    return (
      <fieldset className="mt-5">
        <legend className="sr-only">{question.heading}</legend>
        <div className={`grid gap-3 ${question.twoColumns === true ? "sm:grid-cols-2" : ""}`}>
          {question.options.map((option) => {
            const selected = option.value === selectedValue;
            return (
              <label
                key={option.value}
                className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--purple)]"
                style={{
                  borderColor: selected ? "var(--purple)" : "var(--border)",
                  background: selected ? "var(--purple-subtle)" : "var(--bg)"
                }}
              >
                {/* Real radio, visually hidden; the card is its label. */}
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={selected}
                  required
                  className="sr-only"
                  onChange={() => chooseAnswer(question, option.value)}
                  onClick={() => {
                    // Re-tapping the already-selected card still advances.
                    if (selected) scheduleAdvance();
                  }}
                />
                <span
                  aria-hidden="true"
                  className="flex size-5 shrink-0 items-center justify-center rounded-full border-2"
                  style={{ borderColor: selected ? "var(--purple)" : "var(--border)" }}
                >
                  {selected && (
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: "var(--purple)" }}
                    />
                  )}
                </span>
                <span>
                  <span className="block font-semibold text-[var(--text)]">{option.label}</span>
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
      </fieldset>
    );
  };

  const sliderScreen = (question: CampaignSliderQuestion) => {
    const dollars = answers.sliders[question.id] ?? question.defaultValue;
    return (
      <div className="mt-5">
        {/* The live figure is display only. Only the band it falls into is submitted. */}
        <p
          aria-live="polite"
          data-slider-value={question.id}
          className="text-center text-3xl font-bold text-[var(--text)]"
        >
          {usd.format(dollars)}
        </p>
        <input
          type="range"
          id={fieldId(question.id)}
          aria-label={question.heading}
          min={question.min}
          max={question.max}
          step={question.step}
          value={dollars}
          onChange={(event) => setSlider(question, Number(event.currentTarget.value))}
          className="mt-4 w-full accent-[var(--purple)]"
        />
        <div className="mt-1 flex justify-between text-xs text-[var(--text-muted)]">
          <span>{usd.format(question.min)}</span>
          <span>{usd.format(question.max)}</span>
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          A rough figure is all this is — only the range it falls in is shared with us.
        </p>
      </div>
    );
  };

  const textScreen = (question: CampaignTextQuestion) => (
    <div className="mt-5">
      <label htmlFor={fieldId(question.id)} className="sr-only">
        {question.heading}
      </label>
      <input
        id={fieldId(question.id)}
        type="text"
        // Deliberately unnamed-for-submission: the value travels through the
        // tested contract mapping into its bounded schema field, not FormData.
        value={answers.text[question.id] ?? ""}
        onChange={(event) => setText(question, event.currentTarget.value)}
        maxLength={question.maxLength}
        placeholder={question.placeholder}
        autoComplete="off"
        className={inputClass}
      />
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Optional — leave it blank if you'd rather not say, or aren't sure yet.
      </p>
    </div>
  );

  return (
    <form
      ref={rootRef}
      onSubmit={handleSubmit}
      data-form-id={formId}
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)] sm:p-8"
    >
      {/* Progress. Slim bar plus the plain-words position in the funnel. */}
      <div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "var(--border)" }}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={stepCount}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${stepCount}`}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progressPct}%`, background: "var(--purple)" }}
          />
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Step {step + 1} of {stepCount}
          </p>
        </div>
        {/* The framing that keeps this a marketing form stays on every screen. */}
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          This is not an application. We do not pull your credit from this form.
        </p>
      </div>

      {/* Screen-reader step announcement. */}
      <p aria-live="polite" role="status" className="sr-only">
        Step {step + 1} of {stepCount}: {heading}
      </p>

      {state.kind === "error" && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-5 rounded-lg border border-danger/40 bg-danger/5 p-4"
        >
          <p className="font-semibold text-danger">{state.message}</p>
          {state.fieldMessages.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-danger">
              {state.fieldMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Keyed so the entrance animation re-runs per step; the global
          prefers-reduced-motion rule zeroes it for readers who asked. */}
      <div key={step} className="animate-fade-up">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 text-xl font-bold outline-none sm:text-2xl"
        >
          {heading}
        </h2>
        {help !== undefined && <p className="mt-1 text-sm text-[var(--text-muted)]">{help}</p>}

        {activeQuestion?.kind === "choice" && choiceCards(activeQuestion)}
        {activeQuestion?.kind === "slider" && sliderScreen(activeQuestion)}
        {activeQuestion?.kind === "text" && textScreen(activeQuestion)}

        {contactStep && (
          <>
            {config.planner !== undefined && (
              <div className="mt-5">
                <label htmlFor={fieldId("propertyState")} className="text-sm font-semibold">
                  State the property is in
                </label>
                <select
                  id={fieldId("propertyState")}
                  name="propertyState"
                  value={propertyState}
                  onChange={(event) => setPropertyState(event.currentTarget.value)}
                  className={inputClass}
                >
                  {STATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={fieldId("firstName")} className="text-sm font-semibold">
                  First name
                </label>
                <input
                  id={fieldId("firstName")}
                  name="firstName"
                  autoComplete="given-name"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={fieldId("lastName")} className="text-sm font-semibold">
                  Last name
                </label>
                <input
                  id={fieldId("lastName")}
                  name="lastName"
                  autoComplete="family-name"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={fieldId("email")} className="text-sm font-semibold">
                  Email
                </label>
                <input
                  id={fieldId("email")}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={fieldId("phone")} className="text-sm font-semibold">
                  Phone
                </label>
                <input
                  id={fieldId("phone")}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="(813) 555-0147"
                  className={inputClass}
                />
              </div>
            </div>

            <fieldset className="mt-6 space-y-3 border-t border-[var(--border)] pt-5">
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
                  <a className="text-[var(--purple)] underline underline-offset-2" href="/privacy">
                    Privacy policy
                  </a>
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
              <TurnstileWidget className="mt-5" siteKey={turnstileSiteKey} action="lead" />
            )}
          </>
        )}
      </div>

      {/* Honeypot. Hidden from assistive technology and from tab order. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={fieldId("company")}>Company</label>
        <input id={fieldId("company")} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-6 flex items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--purple)] hover:text-[var(--text)]"
          >
            Back
          </button>
        )}
        {activeQuestion?.kind === "slider" && activeQuestion.optional === true && (
          <button
            type="button"
            onClick={() => skipSlider(activeQuestion)}
            className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--purple)] hover:text-[var(--text)]"
          >
            Skip
          </button>
        )}
        {activeQuestion?.kind === "slider" && (
          <Button
            type="button"
            onClick={() => {
              // Continue records what the screen shows, so a slider skipped on
              // a previous visit and then confirmed on this one is an answer.
              setSlider(
                activeQuestion,
                answers.sliders[activeQuestion.id] ?? activeQuestion.defaultValue
              );
              advanceNow();
            }}
            className="flex-1"
          >
            Continue
          </Button>
        )}
        {activeQuestion?.kind === "text" && (
          <Button type="button" onClick={advanceNow} className="flex-1">
            Continue
          </Button>
        )}
        {contactStep && (
          <Button type="submit" disabled={state.kind === "submitting"} className="flex-1">
            {state.kind === "submitting" ? "Sending…" : (config.submitLabel ?? "Request a call")}
          </Button>
        )}
      </div>
    </form>
  );
}
