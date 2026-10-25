/** Shared media conditions for Scene 6 (the same split as Scene 4). */
export const CINEMATIC = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
export const REDUCED = "(prefers-reduced-motion: reduce)";
/** Run gsap.matchMedia callbacks on every viewport; the other keys pick the mode. */
export const CONDITIONS = { always: "all", cinematic: CINEMATIC, reduced: REDUCED };
export type Conditions = { always: boolean; cinematic: boolean; reduced: boolean };

/** Scene 6 refreshes after Scene 5 (-2); later parts after earlier ones. */
export const PRIORITY = { arrival: -3, intro: -3, process: -4, structure: -5, profile: -6 } as const;
