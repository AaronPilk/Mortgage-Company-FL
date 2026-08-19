"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY, safeLandingPath } from "@tract/analytics";
import type { LeadAttributionTouch, LeadIntent } from "@tract/schemas";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { resetTurnstile } from "@/lib/turnstile-browser";
import { TurnstileWidget } from "@/components/turnstile-widget";

/**
 * Homepage hero funnel: one question per screen, then contact details.
 *
 * This is the fast lane for organic homepage traffic — a few tappable
 * questions and a contact step — modeled on the chunked-funnel pattern the
 * owner asked for. It stays deliberately short: the full planner lives at
 * /plan, and the deeper ad-campaign funnels live in
 * components/campaign-funnel/ and are configured per campaign in
 * content/campaigns.ts.
 *
 * It is a MARKETING form, and every rule that binds components/lead-form.tsx
 * binds here: no government identifier, no date of birth, no account number,
 * no income documentation, no file upload — ever. Credit is a self-reported
 * band, never a score, and nothing here implies approval or prequalification.
 *
 * Submission mechanics mirror lead-form.tsx exactly: same endpoint, same
 * idempotent submissionId, same attribution touches, same honeypot, same
 * explicitly rendered Turnstile widget. Only the answers differ, and each of
 * them maps onto a field CreateLeadSchema already accepts.
 */

type ChoiceOption<T extends string> = { value: T; label: string; hint?: string };

type TimelineValue = "now" | "0_3_months" | "3_6_months" | "6_plus" | "researching";
type CreditBandValue =
  "below_580" | "580_619" | "620_679" | "680_719" | "720_759" | "760_plus" | "unknown";

/**
 * Step 1 maps straight onto LeadIntent values the schema already accepts.
 * "Sell my home" is connection framing only: TRACT is a mortgage brokerage
 * and does not list homes — the owner's real-estate network picks that
 * conversation up, which is exactly what the sell_home intent exists for.
 */
const INTENT_OPTIONS: ChoiceOption<
  Extract<LeadIntent, "purchase" | "refinance" | "first_time_buyer" | "sell_home">
>[] = [
  { value: "purchase", label: "Buy a home", hint: "I want financing for a purchase" },
  { value: "refinance", label: "Refinance", hint: "I already own and want to revisit my loan" },
  {
    value: "first_time_buyer",
    label: "Buy my first home",
    hint: "This would be my first mortgage"
  },
  { value: "sell_home", label: "Sell my home", hint: "I own and I'm ready to sell" }
];

/** Step 2 uses the Timeline enum verbatim; the labels are its honest reading. */
const TIMELINE_OPTIONS: ChoiceOption<TimelineValue>[] = [
  { value: "now", label: "As soon as possible" },
  { value: "0_3_months", label: "Within 3 months" },
  { value: "3_6_months", label: "3 to 6 months" },
  { value: "6_plus", label: "More than 6 months" },
  { value: "researching", label: "Just researching" }
];

/** Self-reported bands from CreditBandSchema. Never a score, never a pull. */
const CREDIT_OPTIONS: ChoiceOption<CreditBandValue>[] = [
  { value: "760_plus", label: "760 or above" },
  { value: "720_759", label: "720–759" },
  { value: "680_719", label: "680–719" },
  { value: "620_679", label: "620–679" },
  { value: "580_619", label: "580–619" },
  { value: "below_580", label: "Below 580" },
  { value: "unknown", label: "Not sure", hint: "That's fine — a rough guess is all this is" }
];

const AUTO_ADVANCE_MS = 220;
/**
 * Arrow-keying through the radio cards fires a change per keypress; whisking
 * the screen away 220ms after each one makes the options impossible to
 * compare. Keyboard browsing gets a longer window; a pointer tap (or an
 * explicit Enter/Space confirm) keeps the snappy delay.
 */
const KEYBOARD_AUTO_ADVANCE_MS = 900;

type StepKey = "intent" | "timeline" | "credit" | "contact";

/**
 * Friendly text for the server's field-level rejections, mirroring the map in
 * components/planner/planner.tsx. Unknown keys fall through to the server's
 * own message, which is still more actionable than a generic retry line.
 */
const SERVER_FIELD_TEXT: Record<string, string> = {
  turnstileToken: "The security check didn't complete. Please wait a moment and try again.",
  firstName: "Enter your first name.",
  lastName: "Enter your last name.",
  email: "Enter an email address we can reply to.",
  phone: "Enter a phone number with at least 10 digits.",
  consent: "Please confirm the permission checkbox so a licensed professional can contact you.",
  submissionId: "Something went wrong preparing the submission. Reload the page and try again.",
  intent: "Choose what you are trying to do on the first screen.",
  timeline: "Choose a timeframe on the timing screen.",
  estimatedCreditBand: "Choose a credit range — “Not sure” is fine."
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

type Answers = {
  intent: LeadIntent | "";
  timeline: TimelineValue | "";
  creditBand: CreditBandValue | "";
};

export function HomeFunnel({
  formId,
  disclosureText,
  smsConsentText,
  emailConsentText,
  disclosureVersion,
  turnstileSiteKey
}: {
  formId: string;
  disclosureText: string;
  smsConsentText: string;
  emailConsentText: string;
  disclosureVersion: string;
  turnstileSiteKey?: string | undefined;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    intent: "",
    timeline: "",
    creditBand: ""
  });
  const [state, setState] = useState<FormState>({ kind: "idle" });

  // A seller is never asked for a financing credit band.
  const skipCredit = answers.intent === "sell_home";

  // The step list is derived, not stated, so the progress bar, the submit
  // guard, and the screen order can never disagree about which questions this
  // instance of the funnel actually asks.
  const steps: StepKey[] = [
    "intent",
    "timeline",
    ...(skipCredit ? [] : (["credit"] as const)),
    "contact"
  ];
  const stepCount = steps.length;

  const stepHeadings: Record<StepKey, string> = {
    intent: "What are you trying to do?",
    timeline: "When are you hoping to do it?",
    credit: "Where do you think your credit sits?",
    contact: "Where should we send your answer?"
  };

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
  // True while the pending advance came from arrow-key browsing; consumed by
  // scheduleAdvance to pick the longer keyboard delay.
  const keyboardArrowRef = useRef(false);
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
    // Scroll only when the card has actually left the viewport; smooth unless
    // the reader has asked for reduced motion.
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

  // Focus the error summary when a submission failure lands. An effect, not a
  // microtask after setState: the microtask runs before React commits, so on
  // the first failure the summary has not rendered and the ref is still null.
  // Every failure produces a fresh state object, so this fires once per
  // failure and never on unrelated re-renders.
  useEffect(() => {
    if (state.kind === "error") errorSummaryRef.current?.focus();
  }, [state]);

  function scheduleAdvance() {
    if (advanceTimer.current !== undefined) window.clearTimeout(advanceTimer.current);
    const delayMs = keyboardArrowRef.current ? KEYBOARD_AUTO_ADVANCE_MS : AUTO_ADVANCE_MS;
    keyboardArrowRef.current = false;
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = undefined;
      setStep((current) => Math.min(current + 1, stepCount - 1));
    }, delayMs);
  }

  function goBack() {
    if (advanceTimer.current !== undefined) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = undefined;
    }
    setStep((current) => Math.max(current - 1, 0));
  }

  function choose<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    scheduleAdvance();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Enter on an earlier screen means "next", not "submit".
    const currentStep = steps[step];
    if (step < stepCount - 1) {
      const answered =
        (currentStep === "intent" && answers.intent !== "") ||
        (currentStep === "timeline" && answers.timeline !== "") ||
        (currentStep === "credit" && answers.creditBand !== "");
      if (answered) scheduleAdvance();
      return;
    }
    if (state.kind === "submitting") return;
    if (answers.intent === "") return;
    setState({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    const consent = {
      privacyAccepted: form.get("privacyAccepted") === "on",
      contactRequested: true as const,
      smsMarketing: form.get("smsMarketing") === "on",
      emailMarketing: form.get("emailMarketing") === "on",
      disclosureVersion
    };
    const core = {
      intent: answers.intent,
      timeline: answers.timeline || undefined,
      // A credit answer can survive a back-and-change to selling; a seller
      // lead never carries one.
      estimatedCreditBand: skipCredit ? undefined : answers.creditBand || undefined,
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
      intent: core.intent,
      firstName: core.firstName,
      lastName: core.lastName,
      email: core.email,
      phone: core.phone,
      stateCode: "FL",
      timeline: core.timeline,
      estimatedCreditBand: core.estimatedCreditBand,
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
    } catch {
      setState({
        kind: "error",
        message: "We could not reach the server. Please check your connection and try again.",
        fieldMessages: []
      });
      resetTurnstile();
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
          A licensed mortgage professional will reach out. Nothing has been submitted to a lender,
          no credit inquiry has been made, and you are not obligated to anything.
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
  const activeStep = steps[step] ?? "contact";
  const heading = stepHeadings[activeStep];

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base " +
    "min-h-[44px] focus:border-[var(--purple)]";

  const choiceCards = <T extends string>(
    name: keyof Answers,
    options: ChoiceOption<T>[],
    selectedValue: string,
    twoColumns = false
  ) => (
    <fieldset className="mt-5">
      <legend className="sr-only">{heading}</legend>
      <div className={`grid gap-3 ${twoColumns ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => {
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
                name={name}
                value={option.value}
                checked={selected}
                required
                className="sr-only"
                onChange={() => choose(name, option.value as Answers[typeof name])}
                onClick={() => {
                  // Re-tapping the already-selected card still advances.
                  if (selected) scheduleAdvance();
                }}
                onKeyDown={(event) => {
                  if (event.key.startsWith("Arrow")) {
                    keyboardArrowRef.current = true;
                    return;
                  }
                  // Enter or Space on the already-checked radio fires no
                  // change and no click, so after Back a keyboard user could
                  // never re-confirm the existing choice. Mirror the re-tap
                  // path; when unchecked, native behavior checks it and the
                  // change handler advances.
                  if ((event.key === "Enter" || event.key === " ") && event.currentTarget.checked) {
                    event.preventDefault();
                    scheduleAdvance();
                  }
                }}
              />
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2"
                style={{ borderColor: selected ? "var(--purple)" : "var(--border)" }}
              >
                {selected && (
                  <span className="size-2.5 rounded-full" style={{ background: "var(--purple)" }} />
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

        {activeStep === "intent" && choiceCards("intent", INTENT_OPTIONS, answers.intent)}
        {activeStep === "timeline" && choiceCards("timeline", TIMELINE_OPTIONS, answers.timeline)}
        {activeStep === "credit" && (
          <>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Your own rough sense is all we need. This is self-reported — never a credit check.
            </p>
            {choiceCards("creditBand", CREDIT_OPTIONS, answers.creditBand, true)}
          </>
        )}

        {activeStep === "contact" && (
          <>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              A licensed mortgage professional will reach out about your options.
            </p>
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
        {step === stepCount - 1 && (
          <Button type="submit" disabled={state.kind === "submitting"} className="flex-1">
            {state.kind === "submitting" ? "Sending…" : "Request a call"}
          </Button>
        )}
      </div>
    </form>
  );
}
