"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY, safeLandingPath } from "@tract/analytics";
import type { LeadAttributionTouch } from "@tract/schemas";
import {
  EMAIL_CONSENT_TEXT,
  LEAD_DISCLOSURE_TEXT,
  LEAD_DISCLOSURE_VERSION,
  SMS_CONSENT_TEXT
} from "@/lib/site";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { resetTurnstile } from "@/lib/turnstile-browser";
import { TurnstileWidget } from "@/components/turnstile-widget";

/**
 * Inlined at build time; the Turnstile site key is public by design — it
 * renders in the page markup for every visitor.
 */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Introduction request — the centerpiece of an agent profile.
 *
 * The consumer never receives the agent's contact details, by design: this form
 * creates a TRACT lead (intent "agent_introduction") and a TRACT team member
 * personally makes the introduction. That is why the message is a fixed,
 * server-recognizable sentence naming the agent slug rather than free text, and
 * why there is deliberately no message field at all — the form collects only
 * what routing the introduction requires.
 *
 * Mechanics mirror components/lead-form.tsx: an unchanged retry reuses the same
 * submissionId so server-side idempotency holds across a failure, attribution
 * touches ride along, the honeypot must arrive empty, and consent is the same
 * three unbundled checkboxes as every lead form.
 */

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; fields: Record<string, string[]> }
  | { kind: "success" };

export function AgentIntroductionForm({
  agentSlug,
  agentFirstName,
  cities
}: {
  agentSlug: string;
  agentFirstName: string;
  /** The agent's comma-separated city list, echoed into the lead message. */
  cities: string;
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
    const consent = {
      privacyAccepted: form.get("privacyAccepted") === "on",
      contactRequested: true as const,
      smsMarketing: form.get("smsMarketing") === "on",
      emailMarketing: form.get("emailMarketing") === "on",
      disclosureVersion: LEAD_DISCLOSURE_VERSION
    };
    const core = {
      intent: "agent_introduction",
      agentSlug,
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
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
      intent: "agent_introduction" as const,
      firstName: core.firstName,
      lastName: core.lastName,
      email: core.email,
      phone: core.phone,
      message: `Requested an introduction to agent ${agentSlug} (${cities})`,
      // The profile being viewed is the referring agent for this lead. The
      // server only honors it as a CRM tag when the slug resolves to a
      // consenting partner, so an unclaimed public-record profile still routes
      // the introduction but adds no partner attribution.
      referringAgentSlug: agentSlug,
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
        setState({ kind: "success" });
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
        <h3 className="text-2xl font-bold text-[var(--text)]">We have your request</h3>
        <p className="mt-3 text-[var(--text-muted)]">
          A TRACT team member will reach out and personally make the introduction. Your contact
          details go to TRACT, not to the agent, until you say so.
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
      data-form-id="agent-introduction"
    >
      <h3 className="text-2xl font-bold">
        Want to work with {agentFirstName}? We&rsquo;ll introduce you.
      </h3>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Tell us how to reach you and a TRACT team member makes the introduction personally. This is
        not an application, and we do not pull your credit from this form.
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
            aria-invalid={errorFor("phone") !== undefined}
            className={inputClass}
          />
          {errorFor("phone") !== undefined && (
            <p className="mt-1 text-sm text-danger">{errorFor("phone")}</p>
          )}
        </div>
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
            {LEAD_DISCLOSURE_TEXT}{" "}
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
          <span>{SMS_CONSENT_TEXT}</span>
        </label>

        <label className="flex gap-3 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            name="emailMarketing"
            className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
          />
          <span>{EMAIL_CONSENT_TEXT}</span>
        </label>
      </fieldset>

      {TURNSTILE_SITE_KEY !== undefined && (
        <TurnstileWidget className="mt-6" siteKey={TURNSTILE_SITE_KEY} action="lead" />
      )}

      <div className="mt-7">
        <Button type="submit" disabled={state.kind === "submitting"}>
          {state.kind === "submitting" ? "Sending…" : "Request an introduction"}
        </Button>
      </div>
    </form>
  );
}
