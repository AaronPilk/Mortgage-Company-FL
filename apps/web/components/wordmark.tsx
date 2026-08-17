/**
 * Typographic wordmark placeholder.
 *
 * A permanent logo is a brand decision the founders own. This is deliberately a
 * type treatment, not a generated mark, so nothing here becomes the accidental
 * final logo.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className="text-xl font-bold tracking-[0.16em] text-purple-900">TRACT</span>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-600">
        Mortgage
      </span>
    </span>
  );
}
