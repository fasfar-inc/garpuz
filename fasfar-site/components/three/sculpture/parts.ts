/**
 * The sculpture is data: each component has an assembled pose (Scene 1) and
 * an exploded pose (Scene 2) in sculpture-local space, where the stack runs
 * along +Y. Add, remove or re-pose components here without touching the
 * rendering code.
 */
export type Vec3 = [number, number, number];
export type PartKind = "bowl" | "lens" | "ring";
export type PartMaterial = "chrome" | "glass" | "pearl";
export type Pose = { position: Vec3; rotation: Vec3; scale: number };

export type SculpturePart = {
  id: string;
  kind: PartKind;
  material: PartMaterial;
  radius: number;
  /** Lens/bowl thickness, or tube radius for rings. */
  thickness: number;
  assembled: Pose;
  exploded: Pose;
  /** Where in the explode sequence this part starts moving, 0 → 0.4. */
  delay: number;
  /** Whether a venture's leader line may attach to this part's rim. */
  anchorable?: boolean;
};

const pose = (position: Vec3, rotation: Vec3 = [0, 0, 0], scale = 1): Pose => ({ position, rotation, scale });

export const sculptureParts = [
  {
    id: "crown",
    kind: "bowl",
    material: "chrome",
    radius: 1.75,
    thickness: 0.5,
    assembled: pose([0, 1.62, 0]),
    exploded: pose([0.55, 2.95, -0.25], [0.22, 0, -0.18], 1.04),
    delay: 0.02,
    anchorable: true,
  },
  {
    id: "halo",
    kind: "ring",
    material: "glass",
    radius: 1.86,
    thickness: 0.035,
    assembled: pose([0, 1.2, 0]),
    exploded: pose([0.35, 2.0, 0.05], [0.12, 0, -0.1]),
    delay: 0.06,
  },
  {
    id: "veil",
    kind: "lens",
    material: "glass",
    radius: 1.72,
    thickness: 0.2,
    assembled: pose([0, 0.92, 0]),
    exploded: pose([0.2, 1.42, 0.15], [0.08, 0, -0.06]),
    delay: 0.1,
  },
  {
    id: "pearl-upper",
    kind: "lens",
    material: "pearl",
    radius: 1.55,
    thickness: 0.52,
    assembled: pose([0, 0.46, 0]),
    exploded: pose([-0.05, 0.42, 0.3], [-0.05, 0, 0.04]),
    delay: 0.14,
  },
  {
    id: "core",
    kind: "bowl",
    material: "chrome",
    radius: 1.6,
    thickness: 0.44,
    assembled: pose([0, -0.04, 0], [Math.PI, 0, 0]),
    exploded: pose([-0.1, -0.42, 0.12], [Math.PI - 0.1, 0, 0.08]),
    delay: 0.18,
  },
  {
    id: "pearl-lower",
    kind: "lens",
    material: "pearl",
    radius: 1.7,
    thickness: 0.56,
    assembled: pose([0, -0.52, 0]),
    exploded: pose([0.3, -1.18, 0.28], [-0.1, 0, 0.1]),
    delay: 0.22,
    anchorable: true,
  },
  {
    id: "skirt",
    kind: "ring",
    material: "glass",
    radius: 1.92,
    thickness: 0.04,
    assembled: pose([0, -0.92, 0]),
    exploded: pose([0.15, -1.82, 0.05], [-0.14, 0, 0.12]),
    delay: 0.26,
  },
  {
    id: "base",
    kind: "bowl",
    material: "chrome",
    radius: 1.72,
    thickness: 0.48,
    assembled: pose([0, -1.36, 0], [Math.PI, 0, 0]),
    exploded: pose([-0.2, -2.78, -0.1], [Math.PI - 0.24, 0, 0.2]),
    delay: 0.3,
    anchorable: true,
  },
  {
    // Tucked inside the stack while assembled; breaks away in Scene 2.
    id: "satellite",
    kind: "lens",
    material: "pearl",
    radius: 0.66,
    thickness: 0.3,
    assembled: pose([0.1, 0.5, 0], [0, 0, 0], 0.4),
    exploded: pose([-0.6, 2.6, 1.5], [0.5, 0, 0.55], 0.9),
    delay: 0.12,
    anchorable: true,
  },
] as const satisfies readonly SculpturePart[];

export type SculptureAnchorId = Extract<(typeof sculptureParts)[number], { anchorable: true }>["id"];

/** Whole-sculpture orientation for each scene. */
export const sculptureTilt = {
  assembled: [0.5, 0.15, 0.4] as Vec3,
  exploded: [0.58, -0.12, 0.56] as Vec3,
};

/** Free-floating chrome spheres. */
export const orbiters = [
  { radius: 0.16, assembled: [-1.7, 2.4, 0.6] as Vec3, exploded: [-1.6, 3.6, 1.2] as Vec3, phase: 0 },
  { radius: 0.26, assembled: [2.25, -1.25, 0.9] as Vec3, exploded: [2.6, 0.2, 1.4] as Vec3, phase: 2.1 },
];
