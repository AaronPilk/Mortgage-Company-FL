import Link from "next/link";
import { pageCount } from "@tract/integrations";
import { propertiesHref, type PropertySearchCriteria } from "./criteria";

/**
 * Pagination.
 *
 * Rendered as links, not buttons, because the page number is part of the URL —
 * a result set has to survive being copied, bookmarked, and opened in a new
 * tab. `rel="prev"`/`rel="next"` state the sequence for anything that walks it.
 */
export function ListingPagination({
  criteria,
  totalCount,
  pageSize
}: {
  criteria: PropertySearchCriteria;
  totalCount: number;
  pageSize: number;
}) {
  const total = pageCount(totalCount, pageSize);
  if (total <= 1) return null;

  const current = Math.min(criteria.page, total);
  const numbers = Array.from({ length: total }, (_, index) => index + 1);

  const linkClass =
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors";

  return (
    <nav aria-label="Search result pages" className="mt-10 flex flex-wrap items-center gap-2">
      {current > 1 ? (
        <Link
          href={propertiesHref(criteria, { page: current - 1 })}
          rel="prev"
          className={`${linkClass} hover:border-[var(--purple)] hover:text-[var(--purple)]`}
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Previous
        </Link>
      ) : (
        <span
          className={linkClass}
          aria-disabled="true"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)", opacity: 0.55 }}
        >
          Previous
        </span>
      )}

      <ol className="flex flex-wrap items-center gap-2">
        {numbers.map((number) => (
          <li key={number}>
            {number === current ? (
              <span
                className={linkClass}
                aria-current="page"
                style={{
                  borderColor: "var(--purple)",
                  background: "var(--purple-subtle)",
                  color: "var(--purple)"
                }}
              >
                {number}
              </span>
            ) : (
              <Link
                href={propertiesHref(criteria, { page: number })}
                className={`${linkClass} hover:border-[var(--purple)] hover:text-[var(--purple)]`}
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                <span className="sr-only">Page </span>
                {number}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {current < total ? (
        <Link
          href={propertiesHref(criteria, { page: current + 1 })}
          rel="next"
          className={`${linkClass} hover:border-[var(--purple)] hover:text-[var(--purple)]`}
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Next
        </Link>
      ) : (
        <span
          className={linkClass}
          aria-disabled="true"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)", opacity: 0.55 }}
        >
          Next
        </span>
      )}
    </nav>
  );
}
