"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

type NavItem = { href: string; label: string };

/**
 * Mobile navigation: a menu button in the header row and a sheet that drops
 * from under the header.
 *
 * This replaces a horizontally scrolling strip of nine links. That strip cut
 * half the destinations off the right edge of a phone with no affordance that
 * more existed, and its rows were below the 44px touch minimum. A disclosure
 * menu shows every destination at once, at full tap size.
 *
 * The panel stays mounted while closed (visibility, not conditional render):
 * the header's account affordance and the "Primary mobile" navigation are part
 * of the page contract that tests assert on the DOM, open or not.
 *
 * Positioning is absolute against the header rather than fixed on purpose —
 * the header's backdrop-filter makes it the containing block for fixed
 * descendants, so fixed here would silently anchor to the wrong box.
 */
export function MobileNav({ items, accountLabel }: { items: NavItem[]; accountLabel: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Navigating is the strongest possible "I'm done with the menu" signal.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        // Return focus to the trigger, not to nowhere, on close.
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    // Mirrors the header's inline-nav breakpoint: the menu button is the
    // navigation for every window narrower than min-[1360px].
    <div className="min-[1360px]:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-11 items-center justify-center rounded-xl border transition-colors hover:border-[var(--purple)] hover:text-[var(--purple)]"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      <div
        id="mobile-menu"
        className={`absolute inset-x-0 top-full overflow-y-auto shadow-[var(--shadow-float)] transition-[opacity,transform] duration-200 ${
          open ? "translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
          maxHeight: "calc(100dvh - 4rem)"
        }}
      >
        <nav aria-label="Primary mobile" className="container-wide py-3">
          <ul>
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[48px] items-center rounded-xl px-3 text-base transition-colors hover:bg-[var(--purple-subtle)] hover:text-[var(--purple)] ${
                      active ? "font-semibold" : "font-medium"
                    }`}
                    style={active ? { color: "var(--purple)" } : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li style={{ borderTop: "1px solid var(--border)" }} className="mt-2 pt-2">
              <Link
                href="/account"
                data-nav="account"
                className="flex min-h-[48px] items-center rounded-xl px-3 text-base font-medium transition-colors hover:bg-[var(--purple-subtle)] hover:text-[var(--purple)]"
              >
                {accountLabel}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="container-wide flex items-center justify-between gap-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
          <span className="px-3 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Appearance
          </span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
