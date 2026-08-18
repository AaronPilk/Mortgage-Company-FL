"use client";

import { useId, useRef, useState } from "react";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY } from "@tract/analytics";
import type { LeadAttributionTouch } from "@tract/schemas";
import type { VisionInput, VisionResult } from "@tract/vision-model";
import { Button } from "@/components/ui";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { trackVisionReportRequested } from "./analytics";

/**
 * Report request.
 *
 * This is the only place in Vision that asks for a contact detail, and it is
 * deliberately downstream of a working result: the preview is complete and
 * readable before this component is ever rendered.
 *
 * It posts the bounded model inputs—not client-calculated figures—to the Vision
 * report endpoint. The server re-runs the deterministic model and atomically
 * stores the lead, consent, attribution, project, scenario, draft report, and
 * CRM outbox event. That keeps durable Vision state reconstructable without
 * trusting a browser-authored financial result.
 */

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; fields: Record<string, string[]> }
  | { kind: "success"; receiptId: string };

export function VisionReportRequest({
  scenario,
  result,
  scenarioRef,
  disclosureText,
  disclosureVersion,
  smsConsentText,
  emailConsentText,
  turnstileSiteKey
}: {
  scenario: VisionInput;
  result: VisionResult;
  scenarioRef: string;
  disclosureText: string;
  disclosureVersion: string;
  smsConsentText: string;
  emailConsentText: string;
  turnstileSiteKey?: string | undefined;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const submissionIdentityRef = useRef<{
    id: string;
    fingerprint: string;
    firstTouch: LeadAttributionTouch;
    lastTouch: LeadAttributionTouch;
    conversionTouch: LeadAttributionTouch;
  } | null>(null);
  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "submitting") return;
    setState({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    const note = String(form.get("note") ?? "").trim();

    const core = {
      scenario,
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      timeline: form.get("timeline") ? String(form.get("timeline")) : undefined,
      ...(note === "" ? {} : { note }),
      consent: {
        privacyAccepted: form.get("privacyAccepted") === "on",
        contactRequested: true,
        smsMarketing: form.get("smsMarketing") === "on",
        emailMarketing: form.get("emailMarketing") === "on",
        disclosureVersion
      }
    };
    const fingerprint = JSON.stringify(core);
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

    const payload = {
      ...core,
      submissionId: submissionIdentity.id,
      firstTouch: submissionIdentity.firstTouch,
      lastTouch: submissionIdentity.lastTouch,
      conversionTouch: submissionIdentity.conversionTouch,
      turnstileToken: String(form.get("cf-turnstile-response") ?? "no-challenge-configured"),
      honeypot: String(form.get("company") ?? "")
    };

    try {
      const response = await fetch("/api/v1/vision/report-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as
        | { ok: true; data: { receiptId: string } }
        | { ok: false; error: { message: string; fields?: Record<string, string[]> } };

      if (body.ok) {
        trackVisionReportRequested(result.analysisType, scenarioRef);
        setState({ kind: "success", receiptId: body.data.receiptId });
        return;
      }
      setState({
        kind: "error",
        message: body.error.message,
        fields: body.error.fields ?? {}
      });
      queueMicrotask(() => errorSummaryRef.current?.focus());
    } catch {
      setState({
        kind: "error",
        message: "We could not reach the server. Please check your connection and try again.",
        fields: {}
      });
      queueMicrotask(() => errorSummaryRef.current?.focus());
    }
  }

  if (state.kind === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border p-8"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      >
        <h2 className="text-2xl font-bold text-[var(--text)]">We have your scenario</h2>
        <p className="mt-3 text-[var(--text-muted)]">
          A licensed mortgage professional will go through it with you and tell you which of the
          unverified items above actually matter for what you are trying to do. Nothing has been
          submitted to a lender, no credit inquiry has been made, and you are not obligated to
          anything.
        </p>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Reference{" "}
          <span className="font-mono text-[var(--text)]">{state.receiptId.slice(0, 8)}</span> — keep
          this if you need to follow up.
        </p>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          The figures you saw are still a model. They did not become an appraisal, a valuation, or
          an offer of credit by being sent to us.
        </p>
      </div>
    );
  }

  const errorFor = (field: string): string | undefined =>
    state.kind === "error" ? state.fields[field]?.[0] : undefined;

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base " +
    "min-h-[44px] text-[var(--text)] focus:border-[var(--purple)]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border p-6 sm:p-8"
      style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      data-form-id="vision-report"
    >
      <h2 className="text-2xl font-bold text-[var(--text)]">Get the full report</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        The preview above is yours and stays free. This sends the same scenario to a licensed
        mortgage professional who will work through the unverified items with you. It is not an
        application, and we do not pull your credit from this form.
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
          <label
            htmlFor={fieldId("firstName")}
            className="text-sm font-semibold text-[var(--text)]"
          >
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
          <label htmlFor={fieldId("lastName")} className="text-sm font-semibold text-[var(--text)]">
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
          <label htmlFor={fieldId("email")} className="text-sm font-semibold text-[var(--text)]">
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
          <label htmlFor={fieldId("phone")} className="text-sm font-semibold text-[var(--text)]">
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
      </div>

      <div className="mt-5">
        <label htmlFor={fieldId("timeline")} className="text-sm font-semibold text-[var(--text)]">
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

      <div className="mt-5">
        <label htmlFor={fieldId("note")} className="text-sm font-semibold text-[var(--text)]">
          Anything we should know?{" "}
          <span className="font-normal text-[var(--text-muted)]">(optional)</span>
        </label>
        <textarea
          id={fieldId("note")}
          name="note"
          rows={3}
          maxLength={600}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Your scenario and its assumptions are attached automatically. Please do not include your
          Social Security number, account numbers, or documents — those belong in the secure
          application system, not a web form.
        </p>
      </div>

      {/* Honeypot. Hidden from assistive technology and from tab order. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={fieldId("company")}>Company</label>
        <input id={fieldId("company")} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="mt-7 space-y-3 border-t border-[var(--border)] pt-6">
        <legend className="sr-only">Consent</legend>
        <label className="flex gap-3 text-sm text-[var(--text)]">
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
        <div
          className="mt-6 cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-action="vision_report"
        />
      )}

      <div className="mt-7">
        <Button type="submit" disabled={state.kind === "submitting"}>
          {state.kind === "submitting" ? "Sending…" : "Send me the full report"}
        </Button>
      </div>
    </form>
  );
}
