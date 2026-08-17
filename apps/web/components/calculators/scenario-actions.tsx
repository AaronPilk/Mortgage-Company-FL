"use client";

import { useState } from "react";
import Link from "next/link";
import type { LeadIntent, PlanningSnapshot } from "@tract/schemas";
import { LeadForm } from "@/components/lead-form";
import { Button, Card } from "@/components/ui";
import { EMAIL_CONSENT_TEXT, LEAD_DISCLOSURE_TEXT, SMS_CONSENT_TEXT } from "@/lib/site";

const SAVED_SCENARIOS_KEY = "tract.calculator-scenarios.saved";

type Action = "email" | "talk" | null;

export function ScenarioActions({
  snapshot,
  intent,
  compareTargetId
}: {
  snapshot: PlanningSnapshot;
  intent: LeadIntent;
  compareTargetId: string;
}) {
  const [action, setAction] = useState<Action>(null);
  const [saveStatus, setSaveStatus] = useState("");

  function saveOnDevice() {
    try {
      const raw = window.localStorage.getItem(SAVED_SCENARIOS_KEY);
      const parsed = raw === null ? null : (JSON.parse(raw) as { items?: unknown[] });
      const items = Array.isArray(parsed?.items) ? parsed.items.slice(-9) : [];
      items.push({ id: window.crypto.randomUUID(), savedAt: new Date().toISOString(), snapshot });
      window.localStorage.setItem(
        SAVED_SCENARIOS_KEY,
        JSON.stringify({ version: "calculator-scenarios@1.0.0", items })
      );
      setSaveStatus("Saved on this device. Nothing was sent to TRACT.");
    } catch {
      setSaveStatus("This browser blocked local storage, so the scenario was not saved.");
    }
  }

  function compare() {
    const target = document.getElementById(compareTargetId);
    target?.focus();
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const requestedSnapshot: PlanningSnapshot = {
    ...snapshot,
    inputSnapshot: {
      ...snapshot.inputSnapshot,
      requestedDelivery: action === "email" ? "email" : "human_review"
    }
  };

  return (
    <Card className="mt-6" dataTestId="scenario-actions">
      <h3 className="text-xl font-bold">Keep working with this result</h3>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        The calculation is already yours. Saving on this device needs no contact details. Sending it
        to TRACT is optional and requires an explicit contact request.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={saveOnDevice}>
          Save this scenario
        </Button>
        <Button type="button" variant="secondary" onClick={() => setAction("email")}>
          Email me this breakdown
        </Button>
        <Button type="button" variant="secondary" onClick={compare}>
          Compare another scenario
        </Button>
        <Button type="button" onClick={() => setAction("talk")}>
          Talk through these numbers
        </Button>
        <Link
          href="/properties"
          className="inline-flex min-h-[48px] items-center rounded-xl px-3 font-semibold text-[var(--purple)] underline underline-offset-4"
        >
          Use a property from TRACT
        </Link>
      </div>
      {saveStatus !== "" && (
        <p className="mt-4 text-sm text-[var(--text-muted)]" role="status">
          {saveStatus}
        </p>
      )}
      {action !== null && (
        <div className="mt-8 border-t border-[var(--border)] pt-8">
          <LeadForm
            intent={intent}
            formId={`calculator-${snapshot.source}-${action}`}
            heading={
              action === "email"
                ? "Request this breakdown by email"
                : "Ask TRACT to review these numbers"
            }
            submitLabel={action === "email" ? "Request emailed breakdown" : "Send for review"}
            disclosureText={LEAD_DISCLOSURE_TEXT}
            smsConsentText={SMS_CONSENT_TEXT}
            emailConsentText={EMAIL_CONSENT_TEXT}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            planningSnapshot={requestedSnapshot}
          />
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Email delivery is a requested follow-up, not an instant automated message. The
            confirmation will say only what was durably saved.
          </p>
        </div>
      )}
    </Card>
  );
}
