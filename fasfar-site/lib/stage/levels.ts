import { smoothstep } from "./math";
import { beyondPhases, phases } from "./phases";

type Progress = { progress: number; outro: number };

/** How far into the midnight palette the stage is: rises in Scene 2, falls again in Scene 3. */
export function nightLevel(s: Progress, offset: readonly [number, number] = [0, 0]) {
  const night = smoothstep(phases.night[0] + offset[0], phases.night[1] + offset[1], s.progress);
  return night * (1 - smoothstep(beyondPhases.day[0], beyondPhases.day[1], s.outro));
}

/** Local 0 → 1 progress of a Scene 3 phase. */
export const beyondAt = (s: Progress, phase: readonly [number, number]) => smoothstep(phase[0], phase[1], s.outro);
