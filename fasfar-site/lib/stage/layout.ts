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
