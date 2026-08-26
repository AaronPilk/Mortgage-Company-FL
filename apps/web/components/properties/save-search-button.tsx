"use client";

import { useState } from "react";
import { AccountPromptDialog } from "@/components/account/account-prompt-dialog";
import { Button } from "@/components/ui";

/**
 * Saves the current result set's criteria to the visitor's account.
 *
 * The search itself is never gated: signed out, the button opens the shared
 * account prompt dialog instead of saving, and everything else on the page
 * keeps working. Signed in, it posts the current query string; the server
 * re-parses it with the same schema the page uses and stores only the
 * canonical form.
 *
 * "Saved" describes one exact set of criteria, so call sites key this
 * component on the canonical search string — a filter change remounts it back
 * to idle instead of claiming a different search was saved.
 */
export function SaveSearchButton({
  signedIn,
  search,
  accountsConfigured,
  alertsAvailable = false,
  supabaseUrl,
  anonKey
}: {
  signedIn: boolean;
  /** Query-string form of the criteria currently on screen (no leading "?"). */
  search: string;
  accountsConfigured: boolean;
  /**
   * Whether new-listing email alerts can be promised here. Derived public flag:
   * true only when a licensed listing feed and the backend feature are both on,
   * so the opt-in is hidden — never dead — until it can actually fire.
   */
  alertsAvailable?: boolean;
  supabaseUrl?: string | undefined;
  anonKey?: string | undefined;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [promptOpen, setPromptOpen] = useState(false);
  const [wantAlerts, setWantAlerts] = useState(false);

  async function save() {
    if (!signedIn) {
      setPromptOpen(true);
      return;
    }
    setState("saving");
    const saveId = window.crypto.randomUUID();
    try {
      const response = await fetch("/api/v1/account/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveId, search })
      });
      if (!response.ok) {
        setState("error");
        return;
      }
      // Opting in is a second, best-effort write against the row just saved — its
      // id comes back from the server, which may differ from ours when re-saving
      // a search already kept. A failed opt-in never unsays "saved".
      if (wantAlerts) {
        const body = (await response.json().catch(() => null)) as {
          data?: { saveId?: string };
        } | null;
        const savedId = body?.data?.saveId ?? saveId;
        await fetch("/api/v1/account/saved-searches/alerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ saveId: savedId, alertsEnabled: true })
        }).catch(() => undefined);
      }
      setState("saved");
    } catch {
      setState("error");
    }
  }

  if (!accountsConfigured) return null;

  return (
    <div>
      {signedIn && alertsAvailable && (
        <label className="mb-2 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={wantAlerts}
            onChange={(event) => setWantAlerts(event.target.checked)}
            className="mt-1 size-4"
          />
          Email me when new listings match this search.
        </label>
      )}
      <Button
        type="button"
        variant="secondary"
        onClick={save}
        disabled={state === "saving"}
        aria-haspopup={signedIn ? undefined : "dialog"}
      >
        {state === "saving"
          ? "Saving…"
          : state === "saved"
            ? "Search saved to account"
            : "Save this search"}
      </Button>
      <p className="mt-2 text-sm text-[var(--text-muted)]" role="status">
        {state === "error" ? "The search was not confirmed as saved. Try again later." : ""}
      </p>
      {!signedIn && (
        <AccountPromptDialog
          open={promptOpen}
          onClose={() => setPromptOpen(false)}
          headline="Save this search"
          body="Keep this exact set of criteria on your account and reopen it from any device."
          configured={accountsConfigured}
          supabaseUrl={supabaseUrl}
          anonKey={anonKey}
        />
      )}
    </div>
  );
}
