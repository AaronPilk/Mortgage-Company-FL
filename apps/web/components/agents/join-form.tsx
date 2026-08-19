"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY, safeLandingPath } from "@tract/analytics";
import type { LeadAttributionTouch } from "@tract/schemas";
import { LEAD_DISCLOSURE_TEXT, LEAD_DISCLOSURE_VERSION } from "@/lib/site";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { resetTurnstile } from "@/lib/turnstile-browser";
import { TurnstileWidget } from "@/components/turnstile-widget";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Agent directory application.
 *
 * Two posts, in a fixed order, mirroring account creation
 * (components/account/account-sign-in.tsx): the consented CRM lead goes to
 * /api/v1/leads FIRST — the first-party write is authoritative — and only then
 * does the profile application go to /api/v1/agents/join. A validation
 * rejection from the lead endpoint stops the walk so a profile is never queued
 * around contact data the person still has to fix; any other lead failure
 * (5xx, network) does not block the application, because the server logs its
 * own side and the person's goal here is the directory.
 *
 * Consent is unbundled on purpose: the contact consent and the display consent
 * ("show my profile") are separate checkboxes agreeing to separate things, and
 * neither implies the other. There is no password anywhere in this flow, and
 * the form collects no government identifier, income figure, or document —
 * a Florida real-estate license number is a public professional credential,
 * not a personal identifier, and it is the one credential the directory is
 * about. Verification against state records happens on our side before any
 * profile ever claims it.
 */

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; fields: Record<string, string[]> }
  | { kind: "success"; status: string };

export function AgentJoinForm() {
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
    const consent = {
      privacyAccepted: form.get("privacyAccepted") === "on",
      contactRequested: true as const,
      smsMarketing: false,
      emailMarketing: false,
      disclosureVersion: LEAD_DISCLOSURE_VERSION
    };
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const core = {
      firstName: text("firstName"),
      lastName: text("lastName"),
      email: text("email"),
      phone: text("phone"),
      licenseNumber: text("licenseNumber"),
      brokerage: text("brokerage"),
      cities: text("cities"),
      bio: text("bio"),
      displayConsent: form.get("displayConsent") === "on",
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
    const turnstileToken = String(form.get("cf-turnstile-response") ?? "no-challenge-configured");
    const honeypot = String(form.get("company") ?? "");

    /*
     * Step 1 — the lead. Deliberately carries only contact identity and
     * consent: the license number, brokerage, and bio belong to the profile
     * application, not to the CRM lead.
     */
    const leadPayload = {
      submissionId: submission.id,
      intent: "agent_partner" as const,
      firstName: core.firstName,
      lastName: core.lastName,
      email: core.email,
      phone: core.phone,
      message: "Joined the agent directory.",
      consent,
      firstTouch: submission.firstTouch,
      lastTouch: submission.lastTouch,
      conversionTouch: submission.conversionTouch,
      turnstileToken,
      honeypot
    };

    try {
      const response = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload)
      });
      const result = (await response.json()) as
        | { ok: true; data: { receiptId: string } }
        | { ok: false; error: { message: string; fields?: Record<string, string[]> } };
      if (!result.ok && result.error.fields !== undefined) {
        setState({
          kind: "error",
          message: result.error.message,
          fields: result.error.fields
        });
        resetTurnstile();
        queueMicrotask(() => errorSummaryRef.current?.focus());
        return;
      }
      // Any other failure falls through: the application must not be blocked
      // by a CRM hiccup. The server logs its own side.
    } catch {
      // Network failure on the lead: same decision — proceed to the application.
    }

    /* Step 2 — the profile application. */
    const joinPayload = {
      submissionId: submission.id,
      firstName: core.firstName,
      lastName: core.lastName,
      email: core.email,
      phone: core.phone,
      licenseNumber: core.licenseNumber,
      ...(core.brokerage === "" ? {} : { brokerage: core.brokerage }),
      cities: core.cities,
      ...(core.bio === "" ? {} : { bio: core.bio }),
      displayConsent: core.displayConsent,
      turnstileToken,
      honeypot
    };

    try {
      const response = await fetch("/api/v1/agents/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload)
      });
      const result = (await response.json()) as
        | { ok: true; data: { agentId: string; slug: string; status: string } }
        | { ok: false; error: { message: string; fields?: Record<string, string[]> } };
      if (result.ok) {
        setState({ kind: "success", status: result.data.status });
        return;
      }
      setState({
        kind: "error",
        message: result.error.message,
        fields: result.error.fields ?? {}
      });
      resetTurnstile();
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
        <h2 className="text-2xl font-bold text-[var(--text)]">You&rsquo;re in the queue</h2>
        <p className="mt-3 text-[var(--text-muted)]">
          We review every profile before it goes live — including checking the license number you
          gave us against state records. Until that check completes, your profile shows
          &ldquo;License verification pending,&rdquo; because we only claim what we have verified.
        </p>
      </div>
    );
  }

  const errorFor = (field: string): string | undefined =>
    state.kind === "error" ? state.fields[field]?.[0] : undefined;

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base " +
    "min-h-[44px] focus:border-[var(--purple)]";

  const fieldError = (field: string) =>
    errorFor(field) === undefined ? null : (
      <p className="mt-1 text-sm text-danger">{errorFor(field)}</p>
    );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)] sm:p-8"
      data-form-id="agent-join"
    >
      <h2 className="text-2xl font-bold">Apply to join</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        We review every application before a profile goes live. Nothing here is published until you
        have consented and we have reviewed it.
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
          {fieldError("firstName")}
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
          {fieldError("lastName")}
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
          {fieldError("email")}
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
            aria-invalid={errorFor("phone") !== undefined}
            className={inputClass}
          />
          {fieldError("phone")}
        </div>
        <div>
          <label htmlFor={fieldId("licenseNumber")} className="text-sm font-semibold">
            Florida real estate license number
          </label>
          <input
            id={fieldId("licenseNumber")}
            name="licenseNumber"
            autoComplete="off"
            required
            aria-invalid={errorFor("licenseNumber") !== undefined}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            We verify it against state records before your profile claims anything.
          </p>
          {fieldError("licenseNumber")}
        </div>
        <div>
          <label htmlFor={fieldId("brokerage")} className="text-sm font-semibold">
            Brokerage <span className="font-normal text-[var(--text-muted)]">(optional)</span>
          </label>
          <input
            id={fieldId("brokerage")}
            name="brokerage"
            autoComplete="organization"
            aria-invalid={errorFor("brokerage") !== undefined}
            className={inputClass}
          />
          {fieldError("brokerage")}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={fieldId("cities")} className="text-sm font-semibold">
          Cities you serve
        </label>
        <input
          id={fieldId("cities")}
          name="cities"
          required
          placeholder="St. Petersburg, Tampa"
          aria-invalid={errorFor("cities") !== undefined}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">Separate cities with commas.</p>
        {fieldError("cities")}
      </div>

      <div className="mt-5">
        <label htmlFor={fieldId("bio")} className="text-sm font-semibold">
          Short bio <span className="font-normal text-[var(--text-muted)]">(optional)</span>
        </label>
        <textarea
          id={fieldId("bio")}
          name="bio"
          rows={3}
          maxLength={1000}
          aria-invalid={errorFor("bio") !== undefined}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          A few sentences about how you work. We review it before it appears anywhere.
        </p>
        {fieldError("bio")}
      </div>

      {/* Honeypot. Hidden from assistive technology and from tab order. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={fieldId("company")}>Company</label>
        <input id={fieldId("company")} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="mt-7 space-y-3 border-t border-[var(--border)] pt-6">
        <legend className="sr-only">Consent</legend>

        {/*
          Two consents agreeing to two different things, deliberately not
          bundled: being contacted about this application, and having a profile
          displayed publicly. Checking one must never imply the other.
        */}
        <label className="flex gap-3 text-sm">
          <input
            type="checkbox"
            name="privacyAccepted"
            required
            className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
          />
          <span>
            {LEAD_DISCLOSURE_TEXT}{" "}
            <a className="text-[var(--purple)] underline underline-offset-2" href="/privacy">
              Privacy policy
            </a>
            .
          </span>
        </label>

        <label className="flex gap-3 text-sm">
          <input
            type="checkbox"
            name="displayConsent"
            required
            className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
          />
          <span>
            Show my profile in the TRACT agent directory. Your name, brokerage, cities, bio, and
            license status appear publicly after review — never your phone number or email address.
          </span>
        </label>
      </fieldset>

      {TURNSTILE_SITE_KEY !== undefined && (
        <TurnstileWidget className="mt-6" siteKey={TURNSTILE_SITE_KEY} action="lead" />
      )}

      <div className="mt-7">
        <Button type="submit" disabled={state.kind === "submitting"}>
          {state.kind === "submitting" ? "Submitting…" : "Apply to join the directory"}
        </Button>
      </div>
    </form>
  );
}
