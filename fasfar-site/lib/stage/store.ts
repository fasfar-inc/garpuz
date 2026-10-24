"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

/**
 * Shared, mutable state between the DOM scroll timeline (GSAP) and the WebGL
 * scene (R3F). Hot values (progress, pointer) are plain fields read inside
 * `useFrame`, so scrolling never triggers React renders. The few values the
 * UI needs to render (hovered venture, active chapter) go through `subscribe`.
 */
export type StageStore = {
  /** Smoothed timeline progress across the pinned stage, 0 → 1. */
  progress: number;
  /** Normalised pointer, -1 → 1 on both axes. */
  pointer: { x: number; y: number };
  reducedMotion: boolean;
  /** DOM nodes the WebGL scene projects anchor points onto. */
  cards: (HTMLElement | null)[];
  lines: (SVGPathElement | null)[];
  anchorDots: (SVGCircleElement | null)[];
  cardDots: (SVGCircleElement | null)[];
  /** Set by the canvas; asks for a frame when rendering on demand. */
  invalidate: () => void;
  setInvalidate: (fn: () => void) => void;
  setReducedMotion: (value: boolean) => void;
  /** Register a DOM node the WebGL layer writes to. */
  attach: <K extends "cards" | "lines" | "anchorDots" | "cardDots">(kind: K, index: number, el: StageStore[K][number]) => void;

  hovered: number | null;
  chapter: number;
  setHovered: (index: number | null) => void;
  setChapter: (index: number) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createStageStore(): StageStore {
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const store: StageStore = {
    progress: 0,
    pointer: { x: 0, y: 0 },
    reducedMotion: false,
    cards: [],
    lines: [],
    anchorDots: [],
    cardDots: [],
    invalidate: () => {},
    setInvalidate(fn) {
      store.invalidate = fn;
    },
    setReducedMotion(value) {
      store.reducedMotion = value;
      store.invalidate();
    },
    attach(kind, index, el) {
      (store[kind] as (typeof el)[])[index] = el;
    },
    hovered: null,
    chapter: 0,
    setHovered(index) {
      if (store.hovered === index) return;
      store.hovered = index;
      store.invalidate();
      emit();
    },
    setChapter(index) {
      if (store.chapter === index) return;
      store.chapter = index;
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return store;
}

export const StageContext = createContext<StageStore | null>(null);

export function useStage(): StageStore {
  const store = useContext(StageContext);
  if (!store) throw new Error("useStage must be used inside <StageContext>");
  return store;
}

export function useStageValue<T>(select: (s: StageStore) => T, fallback: T): T {
  const store = useContext(StageContext);
  return useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    () => (store ? select(store) : fallback),
    () => fallback,
  );
}

const noopSubscribe = () => () => {};
