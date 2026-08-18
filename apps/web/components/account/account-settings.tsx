"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

type PreferenceState = {
  reportReadyEmail: boolean;
  reportFailureEmail: boolean;
};

export function AccountSettings({ initial }: { initial: PreferenceState }) {
  const [preferences, setPreferences] = useState(initial);
  const [preferenceStatus, setPreferenceStatus] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("");
  const privacyRequestIds = useRef<Partial<Record<"export" | "delete", string>>>({});

  async function savePreferences() {
    setPreferenceStatus("Saving…");
    try {
      const response = await fetch("/api/v1/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences)
      });
      setPreferenceStatus(
        response.ok ? "Preferences saved." : "Preferences could not be saved. Try again."
      );
    } catch {
      setPreferenceStatus("Preferences could not be saved. Try again.");
    }
  }

  async function requestPrivacyAction(requestType: "export" | "delete") {
    const requestId = (privacyRequestIds.current[requestType] ??= window.crypto.randomUUID());
    setPrivacyStatus(`Submitting ${requestType} request…`);
    try {
      const response = await fetch("/api/v1/account/privacy-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, requestType })
      });
      if (!response.ok) {
        setPrivacyStatus("The request was not confirmed. Retry to check the same request.");
        return;
      }
      delete privacyRequestIds.current[requestType];
      setPrivacyStatus(
        requestType === "export"
          ? "Export request received. This does not mean the export is complete; staff processing is still required."
          : "Deletion request received. Nothing has been deleted yet; staff review and processing are still required."
      );
    } catch {
      setPrivacyStatus("The request was not confirmed. Retry to check the same request.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold">Report notifications</h3>
        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={preferences.reportReadyEmail}
              onChange={(event) =>
                setPreferences((value) => ({ ...value, reportReadyEmail: event.target.checked }))
              }
              className="mt-1 size-4"
            />
            Email me when a requested report becomes ready.
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={preferences.reportFailureEmail}
              onChange={(event) =>
                setPreferences((value) => ({ ...value, reportFailureEmail: event.target.checked }))
              }
              className="mt-1 size-4"
            />
            Email me if a requested report fails.
          </label>
        </div>
        <Button type="button" variant="secondary" className="mt-4" onClick={savePreferences}>
          Save notification preferences
        </Button>
        <p className="mt-3 text-sm text-[var(--text-muted)]" role="status">
          {preferenceStatus}
        </p>
      </div>

      <div className="border-t border-[var(--border)] pt-7">
        <h3 className="text-lg font-bold">Privacy requests</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          These buttons open a tracked request. They do not claim that an export or deletion has
          already happened.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={() => requestPrivacyAction("export")}>
            Request my data export
          </Button>
          <Button type="button" variant="secondary" onClick={() => requestPrivacyAction("delete")}>
            Request account deletion
          </Button>
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]" role="status">
          {privacyStatus}
        </p>
      </div>
    </div>
  );
}
