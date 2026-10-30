import type { PointCloudBuilder, Vec3 } from "./builder";
import {
  box,
  cone,
  cylinder,
  ellipsoid,
  extrude,
  implicitRadius,
  lathe,
  outline,
  radialSurface,
  ring,
  roundedBox,
  sheet,
  sphere,
  torus,
  tube,
} from "./geometry";
import { createWaveNoise, gaussian, randomDirection, type Rng } from "./random";

/**
 * Procedural recipes for every predefined form. Each recipe composes simple 3D geometry
 * (+Y up, +Z toward the viewer, "front" of directional objects toward +X) and the builder
 * samples it into an evenly distributed particle formation.
 */
export type ShapeRecipe = (b: PointCloudBuilder, rng: Rng) => void;

const PI = Math.PI;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const length3 = (p: Vec3) => Math.hypot(p[0], p[1], p[2]);

/* ------------------------------------------------------------------ entity */

/** The idle organism: a breathing shell with a dense core and drifting orbital rings. */
export const entity: ShapeRecipe = (b) => {
  const lobes = createWaveNoise(11, 6, 1.6);
  b.volume(
    (rng) => {
      const d = randomDirection(rng);
      const r = 1.0 + 0.13 * lobes(d[0], d[1], d[2]) + gaussian(rng) * 0.045;
      return [d[0] * r, d[1] * r, d[2] * r];
    },
    { share: 0.5, tone: 0.95 },
  );
  b.volume(
    (rng) => {
      const d = randomDirection(rng);
      const r = 0.82 * Math.pow(rng(), 0.55);
      return [d[0] * r, d[1] * r, d[2] * r];
    },
    { share: 0.22, tone: (p) => 0.55 + 0.45 * (1 - length3(p)) },
  );
  const rings = [
    { radius: 1.32, tilt: 0.32, spin: 0.2, share: 0.08 },
    { radius: 1.5, tilt: -0.22, spin: 1.4, share: 0.07 },
    { radius: 1.66, tilt: 0.12, spin: 2.5, share: 0.05 },
  ];
  for (const ringSpec of rings) {
    b.volume(
      (rng) => {
        const a = rng() * PI * 2;
        const r = ringSpec.radius + gaussian(rng) * 0.025;
        const y = gaussian(rng) * 0.018;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        // Tilt around an axis rotated by `spin` in the XZ plane.
        const ax = Math.cos(ringSpec.spin);
        const az = Math.sin(ringSpec.spin);
        const along = x * ax + z * az;
        const across = -x * az + z * ax;
        const c = Math.cos(ringSpec.tilt);
        const s = Math.sin(ringSpec.tilt);
        const across2 = across * c - y * s;
        const y2 = across * s + y * c;
        return [along * ax - across2 * az, y2, along * az + across2 * ax];
      },
      { share: ringSpec.share, tone: 0.8 },
    );
  }
  b.volume(
    (rng) => {
      const d = randomDirection(rng);
      const r = 1.75 + rng() * 0.6;
      return [d[0] * r, d[1] * r, d[2] * r];
    },
    { share: 0.06, tone: 0.35 },
  );
};

/* ------------------------------------------------------------------ food */

export const banana: ShapeRecipe = (b) => {
  const spine: Vec3[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const a = -PI * 0.86 + t * PI * 0.72;
    spine.push([2.2 * Math.cos(a), 2.2 + 2.2 * Math.sin(a), 0.22 * Math.sin(t * PI)]);
  }
  const radius = (t: number) =>
    0.085 + 0.345 * smoothstep(0.07, 0.32, t) - 0.37 * smoothstep(0.72, 0.99, t) + 0.02 * Math.sin(t * PI);
  b.surface(
    tube(spine, { radius, section: (theta) => 1 + 0.075 * Math.cos(theta * 5), caps: true }),
    { tone: (p) => (p[0] < -1.62 ? 0.78 : 1) },
  );
  // Dark blossom tip and the stem's cut end read as the banana's two "ends".
  b.surface(sphere(0.05, { p: [1.98, 1.26, 0] }), { tone: 0.5, density: 4 });
};

export const potato: ShapeRecipe = (b, rng) => {
  const lumps = createWaveNoise(24, 4, 1.15);
  const fine = createWaveNoise(22, 5, 4.2);
  const eyes = Array.from({ length: 12 }, () => randomDirection(rng));
  const nearestEye = (d: Vec3) =>
    eyes.reduce((best, e) => Math.min(best, Math.hypot(d[0] - e[0], d[1] - e[1], d[2] - e[2])), Infinity);
  const scale: Vec3 = [1.5, 0.9, 1.0];
  const radius = (d: Vec3) => {
    const eye = nearestEye(d);
    return 1 + 0.42 * lumps(d[0], d[1], d[2]) + 0.07 * fine(d[0], d[1], d[2]) - 0.06 * Math.exp(-(eye * eye) / 0.004);
  };
  b.surface(radialSurface(radius, { s: scale }), {
    tone: (p) => {
      const len = Math.hypot(p[0] / scale[0], p[1] / scale[1], p[2] / scale[2]) || 1;
      const d: Vec3 = [p[0] / scale[0] / len, p[1] / scale[1] / len, p[2] / scale[2] / len];
      const eye = nearestEye(d);
      // Each eye is a dark pit with a faintly raised rim.
      const rim = Math.exp(-((eye - 0.085) ** 2) / 0.0006);
      const pit = Math.exp(-(eye * eye) / 0.0025);
      const relief = 0.95 + 0.5 * lumps(d[0], d[1], d[2]) + 0.08 * fine(p[0] * 2, p[1] * 2, p[2] * 2);
      return Math.max(0.15, relief * (1 + 0.9 * rim - 0.75 * pit));
    },
  });
};

export const pizza: ShapeRecipe = (b, rng) => {
  const R = 2;
  const cuts = [0, 1, 2, 3].map((k) => (k * PI) / 4);
  const onCut = (p: Vec3) => cuts.some((a) => Math.abs(-Math.sin(a) * p[0] + Math.cos(a) * p[2]) < 0.035);
  // One slice slides out of the pie, as if someone already reached for it.
  const slice = (p: Vec3): Vec3 => {
    const angle = Math.atan2(p[2], p[0]);
    if (angle > 0.01 && angle < PI / 4 - 0.01) {
      const bis = PI / 8;
      return [p[0] + Math.cos(bis) * 0.5, p[1] + 0.12, p[2] + Math.sin(bis) * 0.5];
    }
    return p;
  };
  const wobble = createWaveNoise(31, 5, 2.5);
  b.surface(ring(0.001, R - 0.08, { r: [-PI / 2, 0, 0], p: [0, 0.07, 0] }), {
    keep: (p) => !onCut(p),
    deform: (p) => slice([p[0], p[1] + 0.02 * wobble(p[0], 0, p[2]), p[2]]),
    tone: 0.82,
  });
  b.surface(ring(0.001, R, { r: [PI / 2, 0, 0], p: [0, -0.06, 0] }), {
    keep: (p) => !onCut(p),
    deform: slice,
    tone: 0.45,
    density: 0.45,
  });
  b.surface(torus(R, 0.16, { r: [PI / 2, 0, 0] }), { keep: (p) => !onCut(p), deform: slice, tone: 1.1, density: 1.5 });

  const toppings: [number, number][] = [];
  for (let attempt = 0; attempt < 400 && toppings.length < 11; attempt++) {
    const a = rng() * PI * 2;
    const r = 0.45 + Math.sqrt(rng()) * 1.15;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const clear = toppings.every(([tx, tz]) => Math.hypot(tx - x, tz - z) > 0.6);
    const offCut = cuts.every((c) => Math.abs(-Math.sin(c) * x + Math.cos(c) * z) > 0.3);
    if (clear && offCut) toppings.push([x, z]);
  }
  for (const [x, z] of toppings) {
    b.surface(ring(0.001, 0.27, { r: [-PI / 2, 0, 0], p: [x, 0.11, z] }), { deform: slice, tone: 1.55, density: 1.8 });
  }
};

/* ------------------------------------------------------------------ animals */

export const duck: ShapeRecipe = (b) => {
  const flatBottom = (p: Vec3): Vec3 => (p[1] < -0.5 ? [p[0], -0.5 + (p[1] + 0.5) * 0.25, p[2]] : p);
  b.surface(ellipsoid(1.25, 0.82, 0.95), { deform: flatBottom });
  b.surface(ellipsoid(0.5, 0.26, 0.4, { p: [-1.05, 0.45, 0], r: [0, 0, 0.75] }));
  b.surface(sphere(0.64, { p: [0.62, 1.08, 0] }));
  b.surface(ellipsoid(0.44, 0.11, 0.32, { p: [1.22, 0.95, 0], r: [0, 0, -0.12] }), { tone: 1.25, density: 1.4 });
  b.surface(ellipsoid(0.36, 0.07, 0.27, { p: [1.14, 0.83, 0], r: [0, 0, -0.05] }), { tone: 1.05 });
  for (const side of [-1, 1]) {
    b.surface(sphere(0.085, { p: [1.0, 1.27, side * 0.33] }), { tone: 2.2, density: 3 });
    b.surface(ellipsoid(0.62, 0.32, 0.12, { p: [-0.15, 0.22, side * 0.88], r: [side * 0.15, 0, 0.28] }), {
      tone: 1.1,
    });
  }
};

export const cat: ShapeRecipe = (b) => {
  b.surface(
    lathe(
      [
        [0.001, 0],
        [0.72, 0.04],
        [0.92, 0.35],
        [0.88, 0.78],
        [0.66, 1.22],
        [0.46, 1.56],
        [0.3, 1.72],
      ],
      { s: [1, 1, 0.85] },
    ),
  );
  b.surface(ellipsoid(0.68, 0.58, 0.58, { p: [0, 2.1, 0.12] }));
  // Muzzle bump
  b.surface(ellipsoid(0.28, 0.18, 0.18, { p: [0, 1.96, 0.6] }), { density: 0.8 });
  for (const side of [-1, 1]) {
    b.surface(cone(0.24, 0.52, { p: [side * 0.42, 2.66, 0.08], r: [0, 0, -side * 0.38] }), { tone: 1.05 });
    b.surface(cylinder(0.14, 0.16, 1.0, { p: [side * 0.3, 0.52, 0.6] }), { density: 0.9 });
    b.surface(sphere(0.18, { p: [side * 0.3, 0.08, 0.72] }), { tone: 1.1 });
    b.surface(ellipsoid(0.11, 0.065, 0.04, { p: [side * 0.24, 2.2, 0.66], r: [0, 0, side * 0.25] }), {
      tone: 2.3,
      density: 4,
    });
    for (const dy of [-0.07, 0, 0.07]) {
      b.surface(
        tube(
          [
            [side * 0.2, 1.97, 0.72],
            [side * 0.5, 1.98 + dy * 1.6, 0.74],
            [side * 0.82, 1.98 + dy * 3.2, 0.66],
          ],
          { radius: 0.008, radial: 6 },
        ),
        { tone: 1.6, density: 9 },
      );
    }
  }
  b.surface(cone(0.06, 0.08, { p: [0, 2.03, 0.76], r: [PI, 0, 0] }), { tone: 1.8, density: 4 });
  b.surface(
    tube(
      [
        [0.35, 0.18, -0.6],
        [0.95, 0.12, -0.2],
        [0.92, 0.1, 0.45],
        [0.45, 0.08, 0.95],
        [-0.15, 0.08, 1.02],
      ],
      { radius: (t) => 0.14 - 0.06 * t, caps: true },
    ),
  );
};

export const fish: ShapeRecipe = (b) => {
  b.surface(
    lathe(
      [
        [0.001, -1.62],
        [0.13, -1.56],
        [0.28, -1.2],
        [0.6, -0.6],
        [0.78, 0],
        [0.74, 0.6],
        [0.6, 1.0],
        [0.4, 1.3],
        [0.2, 1.46],
        [0.001, 1.53],
      ],
      { r: [0, 0, -PI / 2], s: [1, 1, 0.52] },
    ),
  );
  const fins: { shape: [number, number][]; rays: number }[] = [
    {
      shape: [
        [-1.5, 0.1],
        [-2.25, 0.82],
        [-2.5, 0.8],
        [-2.18, 0],
        [-2.5, -0.8],
        [-2.25, -0.82],
        [-1.5, -0.1],
      ],
      rays: 9,
    },
    {
      shape: [
        [-0.65, 0.62],
        [-0.25, 1.25],
        [0.35, 1.08],
        [0.5, 0.68],
      ],
      rays: 6,
    },
    {
      shape: [
        [-0.95, -0.42],
        [-1.25, -0.82],
        [-0.55, -0.6],
      ],
      rays: 3,
    },
  ];
  for (const fin of fins) {
    b.surface(sheet(outline(fin.shape)), { tone: 0.72, density: 1.3 });
    // Fin rays fan out from the root of each fin.
    const root = fin.shape[0];
    const tipStart = 1;
    const tipEnd = fin.shape.length - 2;
    for (let k = 0; k < fin.rays; k++) {
      const f = tipStart + ((tipEnd - tipStart) * k) / Math.max(1, fin.rays - 1);
      const i = Math.floor(f);
      const j = Math.min(i + 1, fin.shape.length - 1);
      const w = f - i;
      const tip: Vec3 = [
        fin.shape[i][0] * (1 - w) + fin.shape[j][0] * w,
        fin.shape[i][1] * (1 - w) + fin.shape[j][1] * w,
        0,
      ];
      b.surface(tube([[root[0], root[1], 0], tip], { radius: 0.012, radial: 6, tubular: 24 }), {
        tone: 1.35,
        density: 6,
      });
    }
  }
  for (const side of [-1, 1]) {
    b.surface(torus(0.13, 0.03, { p: [1.0, 0.18, side * 0.36] }), { tone: 1.5, density: 3 });
    b.surface(sphere(0.07, { p: [1.0, 0.18, side * 0.38] }), { tone: 2.3, density: 4 });
    b.surface(
      tube(
        [
          [0.7, 0.52, side * 0.33],
          [0.55, 0.1, side * 0.4],
          [0.66, -0.36, side * 0.32],
        ],
        { radius: 0.02, radial: 6 },
      ),
      { tone: 1.4, density: 5 },
    );
    b.surface(
      sheet(
        outline([
          [0, 0],
          [-0.55, 0.12],
          [-0.5, -0.22],
        ]),
        { p: [0.35, -0.2, side * 0.4], r: [0, side * 0.35, 0] },
      ),
      { tone: 0.8, density: 1.4 },
    );
  }
};

/* ------------------------------------------------------------------ objects */

export const car: ShapeRecipe = (b) => {
  const arch = (cx: number, from: number, to: number): [number, number][] => {
    const pts: [number, number][] = [];
    for (let k = 0; k <= 16; k++) {
      const a = from + ((to - from) * k) / 16;
      pts.push([cx + Math.cos(a) * 0.5, 0.42 + Math.sin(a) * 0.5]);
    }
    return pts;
  };
  const bodyOutline: [number, number][] = [
    [-2.15, 0.2],
    [-2.22, 0.55],
    [-2.1, 0.8],
    [-1.5, 0.86],
    [1.15, 0.8],
    [1.9, 0.63],
    [2.22, 0.45],
    [2.18, 0.24],
    [1.86, 0.18],
    ...arch(1.35, -0.25, PI + 0.25),
    [0.85, 0.16],
    [-0.85, 0.16],
    ...arch(-1.35, -0.25, PI + 0.25),
    [-1.86, 0.18],
  ];
  b.surface(extrude(outline(bodyOutline), 1.9, 0.09), { tone: 1 });
  b.surface(
    extrude(
      outline([
        [-1.6, 0.8],
        [-0.8, 1.32],
        [0.3, 1.36],
        [1.2, 0.8],
      ]),
      1.42,
      0.06,
    ),
    { tone: 0.62, density: 0.9 },
  );
  for (const x of [-1.35, 1.35]) {
    for (const side of [-1, 1]) {
      b.surface(torus(0.32, 0.12, { p: [x, 0.42, side * 0.86] }), { tone: 0.95, density: 1.2 });
      b.surface(ring(0.06, 0.24, { p: [x, 0.42, side * 0.97] }), { tone: 1.35, density: 1.4 });
    }
  }
  for (const side of [-1, 1]) {
    b.surface(ellipsoid(0.1, 0.06, 0.22, { p: [2.12, 0.56, side * 0.6] }), { tone: 2.4, density: 3 });
    b.surface(box(0.06, 0.08, 0.42, { p: [-2.2, 0.66, side * 0.55] }), { tone: 1.8, density: 3 });
    b.surface(ellipsoid(0.1, 0.06, 0.08, { p: [0.92, 0.96, side * 0.82] }), { tone: 1.2 });
    b.surface(box(0.05, 0.22, 0.05, { p: [-1.95, 0.95, side * 0.6] }), { density: 1.5 });
  }
  b.surface(box(0.38, 0.04, 1.8, { p: [-1.98, 1.07, 0] }), { tone: 1.2, density: 1.3 });
};

export const shoe: ShapeRecipe = (b) => {
  const footprint: [number, number][] = [];
  for (let k = 0; k < 96; k++) {
    const a = (k / 96) * PI * 2;
    const x = 1.5 * Math.cos(a);
    const w = 0.42 + 0.14 * smoothstep(-0.9, 0.7, x);
    footprint.push([x, Math.sin(a) * w]);
  }
  b.surface(extrude(outline(footprint), 0.3, 0.07, { r: [-PI / 2, 0, 0], p: [0, 0.15, 0] }), {
    tone: (p) => (p[1] < 0.08 ? 0.85 + 0.25 * (Math.sin(p[0] * 22) > 0 ? 1 : 0) : 1.2),
    density: 1.1,
  });

  const c: Vec3 = [-0.05, 0.28, 0];
  const radii: Vec3 = [1.45, 0.85, 0.52];
  const heightScale = (x: number) => 0.45 + 0.55 * smoothstep(1.3, -0.25, x);
  const lowerToe = (p: Vec3): Vec3 => [p[0], 0.28 + (p[1] - 0.28) * heightScale(p[0]), p[2]];
  const opening = (p: Vec3) => ((p[0] + 0.62) / 0.6) ** 2 + (p[2] / 0.36) ** 2 < 1 && p[1] > 0.72;
  b.surface(ellipsoid(radii[0], radii[1], radii[2], { p: c }), {
    keep: (p) => p[1] > 0.26 && !opening(p),
    deform: lowerToe,
  });
  // Padded collar around the ankle opening, higher at the back.
  const collar = torus(1, 0.07, { r: [PI / 2, 0, 0], s: [0.62, 0.38, 1] });
  collar.rotateZ(0.16);
  collar.translate(-0.62, 0.78, 0);
  b.surface(collar, {
    tone: 1.25,
    density: 1.5,
  });
  const topY = (x: number, z: number) => {
    const q = 1 - ((x - c[0]) / radii[0]) ** 2 - (z / radii[2]) ** 2;
    return 0.28 + radii[1] * Math.sqrt(Math.max(q, 0)) * heightScale(x);
  };
  for (let k = 0; k < 5; k++) {
    const x = -0.02 + k * 0.2;
    const zEdge = 0.24;
    b.surface(
      tube(
        [
          [x - 0.04, topY(x - 0.04, zEdge) + 0.01, -zEdge],
          [x, topY(x, 0) + 0.05, 0],
          [x + 0.04, topY(x + 0.04, zEdge) + 0.01, zEdge],
        ],
        { radius: 0.025, radial: 8 },
      ),
      { tone: 1.6, density: 4 },
    );
  }
  b.surface(roundedBox(0.12, 0.42, 0.3, 0.05, { p: [-1.48, 0.62, 0] }), { tone: 1.2 });
};

export const chair: ShapeRecipe = (b) => {
  const seatY = 1.05;
  const tone = 1;
  b.surface(roundedBox(1.6, 1.5, 0.14, 0.12, { p: [0, seatY, 0], r: [PI / 2, 0, 0] }), { tone: 1.1 });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      b.surface(cylinder(0.06, 0.05, seatY, { p: [sx * 0.68, seatY / 2, sz * 0.62] }), { tone, density: 1.4 });
    }
    b.surface(cylinder(0.065, 0.065, 1.6, { p: [sx * 0.68, seatY + 0.8, -0.66] }), { density: 1.4 });
    b.surface(cylinder(0.03, 0.03, 1.24, { p: [sx * 0.68, 0.32, 0], r: [PI / 2, 0, 0] }), { density: 1.5 });
  }
  b.surface(roundedBox(1.52, 0.26, 0.1, 0.08, { p: [0, seatY + 1.5, -0.66] }), { tone: 1.15 });
  for (const x of [-0.36, 0, 0.36]) {
    b.surface(box(0.09, 1.15, 0.05, { p: [x, seatY + 0.8, -0.66] }), { density: 1.2 });
  }
  b.surface(cylinder(0.03, 0.03, 1.3, { p: [0, 0.32, 0.62], r: [0, 0, PI / 2] }), { density: 1.5 });
};

export const cup: ShapeRecipe = (b) => {
  b.surface(
    lathe([
      [0.001, 0.32],
      [0.42, 0.3],
      [0.5, 0.42],
      [0.66, 0.5],
      [0.86, 0.8],
      [1.0, 1.22],
      [1.04, 1.26],
      [0.98, 1.24],
      [0.86, 0.86],
      [0.6, 0.6],
      [0.001, 0.56],
    ]),
  );
  b.surface(ring(0.001, 0.9, { r: [-PI / 2, 0, 0], p: [0, 1.04, 0] }), { tone: 0.55, density: 0.8 });
  b.surface(torus(0.3, 0.065, { p: [1.08, 0.86, 0], r: [0, 0, -PI * 0.6] }, PI * 1.25), { tone: 1.15, density: 1.6 });
  b.surface(
    lathe([
      [0.001, 0.0],
      [0.55, 0.0],
      [0.6, 0.06],
      [1.25, 0.14],
      [1.62, 0.3],
      [1.66, 0.33],
      [1.58, 0.33],
      [1.2, 0.22],
      [0.6, 0.15],
      [0.001, 0.15],
    ]),
    { density: 0.65 },
  );
};

export const mug: ShapeRecipe = (b) => {
  const h = 1.9;
  b.surface(cylinder(0.86, 0.84, h, { p: [0, h / 2, 0] }, true));
  b.surface(cylinder(0.78, 0.78, 0.35, { p: [0, h - 0.175, 0] }, true), { tone: 0.6, density: 0.8 });
  b.surface(torus(0.82, 0.045, { p: [0, h, 0], r: [PI / 2, 0, 0] }), { tone: 1.3, density: 1.8 });
  b.surface(ring(0.001, 0.84, { r: [PI / 2, 0, 0], p: [0, 0, 0] }), { tone: 0.6, density: 0.5 });
  b.surface(ring(0.001, 0.78, { r: [-PI / 2, 0, 0], p: [0, h - 0.33, 0] }), { tone: 0.5, density: 0.8 });
  b.surface(
    tube(
      [
        [0.8, 1.55, 0],
        [1.3, 1.5, 0],
        [1.52, 1.12, 0],
        [1.42, 0.7, 0],
        [0.8, 0.42, 0],
      ],
      { radius: 0.12 },
    ),
    { tone: 1.05, density: 1.2 },
  );
  // Wisps of steam: fade with height so they read as vapour, not wire.
  for (const [x, z, phase] of [
    [-0.3, 0.1, 0],
    [0.15, -0.2, 2.1],
    [0.35, 0.25, 4.0],
  ] as const) {
    const pts: Vec3[] = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      pts.push([x + Math.sin(t * PI * 2.2 + phase) * 0.14, h + 0.15 + t * 1.25, z + Math.cos(t * PI * 1.6 + phase) * 0.08]);
    }
    b.surface(tube(pts, { radius: (t) => 0.025 + 0.03 * t, radial: 8 }), {
      tone: (p) => 0.85 * (1 - smoothstep(h + 0.2, h + 1.45, p[1])) + 0.08,
      density: 2.2,
    });
  }
};

export const heart: ShapeRecipe = (b) => {
  // Taubin heart surface with Y up and Z toward the viewer.
  const field = ([x, y, z]: Vec3) => {
    const depth = z / 1.0;
    const base = x * x + (9 / 4) * depth * depth + y * y - 1;
    return base * base * base - x * x * y * y * y - (9 / 80) * depth * depth * y * y * y;
  };
  b.surface(radialSurface((d) => implicitRadius(field, d, 2), { s: [1, 1, 1.35] }, [160, 120]), {
    tone: (p) => 0.92 + 0.18 * Math.max(0, p[2]),
  });
};

export const tree: ShapeRecipe = (b) => {
  b.surface(
    tube(
      [
        [0, -1.7, 0],
        [0.06, -0.8, 0.02],
        [-0.05, 0.1, 0],
        [0.02, 0.75, 0],
      ],
      { radius: (t) => 0.24 * (1 - 0.45 * t) + 0.2 * Math.exp(-t * 14), section: (th) => 1 + 0.06 * Math.cos(th * 7) },
    ),
    { tone: 0.95, density: 1.4 },
  );
  for (const [dx, dz, y0] of [
    [0.7, 0.2, 0.2],
    [-0.75, -0.1, 0.35],
    [0.25, -0.65, 0.5],
    [-0.2, 0.7, 0.45],
  ]) {
    b.surface(
      tube(
        [
          [0, y0, 0],
          [dx * 0.5, y0 + 0.35, dz * 0.5],
          [dx, y0 + 0.75, dz],
        ],
        { radius: (t) => 0.08 - 0.045 * t, radial: 10 },
      ),
      { tone: 0.95, density: 1.4 },
    );
  }
  for (const [dx, dz] of [
    [0.45, 0.2],
    [-0.4, 0.3],
    [0.05, -0.48],
  ]) {
    b.surface(
      tube(
        [
          [0, -1.45, 0],
          [dx * 0.6, -1.65, dz * 0.6],
          [dx, -1.75, dz],
        ],
        { radius: (t) => 0.1 - 0.07 * t, radial: 10 },
      ),
      { density: 1.2 },
    );
  }
  const clusters: [number, number, number, number][] = [
    [0, 1.55, 0, 1.0],
    [0.88, 1.25, 0.2, 0.75],
    [-0.88, 1.3, -0.1, 0.78],
    [0.35, 2.25, -0.2, 0.72],
    [-0.45, 2.1, 0.35, 0.7],
    [0.2, 1.1, 0.82, 0.7],
    [-0.2, 1.2, -0.82, 0.7],
    [0.62, 1.85, -0.62, 0.6],
  ];
  const leafy = createWaveNoise(41, 6, 3.2);
  const insideOther = (p: Vec3, self: number) =>
    clusters.some(([x, y, z, r], j) => j !== self && Math.hypot(p[0] - x, p[1] - y, p[2] - z) < r * 0.96);
  clusters.forEach(([x, y, z, r], i) => {
    b.surface(
      radialSurface((d) => r * (1 + 0.09 * leafy(d[0] * 2 + i, d[1] * 2, d[2] * 2)), { p: [x, y, z] }, [72, 48]),
      { keep: (p) => !insideOther(p, i), tone: (p) => 0.9 + 0.2 * leafy(p[0] * 3, p[1] * 3, p[2] * 3) },
    );
  });
  b.volume(
    (r) => {
      const [x, y, z, rad] = clusters[Math.floor(r() * clusters.length)];
      const d = randomDirection(r);
      const k = rad * Math.cbrt(r()) * 0.9;
      return [x + d[0] * k, y + d[1] * k, z + d[2] * k];
    },
    { share: 0.1, tone: 0.4 },
  );
};

export const robot: ShapeRecipe = (b) => {
  for (const side of [-1, 1]) {
    b.surface(cylinder(0.17, 0.17, 0.9, { p: [side * 0.36, 0.66, 0] }));
    b.surface(roundedBox(0.5, 0.75, 0.24, 0.08, { p: [side * 0.36, 0.12, 0.08], r: [PI / 2, 0, 0] }), { tone: 1.1 });
    b.surface(sphere(0.21, { p: [side * 0.92, 2.5, 0] }), { tone: 1.1 });
    b.surface(cylinder(0.14, 0.14, 0.12, { p: [side * 0.64, 3.25, 0], r: [0, 0, PI / 2] }), { tone: 1.2 });
    b.surface(torus(0.13, 0.035, { p: [side * 0.25, 3.32, 0.47] }), { tone: 2, density: 3 });
    b.surface(sphere(0.06, { p: [side * 0.25, 3.32, 0.47] }), { tone: 2.6, density: 4 });
  }
  b.surface(roundedBox(1.0, 0.3, 0.7, 0.1, { p: [0, 1.22, 0] }));
  b.surface(roundedBox(1.5, 1.3, 0.95, 0.2, { p: [0, 2.0, 0] }));
  b.surface(roundedBox(0.7, 0.45, 0.06, 0.03, { p: [0, 2.15, 0.49] }), { tone: 1.3, density: 1.2 });
  for (const x of [-0.22, 0, 0.22]) b.surface(sphere(0.055, { p: [x, 1.72, 0.5] }), { tone: 2.4, density: 4 });
  b.surface(cylinder(0.15, 0.17, 0.26, { p: [0, 2.77, 0] }));
  b.surface(roundedBox(1.15, 0.85, 0.9, 0.2, { p: [0, 3.25, 0] }));
  for (const x of [-0.18, -0.06, 0.06, 0.18]) {
    b.surface(box(0.04, 0.12, 0.03, { p: [x, 3.0, 0.46] }), { tone: 1.6, density: 3 });
  }
  b.surface(cylinder(0.025, 0.025, 0.42, { p: [0, 3.87, 0] }), { density: 2 });
  b.surface(sphere(0.085, { p: [0, 4.12, 0] }), { tone: 2.6, density: 4 });

  // Left arm hangs, right arm waves.
  b.surface(
    tube(
      [
        [-0.92, 2.5, 0],
        [-1.06, 2.0, 0.02],
        [-1.12, 1.45, 0.05],
      ],
      { radius: 0.11, caps: true },
    ),
  );
  b.surface(torus(0.15, 0.05, { p: [-1.12, 1.3, 0.05], r: [0, 0, -PI * 0.22] }, PI * 1.45), { tone: 1.2 });
  b.surface(
    tube(
      [
        [0.92, 2.5, 0],
        [1.28, 2.55, 0.05],
        [1.44, 2.8, 0.08],
        [1.56, 3.32, 0.1],
      ],
      { radius: 0.11, caps: true },
    ),
  );
  b.surface(torus(0.15, 0.05, { p: [1.58, 3.5, 0.1], r: [0, 0, PI * 0.78] }, PI * 1.45), { tone: 1.2 });
};

export const planet: ShapeRecipe = (b) => {
  const swirl = createWaveNoise(51, 5, 2.2);
  b.surface(sphere(1), {
    tone: (p) => 0.78 + 0.28 * Math.sin(p[1] * 10 + 0.6 * swirl(p[0], p[1], p[2])),
    density: 1.5,
  });
  b.surface(ring(1.38, 2.25, { r: [-PI / 2, 0, 0] }), {
    keep: (p) => {
      const r = Math.hypot(p[0], p[2]);
      return r < 1.83 || r > 1.92;
    },
    tone: (p) => {
      const r = Math.hypot(p[0], p[2]);
      return 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(r * 34)) * smoothstep(2.3, 1.4, r);
    },
    density: 0.42,
  });
  b.surface(sphere(0.16, { p: [2.25, 0.85, -0.55] }), { tone: 1.1, density: 1.6 });
};
