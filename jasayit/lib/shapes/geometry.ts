import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Matrix4,
  Quaternion,
  RingGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import type { Vec3 } from "./builder";

/** Geometry primitives used to compose recognizable objects before they are sampled into particles. */

export interface Placement {
  p?: Vec3;
  /** Euler rotation in radians (XYZ order). */
  r?: Vec3;
  s?: number | Vec3;
}

export function place<T extends BufferGeometry>(geometry: T, { p = [0, 0, 0], r = [0, 0, 0], s = 1 }: Placement): T {
  const scale = typeof s === "number" ? new Vector3(s, s, s) : new Vector3(...s);
  const matrix = new Matrix4().compose(
    new Vector3(...p),
    new Quaternion().setFromEuler(new Euler(r[0], r[1], r[2])),
    scale,
  );
  geometry.applyMatrix4(matrix);
  return geometry;
}

export const sphere = (radius: number, at: Placement = {}) => place(new SphereGeometry(radius, 48, 32), at);

export const ellipsoid = (rx: number, ry: number, rz: number, at: Placement = {}) => {
  const g = new SphereGeometry(1, 64, 40);
  g.scale(rx, ry, rz);
  return place(g, at);
};

export const box = (w: number, h: number, d: number, at: Placement = {}) =>
  place(new BoxGeometry(w, h, d, 8, 8, 8), at);

export const cylinder = (rTop: number, rBottom: number, height: number, at: Placement = {}, openEnded = false) =>
  place(new CylinderGeometry(rTop, rBottom, height, 48, 6, openEnded), at);

export const cone = (radius: number, height: number, at: Placement = {}) =>
  place(new ConeGeometry(radius, height, 40, 4), at);

export const torus = (radius: number, tube: number, at: Placement = {}, arc = Math.PI * 2) =>
  place(new TorusGeometry(radius, tube, 20, 96, arc), at);

export const ring = (inner: number, outer: number, at: Placement = {}) =>
  place(new RingGeometry(inner, outer, 128, 8), at);

/** Revolve a [radius, height] profile around the Y axis. */
export const lathe = (profile: [number, number][], at: Placement = {}) =>
  place(new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), 96), at);

/** Rounded slab: a rounded rectangle extruded along Z (front face at +depth/2). */
export function roundedBox(w: number, h: number, d: number, radius: number, at: Placement = {}) {
  const r = Math.min(radius, w / 2, h / 2);
  const shape = new Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return extrude(shape, d, Math.min(r, d / 2) * 0.8, at);
}

/** Extrude a 2D outline (XY) along Z, centered on Z, with a soft bevel. */
export function extrude(shape: Shape, depth: number, bevel = 0.05, at: Placement = {}) {
  const core = Math.max(depth - bevel * 2, 0.001);
  const g = new ExtrudeGeometry(shape, {
    depth: core,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 48,
  });
  g.translate(0, 0, -core / 2);
  return place(g, at);
}

/** Flat 2D outline as a double-sided sheet (fins, slices). */
export function sheet(shape: Shape, at: Placement = {}) {
  return place(new ShapeGeometry(shape, 48), at);
}

export function outline(points: [number, number][]): Shape {
  return new Shape(points.map(([x, y]) => new Vector2(x, y)));
}

export interface TubeOptions {
  /** Radius along the curve, t in [0, 1]. */
  radius: number | ((t: number) => number);
  /** Optional cross-section modulation: multiplier for angle `theta` at `t`. */
  section?: (theta: number, t: number) => number;
  tubular?: number;
  radial?: number;
  /** Close both ends with rounded caps. */
  caps?: boolean;
}

/** A tube that follows a smooth curve with a varying radius (bananas, tails, handles, branches). */
export function tube(points: Vec3[], options: TubeOptions, at: Placement = {}) {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)), false, "centripetal");
  const tubular = options.tubular ?? 128;
  const radial = options.radial ?? 24;
  const frames = curve.computeFrenetFrames(tubular, false);
  const radiusAt = typeof options.radius === "number" ? () => options.radius as number : options.radius;
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    const center = curve.getPointAt(t);
    const n = frames.normals[i];
    const b = frames.binormals[i];
    const r = radiusAt(t);
    for (let j = 0; j <= radial; j++) {
      const theta = (j / radial) * Math.PI * 2;
      const rr = r * (options.section ? options.section(theta, t) : 1);
      const cos = Math.cos(theta) * rr;
      const sin = Math.sin(theta) * rr;
      vertices.push(center.x + cos * n.x + sin * b.x, center.y + cos * n.y + sin * b.y, center.z + cos * n.z + sin * b.z);
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const c = (i + 1) * (radial + 1) + j;
      indices.push(a, c, a + 1, c, c + 1, a + 1);
    }
  }
  if (options.caps) {
    for (const [i, sign] of [
      [0, -1],
      [tubular, 1],
    ] as const) {
      const center = curve.getPointAt(i / tubular);
      const tangent = curve.getTangentAt(i / tubular).multiplyScalar(sign * radiusAt(i / tubular) * 0.6);
      const tip = vertices.length / 3;
      vertices.push(center.x + tangent.x, center.y + tangent.y, center.z + tangent.z);
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j;
        indices.push(tip, a, a + 1);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  return place(g, at);
}

/** Replace a unit sphere's vertices with a radial function of direction (lumpy or implicit star-shaped bodies). */
export function radialSurface(radiusOf: (dir: Vec3) => number, at: Placement = {}, detail: [number, number] = [128, 96]) {
  const g = new SphereGeometry(1, detail[0], detail[1]);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const d: Vec3 = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const r = radiusOf(d);
    pos.setXYZ(i, d[0] * r, d[1] * r, d[2] * r);
  }
  return place(g, at);
}

/** Find the boundary radius of an implicit field (negative inside) along a direction. */
export function implicitRadius(field: (p: Vec3) => number, dir: Vec3, maxRadius: number): number {
  let lo = 0;
  let hi = maxRadius;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (field([dir[0] * mid, dir[1] * mid, dir[2] * mid]) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
