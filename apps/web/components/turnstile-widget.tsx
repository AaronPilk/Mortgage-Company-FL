"use client";

import { useEffect, useRef } from "react";
import { registerTurnstileWidget, unregisterTurnstileWidget } from "@/lib/turnstile-browser";

/**
 * Explicitly rendered Turnstile widget.
 *
 * Cloudflare's api.js auto-renders `.cf-turnstile` elements exactly once, when
 * the script itself loads. Every widget on this site that appears later — the
 * planner's final step, the calculator review forms that open on click, the
 * vision wizard's final step — mounted after that scan, so the widget never
 * rendered, no token was ever issued, and the server correctly refused the
 * submission. Rendering explicitly on mount is the only shape that works for a
 * widget inside multi-step or conditionally shown forms, so every form uses it,
 * including the ones that happened to render at page load.
 *
 * The script may not have arrived yet when this mounts (it loads
 * afterInteractive), so rendering retries briefly until `window.turnstile`
 * exists. The default hidden input name `cf-turnstile-response` is preserved —
 * every form reads its token under that key.
 */
export function TurnstileWidget({
  siteKey,
  action,
  className
}: {
  siteKey: string;
  /** Must match the server route's expectedAction, which is verified. */
  action: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let widgetId: string | undefined;

    const render = (): void => {
      if (cancelled) return;
      const turnstile = window.turnstile;
      const container = containerRef.current;
      if (turnstile?.render === undefined || container === null) {
        timer = window.setTimeout(render, 150);
        return;
      }
      // Strict-mode double-invocation guard: an already-populated container
      // means this effect's twin has rendered, and a second widget in the same
      // element would produce two competing hidden inputs.
      if (container.childElementCount > 0) return;
      widgetId = turnstile.render(container, { sitekey: siteKey, action });
      if (widgetId !== undefined) registerTurnstileWidget(widgetId);
    };

    render();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      if (widgetId !== undefined) {
        unregisterTurnstileWidget(widgetId);
        try {
          window.turnstile?.remove?.(widgetId);
        } catch {
          // The script may have been torn down first; nothing to clean up.
        }
      }
    };
  }, [siteKey, action]);

  return <div ref={containerRef} className={className} />;
}
