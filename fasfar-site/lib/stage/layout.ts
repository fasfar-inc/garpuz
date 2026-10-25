/**
 * Responsive placement of the sculpture on screen, per scene. Values are
 * fractions of the viewport (0,0 = top-left); the camera's view offset puts
 * the sculpture's centre at that point, so the 3D camera can orbit freely
 * while the composition still lines up with the DOM layout.
 */
export type SceneFrame = { x: number; y: number; scale: number };
export type StageLayout = { hero: SceneFrame; ecosystem: SceneFrame; compact: boolean };

export function getStageLayout(width: number, height: number): StageLayout {
  const aspect = width / Math.max(height, 1);

  if (width < 768) {
    // Portrait phones: sculpture between the headline and the copy/cards.
    const s = Math.min(1, aspect / 0.62) * 0.62;
    return {
      compact: true,
      hero: { x: 0.5, y: 0.43, scale: s },
      ecosystem: { x: 0.5, y: 0.43, scale: s * 0.7 },
    };
  }

  if (width < 1100 || aspect < 1.2) {
    const s = Math.min(1, aspect / 1.25) * 0.86;
    return {
      compact: false,
      hero: { x: 0.52, y: 0.47, scale: s },
      ecosystem: { x: 0.56, y: 0.5, scale: s * 0.64 },
    };
  }

  const s = Math.min(1, aspect / 1.35);
  const short = height < 860;
  return {
    compact: false,
    hero: { x: 0.52, y: 0.46, scale: s * (short ? 0.92 : 1) },
    ecosystem: { x: short ? 0.54 : 0.575, y: 0.5, scale: s * (short ? 0.58 : 0.66) },
  };
}

export type FloaterSlot = {
  kind: "sphere" | "lens" | "ring" | "bowl";
  material: "chrome" | "glass" | "pearl";
  /** Screen position, as fractions of the viewport. */
  x: number;
  y: number;
  /** Radius as a fraction of the viewport height. */
  size: number;
  /** Lens/bowl thickness or ring tube, relative to a unit radius. */
  thickness?: number;
  rotation: [number, number, number];
  /** Scene 3 progress range over which it flies in. */
  enter: [number, number];
  /** Where it flies in from, in viewport heights from its slot. */
  from: [number, number];
  /** Pointer pull, 0 → 1 (nearer pieces move more). */
  pull: number;
};

/**
 * Floating 3D pieces of the Scene 3 editorial composition. They sit in the
 * gaps of the DOM layout, so positions differ per breakpoint.
 */
export function getBeyondFloaters(width: number, height: number): FloaterSlot[] {
  if (width < 768) {
    return [
      { kind: "sphere", material: "chrome", x: 0.84, y: 0.15, size: 0.04, rotation: [0, 0, 0], enter: [0.24, 0.42], from: [0.5, -0.4], pull: 0.6 },
      { kind: "lens", material: "pearl", x: 0.72, y: 0.5, size: 0.075, thickness: 0.34, rotation: [1.05, 0, 0.55], enter: [0.4, 0.6], from: [0.6, 0.3], pull: 0.8 },
      { kind: "ring", material: "glass", x: 0.24, y: 0.52, size: 0.06, thickness: 0.035, rotation: [1.15, 0.3, -0.4], enter: [0.56, 0.76], from: [-0.6, 0.3], pull: 0.5 },
      { kind: "sphere", material: "chrome", x: 0.35, y: 0.47, size: 0.014, rotation: [0, 0, 0], enter: [0.62, 0.8], from: [-0.4, 0.5], pull: 1 },
    ];
  }
  const short = height < 860;
  return [
    { kind: "sphere", material: "chrome", x: 0.86, y: short ? 0.2 : 0.22, size: 0.07, rotation: [0, 0, 0], enter: [0.22, 0.42], from: [0.6, -0.5], pull: 0.6 },
    { kind: "lens", material: "pearl", x: 0.73, y: 0.4, size: 0.105, thickness: 0.32, rotation: [1.0, 0, 0.55], enter: [0.36, 0.58], from: [0.8, 0.4], pull: 0.9 },
    { kind: "ring", material: "glass", x: 0.15, y: 0.79, size: 0.085, thickness: 0.032, rotation: [1.2, 0.25, -0.35], enter: [0.52, 0.74], from: [-0.7, 0.4], pull: 0.5 },
    { kind: "sphere", material: "chrome", x: 0.24, y: 0.72, size: 0.024, rotation: [0, 0, 0], enter: [0.58, 0.8], from: [-0.4, 0.6], pull: 1 },
    { kind: "bowl", material: "chrome", x: 0.47, y: 0.79, size: 0.062, thickness: 0.3, rotation: [0.95, 0, -0.45], enter: [0.64, 0.84], from: [0.1, 0.7], pull: 0.7 },
  ];
}
