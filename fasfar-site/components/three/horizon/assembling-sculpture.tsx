"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { frameAt, getHorizonLayout } from "@/lib/stage/horizon-layout";
import { easeInOutCubic, lerp, smoothstep } from "@/lib/stage/math";
import { horizonPhases as hp } from "@/lib/stage/phases";
import { createPartGeometry } from "../sculpture/geometry";
import { createMaterials, radialTexture } from "../sculpture/materials";
import { sculptureParts, sculptureTilt } from "../sculpture/parts";
import { flightPoint, orbiterFlights, partFlights } from "./choreography";
import { useHorizon } from "./horizon-state";

const at = (phase: readonly [number, number], p: number) => smoothstep(phase[0], phase[1], p);

/**
 * The signature sculpture, assembling. Scroll moves every part from its
 * scattered pose along its flight path into the Scene 1 assembled pose; the
 * finished sculpture then lights up from within. Fully reversible.
 */
export function AssemblingSculpture({ detail }: { detail: "high" | "low" }) {
  const state = useHorizon();
  const size = useThree((s) => s.size);
  const layout = useMemo(() => getHorizonLayout(size.width, size.height), [size.width, size.height]);

  const materials = useMemo(() => createMaterials(), []);
  const glowTexture = useMemo(() => radialTexture("rgba(255,214,170,1)", "rgba(255,190,130,0)"), []);
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

  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const parts = useRef<(THREE.Group | null)[]>([]);
  const spheres = useRef<(THREE.Mesh | null)[]>([]);
  const glow = useRef<THREE.Sprite>(null);
  const core = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const p = state.progress;
    const still = state.reducedMotion;
    const idle = still ? 0 : 1;
    const t = clock.elapsedTime;
    const vision = easeInOutCubic(at(hp.vision, p));
    const lit = at(hp.illuminate, p);
    const dawn = at(hp.dawn, p);
    const emerge = still ? 1 : easeInOutCubic(at(hp.scatterIn, p));

    if (root.current && tilt.current) {
      // The parts stay hidden while Part 1's words hold the stage, then emerge from the dark.
      root.current.visible = emerge > 0.001;
      root.current.scale.setScalar(frameAt(layout, easeInOutCubic(dawn), vision).scale * lerp(0.45, 1, emerge));
      root.current.position.y = Math.sin(t * 0.5) * 0.06 * idle;
      tilt.current.rotation.set(...sculptureTilt.assembled);
      // A turn of its own while the camera circles, settling back to Scene 1's pose, plus a breath of idle motion.
      tilt.current.rotation.y += Math.sin(at([hp.orbit[0], 1], p) * Math.PI) * 0.6 + Math.sin(t * 0.25) * 0.05 * idle;
    }

    const span = hp.assemble[1] - hp.assemble[0];
    partFlights.forEach((f, i) => {
      const g = parts.current[i];
      if (!g) return;
      // Staggered windows: early parts start first, all land by the end of the phase.
      const start = hp.assemble[0] + f.order * span * 0.42;
      const k = still ? 1 : easeInOutCubic(smoothstep(start, start + span * 0.58, p));
      flightPoint(f, k, g.position);
      g.position.y += Math.sin(t * 0.6 + i * 1.3) * 0.18 * (1 - k) * idle;
      g.rotation.set(
        lerp(f.scatteredRotation[0], f.homeRotation[0], k) + Math.sin(t * 0.3 + i) * 0.25 * (1 - k) * idle,
        lerp(f.scatteredRotation[1], f.homeRotation[1], k) + f.spin * (1 - k) * Math.PI + t * 0.1 * (1 - k) * idle,
        lerp(f.scatteredRotation[2], f.homeRotation[2], k),
      );
      g.scale.setScalar(lerp(0.85, 1, k) * f.homeScale);
    });

    orbiterFlights.forEach((f, i) => {
      const m = spheres.current[i];
      if (!m) return;
      const k = still ? 1 : easeInOutCubic(at([hp.assemble[0] + 0.1, hp.assemble[1]], p));
      flightPoint(f, k, m.position);
      m.position.y += Math.sin(t * 0.8 + i * 2) * 0.14 * idle;
      m.scale.setScalar(f.homeScale);
    });

    // Illumination: the assembled sculpture glows from within, then settles in daylight.
    const inner = lit * (1 - dawn * 0.65);
    materials.pearl.emissiveIntensity = 0.03 + inner * 0.38;
    materials.chrome.envMapIntensity = lerp(1.0, 1.7, lit);
    if (core.current) core.current.intensity = inner * 18;
    if (glow.current) {
      (glow.current.material as THREE.SpriteMaterial).opacity = inner * 0.7;
      glow.current.scale.setScalar(lerp(2, 5.5, lit));
    }
  });

  return (
    <group ref={root}>
      <group ref={tilt}>
        {sculptureParts.map((part, i) => (
          <group key={part.id} ref={(el) => void (parts.current[i] = el)}>
            <mesh geometry={geometries[i]} material={materials[part.material]} renderOrder={part.material === "glass" ? 2 : 0} />
          </group>
        ))}
        {orbiterFlights.map((_, i) => (
          <mesh key={i} ref={(el) => void (spheres.current[i] = el)} geometry={sphere} material={materials.chrome} />
        ))}
        <sprite ref={glow} position={[0.1, -0.2, 0.4]} renderOrder={1}>
          <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <pointLight ref={core} position={[0.1, -0.2, 0.6]} color="#ffbe86" distance={7} decay={1.6} intensity={0} />
      </group>
    </group>
  );
}
