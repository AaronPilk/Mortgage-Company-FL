import Link from "next/link";
import { LISTING_SORTS, PROPERTY_TYPE_OPTIONS, PUBLIC_STATUS_OPTIONS } from "@tract/integrations";
import {
  SORT_LABELS,
  STATUS_LABELS,
  hasActiveFilters,
  type PropertySearchCriteria
} from "./criteria";

/**
 * Search controls.
 *
 * A plain GET form. Submitting rewrites the query string, the server renders
 * the matching page, and the result is a URL somebody can send to their agent.
 * No client component, no fetch, no state to fall out of sync with the address
 * bar — and the whole thing works before any JavaScript loads.
 *
 * `page` is deliberately not a field. Changing a filter starts a new result
 * set, so it must not silently land the reader on page four of it.
 */

const fieldLabel = "block text-sm font-semibold";
const controlClass =
  "mt-1.5 w-full min-h-[44px] rounded-xl border px-3 py-2 text-sm " +
  "focus:border-[var(--purple)] focus:outline-none focus:ring-2 focus:ring-[var(--purple-glow)]";

const controlStyle = {
  borderColor: "var(--border)",
  background: "var(--surface)",
  color: "var(--text)"
} as const;

const BED_OPTIONS = [1, 2, 3, 4, 5];
const BATH_OPTIONS = [1, 2, 3, 4];

export function SearchFilters({ criteria }: { criteria: PropertySearchCriteria }) {
  return (
    <form
      method="get"
      action="/properties"
      role="search"
      aria-label="Property search"
      className="rounded-2xl border p-5 sm:p-6"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
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

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold" style={{ color: "var(--text)" }}>
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
          <legend className="text-sm font-semibold" style={{ color: "var(--text)" }}>
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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[0.95rem] font-semibold text-white shadow-[0_4px_14px_var(--purple-glow)] transition-all duration-200 hover:-translate-y-0.5"
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
  );
}
