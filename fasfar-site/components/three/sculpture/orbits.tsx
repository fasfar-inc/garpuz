"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { smoothstep } from "@/lib/stage/math";
import { phases } from "@/lib/stage/phases";
import { useStage } from "@/lib/stage/store";
import { radialTexture } from "./materials";

const rings = [
  { rx: 3.4, ry: 3.0, rotation: [1.22, 0.25, 0.55] as const, speed: 0.05 },
  { rx: 4.3, ry: 3.6, rotation: [1.38, -0.4, -0.35] as const, speed: -0.035 },
  { rx: 2.7, ry: 2.5, rotation: [1.0, 0.65, 0.95] as const, speed: 0.07 },
];

/** Thin orbit paths with travelling light nodes — the "ecosystem" connections. */
export function Orbits() {
  const store = useStage();
  const nodeTexture = useMemo(() => radialTexture("rgba(255,226,190,1)"), []);
  const curves = useMemo(() => rings.map((r) => new THREE.EllipseCurve(0, 0, r.rx, r.ry)), []);
  const lines = useMemo(
    () =>
      curves.map((c) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(c.getPoints(220));
        const material = new THREE.LineBasicMaterial({ color: "#c9d6f2", transparent: true, opacity: 0, depthWrite: false });
        return new THREE.LineLoop(geometry, material);
      }),
    [curves],
  );
  useEffect(
    () => () => {
      lines.forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
      nodeTexture.dispose();
    },
    [lines, nodeTexture],
  );

  const nodes = useRef<(THREE.Sprite | null)[]>([]);

  useFrame(({ clock }) => {
    const night = smoothstep(phases.night[0] + 0.1, phases.night[1] + 0.15, store.progress);
    const t = store.reducedMotion ? 0 : clock.elapsedTime;
    lines.forEach((l, i) => {
      (l.material as THREE.LineBasicMaterial).opacity = night * (0.22 - i * 0.04);
      const node = nodes.current[i];
      if (!node) return;
      const p = curves[i].getPoint((((t * rings[i].speed + i * 0.31) % 1) + 1) % 1);
      node.position.set(p.x, p.y, 0);
      (node.material as THREE.SpriteMaterial).opacity = night * 0.9;
    });
  });

  return (
    <>
      {rings.map((r, i) => (
        <group key={i} rotation={r.rotation}>
          <primitive object={lines[i]} />
          <sprite ref={(el) => void (nodes.current[i] = el)} scale={0.22}>
            <spriteMaterial map={nodeTexture} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </group>
      ))}
    </>
  );
}
