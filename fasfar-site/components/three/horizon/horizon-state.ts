"use client";

import { createContext, useContext } from "react";

/**
 * Scroll state shared between Scene 5's DOM timeline and its canvas. Plain
 * mutable fields read in `useFrame`, so scrolling never re-renders React.
 */
export type HorizonState = {
  /** Scene 5 timeline progress, 0 → 1. */
  progress: number;
  pointer: { x: number; y: number };
  reducedMotion: boolean;
  invalidate: () => void;
  setReducedMotion: (value: boolean) => void;
};

export function createHorizonState(): HorizonState {
  const state: HorizonState = {
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

export const HorizonContext = createContext<HorizonState | null>(null);

export function useHorizon() {
  const state = useContext(HorizonContext);
  if (!state) throw new Error("useHorizon must be used inside <HorizonContext>");
  return state;
}
