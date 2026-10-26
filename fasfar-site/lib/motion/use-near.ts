"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True while `ref`'s element is within `margin` viewport heights of the
 * viewport. Used to mount each WebGL canvas only around its own section, so
 * the page never keeps more than one live WebGL context.
 *
 * Measured on scroll and resize rather than with IntersectionObserver, whose
 * notifications wait for a rendered frame — and a still page under reduced
 * motion may not render one after a jump.
 */
export function useNear(ref: RefObject<Element | null>, margin = 1.5, initial = false) {
  const [near, setNear] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const r = el.getBoundingClientRect();
      const pad = window.innerHeight * margin;
      setNear(r.bottom > -pad && r.top < window.innerHeight + pad);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [ref, margin]);
  return near;
}
