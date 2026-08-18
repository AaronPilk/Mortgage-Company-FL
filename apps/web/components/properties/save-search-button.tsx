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
 */
export function SaveSearchButton({
  signedIn,
  search,
  accountsConfigured,
  supabaseUrl,
  anonKey
}: {
  signedIn: boolean;
  /** Query-string form of the criteria currently on screen (no leading "?"). */
  search: string;
  accountsConfigured: boolean;
  supabaseUrl?: string | undefined;
  anonKey?: string | undefined;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [promptOpen, setPromptOpen] = useState(false);

  async function save() {
    if (!signedIn) {
      setPromptOpen(true);
      return;
    }
    setState("saving");
    try {
      const response = await fetch("/api/v1/account/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveId: window.crypto.randomUUID(), search })
      });
      setState(response.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  if (!accountsConfigured) return null;

  return (
    <div>
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
