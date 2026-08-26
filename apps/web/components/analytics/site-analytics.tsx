"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { type AnalyticsEvent, inspectEvent } from "@tract/analytics";

/**
 * Consent-gated analytics.
 *
 * Nothing here runs until a Google Tag Manager container id is configured
 * (NEXT_PUBLIC_GTM_CONTAINER_ID). When it is:
 *
 *   1. Google Consent Mode v2 defaults are set to DENIED before anything loads,
 *      so GTM/GA/Ads set no advertising or analytics cookies until the visitor
 *      opts in. This is the interlock behind CLAUDE.md's "consent-gated" note.
 *   2. GTM loads (denied state = no cookies, only cookieless modelling), so ad
 *      platforms still learn from the visit without identifying anyone.
 *   3. A visitor choice updates consent and is remembered; the banner never
 *      shows again.
 *   4. page_view and cta_click are pushed to the dataLayer — but only through
 *      inspectEvent, the same hard PII guard every other event obeys. A refused
 *      event is dropped, never sent.
 *
 * The GA4 / Google Ads / Meta tags themselves are configured inside GTM; this
 * component only supplies the consent state and the event signals.
 */

const GTM_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
const CONSENT_KEY = "tract.consent";

type Choice = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function readStoredChoice(): Choice | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

/** Consent Mode v2 defaults. Everything non-essential denied until a choice. */
function setConsentDefaults(): void {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push([
    "consent",
    "default",
    {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500
    }
  ]);
  // Redact ad click identifiers and pass them through the URL while denied, so
  // conversions can still be modelled without writing a cookie.
  window.dataLayer.push(["set", "ads_data_redaction", true]);
  window.dataLayer.push(["set", "url_passthrough", true]);
}

function updateConsent(choice: Choice): void {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push([
    "consent",
    "update",
    {
      ad_storage: choice,
      ad_user_data: choice,
      ad_personalization: choice,
      analytics_storage: choice
    }
  ]);
}

function loadGtm(id: string): void {
  if (document.getElementById("gtm-loader")) return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = "gtm-loader";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

function emit(event: AnalyticsEvent): void {
  const verdict = inspectEvent(event);
  if (!verdict.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`analytics event refused: ${verdict.reason}`);
    }
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  const { name, ...params } = event;
  window.dataLayer.push({ event: name, ...params });
}

/** A coarse, non-identifying grouping from the first path segment. */
function contentGroupFor(path: string): string {
  if (path === "/") return "home";
  return path.split("/").filter(Boolean)[0] ?? "home";
}

export function SiteAnalytics() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [ready, setReady] = useState(false);

  // Boot: defaults, remembered choice, GTM. Once only.
  useEffect(() => {
    if (GTM_ID === undefined) return;
    const stored = readStoredChoice();
    setConsentDefaults();
    if (stored === "granted") updateConsent("granted");
    loadGtm(GTM_ID);
    setChoice(stored);
    setReady(true);
  }, []);

  // A page_view per client navigation, through the guard.
  useEffect(() => {
    if (GTM_ID === undefined || !ready) return;
    emit({ name: "page_view", path: pathname, contentGroup: contentGroupFor(pathname) });
  }, [pathname, ready]);

  // One delegated listener turns every [data-cta] into a cta_click.
  useEffect(() => {
    if (GTM_ID === undefined) return;
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const element = target?.closest?.("[data-cta]") as HTMLElement | null;
      if (element === null) return;
      emit({
        name: "cta_click",
        ctaId: element.getAttribute("data-cta") ?? "unknown",
        placement:
          element.getAttribute("data-placement") ?? contentGroupFor(window.location.pathname),
        destination: element.getAttribute("href") ?? ""
      });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const decide = useCallback((next: Choice) => {
    try {
      localStorage.setItem(CONSENT_KEY, next);
    } catch {
      // A blocked storage write still applies the choice for this page view.
    }
    updateConsent(next);
    setChoice(next);
  }, []);

  // No container, no prior choice made yet, or not mounted → no banner.
  if (GTM_ID === undefined || !ready || choice !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4"
    >
      <div
        className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border p-4 shadow-[0_16px_44px_var(--purple-glow)] sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "var(--card-bg)", borderColor: "var(--purple)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          We use cookies to measure site traffic and ad performance. You can accept, or decline and
          keep only what the site needs to work.{" "}
          <a
            href="/privacy"
            className="font-medium underline underline-offset-2"
            style={{ color: "var(--purple)" }}
          >
            Privacy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2.5">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="min-h-[44px] rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:border-[var(--purple)] hover:text-[var(--purple)]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="min-h-[44px] rounded-xl px-5 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
            style={{ background: "var(--purple)", boxShadow: "0 4px 14px var(--purple-glow)" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
