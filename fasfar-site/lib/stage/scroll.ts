import type { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Whether the page is scrolled within a trigger's range, ends included.
 * (`ScrollTrigger#isActive` is false exactly at `start` and `end`, which is
 * where a fast scroll often lands.)
 */
export const inRange = (st: ScrollTrigger | undefined) => {
  if (!st) return false;
  const y = st.scroll();
  return y >= st.start && y <= st.end;
};
