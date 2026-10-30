/**
 * Morph math shared by the CPU and the vertex shader.
 *
 * The GPU draws every particle at `transitionPosition(from, to, progress)` plus continuous,
 * uniform-driven noise. When a new morph interrupts a running one, the CPU evaluates the
 * same deterministic path to snapshot where every particle currently is, so the next
 * transition starts exactly from what is on screen — no pops, ever.
 */

/** Fraction of the timeline used by per-particle travel; the rest is staggered delay. */
export const TRAVEL_SPAN = 0.58;
export const MAX_DELAY = 1 - TRAVEL_SPAN;

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function localProgress(progress: number, delay: number): number {
  return Math.min(1, Math.max(0, (progress - delay) / TRAVEL_SPAN));
}

export interface PathParams {
  /** 0 disables scatter and vortex (reduced motion). */
  vortex: number;
  /** Accumulated idle swirl phase applied to the destination (the organism's inner flow). */
  swirlPhase: number;
  /** 1 when the destination is the organism's own body, 0 for objects. */
  toSwirl: number;
}

/**
 * Rotate a destination point around Y by a per-particle amount that depends on its radius,
 * giving the idle body differential rotation (an inner current) without leaving its shell.
 */
export function swirlAngle(x: number, z: number, randZ: number, params: PathParams): number {
  if (params.toSwirl === 0) return 0;
  const r = Math.sqrt(x * x + z * z);
  return (params.swirlPhase * params.toSwirl * (0.55 + 0.9 * randZ)) / (0.6 + r);
}

/**
 * Deterministic part of a particle's position during a transition.
 * Mirrors `transitionPosition` in shaders.ts — keep them in sync.
 */
export function transitionPosition(
  out: Float32Array,
  o: number,
  from: Float32Array,
  to: Float32Array,
  rand: Float32Array,
  r4: number,
  delay: number,
  progress: number,
  params: PathParams,
) {
  const t = localProgress(progress, delay);
  const e = easeInOutCubic(t);

  let tx = to[o];
  const ty = to[o + 1];
  let tz = to[o + 2];
  const sa = swirlAngle(tx, tz, rand[r4 + 2], params);
  if (sa !== 0) {
    const c = Math.cos(sa);
    const s = Math.sin(sa);
    const nx = tx * c - tz * s;
    tz = tx * s + tz * c;
    tx = nx;
  }

  let x = from[o] + (tx - from[o]) * e;
  let y = from[o + 1] + (ty - from[o + 1]) * e;
  let z = from[o + 2] + (tz - from[o + 2]) * e;

  const bump = Math.sin(Math.PI * t) * params.vortex;
  if (bump > 0) {
    // 1. Destabilize: drift outward from the centre.
    const len = Math.sqrt(x * x + y * y + z * z) + 1e-4;
    const push = bump * (0.22 + 0.5 * rand[r4 + 1]);
    x += (x / len) * push;
    y += (y / len) * push;
    z += (z / len) * push;
    // 2. Vortex: spin around Y, faster near the axis, and stretch along it.
    const r = Math.sqrt(x * x + z * z);
    const angle = (bump * (2.2 + 2.4 * rand[r4 + 2])) / (0.35 + r);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const nx = x * c - z * s;
    z = x * s + z * c;
    x = nx;
    y += bump * (rand[r4 + 3] - 0.5) * 0.9;
  }

  out[o] = x;
  out[o + 1] = y;
  out[o + 2] = z;
  return e;
}

/* ------------------------------------------------------------- correspondence */

function spreadBits(v: number): number {
  v &= 0x3ff;
  v = (v | (v << 16)) & 0x030000ff;
  v = (v | (v << 8)) & 0x0300f00f;
  v = (v | (v << 4)) & 0x030c30c3;
  v = (v | (v << 2)) & 0x09249249;
  return v >>> 0;
}

const INDEX_BITS = 2 ** 17;

/** Morton (Z-order) codes keep spatially close points close in sort order. */
export function mortonOrder(positions: Float32Array, count: number, extent = 2.6): Uint32Array {
  if (count > INDEX_BITS) throw new Error(`mortonOrder supports up to ${INDEX_BITS} points`);
  // Pack (code, index) into one exact float so the native numeric sort does the work.
  const keys = new Float64Array(count);
  const scale = 1023 / (2 * extent);
  for (let i = 0; i < count; i++) {
    const qx = Math.min(1023, Math.max(0, Math.floor((positions[i * 3] + extent) * scale)));
    const qy = Math.min(1023, Math.max(0, Math.floor((positions[i * 3 + 1] + extent) * scale)));
    const qz = Math.min(1023, Math.max(0, Math.floor((positions[i * 3 + 2] + extent) * scale)));
    const code = ((spreadBits(qy) << 2) | (spreadBits(qx) << 1) | spreadBits(qz)) >>> 0;
    keys[i] = code * INDEX_BITS + i;
  }
  keys.sort();
  const order = new Uint32Array(count);
  for (let k = 0; k < count; k++) order[k] = keys[k] % INDEX_BITS;
  return order;
}

const targetOrders = new WeakMap<Float32Array, Uint32Array>();

/**
 * Pair every live particle with a target point so neighbours travel together:
 * the k-th particle in spatial order takes the k-th target in spatial order.
 * Returns `assignment[particle] = targetIndex`.
 */
export function assignTargets(current: Float32Array, target: Float32Array, count: number): Uint32Array {
  const fromOrder = mortonOrder(current, count);
  let toOrder = targetOrders.get(target);
  if (!toOrder || toOrder.length !== count) {
    toOrder = mortonOrder(target, count);
    targetOrders.set(target, toOrder);
  }
  const assignment = new Uint32Array(count);
  for (let k = 0; k < count; k++) assignment[fromOrder[k]] = toOrder[k];
  return assignment;
}

export type AssemblyStyle = "rise" | "bloom" | "sweep" | "scatter";

/**
 * Per-particle start delays decide how the new form "assembles" on screen.
 * Mixed with randomness so the wave never looks mechanical.
 */
export function computeDelays(
  out: Float32Array,
  to: Float32Array,
  rand: Float32Array,
  count: number,
  style: AssemblyStyle,
  maxDelay = MAX_DELAY,
) {
  for (let i = 0; i < count; i++) {
    const x = to[i * 3];
    const y = to[i * 3 + 1];
    const z = to[i * 3 + 2];
    let order: number;
    switch (style) {
      case "rise":
        order = (y + 1.6) / 3.2;
        break;
      case "bloom":
        order = Math.sqrt(x * x + y * y + z * z) / 1.6;
        break;
      case "sweep":
        order = (x + 1.6) / 3.2;
        break;
      default:
        order = rand[i * 4];
    }
    order = Math.min(1, Math.max(0, order));
    out[i] = maxDelay * (0.55 * order + 0.45 * rand[i * 4]);
  }
}
