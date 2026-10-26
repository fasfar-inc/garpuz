import * as THREE from "three";
import { orbiters, sculptureParts, type Vec3 } from "../sculpture/parts";

/**
 * Scene 5's assembly choreography for the signature sculpture. Every part
 * starts scattered through the space and travels home along a curved path
 * (a quadratic Bézier) to the exact assembled pose from Scene 1, so the
 * object that forms is the same FASFAR sculpture. Poses are derived from the
 * part list, so re-shaping the sculpture in parts.ts updates this too.
 */
export type Flight = {
  scattered: THREE.Vector3;
  control: THREE.Vector3;
  home: THREE.Vector3;
  scatteredRotation: Vec3;
  homeRotation: Vec3;
  homeScale: number;
  /** Extra turns while travelling. */
  spin: number;
  /** Assembly order, 0 → 1. */
  order: number;
};

const GOLDEN = 2.39996;

function flightFor(home: Vec3, homeRotation: Vec3, homeScale: number, i: number, count: number): Flight {
  const angle = i * GOLDEN + 0.6;
  const radius = 3.3 + (i % 3) * 0.9;
  const scattered = new THREE.Vector3(
    Math.cos(angle) * radius,
    home[1] * 1.05 + Math.sin(angle * 1.7) * 0.8,
    -2.5 - (i % 4) * 1.2 + Math.sin(angle) * 1.2,
  );
  const homeV = new THREE.Vector3(...home);
  // Swing out towards the camera and to one side before settling.
  const control = scattered.clone().lerp(homeV, 0.45).add(new THREE.Vector3(i % 2 ? 1.2 : -1.2, i % 3 === 0 ? 0.9 : -0.6, 1.8));
  return {
    scattered,
    control,
    home: homeV,
    scatteredRotation: [homeRotation[0] + Math.sin(angle * 2) * 1.1, homeRotation[1] + angle, homeRotation[2] + Math.cos(angle) * 0.9],
    homeRotation,
    homeScale,
    spin: (i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.3),
    order: count > 1 ? i / (count - 1) : 0,
  };
}

export const partFlights = sculptureParts.map((p, i) =>
  flightFor(p.assembled.position, p.assembled.rotation, p.assembled.scale, i, sculptureParts.length),
);

export const orbiterFlights = orbiters.map((o, i) => flightFor(o.assembled, [0, 0, 0], o.radius, i + 3, orbiters.length + 4));

const a = new THREE.Vector3();
const b = new THREE.Vector3();
/** Point on a flight path at t (0 = scattered, 1 = home). */
export function flightPoint(f: Flight, t: number, out: THREE.Vector3) {
  a.copy(f.scattered).lerp(f.control, t);
  b.copy(f.control).lerp(f.home, t);
  return out.copy(a).lerp(b, t);
}
