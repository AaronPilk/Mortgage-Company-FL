"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui";
import { MINIMUM_PASSWORD_LENGTH, passwordProblem } from "@/lib/password";

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
 * Email + password account entry, in three modes:
 *
 *  - "create": email + password with the standing terms/privacy consent line.
 *  - "signIn": email + password, with a quiet path into "reset".
 *  - "reset": email only; asks Supabase to send a password reset link that
 *    lands on /auth/update-password via the Auth callback.
 *
 * The password lives in component state exactly long enough to hand it to
 * Supabase Auth — it is never logged, stored, or sent anywhere else. Error
 * messages come from Supabase verbatim, so this component never reveals more
 * about whether an email exists than Supabase itself chooses to.
 */
export function AccountSignIn({
  configured,
  supabaseUrl,
  anonKey,
  initialEmail = "",
  defaultMode = "create",
  onSuccess
}: {
  configured: boolean;
  supabaseUrl?: string | undefined;
  anonKey?: string | undefined;
  /** Prefill only. The person can still change it before submitting. */
  initialEmail?: string;
  /** Which form to show first; the person can toggle freely. */
  defaultMode?: Extract<AccountSignInMode, "create" | "signIn">;
  /**
   * Fires once per successful submission so a host (the account prompt
   * dialog) can show its own success surface. The auth logic stays here —
   * this is a notification, not a handoff.
   */
  onSuccess?: (outcome: AccountSignInOutcome) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AccountSignInMode>(defaultMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "working" | "signedIn" | "confirmationSent" | "resetSent"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: AccountSignInMode) {
    setMode(next);
    setPassword("");
    setError(null);
    setStatus("idle");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || supabaseUrl === undefined || anonKey === undefined) return;
    if (status === "working") return;
    setError(null);

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
      callback.searchParams.set("next", "/account");
      const { data, error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callback.toString() }
      });
      if (signUpError !== null) {
        setStatus("idle");
        setError(signUpError.message);
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        {mode === "create"
          ? "Create a free account with your email and a password. TRACT never sees the password — Supabase Auth stores it."
          : mode === "signIn"
            ? "Sign in with your email and password."
            : "Forgot your password? We’ll email you a link to set a new password."}
      </p>

      <label className="block text-sm font-semibold">
        Email address
        <input
          required
          type="email"
          autoComplete="email"
          maxLength={320}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4"
        />
      </label>

      {mode !== "reset" && (
        <label className="block text-sm font-semibold">
          Password
          <input
            required
            type="password"
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            minLength={mode === "create" ? MINIMUM_PASSWORD_LENGTH : undefined}
            maxLength={200}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4"
          />
          {mode === "create" && (
            <span className="mt-1.5 block text-xs font-normal text-[var(--text-muted)]">
              At least {MINIMUM_PASSWORD_LENGTH} characters.
            </span>
          )}
        </label>
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
        /* The account's consent surface: creating one means agreeing to the
           existing published terms and privacy policy. No new legal text here —
           the linked pages are the authority. */
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
        <p className="text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
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
