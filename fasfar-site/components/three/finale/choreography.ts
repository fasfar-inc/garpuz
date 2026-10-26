import type { Vec3 } from "../sculpture/parts";

/**
 * Scene 8's signature transformation: the assembled sculpture opens and its
 * components travel out to the edges of the frame, where they frame the
 * FASFAR wordmark. Each slot is art-directed in screen space — x and y are
 * fractions of the half-viewport (-1 left/bottom → 1 right/top) at the
 * camera's final distance — so the frame holds at any aspect ratio.
 *
 * Keyed by part id (see parts.ts); orbiters use "orbiter-0", "orbiter-1".
 * A part without a slot simply stays home.
 */
export type FrameSlot = {
  x: number;
  y: number;
  /** Depth towards the camera (world units). */
  z: number;
  /** Final scale, absolute. */
  scale: number;
  rotation: Vec3;
};

export const frameSlots: Record<string, FrameSlot> = {
  // Left edge, clear of the header and of the headline that arrives later.
  satellite: { x: -0.8, y: 0.6, z: 0.5, scale: 0.28, rotation: [0.9, 0, -0.3] },
  crown: { x: -0.97, y: 0.28, z: -1, scale: 0.48, rotation: [1.05, 0.2, 0.5] },
  core: { x: -0.99, y: -0.36, z: 0, scale: 0.42, rotation: [1.15, 0.3, -0.5] },
  // Right edge.
  base: { x: 0.97, y: 0.6, z: -0.5, scale: 0.4, rotation: [1.2, 0, -0.6] },
  halo: { x: 1.02, y: 0.12, z: -1.5, scale: 0.75, rotation: [0.35, 1.1, 0.2] },
  "pearl-lower": { x: 0.95, y: -0.32, z: 0, scale: 0.4, rotation: [1.2, 0, -0.4] },
  // Bottom edge, mostly below the frame.
  veil: { x: -0.56, y: -1.04, z: 0, scale: 0.42, rotation: [1.1, 0, 0.3] },
  skirt: { x: 0.04, y: -1.1, z: -2, scale: 1.0, rotation: [1.35, 0, 0.05] },
  "pearl-upper": { x: 0.6, y: -1.04, z: 0, scale: 0.38, rotation: [1.25, 0, 0.6] },
  "orbiter-0": { x: -0.16, y: -0.86, z: 1, scale: 0.18, rotation: [0, 0, 0] },
  "orbiter-1": { x: 0.7, y: 0.6, z: 1.5, scale: 0.22, rotation: [0, 0, 0] },
};

/** Phones: the same frame pushed further into the corners, and smaller. */
export const compactAdjust = { spreadX: 1.05, spreadY: 0.96, scale: 0.55 };

/** Camera field of view and its distance from the sculpture once it settles front-on. */
export const FINALE_FOV = 32;
export const FINAL_DISTANCE = 18;
/** Where the camera starts, far down the corridor of connection lines. */
export const START_DISTANCE = 64;

/** Half the visible height and width (world units) at `distance` from the camera. */
export function frustumAt(distance: number, aspect: number) {
  const hh = Math.tan(((FINALE_FOV / 2) * Math.PI) / 180) * distance;
  return { hh, hw: hh * aspect };
}
