"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { damp, easeInOutCubic, lerp, smoothstep } from "@/lib/stage/math";
import { finalePhases as fp } from "@/lib/stage/phases";
import { createPartGeometry } from "../sculpture/geometry";
import { createMaterials, radialTexture } from "../sculpture/materials";
import { orbiters, sculptureParts, sculptureTilt, type Vec3 } from "../sculpture/parts";
import { compactAdjust, FINAL_DISTANCE, frameSlots, frustumAt, type FrameSlot } from "./choreography";
import { useFinale } from "./finale-state";

const at = (phase: readonly [number, number], p: number) => smoothstep(phase[0], phase[1], p);

/** Every component, parts then orbiters, with its home pose in sculpture space. */
const pieces = [
  ...sculptureParts.map((p, i) => ({
    id: p.id,
    home: p.assembled.position as Vec3,
    rotation: p.assembled.rotation as Vec3,
    scale: p.assembled.scale as number,
    spin: i % 2 ? 1 : -1,
  })),
  ...orbiters.map((o, i) => ({ id: `orbiter-${i}`, home: o.assembled, rotation: [0, 0, 0] as Vec3, scale: o.radius, spin: 0 })),
];

const v = new THREE.Vector3();
const a = new THREE.Vector3();
const b = new THREE.Vector3();
const qa = new THREE.Quaternion();
const qb = new THREE.Quaternion();
const qTilt = new THREE.Quaternion();
const qSpin = new THREE.Quaternion();
const e = new THREE.Euler();
const Y = new THREE.Vector3(0, 1, 0);

/**
 * The signature sculpture's final transformation. It approaches out of the
 * dark, turns, opens up, and then each component travels on an arc to its
 * slot at the edge of the frame — where, front-on, they frame the FASFAR
 * wordmark. Unlike Scene 5 (scattered → assembled), this goes the other
 * way: assembled → a composition. Fully reversible.
 */
export function FinaleSculpture({ detail }: { detail: "high" | "low" }) {
  const state = useFinale();
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const compact = size.width < 768;

  const materials = useMemo(() => createMaterials(), []);
  const glowTexture = useMemo(() => radialTexture("rgba(170,196,255,1)", "rgba(120,150,255,0)"), []);
  const geometries = useMemo(() => sculptureParts.map((p) => createPartGeometry(p.kind, p.radius, p.thickness, detail)), [detail]);
  const sphere = useMemo(() => new THREE.SphereGeometry(1, detail === "high" ? 48 : 28, detail === "high" ? 32 : 18), [detail]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => sphere.dispose(), [sphere]);
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => {
        m.roughnessMap?.dispose();
        m.dispose();
      });
      glowTexture.dispose();
    },
    [materials, glowTexture],
  );

  const refs = useRef<(THREE.Object3D | null)[]>([]);
  const glow = useRef<THREE.Sprite>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const p = state.progress;
    const still = state.reducedMotion;
    const idle = still ? 0 : 1;
    const t = clock.elapsedTime;
    pointer.current.x = still ? 0 : damp(pointer.current.x, state.pointer.x, 2.2, dt);
    pointer.current.y = still ? 0 : damp(pointer.current.y, state.pointer.y, 2.2, dt);

    const travel = easeInOutCubic(at(fp.travel, p));
    const turn = easeInOutCubic(at(fp.turn, p));
    const open = easeInOutCubic(at([fp.turn[0], fp.separate[0] + 0.06], p));
    const rise = easeInOutCubic(at(fp.rise, p));

    // The whole sculpture: drifts in from off-centre, then turns gently.
    const s = Math.min(1, aspect / 0.9) * (compact ? 0.95 : 1) * lerp(0.8, 1, travel);
    const offset = v.set(lerp(1.4, 0, travel), lerp(0.9, 0, travel) + Math.sin(t * 0.5) * 0.06 * idle, 0);
    e.set(sculptureTilt.assembled[0] * (1 - turn * 0.5), sculptureTilt.assembled[1] + turn * Math.PI * 0.85 + Math.sin(t * 0.2) * 0.05 * idle, sculptureTilt.assembled[2] * (1 - turn * 0.6));
    qTilt.setFromEuler(e);

    const { hh, hw } = frustumAt(FINAL_DISTANCE, aspect);
    const fit = compact ? compactAdjust.scale : Math.min(1, hw / 8);
    const span = fp.separate[1] - fp.separate[0];

    pieces.forEach((piece, i) => {
      const obj = refs.current[i];
      if (!obj) return;
      const slot: FrameSlot | undefined = frameSlots[piece.id];

      // Home: the assembled pose, opening up along the stack as it turns.
      a.set(piece.home[0], piece.home[1] * (1 + open * 0.55), piece.home[2]).applyQuaternion(qTilt).multiplyScalar(s).add(offset);
      qa.setFromEuler(e.set(...piece.rotation));
      qSpin.setFromAxisAngle(Y, t * 0.08 * piece.spin * idle);
      qa.premultiply(qTilt).multiply(qSpin);
      const homeScale = piece.scale * s;

      if (!slot) {
        obj.position.copy(a);
        obj.quaternion.copy(qa);
        obj.scale.setScalar(homeScale);
        return;
      }

      // The frame: screen-space slot at the final camera distance, pushed a little
      // further out as the composition settles in daylight.
      const depth = (FINAL_DISTANCE - slot.z) / FINAL_DISTANCE;
      const outX = 1 + rise * 0.06;
      const outY = 1 + rise * 0.04;
      const sx = slot.x * (compact ? compactAdjust.spreadX : 1);
      const sy = slot.y * (compact ? compactAdjust.spreadY : 1);
      b.set(sx * hw * depth * outX, sy * hh * depth * outY, slot.z);
      b.x += pointer.current.x * (0.25 + slot.z * 0.12);
      b.y += Math.sin(t * 0.55 + i * 1.7) * 0.12 * idle - pointer.current.y * (0.18 + slot.z * 0.08);
      qb.setFromEuler(e.set(slot.rotation[0] + Math.sin(t * 0.3 + i) * 0.06 * idle, slot.rotation[1] + t * 0.05 * piece.spin * idle, slot.rotation[2]));

      // Staggered departures: outer slots leave first, all land by the end of the phase.
      const order = 1 - Math.min(1, Math.hypot(slot.x, slot.y) / 1.45);
      const start = fp.separate[0] + order * span * 0.35;
      const k = still ? (p >= fp.separate[0] ? 1 : 0) : easeInOutCubic(smoothstep(start, start + span * 0.65, p));

      obj.position.lerpVectors(a, b, k);
      // Arc towards the camera on the way out.
      obj.position.z += Math.sin(k * Math.PI) * 2.4;
      obj.quaternion.slerpQuaternions(qa, qb, k);
      obj.scale.setScalar(lerp(homeScale, slot.scale * fit * (1 - rise * 0.12), k));
    });

    // Atmosphere: chrome warms up as the light finds it; a cool glow behind the
    // sculpture fades once it has opened.
    const reveal = at(fp.reveal, p);
    const dawn = at(fp.dawn, p);
    materials.chrome.envMapIntensity = lerp(0.6, 1.5, reveal) * lerp(1, 0.85, dawn);
    materials.pearl.emissiveIntensity = 0.02 + reveal * (1 - dawn) * 0.16;
    if (glow.current) {
      const sep = at(fp.separate, p);
      (glow.current.material as THREE.SpriteMaterial).opacity = reveal * (1 - sep) * (1 - dawn) * 0.55;
      glow.current.position.copy(offset).setZ(-1.5);
      glow.current.scale.setScalar(lerp(5, 9, reveal) * s);
    }
  });

  return (
    <group>
      {sculptureParts.map((part, i) => (
        <mesh
          key={part.id}
          ref={(el) => void (refs.current[i] = el)}
          geometry={geometries[i]}
          material={materials[part.material]}
          renderOrder={part.material === "glass" ? 2 : 0}
        />
      ))}
      {orbiters.map((_, i) => (
        <mesh key={i} ref={(el) => void (refs.current[sculptureParts.length + i] = el)} geometry={sphere} material={materials.chrome} />
      ))}
      <sprite ref={glow} renderOrder={-1}>
        <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}
