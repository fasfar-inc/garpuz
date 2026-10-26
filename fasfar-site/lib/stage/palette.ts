import gsap from "gsap";
import type { ThemeVars } from "./theme";

/**
 * The page palette (theme variables read by the header and chrome) has one
 * writer: a ticker that, each frame, finds the section that owns the scroll
 * position and writes that section's palette if it changed.
 *
 * Sections animate their palette on a plain object (often inside a scrubbed
 * timeline) and register it here. Writing from the ticker rather than from
 * timeline callbacks means scrub smoothing, refresh-time renders and fast
 * jumps between sections can never leave a stale palette on screen.
 */
type PaletteSource = { owns: () => boolean; values: ThemeVars };

const KEYS = ["--ink", "--ink-muted", "--hairline", "--hairline-strong", "--paper"] as const satisfies readonly (keyof ThemeVars)[];
const sources = new Set<PaletteSource>();
let written = "";

function tick() {
  for (const source of sources) {
    if (!source.owns()) continue;
    // Only the palette keys: GSAP adds its own bookkeeping to animated objects.
    const next = KEYS.map((k) => source.values[k]).join("|");
    if (next !== written) {
      written = next;
      const style = document.documentElement.style;
      KEYS.forEach((k) => style.setProperty(k, source.values[k]));
    }
    return;
  }
}

export function registerPalette(source: PaletteSource) {
  if (sources.size === 0) gsap.ticker.add(tick);
  sources.add(source);
  return () => {
    sources.delete(source);
    if (sources.size === 0) gsap.ticker.remove(tick);
  };
}

/**
 * Forget the last write. Call it whenever something else writes the palette
 * directly (a one-off tween or set for a section without a palette source),
 * so the owning source — if any — re-asserts its palette on the next tick.
 */
export const resetPaletteCache = () => {
  written = "";
};
