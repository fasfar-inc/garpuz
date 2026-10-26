"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { lerp, smoothstep } from "@/lib/stage/math";
import { finalePhases as fp } from "@/lib/stage/phases";
import { radialTexture } from "../sculpture/materials";
import { START_DISTANCE } from "./choreography";
import { useFinale } from "./finale-state";

const at = (phase: readonly [number, number], p: number) => smoothstep(phase[0], phase[1], p);
const GOLDEN = 2.39996;
const WARM = new THREE.Color("#e9b77f");
const COOL = new THREE.Color("#9fb4ff");

/**
 * Scene 7's connection lines, carried into 3D: a corridor of thin luminous
 * threads that all converge on the sculpture. The camera travels down it,
 * with light pulses running ahead towards FASFAR. Lines are 1px (crisp at
 * any distance); brightness falls off at both ends through vertex colours,
 * which additive blending turns into transparency.
 */
export function FinaleThreads({ count, pulsesPerThread }: { count: number; pulsesPerThread: number }) {
  const state = useFinale();

  const threads = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = i * GOLDEN;
        const r0 = 2.4 + (i % 4) * 1.35;
        // They gather around the sculpture and pass behind it, rather than into its face.
        const rEnd = 2.4 + (i % 3) * 0.45;
        const dir = i % 2 ? 1 : -1;
        const points: THREE.Vector3[] = [];
        for (const z of [START_DISTANCE + 10, 56, 42, 30, 20, 12, 6, 2, -1, -3]) {
          const r = lerp(rEnd, r0, smoothstep(0, 34, z));
          const th = angle + (START_DISTANCE + 10 - z) * 0.011 * dir;
          points.push(new THREE.Vector3(Math.cos(th) * r, Math.sin(th) * r * 0.78 + 0.15, z));
        }
        const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
        const samples = curve.getSpacedPoints(180);
        const color = i % 3 === 0 ? COOL : WARM;
        const colors = new Float32Array(samples.length * 3);
        samples.forEach((pt, j) => {
          // Dim far away and as it disappears into the sculpture.
          const fade = smoothstep(START_DISTANCE + 10, START_DISTANCE - 14, pt.z) * smoothstep(-3, 1.5, pt.z);
          colors.set([color.r * fade, color.g * fade, color.b * fade], j * 3);
        });
        const geometry = new THREE.BufferGeometry().setFromPoints(samples);
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        return { curve, geometry, color, speed: 0.045 + (i % 5) * 0.012, offset: (i * 0.37) % 1 };
      }),
    [count],
  );

  const lineMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    [],
  );
  // THREE.Line as a primitive: JSX <line> is the SVG element.
  const lines = useMemo(() => threads.map((th) => Object.assign(new THREE.Line(th.geometry, lineMaterial), { frustumCulled: false })), [threads, lineMaterial]);
  const pulseTexture = useMemo(() => radialTexture(), []);
  const pulseMaterials = useMemo(
    () =>
      threads.map(
        (th) => new THREE.SpriteMaterial({ map: pulseTexture, color: th.color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      ),
    [threads, pulseTexture],
  );
  const pulses = useMemo(
    () => threads.flatMap((th, i) => Array.from({ length: pulsesPerThread }, (_, j) => ({ thread: th, material: pulseMaterials[i], phase: j / pulsesPerThread, sprite: new THREE.Sprite(pulseMaterials[i]) }))),
    [threads, pulseMaterials, pulsesPerThread],
  );

  useEffect(
    () => () => {
      threads.forEach((th) => th.geometry.dispose());
      pulseMaterials.forEach((m) => m.dispose());
      lineMaterial.dispose();
      pulseTexture.dispose();
    },
    [threads, pulseMaterials, lineMaterial, pulseTexture],
  );

  useFrame(({ clock }) => {
    const p = state.progress;
    // In with the night; they fade as the sculpture opens and the lines' work is done.
    const level = at(fp.threads, p) * (1 - at([fp.turn[0] + 0.04, fp.separate[0] + 0.08], p));
    lineMaterial.opacity = level * 0.95;
    pulseMaterials.forEach((m) => (m.opacity = level));
    const t = state.reducedMotion ? 0 : clock.elapsedTime;
    pulses.forEach(({ thread, sprite, phase }) => {
      sprite.visible = level > 0.01;
      if (!sprite.visible) return;
      const u = (t * thread.speed + thread.offset + phase) % 1;
      thread.curve.getPointAt(u, sprite.position);
      // Brightest mid-corridor, vanishing at the far end and into the sculpture.
      const z = sprite.position.z;
      sprite.scale.setScalar(0.22 * smoothstep(START_DISTANCE + 8, START_DISTANCE - 10, z) * smoothstep(-2, 3, z) + 0.001);
    });
  });

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
      {pulses.map(({ sprite }, i) => (
        <primitive key={i} object={sprite} />
      ))}
    </group>
  );
}
