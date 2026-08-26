"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui";
import { MINIMUM_PASSWORD_LENGTH, passwordProblem } from "@/lib/password";
import {
  EMAIL_CONSENT_TEXT,
  LEAD_DISCLOSURE_TEXT,
  LEAD_DISCLOSURE_VERSION,
  SMS_CONSENT_TEXT
} from "@/lib/site";
import { FIRST_TOUCH_STORAGE_KEY, LAST_TOUCH_STORAGE_KEY, safeLandingPath } from "@tract/analytics";
import type { LeadAttributionTouch } from "@tract/schemas";
import {
  attributionTouch,
  currentAttributionTouch,
  readStoredTouch
} from "@/lib/attribution-browser";
import { resetTurnstile } from "@/lib/turnstile-browser";
import { TurnstileWidget } from "@/components/turnstile-widget";

export type AccountSignInMode = "create" | "signIn" | "reset";

/**
 * How a successful submission resolved:
 *  - "signed_in": Supabase returned a session. @supabase/ssr has already
 *    written it to cookies and this component has called router.refresh(), so
 *    server components see the signed-in state without a navigation.
 *  - "confirmation_email": sign-up succeeded but Supabase requires the email
 *    to be confirmed first (a dashboard setting); a confirmation link was
 *    requested and no session exists yet.
 */
export type AccountSignInOutcome = "signed_in" | "confirmation_email";

/**
 * Inlined at build time; the Turnstile site key is public by design (it
 * renders in the page markup for every visitor). Reading it here rather than
 * threading a prop keeps every host of this form — the account page, the
 * prompt dialog, the planner — from having to know about Turnstile at all.
 */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Email + password account entry, in three modes:
 *
 *  - "create": a full lead-capture sign-up. Creating an account is also a
 *    consented CRM lead — the owner's requirement is that every account
 *    carries a name, a phone, an email, and contact consent — so this mode
 *    collects the same fields and the same three unbundled consent checkboxes
 *    as the lead forms, posts /api/v1/leads FIRST (the first-party write is
 *    authoritative), and only then calls Supabase signUp.
 *  - "signIn": email + password, with a quiet path into "reset".
 *  - "reset": email only; asks Supabase to send a password reset link that
 *    lands on /auth/update-password via the Auth callback.
 *
 * The password lives in component state exactly long enough to hand it to
 * Supabase Auth — it is never logged, stored, sent to the lead endpoint, or
 * sent anywhere else. Auth error messages come from Supabase verbatim, so this
 * component never reveals more about whether an email exists than Supabase
 * itself chooses to.
 */
export function AccountSignIn({
  configured,
  supabaseUrl,
  anonKey,
  initialEmail = "",
  defaultMode = "create",
  nextPath = "/account",
  onSuccess
}: {
  configured: boolean;
  supabaseUrl?: string | undefined;
  anonKey?: string | undefined;
  /** Prefill only. The person can still change it before submitting. */
  initialEmail?: string;
  /** Which form to show first; the person can toggle freely. */
  defaultMode?: Extract<AccountSignInMode, "create" | "signIn">;
  /** Where to land after auth (default /account). Threaded from the host page. */
  nextPath?: string;
  /**
   * Fires once per successful submission so a host (the account prompt
   * dialog) can show its own success surface. The auth logic stays here —
   * this is a notification, not a handoff.
   */
  onSuccess?: (outcome: AccountSignInOutcome) => void;
}) {
  const router = useRouter();
  const baseId = useId();
  const [mode, setMode] = useState<AccountSignInMode>(defaultMode);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "working" | "signedIn" | "confirmationSent" | "resetSent"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  /**
   * Same retry mechanics as the lead form: an unchanged retry reuses the same
   * submissionId so the server-side idempotency dedupe holds across a failure.
   */
  const submissionRef = useRef<{
    id: string;
    fingerprint: string;
    firstTouch: LeadAttributionTouch;
    lastTouch: LeadAttributionTouch;
    conversionTouch: LeadAttributionTouch;
  } | null>(null);

  const fieldId = (name: string) => `${baseId}-${name}`;
  const errorFor = (field: string): string | undefined => fieldErrors[field]?.[0];

  function switchMode(next: AccountSignInMode) {
    setMode(next);
    setPassword("");
    setError(null);
    setFieldErrors({});
    setStatus("idle");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || supabaseUrl === undefined || anonKey === undefined) return;
    if (status === "working") return;
    // Read before any await: React may recycle the event after this handler
    // yields, and the Turnstile token and consent checkboxes live in the DOM.
    const form = new FormData(event.currentTarget);
    setError(null);
    setFieldErrors({});

    if (mode === "create") {
      const problem = passwordProblem(password);
      if (problem !== null) {
        setError(problem);
        return;
      }
    }

    setStatus("working");
    const client = createBrowserClient(supabaseUrl, anonKey);
    const callback = new URL("/auth/callback", window.location.origin);

    if (mode === "signIn") {
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError !== null) {
        setStatus("idle");
        setError(signInError.message);
        return;
      }
      setStatus("signedIn");
      // The session cookie is set; refresh so server components render the
      // signed-in state (AI unlocked, /account populated) without navigating.
      router.refresh();
      onSuccess?.("signed_in");
      return;
    }

    if (mode === "create") {
      /*
       * Step 1 — the lead. The first-party write is authoritative: the person
       * in front of us has just given their name, phone, email, and contact
       * consent, and that capture must not depend on Supabase Auth being up.
       * The password is deliberately absent from everything in this block.
       */
      const consent = {
        privacyAccepted: form.get("privacyAccepted") === "on",
        contactRequested: true as const,
        smsMarketing: form.get("smsMarketing") === "on",
        emailMarketing: form.get("emailMarketing") === "on",
        disclosureVersion: LEAD_DISCLOSURE_VERSION
      };
      const core = { firstName, lastName, email, phone, consent };
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
        intent: "general" as const,
        firstName,
        lastName,
        email,
        phone,
        message: "Created a TRACT account.",
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
        if (!result.ok && result.error.fields !== undefined) {
          // A validation rejection (bad phone, failed challenge) is the
          // person's to fix before an account exists around the bad data.
          setStatus("idle");
          setError(result.error.message);
          setFieldErrors(result.error.fields);
          resetTurnstile();
          return;
        }
        // Any other failure (5xx, malformed body) falls through: an account
        // must not be blocked by a CRM hiccup. The server logs its own side.
      } catch {
        // Network failure: same decision — proceed to account creation.
      }

      /*
       * Step 2 — the account. Name and phone ride in user metadata so the
       * account itself carries what the lead captured.
       */
      callback.searchParams.set("next", nextPath);
      const { data, error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callback.toString(),
          data: { first_name: firstName, last_name: lastName, phone }
        }
      });
      if (signUpError !== null) {
        setStatus("idle");
        setError(signUpError.message);
        // The lead POST consumed the token; a visible retry needs a fresh one.
        resetTurnstile();
        return;
      }
      if (data.session !== null) {
        setStatus("signedIn");
        router.refresh();
        onSuccess?.("signed_in");
        return;
      }
      // A user without a session means Supabase wants the email confirmed
      // before the first sign-in — a project-level dashboard setting.
      setStatus("confirmationSent");
      onSuccess?.("confirmation_email");
      return;
    }

    callback.searchParams.set("next", "/auth/update-password");
    const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: callback.toString()
    });
    if (resetError !== null) {
      setStatus("idle");
      setError(resetError.message);
      return;
    }
    setStatus("resetSent");
  }

  if (!configured) {
    return (
      <p className="text-[var(--text-muted)]" role="status">
        Account sign-in is not configured in this environment. The calculators, property examples,
        and Vision preview still work without an account.
      </p>
    );
  }

  if (status === "signedIn") {
    return (
      <p className="font-semibold" role="status">
        You&rsquo;re in.
      </p>
    );
  }

  if (status === "confirmationSent") {
    return (
      <p className="text-sm text-[var(--text-muted)]" role="status">
        Check your email to confirm your account — one time only, then you sign in with your
        password.
      </p>
    );
  }

  const inputClass =
    "mt-2 min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4";
  const fieldMessage = (field: string) =>
    errorFor(field) === undefined ? null : (
      <span className="mt-1.5 block text-xs font-normal text-danger">{errorFor(field)}</span>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        {mode === "create"
          ? "Create a free account so a licensed professional can follow up on what you save. TRACT never sees the password — Supabase Auth stores it."
          : mode === "signIn"
            ? "Sign in with your email and password."
            : "Forgot your password? We’ll email you a link to set a new password."}
      </p>

      {mode === "create" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold" htmlFor={fieldId("firstName")}>
            First name
            <input
              id={fieldId("firstName")}
              name="firstName"
              required
              autoComplete="given-name"
              maxLength={80}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              aria-invalid={errorFor("firstName") !== undefined}
              className={inputClass}
            />
            {fieldMessage("firstName")}
          </label>
          <label className="block text-sm font-semibold" htmlFor={fieldId("lastName")}>
            Last name
            <input
              id={fieldId("lastName")}
              name="lastName"
              required
              autoComplete="family-name"
              maxLength={80}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              aria-invalid={errorFor("lastName") !== undefined}
              className={inputClass}
            />
            {fieldMessage("lastName")}
          </label>
        </div>
      )}

      <label className="block text-sm font-semibold" htmlFor={fieldId("email")}>
        Email address
        <input
          id={fieldId("email")}
          name="email"
          required
          type="email"
          autoComplete="email"
          maxLength={320}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={errorFor("email") !== undefined}
          className={inputClass}
        />
        {fieldMessage("email")}
      </label>

      {mode === "create" && (
        <label className="block text-sm font-semibold" htmlFor={fieldId("phone")}>
          Phone
          <input
            id={fieldId("phone")}
            name="phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={32}
            placeholder="(813) 555-0147"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            aria-invalid={errorFor("phone") !== undefined}
            className={inputClass}
          />
          {fieldMessage("phone")}
        </label>
      )}

      {mode !== "reset" && (
        <label className="block text-sm font-semibold" htmlFor={fieldId("password")}>
          Password
          <input
            id={fieldId("password")}
            name="password"
            required
            type="password"
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            minLength={mode === "create" ? MINIMUM_PASSWORD_LENGTH : undefined}
            maxLength={200}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
          {mode === "create" && (
            <span className="mt-1.5 block text-xs font-normal text-[var(--text-muted)]">
              At least {MINIMUM_PASSWORD_LENGTH} characters.
            </span>
          )}
        </label>
      )}

      {mode === "create" && (
        <>
          {/* Honeypot. Hidden from assistive technology and from tab order. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor={fieldId("company")}>Company</label>
            <input id={fieldId("company")} name="company" tabIndex={-1} autoComplete="off" />
          </div>

          {/*
            The same three unbundled consents as every lead form, verbatim from
            @/lib/site. The privacy/contact consent is required — an account is
            a consented lead or it is not created — and the marketing channels
            stay separate and optional; their not-a-condition language lives
            inside the constants.
          */}
          <fieldset className="space-y-3 border-t border-[var(--border)] pt-4">
            <legend className="sr-only">Consent</legend>
            <label className="flex gap-3 text-sm font-normal">
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
            <label className="flex gap-3 text-sm font-normal text-[var(--text-muted)]">
              <input
                type="checkbox"
                name="smsMarketing"
                className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
              />
              <span>{SMS_CONSENT_TEXT}</span>
            </label>
            <label className="flex gap-3 text-sm font-normal text-[var(--text-muted)]">
              <input
                type="checkbox"
                name="emailMarketing"
                className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
              />
              <span>{EMAIL_CONSENT_TEXT}</span>
            </label>
          </fieldset>

          {TURNSTILE_SITE_KEY !== undefined && (
            <div data-testid="account-turnstile">
              {/* The lead endpoint verifies action "lead"; sign-up posts a lead first. */}
              <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} action="lead" />
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={status === "working" || status === "resetSent"}>
          {mode === "create"
            ? status === "working"
              ? "Creating account…"
              : "Create my account"
            : mode === "signIn"
              ? status === "working"
                ? "Signing in…"
                : "Sign in"
              : status === "working"
                ? "Requesting link…"
                : status === "resetSent"
                  ? "Check your email"
                  : "Email me a reset link"}
        </Button>
        {mode === "signIn" && (
          <button
            type="button"
            onClick={() => switchMode("reset")}
            className="text-sm font-semibold text-[var(--purple)] underline underline-offset-2"
          >
            Forgot password?
          </button>
        )}
      </div>

      {mode === "create" && (
        /* The account's standing consent surface: creating one means agreeing
           to the existing published terms and privacy policy. No new legal
           text here — the linked pages are the authority. */
        <p className="text-xs text-[var(--text-muted)]">
          By creating an account you agree to the{" "}
          <a className="text-[var(--purple)] underline underline-offset-2" href="/terms">
            terms of use
          </a>{" "}
          and the{" "}
          <a className="text-[var(--purple)] underline underline-offset-2" href="/privacy">
            privacy policy
          </a>
          .
        </p>
      )}

      {error !== null && (
        <div role="alert" className="text-sm font-semibold text-danger">
          <p>{error}</p>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-2 list-disc pl-5 font-normal">
              {Object.entries(fieldErrors).map(([field, messages]) => (
                <li key={field}>{messages[0]}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {status === "resetSent" && (
        <p className="text-sm text-[var(--text-muted)]" role="status">
          If that address has an account, a password reset link has been requested. Open it to set a
          new password, then sign in here.
        </p>
      )}

      <p className="text-sm text-[var(--text-muted)]">
        {mode === "create" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signIn")}
              className="font-semibold text-[var(--purple)] underline underline-offset-2"
            >
              Sign in
            </button>
          </>
        ) : mode === "signIn" ? (
          <>
            New here?{" "}
            <button
              type="button"
              onClick={() => switchMode("create")}
              className="font-semibold text-[var(--purple)] underline underline-offset-2"
            >
              Create an account
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => switchMode("signIn")}
            className="font-semibold text-[var(--purple)] underline underline-offset-2"
          >
            Back to sign in
          </button>
        )}
      </p>
    </form>
  );
}
