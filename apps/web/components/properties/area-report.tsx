"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AreaReport as AreaReportSections } from "@tract/schemas";
import { Card } from "@/components/ui";

/**
 * County area report — presentation.
 *
 * The template prose and the figure panels are already in the server-rendered
 * HTML (this component's props are all deterministic and sourced), so the county
 * page is complete with JS off and with aiSearch off — it is simply not mounted
 * in the latter case. After hydration the component fetches the AI narrative and,
 * only on success, swaps in the richer prose. A failure, a refused budget, or a
 * scrubbed answer all leave the template in place: the reader never sees an error
 * here, and never a figure the model authored — every number on the page comes
 * from the sourced libraries, rendered server-side (invariant 6).
 */

export type AreaDpaFigure = {
  name: string;
  /** The sourced assistance line, rendered verbatim from dpa-programs.ts. */
  assistance: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type AreaFigures = {
  floodExposure: "high-coastal" | "mixed" | "inland";
  cities: string[];
  appraiserName: string;
  appraiserUrl?: string | undefined;
  dpa: AreaDpaFigure[];
  dpaAsOf: string;
};

type AreaReportApiResponse =
  { ok: true; data: { sections: AreaReportSections; source: "ai" | "template" } } | { ok: false };

const FLOOD_LABEL: Record<AreaFigures["floodExposure"], string> = {
  "high-coastal": "Coastal — flood and wind coverage is a routine part of the monthly cost.",
  mixed:
    "Mixed — higher-exposure coastal or riverfront areas alongside lower-risk interior ground.",
  inland: "Inland — largely out of storm surge, though low or lakeside ground can still flood."
};

export function AreaReport({
  countySlug,
  countyName,
  template,
  figures
}: {
  countySlug: string;
  countyName: string;
  /** Deterministic, figure-free prose rendered immediately and kept as the fallback. */
  template: AreaReportSections;
  /** Sourced figures rendered server-side; never authored by the model. */
  figures: AreaFigures;
}) {
  const [sections, setSections] = useState<AreaReportSections>(template);
  const [source, setSource] = useState<"ai" | "template">("template");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/v1/area-report", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ county: countySlug })
        });
        const payload = (await response.json()) as AreaReportApiResponse;
        if (cancelled || !response.ok || !payload.ok) return;
        setSections(payload.data.sections);
        setSource(payload.data.source);
      } catch {
        // Keep the template. No UI — the section is already complete without AI.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [countySlug]);

  return (
    <Card className="mt-6" as="section">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-[var(--text)]">
          What it&apos;s like to buy in {countyName}
        </h2>
        {/* Honest provenance: the badge shows only when a model actually wrote the prose. */}
        {source === "ai" && (
          <span
            className="rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            AI overview
          </span>
        )}
      </div>

      <div className="mt-3 space-y-3 text-sm text-[var(--text-muted)]">
        <p>{sections.overview}</p>
        <p>{sections.lifestyle}</p>
        <p>{sections.buyingConsiderations}</p>
        <p>{sections.neighborhoodsProse}</p>
        {sections.highlights !== undefined && sections.highlights.length > 0 && (
          <ul className="list-disc space-y-1 pl-5">
            {sections.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Figure panels: sourced numbers only, from the data libraries. These do
          not change with the AI fetch — the model writes the words above, never
          these figures. Card takes no style prop, so the tinted panels are plain
          divs with token styles, matching the county page's own panels. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Flood posture
          </p>
          <p className="mt-2 text-sm text-[var(--text)]">{FLOOD_LABEL[figures.floodExposure]}</p>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Communities: {figures.cities.join(", ")}
          </p>
          {figures.appraiserUrl !== undefined ? (
            <a
              href={figures.appraiserUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-semibold underline"
              style={{ color: "var(--purple)" }}
            >
              {figures.appraiserName} ↗
            </a>
          ) : (
            <p className="mt-3 text-xs text-[var(--text-muted)]">{figures.appraiserName}</p>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Down-payment help
          </p>
          <ul className="mt-2 space-y-2">
            {figures.dpa.map((program) => (
              <li key={program.name} className="text-sm text-[var(--text)]">
                <span className="font-semibold">{program.name}:</span>{" "}
                <span className="text-[var(--text-muted)]">{program.assistance}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Program terms as of {figures.dpaAsOf}. See{" "}
            <Link href="/florida-down-payment-assistance" className="underline">
              statewide down-payment programs
            </Link>
            .
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs text-[var(--text-muted)]">
        The overview above is written by AI for context; every figure on this page comes from the
        sourced programs and county offices cited. Confirm current terms with the responsible office
        or a licensed loan officer.
      </p>
    </Card>
  );
}
