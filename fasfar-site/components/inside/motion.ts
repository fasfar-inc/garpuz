/** Shared media conditions for Scene 6 (the same split as Scene 4). */
export const CINEMATIC = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
export const REDUCED = "(prefers-reduced-motion: reduce)";
/** Run gsap.matchMedia callbacks on every viewport; the other keys pick the mode. */
export const CONDITIONS = { always: "all", cinematic: CINEMATIC, reduced: REDUCED };
export type Conditions = { always: boolean; cinematic: boolean; reduced: boolean };

/**
 * ScrollTrigger refresh order: earlier sections first (higher numbers refresh
 * first). Scene 5 is -2; Scene 6 follows, then Scene 7.
 */
export const PRIORITY = { arrival: -3, intro: -3, process: -4, structure: -5, profile: -6 } as const;
export const CONNECTION_PRIORITY = { arrival: -7, intro: -7, network: -8, invitation: -9 } as const;
