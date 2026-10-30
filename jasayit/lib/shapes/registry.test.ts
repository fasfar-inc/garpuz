import { describe, expect, it } from "vitest";
import { generateShape, SHAPE_IDS, SHAPES } from "./registry";

const COUNT = 6000;

function bounds(positions: Float32Array) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      min[c] = Math.min(min[c], positions[i + c]);
      max[c] = Math.max(max[c], positions[i + c]);
    }
  }
  return { min, max, size: max.map((v, c) => v - min[c]) };
}

describe("shape library", () => {
  it.each([...SHAPE_IDS, "self" as const])("%s produces a full, finite, framed formation", (id) => {
    const cloud = generateShape(id, COUNT);
    expect(cloud.count).toBe(COUNT);
    expect(cloud.positions).toHaveLength(COUNT * 3);
    expect(cloud.tones).toHaveLength(COUNT);
    expect(cloud.positions.every(Number.isFinite)).toBe(true);
    expect(cloud.tones.every((t) => Number.isFinite(t) && t >= 0)).toBe(true);

    let farthest = 0;
    for (let i = 0; i < COUNT; i++) {
      farthest = Math.max(farthest, Math.hypot(cloud.positions[i * 3], cloud.positions[i * 3 + 1], cloud.positions[i * 3 + 2]));
    }
    expect(farthest).toBeLessThanOrEqual(id === "self" ? 2.5 : 1.5 + 1e-4);
    // Every form is genuinely three-dimensional, not a flat sprite.
    const { size } = bounds(cloud.positions);
    expect(Math.min(...size)).toBeGreaterThan(0.25);
  });

  it("is deterministic for the same id and count", () => {
    expect(generateShape("cat", 2000).positions).toEqual(generateShape("cat", 2000).positions);
  });

  it("gives every shape distinct geometry", () => {
    const signatures = SHAPE_IDS.map((id) => bounds(generateShape(id, 3000).positions).size.map((v) => v.toFixed(2)).join());
    expect(new Set(signatures).size).toBe(SHAPE_IDS.length);
  });

  it("uses unique aliases across shapes", () => {
    const all = SHAPE_IDS.flatMap((id) => SHAPES[id].aliases);
    expect(new Set(all).size).toBe(all.length);
  });

  it("keeps characteristic proportions", () => {
    const size = (id: (typeof SHAPE_IDS)[number]) => bounds(generateShape(id, 4000).positions).size;
    const tree = size("tree");
    expect(tree[1]).toBeGreaterThan(tree[0]); // taller than wide
    const robot = size("robot");
    expect(robot[1]).toBeGreaterThan(robot[2] * 2); // a figure, not a box
  });
});
