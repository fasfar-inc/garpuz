"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

const QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * Tilts an element in 3D towards the cursor while the cursor is over `area`
 * (defaults to the element's parent). Desktop only. Like useMagnetic, apply
 * it to a wrapper no other animation transforms.
 */
export function useTilt<T extends HTMLElement>({ max = 8, shift = 14 } = {}) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    const area = el?.parentElement;
    if (!el || !area || !window.matchMedia(QUERY).matches) return;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.9, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.9, ease: "power3.out" });
    const tx = gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" });
    const ty = gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      ry(nx * max);
      rx(-ny * max * 0.7);
      tx(nx * shift);
      ty(ny * shift * 0.6);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
      tx(0);
      ty(0);
    };
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);
    return () => {
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      gsap.set(el, { rotationX: 0, rotationY: 0, x: 0, y: 0 });
    };
  }, [max, shift]);
  return ref;
}
