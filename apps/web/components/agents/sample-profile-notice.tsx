import { Badge } from "@/components/ui";

/**
 * Sample-profile labelling for the agent directory.
 *
 * Invariant 6: nothing claims an unestablished fact, and an invented profile
 * cannot be presented as a person. Every sample card carries the badge and
 * every surface that renders one carries the banner. Like the listing
 * equivalents, these components take no boolean on purpose — they render only
 * on the sample path, and a prop would invite a caller to pass `false`.
 */

export function SampleProfileBadge() {
  return <Badge tone="warning">Sample profile — not a real agent</Badge>;
}

export function SampleProfilesBanner({
  scope
}: {
  /** Which surface the reader is on, so the sentence is specific. */
  scope: "directory" | "profile";
}) {
  const detail =
    scope === "directory"
      ? "Some or all of the profiles below are illustrative samples invented to demonstrate how this directory works."
      : "This page describes an illustrative sample profile invented to demonstrate how an agent profile works.";

  return (
    <aside
      role="note"
      aria-label="Sample profiles notice"
      className="rounded-2xl border border-l-4 p-5 text-left sm:p-6"
      style={{
        borderColor: "var(--border)",
        borderLeftColor: "var(--color-warning)",
        background: "var(--surface)"
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <SampleProfileBadge />
        <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
          Sample profiles — not real agents.
        </p>
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {detail} The names are invented, the brokerage is a reserved example name, and the license
        numbers use a deliberately invalid sample format. No sample profile describes a person, and
        no license claim about one has been — or could be — verified.
      </p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Real profiles join through an application we review before anything goes live. Until enough
        real agents are live, this surface runs on labelled samples so the introduction workflow
        around it can be built and reviewed honestly.
      </p>
    </aside>
  );
}
