"use client";

import { useEffect, useState } from "react";

/**
 * Light and dark are both first-class. Light is the default because a mortgage
 * brokerage is read by people making an expensive decision and the material is
 * long-form; dark is one click away and persists.
 *
 * The inline script in the layout applies the stored choice before first paint,
 * so there is no flash of the wrong theme.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem("tract.theme", next ? "dark" : "light");
    } catch {
      // Private browsing. The toggle still works for this page view.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex size-10 items-center justify-center rounded-xl border transition-colors hover:border-[var(--purple)] hover:text-[var(--purple)]"
      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
