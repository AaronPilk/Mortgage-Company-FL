"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

export function SavePropertyButton({
  listingKey,
  sourceMode
}: {
  listingKey: string;
  sourceMode: "fixture" | "live";
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "signin" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const response = await fetch("/api/v1/account/saved-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingKey, sourceMode })
      });
      setState(response.ok ? "saved" : response.status === 401 ? "signin" : "error");
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
    </div>
  );
}
