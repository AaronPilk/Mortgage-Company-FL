import { describe, expect, it } from "vitest";
import {
  agentsHref,
  agentsPageCount,
  paginationWindow
} from "../../components/agents/directory-pagination";

/**
 * The directory paginates a state-scale import (~68k rows, ~2,800 pages), so
 * unlike the property search it renders a window of page numbers. The window
 * arithmetic is what makes that nav honest: first and last always reachable,
 * current always visible, gaps marked.
 */
describe("pagination window", () => {
  it("renders nothing for a single page", () => {
    expect(paginationWindow(1, 1)).toEqual([]);
    expect(paginationWindow(1, 0)).toEqual([]);
  });

  it("renders every number while the total is small (fixture-scale directory)", () => {
    expect(paginationWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationWindow(1, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("windows a state-scale directory around the current page", () => {
    expect(paginationWindow(43, 2834)).toEqual([1, "gap", 41, 42, 43, 44, 45, "gap", 2834]);
  });

  it("collapses the leading gap when the window touches the start", () => {
    expect(paginationWindow(3, 2834)).toEqual([1, 2, 3, 4, 5, "gap", 2834]);
    expect(paginationWindow(1, 2834)).toEqual([1, 2, 3, "gap", 2834]);
  });

  it("collapses the trailing gap when the window touches the end", () => {
    expect(paginationWindow(2833, 2834)).toEqual([1, "gap", 2831, 2832, 2833, 2834]);
    expect(paginationWindow(2834, 2834)).toEqual([1, "gap", 2832, 2833, 2834]);
  });

  it("clamps an out-of-range current page instead of drawing a broken window", () => {
    expect(paginationWindow(9999, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const windowed = paginationWindow(9999, 100);
    expect(windowed[windowed.length - 1]).toBe(100);
    expect(windowed).toContain(99);
  });
});

describe("directory hrefs", () => {
  it("keeps page one as the clean canonical URL", () => {
    expect(agentsHref("", 1)).toBe("/agents");
    expect(agentsHref("Tampa", 1)).toBe("/agents?city=Tampa");
  });

  it("carries the filter alongside the page number", () => {
    expect(agentsHref("Tampa", 3)).toBe("/agents?city=Tampa&page=3");
    expect(agentsHref("", 2)).toBe("/agents?page=2");
  });

  it("URL-encodes the filter value", () => {
    expect(agentsHref("St. Petersburg", 2)).toBe("/agents?city=St.+Petersburg&page=2");
  });
});

describe("page count", () => {
  it("rounds up and never reports zero pages", () => {
    expect(agentsPageCount(0, 24)).toBe(1);
    expect(agentsPageCount(24, 24)).toBe(1);
    expect(agentsPageCount(25, 24)).toBe(2);
    expect(agentsPageCount(68000, 24)).toBe(2834);
  });
});
