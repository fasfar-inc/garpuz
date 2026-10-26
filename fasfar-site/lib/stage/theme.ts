import type { VentureColors } from "@/content/ventures";

/** Theme variables read by the header and stage chrome (see globals.css). */
export type ThemeVars = Record<"--ink" | "--ink-muted" | "--hairline" | "--hairline-strong" | "--paper", string>;

/** Ivory palette, matching the `:root` defaults in globals.css. */
export const IVORY_THEME: ThemeVars = {
  "--ink": "#141312",
  "--ink-muted": "rgba(20,19,18,0.62)",
  "--hairline": "rgba(20,19,18,0.12)",
  "--hairline-strong": "rgba(20,19,18,0.34)",
  "--paper": "#f1ede6",
};

/** Midnight palette for Scene 2. */
export const NIGHT_THEME: ThemeVars = {
  "--ink": "#eef1f8",
  "--ink-muted": "rgba(222,229,244,0.68)",
  "--hairline": "rgba(222,229,244,0.16)",
  "--hairline-strong": "rgba(222,229,244,0.42)",
  "--paper": "#0a1430",
};

const rgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

/** Theme variables for a venture's showcase surface. */
export const themeFromColors = ({ ink, surface }: VentureColors): ThemeVars => ({
  "--ink": ink,
  "--ink-muted": rgba(ink, 0.62),
  "--hairline": rgba(ink, 0.12),
  "--hairline-strong": rgba(ink, 0.34),
  "--paper": surface,
});
