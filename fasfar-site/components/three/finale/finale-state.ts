"use client";

import { createContext, useContext } from "react";

/**
 * Scroll state shared between Scene 8's DOM timeline and its canvas. Plain
 * mutable fields read in `useFrame`, so scrolling never re-renders React.
 */
export type FinaleState = {
  /** Scene 8 timeline progress, 0 → 1. */
  progress: number;
  pointer: { x: number; y: number };
  reducedMotion: boolean;
  invalidate: () => void;
  setReducedMotion: (value: boolean) => void;
};

export function createFinaleState(): FinaleState {
  const state: FinaleState = {
    progress: 0,
    pointer: { x: 0, y: 0 },
    reducedMotion: false,
    invalidate: () => {},
    setReducedMotion(value) {
      state.reducedMotion = value;
      state.invalidate();
    },
  };
  return state;
}

export const FinaleContext = createContext<FinaleState | null>(null);

export function useFinale() {
  const state = useContext(FinaleContext);
  if (!state) throw new Error("useFinale must be used inside <FinaleContext>");
  return state;
}
