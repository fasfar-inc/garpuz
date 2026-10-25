/**
 * Where each beat of the home stage sits on the pinned scroll timeline.
 *
 * The stage is split into segments, one per scene transition. Each segment
 * has its own 0 → 1 progress (`store.progress` for Scene 1 → 2,
 * `store.outro` for Scene 2 → 3), and the DOM timeline and the WebGL scene
 * both read these phase ranges, so the two layers stay in sync when the
 * choreography changes.
 */

/** Scene 1 → Scene 2, on `store.progress`. */
export const phases = {
  heroOut: [0, 0.3],
  explode: [0.04, 0.66],
  camera: [0.02, 0.78],
  night: [0.12, 0.55],
  headlineIn: [0.42, 0.66],
  cardsIn: [0.55, 0.9],
} as const satisfies Record<string, readonly [number, number]>;

/** Scene 2 → Scene 3 ("Beyond the ordinary"), on `store.outro`. */
export const beyondPhases = {
  ecosystemOut: [0, 0.1],
  sculptureExit: [0.02, 0.3],
  camera: [0.04, 0.42],
  day: [0.06, 0.32],
  eyebrowIn: [0.14, 0.22],
  statements: [
    { reveal: [0.2, 0.3], fill: [0.25, 0.34] },
    { reveal: [0.36, 0.46], fill: [0.41, 0.5] },
    { reveal: [0.52, 0.62], fill: [0.57, 0.66] },
  ],
  settle: [0.66, 0.8],
  copyIn: [0.74, 0.9],
  floatersIn: [0.22, 0.84],
} as const;

/** Pinned scroll distance per segment, in viewport heights. */
export const SEGMENT_VH = [260, 420] as const;

/** Timeline time at which each chapter is fully on screen (segment 1 spans 0 → 1). */
export const SEGMENT_DURATIONS = SEGMENT_VH.map((vh) => vh / SEGMENT_VH[0]);
export const TIMELINE_DURATION = SEGMENT_DURATIONS.reduce((a, b) => a + b, 0);
export const CHAPTER_TIMES = [0, SEGMENT_DURATIONS[0], TIMELINE_DURATION];
export const STAGE_TOTAL_VH = SEGMENT_VH.reduce((a, b) => a + b, 0);
