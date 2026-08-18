declare global {
  interface Window {
    turnstile?: { reset: (widgetId?: string) => void };
  }
}

/** A Turnstile token is single-use. A visible form retry must obtain a fresh one. */
export function resetTurnstile(): void {
  try {
    window.turnstile?.reset();
  } catch {
    // The widget may not be configured or may already have been removed.
  }
}
