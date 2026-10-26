"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

/** Fine pointers that can hover, with motion allowed. */
const MAGNETIC_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * Pulls an element towards the cursor while it is within `radius` px of the
 * element's edge, and eases it home when the cursor leaves. Desktop only;
 * a no-op on touch devices and under reduced motion.
 *
 * Apply it to a wrapper that no other animation moves, as it owns `x`/`y`.
 */
export function useMagnetic<T extends HTMLElement>({ strength = 0.3, radius = 90 } = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia(MAGNETIC_QUERY).matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // Measure from the element's resting position, not its pulled one.
      const cx = r.left + r.width / 2 - Number(gsap.getProperty(el, "x"));
      const cy = r.top + r.height / 2 - Number(gsap.getProperty(el, "y"));
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const inside = Math.abs(dx) < r.width / 2 + radius && Math.abs(dy) < r.height / 2 + radius;
      xTo(inside ? dx * strength : 0);
      yTo(inside ? dy * strength : 0);
    };
    const reset = () => {
      xTo(0);
      yTo(0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [strength, radius]);

  return ref;
}
