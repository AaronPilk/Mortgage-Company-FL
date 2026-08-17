/**
 * Design tokens.
 *
 * CSS custom properties in apps/web/app/globals.css are the canonical runtime.
 * These typed exports mirror them so a later Expo client consumes the same
 * values without forcing every visual component through one cross-platform
 * abstraction.
 */

export const light = {
  bg: "#ffffff",
  surface: "#f4f4f8",
  surface2: "#ebebf2",
  text: "#0a0a0a",
  textMuted: "#616873",
  purple: "#7c3aed",
  purpleDark: "#5b21b6",
  purpleLight: "#a855f7"
} as const;

export const dark = {
  bg: "#09090f",
  surface: "#13131f",
  surface2: "#1c1c2e",
  text: "#f0f0f8",
  textMuted: "#9ca3af",
  purple: "#9b5ef5",
  purpleDark: "#7c3aed",
  purpleLight: "#c084fc"
} as const;

export const status = {
  success: "#0f7a4f",
  warning: "#a45d07",
  danger: "#b4233a"
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  xl2: "2rem"
} as const;

export const contentWidth = {
  narrow: "46rem",
  default: "74rem",
  wide: "88rem"
} as const;

export const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Relative luminance and contrast ratio, used by a unit test to prove the
 * shipped text pairings meet WCAG AA rather than asserting it in a document.
 */
export function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => {
    const part = Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
    return part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}
