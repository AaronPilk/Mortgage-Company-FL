"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * A slim, dismissible nudge for signed-out visitors. It is an invitation, not
 * a gate: dismissing it never hides a result or disables a control, and the
 * dismissal is plain component state — it comes back on the next visit, which
 * is the owner's stated intent ("keep asking"), and nothing about the choice
 * is stored anywhere.
 */
export function AccountNudgeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="mt-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p style={{ color: "var(--text-muted)" }}>
        <Link
          href="/account"
          className="font-semibold text-[var(--purple)] underline underline-offset-2"
        >
          Create a free account
        </Link>{" "}
        to save searches and homes.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss account suggestion"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--purple-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--purple)]"
        style={{ color: "var(--text-muted)" }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="h-3.5 w-3.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
      </button>
    </div>
  );
}
