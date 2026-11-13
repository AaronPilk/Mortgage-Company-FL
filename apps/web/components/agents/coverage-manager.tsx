"use client";

import { useMemo, useState } from "react";
import { AGENT_COVERAGE_MAX_ZIPS } from "@tract/schemas";
import { Button, Card } from "@/components/ui";

/**
 * Agent marketplace v1 — manage coverage.
 *
 * The agent edits the full set of ZIPs they cover and saves it; the endpoint
 * replaces their coverage with that set (a replace-set, so Save is idempotent).
 * This is coverage only — no payment, no bidding, no exclusivity, and nothing
 * here implies a lead is owed to anyone. The list is edited locally and
 * persisted on Save, so a misclick is recoverable before it is written.
 *
 * An authenticated same-origin write, like the account cards: the route's
 * `beginAccountMutation` + RLS are the guard, so there is no bot challenge here.
 */

type Status =
  { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

const ZIP_INPUT = /^\d{0,5}$/;

export function CoverageManager({ slug, initialZips }: { slug: string; initialZips: string[] }) {
  const [zips, setZips] = useState<string[]>(() => normalize(initialZips));
  const [saved, setSaved] = useState<string[]>(() => normalize(initialZips));
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const dirty = useMemo(() => !sameSet(zips, saved), [zips, saved]);
  const atLimit = zips.length >= AGENT_COVERAGE_MAX_ZIPS;
  const canAdd = /^\d{5}$/.test(draft) && !zips.includes(draft) && !atLimit;

  function addZip(): void {
    if (!canAdd) return;
    setZips((current) => normalize([...current, draft]));
    setDraft("");
    setStatus({ kind: "idle" });
  }

  function removeZip(zip: string): void {
    setZips((current) => current.filter((entry) => entry !== zip));
    setStatus({ kind: "idle" });
  }

  async function save(): Promise<void> {
    setStatus({ kind: "saving" });
    try {
      const response = await fetch("/api/v1/agents/coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zips })
      });
      const json = (await response.json()) as
        { ok: true; data: { zips: string[] } } | { ok: false; error: { message: string } };
      if (!response.ok || json.ok !== true) {
        setStatus({
          kind: "error",
          message: json.ok === false ? json.error.message : "We couldn't save your coverage."
        });
        return;
      }
      const persisted = normalize(json.data.zips);
      setZips(persisted);
      setSaved(persisted);
      setStatus({ kind: "saved" });
    } catch {
      setStatus({ kind: "error", message: "We couldn't reach the server. Please try again." });
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-[var(--text)]">ZIP codes you cover</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Add the Florida ZIP codes you work in. When lead routing turns on, seller and buyer
        introductions in these areas can come to you. More than one agent can cover the same ZIP —
        this is coverage, not an exclusive territory, and there are no fees or bidding.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="coverage-zip" className="text-sm font-semibold text-[var(--text)]">
            Add a ZIP code
          </label>
          <input
            id="coverage-zip"
            inputMode="numeric"
            value={draft}
            placeholder="33602"
            onChange={(event) => {
              const next = event.target.value.trim();
              if (ZIP_INPUT.test(next)) setDraft(next);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addZip();
              }
            }}
            className="mt-1.5 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-base outline-none focus:border-[var(--purple)]"
          />
        </div>
        <Button type="button" variant="secondary" disabled={!canAdd} onClick={addZip}>
          Add ZIP
        </Button>
      </div>
      {atLimit && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          You&apos;ve reached the {AGENT_COVERAGE_MAX_ZIPS}-ZIP limit for a single save.
        </p>
      )}

      <div className="mt-6">
        {zips.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No ZIP codes yet. Add the areas you cover above.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {zips.map((zip) => (
              <li key={zip}>
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
                  style={{ background: "var(--surface-2)", color: "var(--text)" }}
                >
                  {zip}
                  <button
                    type="button"
                    onClick={() => removeZip(zip)}
                    aria-label={`Remove ${zip}`}
                    className="text-[var(--text-muted)] hover:text-[var(--purple)]"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="primary"
          disabled={!dirty || status.kind === "saving"}
          onClick={() => void save()}
        >
          {status.kind === "saving" ? "Saving…" : "Save coverage"}
        </Button>
        <span className="min-h-5 text-sm text-[var(--text-muted)]" role="status">
          {status.kind === "saved" && !dirty
            ? "Coverage saved."
            : status.kind === "error"
              ? status.message
              : dirty
                ? "Unsaved changes."
                : `Covering ${zips.length} ZIP${zips.length === 1 ? "" : "s"} as ${slug}.`}
        </span>
      </div>
    </Card>
  );
}

/** Sorted, deduped, and bounded to valid five-digit ZIPs — the shape the UI shows. */
function normalize(zips: string[]): string[] {
  return Array.from(new Set(zips.filter((zip) => /^\d{5}$/.test(zip)))).sort();
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((entry) => set.has(entry));
}
