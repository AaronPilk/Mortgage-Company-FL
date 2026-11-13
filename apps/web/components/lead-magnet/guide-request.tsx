"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY, safeLandingPath } from "@tract/analytics";
import type { LeadAttributionTouch } from "@tract/schemas";
import { Button } from "@/components/ui";
import { TurnstileWidget } from "@/components/turnstile-widget";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { readReferralSlug } from "@/lib/referral-browser";
import { resetTurnstile } from "@/lib/turnstile-browser";
import { EMAIL_CONSENT_TEXT, LEAD_DISCLOSURE_TEXT, LEAD_DISCLOSURE_VERSION } from "@/lib/site";

/**
 * Buyer's-guide request.
 *
 * A gated lead magnet. It is modeled on the marketing lead form but does not
 * reuse LeadForm, whose success view is a hard-coded "we'll call you" — here the
 * success state must instead hand the reader the guide. It posts to the same
 * /api/v1/leads endpoint with the first_time_buyer intent, so it inherits every
 * consent, dedupe, rate-limit, and bot-challenge guarantee that endpoint owns.
 *
 * It collects only what routes a follow-up: name, email, phone. It is not an
 * application, it never asks for a government identifier, an account number, an
 * income figure, or a document, and it must never be extended to (invariant 2).
 * The guide itself is not withheld on any real gate — a reader who submits sees
 * it immediately here and can also read it at guideHref — so the exchange is an
 * honest one.
 */

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; fields: Record<string, string[]> }
  | { kind: "success"; receiptId: string };

export function GuideRequest({
  guideHref,
  tableOfContents,
  turnstileSiteKey
}: {
  /** Where the on-page guide lives, revealed prominently on success. */
  guideHref: string;
  /** Section titles shown inline once the guide is unlocked. */
  tableOfContents: string[];
  turnstileSiteKey?: string | undefined;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const submissionRef = useRef<{
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
    const consent = {
      privacyAccepted: form.get("privacyAccepted") === "on",
      contactRequested: true as const,
      // This form has no SMS opt-in, so text-message marketing is never consented.
      smsMarketing: false as const,
      emailMarketing: form.get("emailMarketing") === "on",
      disclosureVersion: LEAD_DISCLOSURE_VERSION
    };
    const core = {
      intent: "first_time_buyer" as const,
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
      intent: core.intent,
      firstName: core.firstName,
      lastName: core.lastName,
      email: core.email,
      phone: core.phone,
      // A referral remembered from a /r/<agent> visit. The server re-checks it
      // against the public directory, so the browser only proposes it.
      referringAgentSlug: readReferralSlug(),
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
      setState({ kind: "error", message: result.error.message, fields: result.error.fields ?? {} });
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
        <h2 className="text-2xl font-bold text-[var(--text)]">Your guide is ready</h2>
        <p className="mt-3 text-[var(--text-muted)]">
          This is not an application, no credit inquiry has been made, and you are not obligated to
          anything. A licensed mortgage professional may follow up to answer questions — only if you
          want the help.
        </p>
        <div className="mt-6">
          <Link
            href={guideHref}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white"
            style={{
              background: "var(--purple)",
              boxShadow: "0 4px 14px var(--purple-glow)"
            }}
          >
            Read the full guide →
          </Link>
        </div>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--purple)]">
            What&apos;s inside
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-[var(--text-muted)]">
            {tableOfContents.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Reference{" "}
          <span className="font-mono text-[var(--text)]">{state.receiptId.slice(0, 8)}</span> — keep
          this if you want to follow up.
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
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)] sm:p-8"
      data-form-id="florida-buyers-guide"
    >
      <h2 className="text-2xl font-bold text-[var(--text)]">Get the free guide</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Tell us where to send it. This is not an application, and we do not pull your credit from
        this form.
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
            className="mt-0.5 size-5 shrink-0 accent-[var(--purple)]"
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
            name="emailMarketing"
            className="mt-0.5 size-5 shrink-0 accent-[var(--purple)]"
          />
          <span>{EMAIL_CONSENT_TEXT}</span>
        </label>
      </fieldset>

      {turnstileSiteKey !== undefined && (
        <TurnstileWidget className="mt-6" siteKey={turnstileSiteKey} action="lead" />
      )}

      <div className="mt-7">
        <Button type="submit" disabled={state.kind === "submitting"}>
          {state.kind === "submitting" ? "Sending…" : "Send me the guide"}
        </Button>
      </div>
    </form>
  );
}
