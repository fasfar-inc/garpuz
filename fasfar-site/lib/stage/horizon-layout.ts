import type { SceneFrame } from "./layout";
import { lerp } from "./math";

/**
 * Where Scene 5's sculpture sits on screen (fractions of the viewport) while
 * it assembles, and in the closing "vision" composition.
 */
export type HorizonLayout = {
  /** While it assembles (Part 2). */
  stage: SceneFrame;
  /** Risen above the statements, like a sun over the horizon (Part 3). */
  dawn: SceneFrame;
  /** Beside the company vision (Part 4). */
  vision: SceneFrame;
  compact: boolean;
};

export function getHorizonLayout(width: number, height: number): HorizonLayout {
  if (width < 768) {
    const s = Math.min(1, width / height / 0.6) * 0.58;
    return {
      compact: true,
      stage: { x: 0.5, y: 0.46, scale: s },
      dawn: { x: 0.5, y: 0.27, scale: s * 0.62 },
      vision: { x: 0.5, y: 0.29, scale: s * 0.72 },
    };
  }
  const s = Math.min(1, width / height / 1.35) * (height < 860 ? 0.9 : 1);
  return {
    compact: false,
    stage: { x: 0.5, y: 0.5, scale: s * 0.92 },
    dawn: { x: 0.5, y: 0.3, scale: s * 0.5 },
    vision: { x: 0.71, y: 0.5, scale: s * 0.8 },
  };
}

/** Blend the three frames: stage → dawn (by `dawn`) → vision (by `vision`). */
export function frameAt(layout: HorizonLayout, dawn: number, vision: number): SceneFrame {
  const mix = (a: SceneFrame, b: SceneFrame, t: number): SceneFrame => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), scale: lerp(a.scale, b.scale, t) });
  return mix(mix(layout.stage, layout.dawn, dawn), layout.vision, vision);
}
