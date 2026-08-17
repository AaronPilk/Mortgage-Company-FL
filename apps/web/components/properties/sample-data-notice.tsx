import { Badge } from "@/components/ui";

/**
 * Sample-data labelling.
 *
 * Invariant 6: nothing claims an unestablished fact, and a fixture cannot be
 * published as real. A record flagged `isFixture` is invented, so the label has
 * to be part of what a person sees — not a comment, not a metadata field, not a
 * line in the page source. Every card carries the badge and every page that
 * renders one carries the banner.
 *
 * These components take no `isFixture` argument on purpose. They are rendered
 * only on the fixture path, and a prop would invite a caller to pass `false`.
 */

export function SampleDataBadge() {
  return <Badge tone="warning">Sample data — not a real listing</Badge>;
}

export function SampleDataBanner({
  scope
}: {
  /** Which surface the reader is on, so the sentence is specific. */
  scope: "search" | "detail";
}) {
  const detail =
    scope === "search"
      ? "Every result below is an illustrative sample property invented to demonstrate how this search works."
      : "This page describes an illustrative sample property invented to demonstrate how a listing detail page works.";

  return (
    <aside
      role="note"
      aria-label="Sample data notice"
      className="rounded-2xl border-2 p-5 sm:p-6"
      style={{
        borderColor: "var(--color-warning)",
        background: "var(--surface-2)"
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <SampleDataBadge />
        <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
          These are not active MLS listings.
        </p>
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {detail} The addresses use reserved &ldquo;Example&rdquo; street names, the prices and
        property details are made up, and none of it comes from an MLS, a public record, or any
        listing portal. Nothing here is for sale, and no part of it should be relied on.
      </p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Real listing data requires an executed agreement with the MLS or an approved aggregator.
        Until that is in place this surface runs on fixtures so the financing tools around it can be
        built and reviewed honestly.
      </p>
    </aside>
  );
}
