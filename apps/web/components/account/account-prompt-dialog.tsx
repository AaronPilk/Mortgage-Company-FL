"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui";
import { AccountSignIn, type AccountSignInOutcome } from "./account-sign-in";

/**
 * The one account-creation prompt for signed-out visitors.
 *
 * Every "this needs an account" moment on the properties surface — AI search,
 * saving a search, saving a home, the nudge banner — opens this same dialog,
 * so the invitation looks and behaves identically wherever it appears. Only
 * the words change: each trigger names its own benefit, because "sign in"
 * without a reason is a demand, not an offer.
 *
 * The email + password form itself is `AccountSignIn` — this component owns
 * no auth logic, only the modal shell and the success state around it. Two
 * successes exist: an instant session (password sign-in, or sign-up with
 * confirmation disabled) shows a brief "You're in." and closes on its own,
 * because `AccountSignIn` has already refreshed the router and the page
 * behind the dialog is now signed in; a sign-up that needs email
 * confirmation stays open with the check-your-email explanation.
 *
 * Accessibility, in full, because a modal that traps a pointer but not a
 * keyboard is a wall for exactly the people who cannot route around it:
 * role="dialog" + aria-modal, labelled by its own headline; focus moves into
 * the dialog on open, Tab cycles inside it, Escape and the backdrop close it,
 * and focus returns to the trigger on close. Body scroll is locked while open.
 * The entrance animation uses `animate-fade-up`, which globals.css already
 * reduces to nothing under prefers-reduced-motion.
 *
 * Rendered through a portal: triggers live inside cards whose hover transform
 * would otherwise become the containing block for a fixed overlay.
 */

function focusablesIn(panel: HTMLElement | null): HTMLElement[] {
  return Array.from(
    panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    ) ?? []
  );
}

export function AccountPromptDialog({
  open,
  onClose,
  eyebrow = "Free account",
  headline,
  body,
  note,
  configured,
  supabaseUrl,
  anonKey
}: {
  open: boolean;
  onClose: () => void;
  /** Small badge above the headline. */
  eyebrow?: string;
  /** Names the benefit, e.g. "Unlock AI search". Also the dialog's accessible name. */
  headline: string;
  /** One or two sentences on what the account actually gets this person. */
  body: string;
  /** Optional extra line, e.g. the honest scope of the AI perk. */
  note?: string;
  configured: boolean;
  supabaseUrl?: string | undefined;
  anonKey?: string | undefined;
}) {
  const headingId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [outcome, setOutcome] = useState<AccountSignInOutcome | null>(null);

  // The parent recreates onClose every render (router.refresh() included), so
  // effects read the latest via this ref instead of depending on its identity —
  // a mid-dialog re-render must never tear down and re-run the focus lifecycle.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Portals cannot render during SSR; the dialog only exists after mount.
  useEffect(() => setMounted(true), []);

  // A fresh open starts at the form, not at a stale success message.
  useEffect(() => {
    if (open) setOutcome(null);
  }, [open]);

  // An instant session needs no further action from the person: show the
  // brief success state, then close so they land back on the now-unlocked
  // page. The confirmation-email outcome stays open — it carries instructions.
  useEffect(() => {
    if (!open || outcome !== "signed_in") return;
    const timer = window.setTimeout(() => onCloseRef.current(), 1800);
    return () => window.clearTimeout(timer);
  }, [open, outcome]);

  // Focus lifecycle, keyed on `open` alone: capture where focus came from,
  // lock body scroll, move focus in, and undo both on close. Anything else in
  // the deps would re-run this mid-dialog — recapturing "previous focus" from
  // inside the panel and dropping the real trigger on final close.
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Initial focus lands on the email field when the form is up, otherwise on
    // the first focusable control (the close button).
    const email = panelRef.current?.querySelector<HTMLElement>('input[type="email"]');
    (email ?? focusablesIn(panelRef.current)[0] ?? panelRef.current)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // The keyboard trap, separate from the lifecycle above so re-attaching a
  // listener never re-runs focus capture. The handler reads the latest onClose
  // through the ref.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusablesIn(panelRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (first === undefined || last === undefined) return;
      const active = document.activeElement;
      // Both directions wrap when focus has escaped the panel entirely (e.g.
      // the focused control was removed by a state change), not just at the
      // edges — otherwise a forward Tab from outside walks the page behind.
      const outsidePanel = !panelRef.current?.contains(active);
      if (event.shiftKey && (active === first || outsidePanel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outsidePanel)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] grid place-items-center p-4 sm:p-6">
      {/* Backdrop click closes; it is presentation, not a control. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="animate-fade-up relative max-h-full w-full max-w-md overflow-y-auto rounded-3xl border p-7 sm:p-8"
        style={{
          background: "var(--bg)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-float)"
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-[var(--purple-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--purple)]"
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

        <p
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
          style={{
            borderColor: "var(--purple)",
            background: "var(--purple-subtle)",
            color: "var(--purple)"
          }}
        >
          <SparkleIcon />
          {eyebrow}
        </p>

        <h2 id={headingId} className="mt-4 text-2xl tracking-[-0.02em]">
          {headline}
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {body}
        </p>
        {note !== undefined && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {note}
          </p>
        )}

        <div className="mt-6">
          {outcome !== null ? (
            <div role="status" className="space-y-4">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                  style={{ background: "var(--purple-subtle)", color: "var(--purple)" }}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 10.5 8 14.5 16 5.5" />
                  </svg>
                </span>
                {outcome === "signed_in" ? (
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>
                      You&rsquo;re in.
                    </p>
                    <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                      This page now knows you — your account features are unlocked.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>
                      Check your email to confirm your account.
                    </p>
                    {/* Honest scope: we requested the email; we cannot see delivery. */}
                    <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                      One time only — open the confirmation link, then you sign in here with your
                      password.
                    </p>
                  </div>
                )}
              </div>
              <Button type="button" variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          ) : (
            <AccountSignIn
              configured={configured}
              supabaseUrl={supabaseUrl}
              anonKey={anonKey}
              onSuccess={setOutcome}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * The quiet unlock affordance the signed-out triggers share: a small pill with
 * the sparkle, styled to invite rather than shout. Kept beside the dialog so a
 * trigger cannot restyle the pair apart.
 */
export function AccountPromptPill({
  onClick,
  children
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 hover:border-[var(--purple)] hover:text-[var(--purple)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--purple)]"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        color: "var(--text-muted)"
      }}
    >
      <SparkleIcon />
      {children}
    </button>
  );
}

function SparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 shrink-0"
    >
      <path d="M10 2.2c.2 0 .38.13.44.32l1.16 3.6a1.4 1.4 0 0 0 .9.9l3.6 1.16a.46.46 0 0 1 0 .88l-3.6 1.16a1.4 1.4 0 0 0-.9.9l-1.16 3.6a.46.46 0 0 1-.88 0l-1.16-3.6a1.4 1.4 0 0 0-.9-.9l-3.6-1.16a.46.46 0 0 1 0-.88l3.6-1.16a1.4 1.4 0 0 0 .9-.9l1.16-3.6A.46.46 0 0 1 10 2.2Z" />
      <path d="M16 12.4c.13 0 .24.08.28.2l.5 1.54c.06.19.21.34.4.4l1.54.5a.3.3 0 0 1 0 .56l-1.54.5a.62.62 0 0 0-.4.4l-.5 1.54a.3.3 0 0 1-.56 0l-.5-1.54a.62.62 0 0 0-.4-.4l-1.54-.5a.3.3 0 0 1 0-.56l1.54-.5c.19-.06.34-.21.4-.4l.5-1.54a.3.3 0 0 1 .28-.2Z" />
    </svg>
  );
}
