/**
 * Gallery placeholder.
 *
 * There is no photograph of the property, and there is not going to be one until
 * a data agreement supplies images we have the right to display. A stock
 * photograph would imply the sample record depicts a real building; a hotlinked
 * portal image would be someone else's copyrighted work. So the slot renders as
 * geometry with an explicit statement of what is missing and why.
 *
 * Some sample records now carry a company-generated illustration instead — see
 * `listing-gallery.tsx`. That is a different thing to a listing photograph, it
 * is labelled as such wherever it appears, and this placeholder remains the
 * fallback for every record that has none.
 *
 * Drawn inline as SVG rather than shipped as a file, so it costs no request and
 * inherits the theme's colours in both light and dark.
 */

export function PlaceholderTile({ patternId }: { patternId: string }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 160 120"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
            <path
              d="M-2 2 L2 -2 M0 10 L10 0 M8 12 L12 8"
              stroke="var(--border)"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        <rect width="160" height="120" fill={`url(#${patternId})`} opacity="0.7" />
        <path
          d="M40 78 L64 50 L82 72 L96 58 L120 78 Z"
          fill="var(--purple)"
          opacity="0.16"
          stroke="var(--purple)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="108" cy="42" r="7" fill="var(--purple)" opacity="0.22" />
      </svg>
    </div>
  );
}

export function GalleryPlaceholder({ listingKey }: { listingKey: string }) {
  // Pattern ids are document-global in SVG, so they are namespaced per record.
  const id = (index: number) =>
    `gallery-hatch-${listingKey.replace(/[^A-Za-z0-9-]/g, "")}-${index}`;

  return (
    <figure className="m-0" aria-label="Photograph placeholder">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 aspect-[4/3] sm:row-span-2 sm:aspect-auto sm:min-h-[300px]">
          <PlaceholderTile patternId={id(0)} />
        </div>
        <div className="aspect-[4/3]">
          <PlaceholderTile patternId={id(1)} />
        </div>
        <div className="aspect-[4/3]">
          <PlaceholderTile patternId={id(2)} />
        </div>
        <div className="aspect-[4/3]">
          <PlaceholderTile patternId={id(3)} />
        </div>
        <div className="aspect-[4/3]">
          <PlaceholderTile patternId={id(4)} />
        </div>
      </div>
      <figcaption className="mt-3 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        No photograph available for sample data. Photographs belong to the listing source and are
        only displayed under a data agreement that grants the right to show them.
      </figcaption>
    </figure>
  );
}
