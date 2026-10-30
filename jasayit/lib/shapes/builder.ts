import type { BufferGeometry } from "three";
import type { Rng } from "./random";

export type Vec3 = [number, number, number];

/** A sampled formation: xyz per particle plus a brightness ("tone") per particle. */
export interface PointCloud {
  positions: Float32Array;
  tones: Float32Array;
  count: number;
}

export interface SurfaceOptions {
  /** Brightness multiplier. Values above 1 read as highlights (eyes, lights). */
  tone?: number | ((p: Vec3) => number);
  /** Relative particle density per unit area. */
  density?: number;
  /** Reject samples that fail this test (cut-outs, gaps). */
  keep?: (p: Vec3) => boolean;
  /** Post-sampling deformation. */
  deform?: (p: Vec3) => Vec3;
}

export interface VolumeOptions {
  tone?: number | ((p: Vec3) => number);
  /** Share of the total particle budget, 0..1. */
  share: number;
}

interface SurfacePart {
  kind: "surface";
  /** Flattened triangle corners: 9 floats per triangle. */
  triangles: Float32Array;
  /** Cumulative triangle areas for area-weighted sampling. */
  cumulative: Float64Array;
  area: number;
  options: SurfaceOptions;
}

interface VolumePart {
  kind: "volume";
  sample: (rng: Rng) => Vec3;
  options: VolumeOptions;
}

type Part = SurfacePart | VolumePart;

const MAX_REJECTIONS = 60;

/**
 * Collects surface meshes and volumetric samplers, then distributes a fixed particle
 * budget across them by surface area × density, so formations look evenly "skinned".
 */
export class PointCloudBuilder {
  private parts: Part[] = [];

  surface(geometry: BufferGeometry, options: SurfaceOptions = {}): this {
    const triangles = flattenTriangles(geometry);
    geometry.dispose();
    const triCount = triangles.length / 9;
    const cumulative = new Float64Array(triCount);
    let area = 0;
    for (let t = 0; t < triCount; t++) {
      area += triangleArea(triangles, t * 9);
      cumulative[t] = area;
    }
    if (area > 0) this.parts.push({ kind: "surface", triangles, cumulative, area, options });
    return this;
  }

  volume(sample: (rng: Rng) => Vec3, options: VolumeOptions): this {
    this.parts.push({ kind: "volume", sample, options });
    return this;
  }

  build(count: number, rng: Rng): PointCloud {
    const positions = new Float32Array(count * 3);
    const tones = new Float32Array(count);
    const quotas = this.allocate(count);

    let cursor = 0;
    this.parts.forEach((part, index) => {
      for (let k = 0; k < quotas[index]; k++) {
        const p = part.kind === "surface" ? sampleSurface(part, rng) : part.sample(rng);
        const toneOption = part.options.tone ?? 1;
        positions[cursor * 3] = p[0];
        positions[cursor * 3 + 1] = p[1];
        positions[cursor * 3 + 2] = p[2];
        tones[cursor] = typeof toneOption === "function" ? toneOption(p) : toneOption;
        cursor++;
      }
    });
    shuffleInPlace(positions, tones, count, rng);
    return { positions, tones, count };
  }

  private allocate(count: number): number[] {
    const volumeShare = this.parts.reduce((s, p) => s + (p.kind === "volume" ? p.options.share : 0), 0);
    const surfaceBudget = count * Math.max(0, 1 - volumeShare);
    const weightedArea = this.parts.reduce(
      (s, p) => s + (p.kind === "surface" ? p.area * (p.options.density ?? 1) : 0),
      0,
    );
    const exact = this.parts.map((p) =>
      p.kind === "volume"
        ? count * p.options.share
        : weightedArea > 0
          ? (surfaceBudget * p.area * (p.options.density ?? 1)) / weightedArea
          : 0,
    );
    // Largest-remainder rounding so quotas always sum to exactly `count`.
    const quotas = exact.map(Math.floor);
    let remaining = count - quotas.reduce((s, q) => s + q, 0);
    const order = exact.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
    for (let k = 0; remaining > 0 && order.length > 0; k = (k + 1) % order.length, remaining--) {
      quotas[order[k][1]]++;
    }
    return quotas;
  }
}

function sampleSurface(part: SurfacePart, rng: Rng): Vec3 {
  const { keep, deform } = part.options;
  let p: Vec3 = [0, 0, 0];
  for (let attempt = 0; attempt < MAX_REJECTIONS; attempt++) {
    p = pointOnTriangle(part, rng);
    if (!keep || keep(p)) break;
  }
  return deform ? deform(p) : p;
}

function pointOnTriangle(part: SurfacePart, rng: Rng): Vec3 {
  const target = rng() * part.area;
  let lo = 0;
  let hi = part.cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (part.cumulative[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  const o = lo * 9;
  const t = part.triangles;
  let u = rng();
  let v = rng();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const w = 1 - u - v;
  return [
    t[o] * w + t[o + 3] * u + t[o + 6] * v,
    t[o + 1] * w + t[o + 4] * u + t[o + 7] * v,
    t[o + 2] * w + t[o + 5] * u + t[o + 8] * v,
  ];
}

function flattenTriangles(geometry: BufferGeometry): Float32Array {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const vertexCount = index ? index.count : position.count;
  const out = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i++) {
    const v = index ? index.getX(i) : i;
    out[i * 3] = position.getX(v);
    out[i * 3 + 1] = position.getY(v);
    out[i * 3 + 2] = position.getZ(v);
  }
  return out;
}

function triangleArea(t: Float32Array, o: number): number {
  const ax = t[o + 3] - t[o];
  const ay = t[o + 4] - t[o + 1];
  const az = t[o + 5] - t[o + 2];
  const bx = t[o + 6] - t[o];
  const by = t[o + 7] - t[o + 1];
  const bz = t[o + 8] - t[o + 2];
  const cx = ay * bz - az * by;
  const cy = az * bx - ax * bz;
  const cz = ax * by - ay * bx;
  return 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
}

/** Particles get random identities so any prefix of the buffer is a uniform subset. */
function shuffleInPlace(positions: Float32Array, tones: Float32Array, count: number, rng: Rng) {
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    for (let c = 0; c < 3; c++) {
      const tmp = positions[i * 3 + c];
      positions[i * 3 + c] = positions[j * 3 + c];
      positions[j * 3 + c] = tmp;
    }
    const tt = tones[i];
    tones[i] = tones[j];
    tones[j] = tt;
  }
}

/** Center the formation and scale it so its farthest particle sits at `radius`. */
export function normalizeCloud(cloud: PointCloud, radius: number): PointCloud {
  const { positions, count } = cloud;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) {
    for (let c = 0; c < 3; c++) {
      const v = positions[i * 3 + c];
      if (v < min[c]) min[c] = v;
      if (v > max[c]) max[c] = v;
    }
  }
  const center = [0, 1, 2].map((c) => (min[c] + max[c]) / 2);
  let farthest = 0;
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3] - center[0];
    const y = positions[i * 3 + 1] - center[1];
    const z = positions[i * 3 + 2] - center[2];
    farthest = Math.max(farthest, x * x + y * y + z * z);
  }
  const scale = farthest > 0 ? radius / Math.sqrt(farthest) : 1;
  for (let i = 0; i < count; i++) {
    for (let c = 0; c < 3; c++) positions[i * 3 + c] = (positions[i * 3 + c] - center[c]) * scale;
  }
  return cloud;
}
