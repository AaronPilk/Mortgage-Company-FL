"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountPromptDialog } from "@/components/account/account-prompt-dialog";
import { Button } from "@/components/ui";

/**
 * Saves a listing to the visitor's account.
 *
 * There is no session prop here: the server's 401 is the truth about being
 * signed out, and it opens the shared account prompt dialog — the same one the
 * AI search and save-search prompts use. The inline /account link remains only
 * as the fallback for a caller that did not pass the Supabase configuration,
 * so the signed-out path can never dead-end.
 */
export function SavePropertyButton({
  listingKey,
  sourceMode,
  accountsConfigured = false,
  supabaseUrl,
  anonKey
}: {
  listingKey: string;
  sourceMode: "fixture" | "live";
  accountsConfigured?: boolean;
  supabaseUrl?: string | undefined;
  anonKey?: string | undefined;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "signin" | "error">("idle");
  const [promptOpen, setPromptOpen] = useState(false);

  const canPrompt = accountsConfigured && supabaseUrl !== undefined && anonKey !== undefined;

  async function save() {
    setState("saving");
    try {
      const response = await fetch("/api/v1/account/saved-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingKey, sourceMode })
      });
      if (response.ok) {
        setState("saved");
      } else if (response.status === 401) {
        if (canPrompt) {
          setState("idle");
          setPromptOpen(true);
        } else {
          setState("signin");
        }
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={save} disabled={state === "saving"}>
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved to account" : "Save property"}
      </Button>
      <p className="mt-2 text-sm text-[var(--text-muted)]" role="status">
        {state === "signin" ? (
          <>
            <Link href="/account" className="font-semibold text-[var(--purple)] underline">
              Sign in
            </Link>{" "}
            to save this property across devices.
          </>
        ) : state === "error" ? (
          "The property was not confirmed as saved. Try again later."
        ) : (
          ""
        )}
      </p>
      {canPrompt && (
        <AccountPromptDialog
          open={promptOpen}
          onClose={() => setPromptOpen(false)}
          headline="Save homes you like"
          body="Keep a shortlist of the homes that catch your eye and come back to it from any device."
          configured={accountsConfigured}
          supabaseUrl={supabaseUrl}
          anonKey={anonKey}
        />
      )}
    </div>
  );
}
