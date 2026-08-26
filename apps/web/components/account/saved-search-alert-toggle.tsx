"use client";

import { useState } from "react";

/**
 * Per-saved-search opt-in: "email me when new listings match."
 *
 * Optimistic on the checkbox, honest in the status line — the control reflects
 * the attempted state immediately and reverts if the write is not confirmed, so
 * the box never claims a preference the server did not durably record. It writes
 * only alerts_enabled (the one column the browser key may touch); the alert
 * baseline is seeded server-side, so opting in never blasts the existing backlog.
 */
export function SavedSearchAlertToggle({
  saveId,
  initialEnabled
}: {
  saveId: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function toggle(next: boolean) {
    setEnabled(next);
    setSaving(true);
    setStatus("Saving…");
    try {
      const response = await fetch("/api/v1/account/saved-searches/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveId, alertsEnabled: next })
      });
      if (!response.ok) {
        setEnabled(!next);
        setStatus("That change was not saved. Try again.");
        return;
      }
      setStatus(
        next ? "You'll be emailed when new listings match." : "Alerts off for this search."
      );
    } catch {
      setEnabled(!next);
      setStatus("That change was not saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={(event) => void toggle(event.target.checked)}
          className="mt-1 size-4"
        />
        Email me when new listings match this search.
      </label>
      <p className="mt-1 text-xs text-[var(--text-muted)]" role="status">
        {status}
      </p>
    </div>
  );
}
