/**
 * Typographic wordmark placeholder.
 *
 * A permanent logo is a brand decision the founders own. This is deliberately a
 * type treatment with a mark built from the brand idea — a tract being a defined
 * parcel — so nothing here becomes the accidental final logo.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="grid size-9 place-items-center rounded-xl"
        style={{
          background: "linear-gradient(135deg, var(--purple), var(--purple-light))",
          boxShadow: "0 4px 16px var(--purple-glow)"
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[18px]"
          fill="none"
          stroke="#fff"
          strokeWidth="2.1"
        >
          <path d="M4 9.5 12 4l8 5.5V20H4V9.5Z" strokeLinejoin="round" />
          <path d="M9.5 20v-6h5v6" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[1.05rem] font-bold tracking-[0.2em]">TRACT</span>
        <span
          className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--text-muted)" }}
        >
          Mortgage
        </span>
      </span>
    </span>
  );
}
