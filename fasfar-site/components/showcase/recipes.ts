import gsap from "gsap";
import type { ShowcaseVisual } from "@/content/ventures";

/**
 * Animation recipes for the venture showcase, one per visual. Each recipe
 * writes tweens into a timeline the showcase owns, at a given position and
 * duration, so the same choreography serves the desktop pinned sequence and
 * the mobile vertical showcase — and every tween scrubs in both directions.
 *
 * Elements are found by `data-sv` attributes inside the venture's panel.
 */
export type RecipeContext = {
  tl: gsap.core.Timeline;
  at: number;
  dur: number;
  reduced: boolean;
};

export type Recipe = {
  /** Scroll-driven steps in `dwell` (products, menu categories…), for click-to-step controls. */
  steps: number;
  /** How the whole panel arrives over the previous venture (desktop sequence only). */
  panelEnter(panel: HTMLElement, ctx: RecipeContext): void;
  /** How the visual's elements arrive. */
  enter(panel: HTMLElement, ctx: RecipeContext): void;
  /** What happens while the venture holds the stage. */
  dwell(panel: HTMLElement, ctx: RecipeContext): void;
};

const all = (panel: HTMLElement, name: string) => Array.from(panel.querySelectorAll<HTMLElement>(`[data-sv="${name}"]`));
const one = (panel: HTMLElement, name: string) => panel.querySelector<HTMLElement>(`[data-sv="${name}"]`);
const steps = (panel: HTMLElement) => Array.from(panel.querySelectorAll<HTMLElement>("[data-sv-step]"));
const gotos = (panel: HTMLElement) => Array.from(panel.querySelectorAll<HTMLElement>("[data-sv-goto]"));

/** Time at which step `k` of `count` becomes active within a dwell. */
export const stepTime = (k: number, count: number, at: number, dur: number) => at + (dur * k) / count;

/** Swap stacked step layers at evenly spaced points; marks the matching control as active. */
function stepper(panel: HTMLElement, { tl, at, dur, reduced }: RecipeContext, children?: string) {
  const layers = steps(panel);
  const controls = gotos(panel);
  if (controls[0]) tl.set(controls[0], { attr: { "data-active": "true" } }, at);
  layers.forEach((layer, k) => {
    if (k === 0) return;
    const t = stepTime(k, layers.length, at, dur);
    const d = Math.min(0.12, dur / layers.length / 2);
    tl.to(layers[k - 1], { autoAlpha: 0, y: reduced ? 0 : -14, duration: d * 0.8, ease: "power1.in" }, t - d * 0.8)
      .fromTo(layer, { autoAlpha: 0, y: reduced ? 0 : 18 }, { autoAlpha: 1, y: 0, duration: d, ease: "power2.out" }, t);
    if (children && !reduced) {
      tl.fromTo(layer.querySelectorAll(`[data-sv="${children}"]`), { x: 18, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: d / 4, duration: d, ease: "power2.out" }, t);
    }
    if (controls[k - 1]) tl.set(controls[k - 1], { attr: { "data-active": "false" } }, t);
    if (controls[k]) tl.set(controls[k], { attr: { "data-active": "true" } }, t);
  });
}

/** Floating chips drift against the main object for depth. */
function parallax(panel: HTMLElement, { tl, at, dur, reduced }: RecipeContext) {
  if (reduced) return;
  all(panel, "float").forEach((el) => {
    const depth = Number(el.dataset.depth ?? 60);
    tl.fromTo(el, { yPercent: depth * 0.6 }, { yPercent: -depth * 0.6, duration: dur, ease: "none" }, at);
  });
}

const mobility: Recipe = {
  steps: 0,
  panelEnter(panel, { tl, at, dur }) {
    tl.fromTo(panel, { clipPath: "circle(0% at 72% 50%)" }, { clipPath: "circle(150% at 72% 50%)", duration: dur, ease: "power2.inOut" }, at);
  },
  enter(panel, { tl, at, dur, reduced }) {
    const rig = one(panel, "rig");
    tl.fromTo(
      rig,
      reduced ? { autoAlpha: 0 } : { autoAlpha: 0, z: -900, rotationY: -58, rotationX: 24, xPercent: 35, yPercent: 18 },
      { autoAlpha: 1, z: 0, rotationY: -20, rotationX: 8, xPercent: 0, yPercent: 0, duration: dur, ease: "power3.out" },
      at,
    )
      .fromTo(all(panel, "glow"), { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 0.8, duration: dur, ease: "power2.out" }, at)
      .fromTo(all(panel, "ring"), { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: dur, ease: "power2.out" }, at + dur * 0.2);
  },
  dwell(panel, ctx) {
    const { tl, at, dur, reduced } = ctx;
    // A slow "camera" move around the phone while the route draws.
    if (!reduced) tl.to(one(panel, "rig"), { rotationY: 14, rotationX: -3, xPercent: -6, duration: dur, ease: "none" }, at);
    tl.to(one(panel, "route"), { strokeDashoffset: 0, duration: dur * 0.6, ease: "power1.inOut" }, at)
      .fromTo(one(panel, "pin"), { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: dur * 0.12, ease: "back.out(3)" }, at + dur * 0.55);
    parallax(panel, ctx);
  },
};

const commerce: Recipe = {
  steps: 4,
  panelEnter(panel, { tl, at, dur }) {
    tl.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: dur, ease: "power2.inOut" }, at).fromTo(
      panel.querySelector("[data-panel-inner]"),
      { yPercent: -35 },
      { yPercent: 0, duration: dur, ease: "power2.inOut" },
      at,
    );
  },
  enter(panel, { tl, at, dur, reduced }) {
    tl.fromTo(
      one(panel, "card"),
      reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 140, rotationX: 38, transformOrigin: "50% 100%" },
      { autoAlpha: 1, y: 0, rotationX: 0, duration: dur, ease: "power3.out" },
      at,
    )
      .fromTo(
        all(panel, "tile"),
        reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 90, rotation: (i: number) => (i % 2 ? 18 : -18) },
        { autoAlpha: 1, y: 0, rotation: 0, stagger: dur * 0.08, duration: dur * 0.7, ease: "power3.out" },
        at + dur * 0.15,
      )
      .fromTo(
        one(panel, "emblem"),
        reduced ? { autoAlpha: 0 } : { autoAlpha: 0, xPercent: 45, yPercent: -20, rotation: 28 },
        { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: -6, duration: dur, ease: "power3.out" },
        at + dur * 0.1,
      )
      .fromTo(all(panel, "glow"), { autoAlpha: 0 }, { autoAlpha: 0.7, duration: dur }, at);
  },
  dwell(panel, ctx) {
    const { tl, at, dur, reduced } = ctx;
    stepper(panel, ctx, "offer");
    const dots = Array.from(panel.querySelectorAll<HTMLElement>("[data-sv-dot]"));
    dots.forEach((dot, k) => {
      const t = stepTime(k, dots.length, at, dur);
      tl.set(dot, { opacity: 1 }, t);
      if (dots[k - 1]) tl.set(dots[k - 1], { opacity: 0 }, t);
    });
    if (!reduced) tl.to(one(panel, "emblem"), { rotation: 6, yPercent: 8, duration: dur, ease: "none" }, at);
  },
};

const hospitality: Recipe = {
  steps: 4,
  panelEnter(panel, { tl, at, dur }) {
    tl.fromTo(panel, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: dur, ease: "power3.inOut" }, at);
  },
  enter(panel, { tl, at, dur, reduced }) {
    tl.fromTo(
      one(panel, "rig"),
      reduced ? { autoAlpha: 0 } : { autoAlpha: 0, yPercent: 45, rotationX: 32, rotationY: -12 },
      { autoAlpha: 1, yPercent: 0, rotationX: 6, rotationY: -14, duration: dur, ease: "power3.out" },
      at,
    )
      .fromTo(
        one(panel, "qr"),
        reduced ? { autoAlpha: 0 } : { autoAlpha: 0, xPercent: -60, yPercent: 30, rotation: -32 },
        { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: 0, duration: dur * 0.8, ease: "power3.out" },
        at + dur * 0.25,
      )
      .fromTo(one(panel, "link"), { autoAlpha: 0 }, { autoAlpha: 1, duration: dur * 0.3 }, at + dur * 0.7)
      .fromTo(all(panel, "glow"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 0.8, scale: 1, duration: dur, ease: "power2.out" }, at);
  },
  dwell(panel, ctx) {
    const { tl, at, dur, reduced } = ctx;
    stepper(panel, ctx, "dish");
    // Slide the active-tab bar under each category in turn.
    const tabs = all(panel, "tab");
    const bar = one(panel, "tab-bar");
    tabs.forEach((tab, k) => {
      if (!bar || k === 0) return;
      tl.to(bar, { x: () => tab.offsetLeft, width: () => tab.offsetWidth, duration: Math.min(0.1, dur / tabs.length / 2), ease: "power2.inOut" }, stepTime(k, tabs.length, at, dur));
    });
    if (bar && tabs[0]) tl.set(bar, { x: () => tabs[0].offsetLeft, width: () => tabs[0].offsetWidth }, at);
    if (!reduced) tl.to(one(panel, "rig"), { rotationY: 8, rotationX: 2, duration: dur, ease: "none" }, at);
  },
};

const automation: Recipe = {
  steps: 4,
  panelEnter(panel, { tl, at, dur }) {
    tl.fromTo(
      panel,
      { autoAlpha: 0, scale: 1.08, filter: "brightness(2.2) blur(10px)" },
      { autoAlpha: 1, scale: 1, filter: "brightness(1) blur(0px)", duration: dur, ease: "power2.out" },
      at,
    );
  },
  enter(panel, { tl, at, dur, reduced }) {
    tl.fromTo(
      one(panel, "panel"),
      reduced ? { autoAlpha: 0 } : { autoAlpha: 0, z: -320, rotationY: 20, xPercent: -10 },
      { autoAlpha: 1, z: 40, rotationY: 0, xPercent: 0, duration: dur, ease: "power3.out" },
      at,
    )
      .fromTo(
        all(panel, "node"),
        reduced ? { autoAlpha: 0 } : { autoAlpha: 0, scale: 0.7, y: 20 },
        { autoAlpha: 1, scale: 1, y: 0, stagger: dur * 0.1, duration: dur * 0.5, ease: "back.out(2)" },
        at + dur * 0.2,
      )
      .to(all(panel, "wire"), { strokeDashoffset: 0, stagger: dur * 0.1, duration: dur * 0.35, ease: "power1.inOut" }, at + dur * 0.35)
      .fromTo(all(panel, "pulse"), { opacity: 0 }, { opacity: 0.9, duration: dur * 0.3 }, at + dur * 0.7)
      .fromTo(all(panel, "glow"), { autoAlpha: 0 }, { autoAlpha: 0.7, duration: dur }, at);
  },
  dwell(panel, ctx) {
    const { tl, at, dur, reduced } = ctx;
    // The conversation builds up message by message.
    const bubbles = all(panel, "bubble");
    bubbles.forEach((bubble, k) => {
      tl.fromTo(
        bubble,
        { autoAlpha: 0, y: reduced ? 0 : 16, scale: reduced ? 1 : 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: Math.min(0.1, dur / bubbles.length / 2), ease: "power2.out" },
        stepTime(k, bubbles.length, at, dur * 0.85),
      );
    });
    parallax(panel, ctx);
  },
};

const generic: Recipe = {
  steps: 0,
  panelEnter(panel, { tl, at, dur }) {
    tl.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur }, at);
  },
  enter(panel, { tl, at, dur, reduced }) {
    tl.fromTo(one(panel, "rig"), reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: dur, ease: "power3.out" }, at);
  },
  dwell(panel, ctx) {
    if (!ctx.reduced) ctx.tl.to(one(panel, "rig"), { rotationY: 10, duration: ctx.dur, ease: "none" }, ctx.at);
  },
};

const recipes: Record<ShowcaseVisual, Recipe> = { mobility, commerce, hospitality, automation };

export const recipeFor = (visual: string): Recipe => recipes[visual as ShowcaseVisual] ?? generic;

/** Copy column arrival, shared by every venture. */
export function enterCopy(panel: HTMLElement, { tl, at, dur, reduced }: RecipeContext) {
  tl.fromTo(
    panel.querySelectorAll("[data-sv-name]"),
    reduced ? { autoAlpha: 0 } : { autoAlpha: 0, yPercent: 105, rotationX: -50 },
    { autoAlpha: 1, yPercent: 0, rotationX: 0, duration: dur * 0.8, ease: "power3.out" },
    at,
  ).fromTo(
    panel.querySelectorAll("[data-sv-copy]"),
    { autoAlpha: 0, y: reduced ? 0 : 36 },
    { autoAlpha: 1, y: 0, stagger: dur * 0.08, duration: dur * 0.6, ease: "power2.out" },
    at + dur * 0.15,
  );
}
