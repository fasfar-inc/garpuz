/**
 * Where each beat of the Scene 1 → Scene 2 transition sits on the pinned
 * scroll timeline (0 → 1). The DOM timeline and the WebGL scene both read
 * these, so the two layers stay in sync when the choreography changes.
 */
export const phases = {
  heroOut: [0, 0.3],
  explode: [0.04, 0.66],
  camera: [0.02, 0.78],
  night: [0.12, 0.55],
  headlineIn: [0.42, 0.66],
  cardsIn: [0.55, 0.9],
} as const satisfies Record<string, readonly [number, number]>;

/** Pinned scroll distance, in viewport heights, for the transition. */
export const STAGE_SCROLL_VH = 260;
