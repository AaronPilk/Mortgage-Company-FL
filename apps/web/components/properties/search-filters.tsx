import Link from "next/link";
import { LISTING_SORTS, PROPERTY_TYPE_OPTIONS, PUBLIC_STATUS_OPTIONS } from "@tract/integrations";
import {
  SORT_LABELS,
  STATUS_LABELS,
  hasActiveFilters,
  propertiesHref,
  type PropertySearchCriteria
} from "./criteria";

/**
 * Structured search controls, collapsed behind a "Filters" pill.
 *
 * The natural-language bar is the front door now; these controls are the
 * precise instrument behind it, so they stay quiet until asked for. A native
 * `<details>` element does the collapsing: keyboard-operable, screen-reader
 * announced, and working before any JavaScript loads — the same reason the
 * form itself is a plain GET. Submitting rewrites the query string, the server
 * renders the matching page, and the result is a URL somebody can send to
 * their agent.
 *
 * The panel opens itself when a filter is active, because collapsed controls
 * that are silently constraining the results would make the page lie about
 * why records are missing.
 *
 * `page` is deliberately not a field. Changing a filter starts a new result
 * set, so it must not silently land the reader on page four of it.
 */

const fieldLabel = "block text-sm font-medium";
const controlClass =
  "mt-1.5 w-full min-h-[44px] rounded-xl border px-3 py-2 text-sm transition-colors " +
  "focus:border-[var(--purple)] focus:outline-none focus:ring-2 focus:ring-[var(--purple-glow)]";

const controlStyle = {
  borderColor: "var(--border)",
  background: "var(--surface)",
  color: "var(--text)"
} as const;

const BED_OPTIONS = [1, 2, 3, 4, 5];
const BATH_OPTIONS = [1, 2, 3, 4];

function activeFilterCount(criteria: PropertySearchCriteria): number {
  return [
    criteria.q !== undefined,
    criteria.minPrice !== undefined,
    criteria.maxPrice !== undefined,
    criteria.beds !== undefined,
    criteria.baths !== undefined,
    criteria.type.length > 0,
    criteria.status.length > 0
  ].filter(Boolean).length;
}

export function SearchFilters({ criteria }: { criteria: PropertySearchCriteria }) {
  const activeCount = activeFilterCount(criteria);

  return (
    <details className="group" open={activeCount > 0 ? true : undefined}>
      <summary
        className="inline-flex min-h-[48px] w-full cursor-pointer list-none items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors hover:border-[var(--purple)] hover:text-[var(--purple)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--purple)] sm:w-auto sm:justify-start [&::-webkit-details-marker]:hidden"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M3 6h14M6 10h8M8.5 14h3" />
        </svg>
        Filters
        {activeCount > 0 && (
          <span
            className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs font-bold text-white"
            style={{ background: "var(--purple)" }}
          >
            {activeCount}
            <span className="sr-only"> active</span>
          </span>
        )}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </summary>

      <form
        method="get"
        action="/properties"
        role="search"
        aria-label="Property search filters"
        className="mt-4 rounded-2xl border p-5 sm:p-6"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="property-q" className={fieldLabel} style={{ color: "var(--text)" }}>
              City or ZIP
            </label>
            <input
              id="property-q"
              name="q"
              type="search"
              inputMode="search"
              maxLength={60}
              defaultValue={criteria.q ?? ""}
              placeholder="Tampa, Sarasota, 33701…"
              className={controlClass}
              style={controlStyle}
            />
          </div>

          <div>
            <label
              htmlFor="property-min-price"
              className={fieldLabel}
              style={{ color: "var(--text)" }}
            >
              Min price (USD)
            </label>
            <input
              id="property-min-price"
              name="minPrice"
              type="number"
              inputMode="numeric"
              min={0}
              max={50000000}
              step={5000}
              defaultValue={criteria.minPrice ?? ""}
              placeholder="No minimum"
              className={controlClass}
              style={controlStyle}
            />
          </div>

          <div>
            <label
              htmlFor="property-max-price"
              className={fieldLabel}
              style={{ color: "var(--text)" }}
            >
              Max price (USD)
            </label>
            <input
              id="property-max-price"
              name="maxPrice"
              type="number"
              inputMode="numeric"
              min={0}
              max={50000000}
              step={5000}
              defaultValue={criteria.maxPrice ?? ""}
              placeholder="No maximum"
              className={controlClass}
              style={controlStyle}
            />
          </div>

          <div>
            <label htmlFor="property-beds" className={fieldLabel} style={{ color: "var(--text)" }}>
              Bedrooms (minimum)
            </label>
            <select
              id="property-beds"
              name="beds"
              defaultValue={criteria.beds === undefined ? "" : String(criteria.beds)}
              className={controlClass}
              style={controlStyle}
            >
              <option value="">Any</option>
              {BED_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count}+
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="property-baths" className={fieldLabel} style={{ color: "var(--text)" }}>
              Bathrooms (minimum)
            </label>
            <select
              id="property-baths"
              name="baths"
              defaultValue={criteria.baths === undefined ? "" : String(criteria.baths)}
              className={controlClass}
              style={controlStyle}
            >
              <option value="">Any</option>
              {BATH_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count}+
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="property-sort" className={fieldLabel} style={{ color: "var(--text)" }}>
              Sort by
            </label>
            <select
              id="property-sort"
              name="sort"
              defaultValue={criteria.sort}
              className={controlClass}
              style={controlStyle}
            >
              {LISTING_SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {SORT_LABELS[sort]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <fieldset className="min-w-0">
            <legend className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Property type
            </legend>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="inline-flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <input
                    type="checkbox"
                    name="type"
                    value={option}
                    defaultChecked={criteria.type.includes(option)}
                    className="h-4 w-4 accent-[var(--purple)]"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Status
            </legend>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {PUBLIC_STATUS_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="inline-flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <input
                    type="checkbox"
                    name="status"
                    value={option}
                    defaultChecked={criteria.status.includes(option)}
                    className="h-4 w-4 accent-[var(--purple)]"
                  />
                  {STATUS_LABELS[option]}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Leave unchecked to see every publicly displayable status.
            </p>
          </fieldset>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-[0_4px_14px_var(--purple-glow)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--purple)]"
            style={{ background: "var(--purple)" }}
          >
            Update results
          </button>
          {hasActiveFilters(criteria) && (
            <Link
              href="/properties"
              className="text-sm font-semibold underline underline-offset-4"
              style={{ color: "var(--purple)" }}
            >
              Clear all filters
            </Link>
          )}
        </div>
      </form>
    </details>
  );
}

/**
 * Removable active-filter chips.
 *
 * On a phone the filter panel is collapsed, so what is currently constraining
 * the results is otherwise invisible until you reopen it. Each chip names one
 * applied filter and links to the same search with that one filter removed —
 * server-rendered, works without JavaScript, and always resets to page one
 * because a narrower or wider set is a new result set, not page four of the old
 * one. Sort is deliberately not a chip: it reorders, it does not constrain.
 */
export function ActiveFilterChips({ criteria }: { criteria: PropertySearchCriteria }) {
  const chips: { id: string; label: string; href: string }[] = [];

  if (criteria.q !== undefined) {
    chips.push({
      id: "q",
      label: `“${criteria.q}”`,
      href: propertiesHref(criteria, { q: undefined, page: 1 })
    });
  }
  if (criteria.minPrice !== undefined) {
    chips.push({
      id: "min",
      label: `Min $${criteria.minPrice.toLocaleString("en-US")}`,
      href: propertiesHref(criteria, { minPrice: undefined, page: 1 })
    });
  }
  if (criteria.maxPrice !== undefined) {
    chips.push({
      id: "max",
      label: `Max $${criteria.maxPrice.toLocaleString("en-US")}`,
      href: propertiesHref(criteria, { maxPrice: undefined, page: 1 })
    });
  }
  if (criteria.beds !== undefined) {
    chips.push({
      id: "beds",
      label: `${criteria.beds}+ beds`,
      href: propertiesHref(criteria, { beds: undefined, page: 1 })
    });
  }
  if (criteria.baths !== undefined) {
    chips.push({
      id: "baths",
      label: `${criteria.baths}+ baths`,
      href: propertiesHref(criteria, { baths: undefined, page: 1 })
    });
  }
  for (const option of criteria.type) {
    chips.push({
      id: `type:${option}`,
      label: option,
      href: propertiesHref(criteria, {
        type: criteria.type.filter((value) => value !== option),
        page: 1
      })
    });
  }
  for (const option of criteria.status) {
    chips.push({
      id: `status:${option}`,
      label: STATUS_LABELS[option],
      href: propertiesHref(criteria, {
        status: criteria.status.filter((value) => value !== option),
        page: 1
      })
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.id}
          href={chip.href}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors hover:border-[var(--purple)] hover:text-[var(--purple)]"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--text)"
          }}
        >
          <span>{chip.label}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5 opacity-60"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l8 8M14 6l-8 8" />
          </svg>
        </Link>
      ))}
      <Link
        href="/properties"
        className="ml-1 text-sm font-semibold underline underline-offset-4"
        style={{ color: "var(--purple)" }}
      >
        Clear all
      </Link>
    </div>
  );
}
