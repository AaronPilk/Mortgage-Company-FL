declare global {
  interface Window {
    turnstile?: {
      render?: (
        container: HTMLElement,
        options: { sitekey: string; action?: string }
      ) => string | undefined;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

/**
 * Widgets rendered explicitly (see components/turnstile-widget.tsx) register
 * here so a form retry can reset them by id. A bare `turnstile.reset()` only
 * reaches implicitly rendered widgets, of which this site has none.
 */
const activeWidgetIds = new Set<string>();

export function registerTurnstileWidget(widgetId: string): void {
  activeWidgetIds.add(widgetId);
}

export function unregisterTurnstileWidget(widgetId: string): void {
  activeWidgetIds.delete(widgetId);
}

/**
 * A Turnstile token is single-use. A visible form retry must obtain a fresh one.
 *
 * Resetting every registered widget assumes at most one lead form — and so one
 * widget — is on screen at a time, which holds for every current screen. A
 * per-form reset that targets only the retried form's widget is the refactor
 * if that assumption ever breaks.
 */
export function resetTurnstile(): void {
  for (const widgetId of activeWidgetIds) {
    try {
      window.turnstile?.reset(widgetId);
    } catch {
      // This widget may not be configured or may already have been removed;
      // one failed reset must not skip the remaining widgets.
    }
  }
}
