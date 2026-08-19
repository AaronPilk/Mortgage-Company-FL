/**
 * Directory pagination arithmetic, kept pure and separate from the component:
 * a state-scale import means ~2,800 pages, so unlike the property search the
 * agent directory cannot render every page number — it renders a window, and
 * the window logic is the part worth unit-testing without a DOM.
 */

export type PageItem = number | "gap";

/**
 * First, last, and a small window around the current page, with "gap" markers
 * where numbers were elided: 1 … 41 42 [43] 44 45 … 2834. Small totals come
 * back whole, so the fixture-scale directory looks like the property search.
 */
export function paginationWindow(current: number, totalPages: number): PageItem[] {
  if (totalPages <= 1) return [];
  const clamped = Math.min(Math.max(current, 1), totalPages);
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const around = [clamped - 2, clamped - 1, clamped, clamped + 1, clamped + 2].filter(
    (page) => page > 1 && page < totalPages
  );
  const items: PageItem[] = [1];
  if (around.length > 0 && around[0] !== 2) items.push("gap");
  items.push(...around);
  const lastAround = around[around.length - 1];
  if (lastAround === undefined || lastAround !== totalPages - 1) items.push("gap");
  items.push(totalPages);
  return items;
}

/** /agents?city=…&page=… with defaults omitted, so page one is the clean URL. */
export function agentsHref(city: string, page: number): string {
  const params = new URLSearchParams();
  if (city !== "") params.set("city", city);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? "/agents" : `/agents?${query}`;
}

export function agentsPageCount(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}
