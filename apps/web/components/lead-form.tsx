"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY, safeLandingPath } from "@tract/analytics";
import type { LeadAttributionTouch, LeadIntent, PlanningSnapshot } from "@tract/schemas";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { resetTurnstile } from "@/lib/turnstile-browser";
import { TurnstileWidget } from "@/components/turnstile-widget";

/**
 * Marketing lead form.
 *
 * Deliberately short. It collects only what is needed to route a follow-up, and
 * it never collects the combination of elements that would make it an
 * application. There is no file upload, no Social Security number, no date of
 * birth, no income field, and no document field — and there must never be.
 *
 * Consent is modeled as two separate things: the request to be contacted about
 * this inquiry, and optional marketing-channel opt-ins. They are not bundled,
 * because a bundled consent is not a reliable consent.
 */

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; fields: Record<string, string[]> }
  | { kind: "success"; receiptId: string };

export function LeadForm({
  intent,
  formId,
  disclosureText,
  smsConsentText,
  emailConsentText,
  turnstileSiteKey,
  planningSnapshot,
  heading = "Talk to a mortgage professional",
  submitLabel = "Request a call"
}: {
  intent: LeadIntent;
  formId: string;
  disclosureText: string;
  smsConsentText: string;
  emailConsentText: string;
  turnstileSiteKey?: string | undefined;
  planningSnapshot?: PlanningSnapshot | undefined;
  heading?: string;
  submitLabel?: string;
}) {
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const submissionRef = useRef<{
    id: string;
    fingerprint: string;
    firstTouch: LeadAttributionTouch;
    lastTouch: LeadAttributionTouch;
    conversionTouch: LeadAttributionTouch;
  } | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "submitting") return;
    setState({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    const preferredContact = form.get("preferredContact")
      ? String(form.get("preferredContact"))
      : undefined;
    const timeline = form.get("timeline") ? String(form.get("timeline")) : undefined;
    const message = form.get("message") ? String(form.get("message")) : undefined;
    const consent = {
      privacyAccepted: form.get("privacyAccepted") === "on",
      contactRequested: true as const,
      smsMarketing: form.get("smsMarketing") === "on",
      emailMarketing: form.get("emailMarketing") === "on",
      disclosureVersion: "lead-disclosure@2026-08-17"
    };
    const core = {
      intent,
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      preferredContact,
      timeline,
      message,
      consent,
      planningSnapshot
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
      intent,
      firstName: core.firstName,
      lastName: core.lastName,
      email: core.email,
      phone: core.phone,
      preferredContact,
      timeline,
      message,
      planningSnapshot,
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
        fields: result.error.fields ?? {}
      });
      resetTurnstile();
      // Move focus to the summary so a screen reader user hears the problem
      // rather than being left at the submit button with no announcement.
      queueMicrotask(() => errorSummaryRef.current?.focus());
    } catch {
      setState({
        kind: "error",
        message: "We could not reach the server. Please check your connection and try again.",
        fields: {}
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
        <h2 className="text-2xl font-bold text-[var(--text)]">We have your request</h2>
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

  const errorFor = (field: string): string | undefined =>
    state.kind === "error" ? state.fields[field]?.[0] : undefined;

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base " +
    "min-h-[44px] focus:border-[var(--purple)]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)] sm:p-8"
      data-form-id={formId}
    >
      <h2 className="text-2xl font-bold">{heading}</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        This is not an application. We do not pull your credit from this form.
      </p>

      {state.kind === "error" && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 rounded-lg border border-danger/40 bg-danger/5 p-4"
        >
          <p className="font-semibold text-danger">{state.message}</p>
          {Object.keys(state.fields).length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-danger">
              {Object.entries(state.fields).map(([field, messages]) => (
                <li key={field}>
                  <a href={`#${fieldId(field)}`} className="underline underline-offset-2">
                    {messages[0]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          {/* Real labels above the input. Placeholders are examples, not labels. */}
          <label htmlFor={fieldId("firstName")} className="text-sm font-semibold">
            First name
          </label>
          <input
            id={fieldId("firstName")}
            name="firstName"
            autoComplete="given-name"
            required
            aria-invalid={errorFor("firstName") !== undefined}
            className={inputClass}
          />
          {errorFor("firstName") !== undefined && (
            <p className="mt-1 text-sm text-danger">{errorFor("firstName")}</p>
          )}
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
            aria-invalid={errorFor("lastName") !== undefined}
            className={inputClass}
          />
          {errorFor("lastName") !== undefined && (
            <p className="mt-1 text-sm text-danger">{errorFor("lastName")}</p>
          )}
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
            aria-invalid={errorFor("email") !== undefined}
            className={inputClass}
          />
          {errorFor("email") !== undefined && (
            <p className="mt-1 text-sm text-danger">{errorFor("email")}</p>
          )}
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
            aria-invalid={errorFor("phone") !== undefined}
            className={inputClass}
          />
          {errorFor("phone") !== undefined && (
            <p className="mt-1 text-sm text-danger">{errorFor("phone")}</p>
          )}
        </div>
        <div>
          <label htmlFor={fieldId("timeline")} className="text-sm font-semibold">
            Timeline <span className="font-normal text-[var(--text-muted)]">(optional)</span>
          </label>
          <select id={fieldId("timeline")} name="timeline" className={inputClass}>
            <option value="">Not sure yet</option>
            <option value="now">Ready now</option>
            <option value="0_3_months">Within 3 months</option>
            <option value="3_6_months">3 to 6 months</option>
            <option value="6_plus">More than 6 months</option>
            <option value="researching">Just researching</option>
          </select>
        </div>
        <div>
          <label htmlFor={fieldId("preferredContact")} className="text-sm font-semibold">
            Best way to reach you{" "}
            <span className="font-normal text-[var(--text-muted)]">(optional)</span>
          </label>
          <select id={fieldId("preferredContact")} name="preferredContact" className={inputClass}>
            <option value="">No preference</option>
            <option value="phone">Phone</option>
            <option value="sms">Text</option>
            <option value="email">Email</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={fieldId("message")} className="text-sm font-semibold">
          Anything we should know?{" "}
          <span className="font-normal text-[var(--text-muted)]">(optional)</span>
        </label>
        <textarea
          id={fieldId("message")}
          name="message"
          rows={3}
          maxLength={1500}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Please do not include your Social Security number, account numbers, or documents. Those
          belong in the secure application system, not a web form.
        </p>
      </div>

      {/* Honeypot. Hidden from assistive technology and from tab order. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={fieldId("company")}>Company</label>
        <input id={fieldId("company")} name="company" tabIndex={-1} autoComplete="off" />
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
        <TurnstileWidget className="mt-6" siteKey={turnstileSiteKey} action="lead" />
      )}

      <div className="mt-7">
        <Button type="submit" disabled={state.kind === "submitting"}>
          {state.kind === "submitting" ? "Sending…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
