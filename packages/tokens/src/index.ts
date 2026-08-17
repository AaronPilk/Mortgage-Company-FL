/**
 * Design tokens.
 *
 * CSS custom properties are the canonical runtime for the web. These typed
 * exports exist so a later Expo application can consume the same values without
 * forcing every visual component through one cross-platform abstraction.
 */

export const color = {
  purple950: "#21103d",
  purple900: "#2f1755",
  purple800: "#45217a",
  purple700: "#5b2ea6",
  purple600: "#7446c8",
  purple500: "#8c65dd",
  purple300: "#c9b7f2",
  purple100: "#f0eafd",
  purple50: "#f8f5ff",
  ink: "#17131d",
  muted: "#645d6f",
  line: "#e8e2ee",
  surface: "#ffffff",
  canvas: "#fbfafe",
  success: "#1f7a55",
  warning: "#a45d07",
  danger: "#b4233a"
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.875rem",
  lg: "1.25rem",
  xl: "1.75rem"
} as const;

export const contentWidth = {
  narrow: "44rem",
  default: "72rem",
  wide: "88rem"
} as const;

export type ColorToken = keyof typeof color;

/**
 * Relative luminance and contrast ratio, used by a unit test to prove the
 * shipped text pairings meet WCAG AA rather than asserting it in a doc.
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
