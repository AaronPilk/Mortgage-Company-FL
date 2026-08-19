import Link from "next/link";
import { agentsHref, agentsPageCount, paginationWindow } from "./directory-pagination";

/**
 * Directory pagination. Same shape and styling as the property search
 * pagination — links, not buttons, because the page number is part of the URL
 * and a result set has to survive being copied, bookmarked, and opened in a
 * new tab — but windowed, because a state-scale directory has thousands of
 * pages and a nav cannot render them all.
 */
export function AgentPagination({
  city,
  page,
  totalCount,
  pageSize
}: {
  city: string;
  page: number;
  totalCount: number;
  pageSize: number;
}) {
  const total = agentsPageCount(totalCount, pageSize);
  if (total <= 1) return null;

  const current = Math.min(page, total);
  const items = paginationWindow(current, total);

  const linkClass =
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors";

  return (
    <nav aria-label="Directory pages" className="mt-10 flex flex-wrap items-center gap-2">
      {current > 1 ? (
        <Link
          href={agentsHref(city, current - 1)}
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
        {items.map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true">
              <span className="px-1 text-sm" style={{ color: "var(--text-muted)" }}>
                &hellip;
              </span>
            </li>
          ) : (
            <li key={item}>
              {item === current ? (
                <span
                  className={linkClass}
                  aria-current="page"
                  style={{
                    borderColor: "var(--purple)",
                    background: "var(--purple-subtle)",
                    color: "var(--purple)"
                  }}
                >
                  {item}
                </span>
              ) : (
                <Link
                  href={agentsHref(city, item)}
                  className={`${linkClass} hover:border-[var(--purple)] hover:text-[var(--purple)]`}
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <span className="sr-only">Page </span>
                  {item}
                </Link>
              )}
            </li>
          )
        )}
      </ol>

      {current < total ? (
        <Link
          href={agentsHref(city, current + 1)}
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
