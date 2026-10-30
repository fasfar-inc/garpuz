/** Small deterministic helpers so every shape is reproducible for a given seed. */

export type Rng = () => number;

/** mulberry32: fast, seedable, good enough for point sampling. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Standard normal sample (Box-Muller). */
export function gaussian(rng: Rng): number {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Uniform direction on the unit sphere. */
export function randomDirection(rng: Rng): [number, number, number] {
  const z = rng() * 2 - 1;
  const a = rng() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), z, r * Math.sin(a)];
}

/**
 * Cheap smooth 3D noise built from a handful of random plane waves.
 * Deterministic per seed; values roughly in [-1, 1].
 */
export function createWaveNoise(seed: number, waves = 7, baseFrequency = 1) {
  const rng = createRng(seed);
  const terms = Array.from({ length: waves }, (_, i) => {
    const d = randomDirection(rng);
    const f = baseFrequency * (1 + i * 0.55) * (0.8 + rng() * 0.4);
    return { d, f, phase: rng() * Math.PI * 2, amp: 1 / (1 + i * 0.6) };
  });
  const norm = terms.reduce((s, t) => s + t.amp, 0);
  return (x: number, y: number, z: number) => {
    let v = 0;
    for (const t of terms) v += t.amp * Math.sin((t.d[0] * x + t.d[1] * y + t.d[2] * z) * t.f + t.phase);
    return v / norm;
  };
}
