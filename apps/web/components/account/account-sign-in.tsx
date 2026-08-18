"use client";

import { useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui";

export function AccountSignIn({
  configured,
  supabaseUrl,
  anonKey,
  initialEmail = "",
  onSent
}: {
  configured: boolean;
  supabaseUrl?: string | undefined;
  anonKey?: string | undefined;
  /** Prefill only. The person can still change it before requesting the link. */
  initialEmail?: string;
  /**
   * Fires once when the link request succeeds, so a host (the account prompt
   * dialog) can show its own success surface. The request logic stays here —
   * this is a notification, not a handoff.
   */
  onSent?: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<"idle" | "requesting" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || supabaseUrl === undefined || anonKey === undefined) return;
    setState("requesting");
    const client = createBrowserClient(supabaseUrl, anonKey);
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/account");
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString(), shouldCreateUser: true }
    });
    setState(error === null ? "sent" : "error");
    if (error === null) onSent?.();
  }

  if (!configured) {
    return (
      <p className="text-[var(--text-muted)]" role="status">
        Account sign-in is not configured in this environment. The calculators, property examples,
        and Vision preview still work without an account.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Enter your email and we will ask Supabase Auth to send a one-time sign-in link. No password
        is stored by TRACT.
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
      <Button type="submit" disabled={state === "requesting" || state === "sent"}>
        {state === "requesting"
          ? "Requesting link…"
          : state === "sent"
            ? "Check your email"
            : "Email me a sign-in link"}
      </Button>
      {/* The account's consent surface: creating one means agreeing to the
          existing published terms and privacy policy. No new legal text here —
          the linked pages are the authority. */}
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
      <p className="text-sm text-[var(--text-muted)]" role="status">
        {state === "sent"
          ? "If the address can receive account email, the sign-in link has been requested. Return here after opening it."
          : state === "error"
            ? "The sign-in request could not be completed. Try again later."
            : ""}
      </p>
    </form>
  );
}
