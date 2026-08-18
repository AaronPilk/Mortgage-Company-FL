"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button, ButtonLink } from "@/components/ui";
import { MINIMUM_PASSWORD_LENGTH, passwordProblem } from "@/lib/password";

/**
 * Sets a new password on an already-recovered session.
 *
 * The server page behind this form has verified that a session exists — the
 * reset link landed through /auth/callback, which exchanged the recovery code
 * for cookies. All this form does is hand the new password to Supabase Auth
 * via updateUser; the password itself is never logged or persisted here.
 */
export function UpdatePasswordForm({
  supabaseUrl,
  anonKey
}: {
  supabaseUrl: string;
  anonKey: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "working") return;
    setError(null);
    const problem = passwordProblem(password);
    if (problem !== null) {
      setError(problem);
      return;
    }
    setStatus("working");
    const client = createBrowserClient(supabaseUrl, anonKey);
    const { error: updateError } = await client.auth.updateUser({ password });
    if (updateError !== null) {
      setStatus("idle");
      setError(updateError.message);
      return;
    }
    setPassword("");
    setStatus("done");
    router.refresh();
  }

  if (status === "done") {
    return (
      <div className="space-y-4" role="status">
        <p className="font-semibold">Your password is set.</p>
        <p className="text-sm text-[var(--text-muted)]">
          You are signed in, and this password is what you use from now on.
        </p>
        <ButtonLink href="/account">Go to your account</ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold">
        New password
        <input
          required
          type="password"
          autoComplete="new-password"
          minLength={MINIMUM_PASSWORD_LENGTH}
          maxLength={200}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4"
        />
        <span className="mt-1.5 block text-xs font-normal text-[var(--text-muted)]">
          At least {MINIMUM_PASSWORD_LENGTH} characters.
        </span>
      </label>
      <Button type="submit" disabled={status === "working"}>
        {status === "working" ? "Saving…" : "Set new password"}
      </Button>
      {error !== null && (
        <p className="text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
