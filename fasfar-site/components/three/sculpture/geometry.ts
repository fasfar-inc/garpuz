import * as THREE from "three";
import type { PartKind } from "./parts";

/** Biconvex lens: domed top and bottom meeting at a fine rim. */
function lensProfile(radius: number, thickness: number, steps: number) {
  const top: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = radius * Math.sin((t * Math.PI) / 2);
    const y = (thickness / 2) * Math.pow(1 - (r / radius) ** 2, 0.6);
    top.push(new THREE.Vector2(r, y));
  }
  const bottom = top
    .slice(0, -1)
    .reverse()
    .map((p) => new THREE.Vector2(p.x, -p.y));
  return [...top, ...bottom];
}

/** Shallow dish with a rolled lip, opening towards +Y. */
function bowlProfile(radius: number, depth: number, steps: number) {
  const wall = Math.max(0.035, depth * 0.12);
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(new THREE.Vector2(radius * t, -depth / 2 + depth * t ** 2.2));
  }
  pts.push(new THREE.Vector2(radius + wall * 0.15, depth / 2 + wall * 0.35));
  pts.push(new THREE.Vector2(radius - wall * 0.6, depth / 2 + wall * 0.45));
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const r = (radius - wall) * t;
    pts.push(new THREE.Vector2(r, -depth / 2 + wall + (depth - wall * 0.4) * t ** 2.4));
  }
  return pts;
}

export function createPartGeometry(kind: PartKind, radius: number, thickness: number, detail: "high" | "low") {
  const radial = detail === "high" ? 128 : 72;
  const steps = detail === "high" ? 40 : 22;
  if (kind === "ring") {
    const g = new THREE.TorusGeometry(radius, thickness, detail === "high" ? 20 : 12, radial);
    g.rotateX(Math.PI / 2);
    return g;
  }
  const profile = kind === "lens" ? lensProfile(radius, thickness, steps) : bowlProfile(radius, thickness, steps);
  const g = new THREE.LatheGeometry(profile, radial);
  g.computeVertexNormals();
  return g;
}
