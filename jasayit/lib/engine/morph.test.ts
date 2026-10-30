import { describe, expect, it } from "vitest";
import { generateShape } from "../shapes/registry";
import { assignTargets, computeDelays, easeInOutCubic, MAX_DELAY, transitionPosition } from "./morph";

describe("morph math", () => {
  it("eases from 0 to 1 monotonically", () => {
    let prev = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = easeInOutCubic(Math.min(1, t));
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("assigns a permutation so no target point is lost or duplicated", () => {
    const a = generateShape("banana", 3000).positions;
    const b = generateShape("planet", 3000).positions;
    const assignment = assignTargets(a, b, 3000);
    expect(new Set(assignment).size).toBe(3000);
  });

  it("starts exactly at the source and lands exactly on the target", () => {
    const count = 500;
    const from = generateShape("cat", count).positions;
    const to = generateShape("duck", count).positions;
    const rand = new Float32Array(count * 4).map((_, i) => ((i * 7919) % 1000) / 1000);
    const delay = new Float32Array(count);
    computeDelays(delay, to, rand, count, "rise");
    const out = new Float32Array(count * 3);
    const params = { vortex: 1, swirlPhase: 0, toSwirl: 0 };
    for (let i = 0; i < count; i++) {
      expect(delay[i]).toBeGreaterThanOrEqual(0);
      expect(delay[i]).toBeLessThanOrEqual(MAX_DELAY);
      transitionPosition(out, i * 3, from, to, rand, i * 4, delay[i], 0, params);
      expect(Array.from(out.subarray(i * 3, i * 3 + 3))).toEqual(Array.from(from.subarray(i * 3, i * 3 + 3)));
      transitionPosition(out, i * 3, from, to, rand, i * 4, delay[i], 1, params);
      for (let c = 0; c < 3; c++) expect(out[i * 3 + c]).toBeCloseTo(to[i * 3 + c], 4);
    }
  });

  it("moves through a vortex mid-transition instead of a straight line", () => {
    const from = new Float32Array([1, 0, 0]);
    const to = new Float32Array([0, 0.5, 1]);
    const rand = new Float32Array([0.5, 0.5, 0.5, 0.5]);
    const swirl = new Float32Array(3);
    const straight = new Float32Array(3);
    transitionPosition(swirl, 0, from, to, rand, 0, 0, 0.29, { vortex: 1, swirlPhase: 0, toSwirl: 0 });
    transitionPosition(straight, 0, from, to, rand, 0, 0, 0.29, { vortex: 0, swirlPhase: 0, toSwirl: 0 });
    expect(Array.from(straight)).toEqual([0.5, 0.25, 0.5]);
    expect(Math.hypot(swirl[0] - straight[0], swirl[1] - straight[1], swirl[2] - straight[2])).toBeGreaterThan(0.3);
  });
});
