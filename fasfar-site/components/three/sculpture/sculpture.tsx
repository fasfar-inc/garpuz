"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { featuredVentures } from "@/content/ventures";
import { getStageLayout } from "@/lib/stage/layout";
import { damp, easeInOutCubic, easeOutCubic, lerp, smoothstep } from "@/lib/stage/math";
import { beyondPhases, phases } from "@/lib/stage/phases";
import { beyondAt, nightLevel } from "@/lib/stage/levels";
import { useStage } from "@/lib/stage/store";
import { useAnchorProjector } from "./anchor-projector";
import { createPartGeometry } from "./geometry";
import { createMaterials, radialTexture } from "./materials";
import { Orbits } from "./orbits";
import { orbiters, sculptureParts, sculptureTilt, type Vec3 } from "./parts";

const INTRO_SECONDS = 2.6;
/** The entrance plays once per visit; if the canvas remounts (scrolling back up from Scene 5) it doesn't replay. */
let introPlayed = false;

/** Map sculpture part id → index of the featured venture anchored to it. */
const ventureByPart = new Map<string, number>(
  featuredVentures.flatMap((v, i) => (v.anchor ? [[v.anchor, i] as const] : [])),
);

const lerp3 = (out: THREE.Vector3 | THREE.Euler, a: Vec3, b: Vec3, t: number) =>
  out.set(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));

export function Sculpture({ detail }: { detail: "high" | "low" }) {
  const store = useStage();
  const size = useThree((s) => s.size);
  const layout = useMemo(() => getStageLayout(size.width, size.height), [size.width, size.height]);

  const materials = useMemo(() => createMaterials(), []);
  const glowTexture = useMemo(() => radialTexture("rgba(255,214,170,1)", "rgba(255,190,130,0)"), []);
  const geometries = useMemo(
    () => sculptureParts.map((p) => createPartGeometry(p.kind, p.radius, p.thickness, detail)),
    [detail],
  );
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(1, detail === "high" ? 48 : 28, detail === "high" ? 32 : 18), [detail]);

  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => sphereGeometry.dispose(), [sphereGeometry]);
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
  const partRefs = useRef<(THREE.Group | null)[]>([]);
  const orbiterRefs = useRef<(THREE.Mesh | null)[]>([]);
  const motion = useRef({ intro: 0, explode: 0, hover: sculptureParts.map(() => 0) });

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const m = motion.current;
    const still = store.reducedMotion;
    const idle = still ? 0 : 1;
    const t = state.clock.elapsedTime;

    m.intro = still || introPlayed ? 1 : Math.min(1, m.intro + dt / INTRO_SECONDS);
    if (m.intro >= 1) introPlayed = true;
    const intro = easeOutCubic(m.intro);
    const explodeTarget = smoothstep(phases.explode[0], phases.explode[1], store.progress);
    m.explode = still ? explodeTarget : damp(m.explode, explodeTarget, 7, dt);
    const e = easeInOutCubic(m.explode);
    const night = nightLevel(store);
    // Scene 3: the sculpture rises, turns and drifts apart out of frame.
    const exit = beyondAt(store, beyondPhases.sculptureExit) ** 2;

    if (root.current && tilt.current) {
      const scale = lerp(layout.hero.scale, layout.ecosystem.scale, e) * lerp(0.84, 1, intro);
      root.current.scale.setScalar(scale * (1 + exit * 0.3));
      root.current.position.y = Math.sin(t * 0.55) * 0.07 * idle + exit * 9.5;
      root.current.position.x = exit * -1.2;
      root.current.visible = exit < 0.999;
      lerp3(tilt.current.rotation, sculptureTilt.assembled, sculptureTilt.exploded, e);
      tilt.current.rotation.x += store.pointer.y * 0.1 * idle + Math.sin(t * 0.3) * 0.03 * idle;
      tilt.current.rotation.y += store.pointer.x * 0.16 * idle + Math.sin(t * 0.22) * 0.06 * idle - (1 - intro) * 1.3;
      tilt.current.rotation.z += Math.cos(t * 0.27) * 0.02 * idle + exit * 0.7;
      tilt.current.rotation.x -= exit * 0.6;
    }

    sculptureParts.forEach((part, i) => {
      const g = partRefs.current[i];
      if (!g) return;
      const k = easeInOutCubic(smoothstep(part.delay, part.delay + 0.6, m.explode));
      const venture = ventureByPart.get(part.id);
      const hoverTarget = venture !== undefined && store.hovered === venture ? 1 : 0;
      m.hover[i] = still ? hoverTarget : damp(m.hover[i], hoverTarget, 9, dt);
      const h = m.hover[i];

      lerp3(g.position, part.assembled.position, part.exploded.position, k);
      g.position.y *= 1 + (1 - intro) * 0.6;
      g.position.multiplyScalar(1 + exit * 0.7);
      g.position.y += Math.sin(t * 0.8 + i * 0.9) * (0.012 + 0.07 * k) * idle;
      g.position.z += h * 0.3;
      lerp3(g.rotation, part.assembled.rotation, part.exploded.rotation, k);
      g.rotation.y = t * 0.08 * idle * (i % 2 ? 1 : -1);
      g.rotation.z += Math.sin(t * 0.5 + i) * 0.025 * k * idle;
      g.scale.setScalar(lerp(part.assembled.scale, part.exploded.scale, k) * (1 + h * 0.05));
    });

    orbiters.forEach((o, i) => {
      const mesh = orbiterRefs.current[i];
      if (!mesh) return;
      lerp3(mesh.position, o.assembled, o.exploded, e);
      mesh.position.y += Math.sin(t * 0.9 + o.phase) * 0.12 * idle;
      mesh.position.x += Math.cos(t * 0.6 + o.phase) * 0.08 * idle;
      mesh.scale.setScalar(o.radius * lerp(0.6, 1, intro));
    });

    materials.pearl.emissiveIntensity = night * 0.22 + 0.02;
    materials.chrome.envMapIntensity = lerp(1.25, 1.6, night);
  });

  useAnchorProjector(partRefs, !layout.compact);

  const onOver = (index: number | undefined) => (e: ThreeEvent<PointerEvent>) => {
    if (index === undefined) return;
    e.stopPropagation();
    store.setHovered(index);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    store.setHovered(null);
    document.body.style.cursor = "";
  };

  return (
    <group ref={root}>
      <Orbits />
      <group ref={tilt}>
        {sculptureParts.map((part, i) => {
          const venture = ventureByPart.get(part.id);
          return (
            <group key={part.id} ref={(el) => void (partRefs.current[i] = el)}>
              <mesh
                geometry={geometries[i]}
                material={materials[part.material]}
                renderOrder={part.material === "glass" ? 2 : 0}
                onPointerOver={onOver(venture)}
                onPointerOut={venture !== undefined ? onOut : undefined}
              />
            </group>
          );
        })}
        {orbiters.map((o, i) => (
          <mesh
            key={i}
            ref={(el) => void (orbiterRefs.current[i] = el)}
            geometry={sphereGeometry}
            material={materials.chrome}
            position={o.assembled}
          />
        ))}
        <CoreGlow texture={glowTexture} />
      </group>
    </group>
  );
}

/** Warm light blooming between the separated components in Scene 2. */
function CoreGlow({ texture }: { texture: THREE.Texture }) {
  const store = useStage();
  const sprite = useRef<THREE.Sprite>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const night = nightLevel(store);
    const pulse = store.reducedMotion ? 1 : 0.9 + Math.sin(clock.elapsedTime * 1.3) * 0.1;
    if (sprite.current) {
      (sprite.current.material as THREE.SpriteMaterial).opacity = night * 0.55 * pulse;
      sprite.current.scale.setScalar(lerp(2.5, 4.2, night));
    }
    if (light.current) light.current.intensity = night * 14 * pulse;
  });
  return (
    <>
      <sprite ref={sprite} position={[0.1, -0.25, 0.4]} renderOrder={1}>
        <spriteMaterial map={texture} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight ref={light} position={[0.1, -0.2, 0.6]} color="#ffbe86" distance={6} decay={1.6} intensity={0} />
    </>
  );
}
