"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp, smoothstep } from "@/lib/stage/math";
import { horizonPhases as hp } from "@/lib/stage/phases";
import { StudioEnvironment } from "../studio-environment";
import { useHorizon } from "./horizon-state";

const HORIZON_Y = -2.6;
const HORIZON_RADIUS = 70;
const at = (phase: readonly [number, number], p: number) => smoothstep(phase[0], phase[1], p);

/**
 * Vertical light falloff for the glow band: bright at the horizon, fading
 * above and below. Greyscale, because an alphaMap reads the green channel.
 */
function bandTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#000");
  g.addColorStop(0.3, "#0d0d0d");
  g.addColorStop(0.47, "#5a5a5a");
  g.addColorStop(0.5, "#fff");
  g.addColorStop(0.54, "#3a3a3a");
  g.addColorStop(0.7, "#080808");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 256);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Night on the horizon: a thin luminous line circling the whole scene (so it
 * stays on the horizon from any camera angle) with a soft glow band, sparse
 * drifting dust for depth, and lighting that goes from moonlit, to the
 * sculpture's own glow, to daylight at dawn.
 */
export function HorizonAtmosphere({ dustCount }: { dustCount: number }) {
  const state = useHorizon();
  const band = useMemo(() => bandTexture(), []);
  const line = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const nightKey = useMemo(() => new THREE.Color("#9fb4ff"), []);
  const dayKey = useMemo(() => new THREE.Color("#fff6ea"), []);

  const dust = useMemo(() => {
    let seed = 3;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const r = 5 + rand() * 26;
      const a = rand() * Math.PI * 2;
      pos.set([Math.cos(a) * r, -2 + rand() * 9, Math.sin(a) * r], i * 3);
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3));
  }, [dustCount]);
  const dustMaterial = useMemo(
    () => new THREE.PointsMaterial({ color: "#cfdcff", size: 0.05, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true }),
    [],
  );
  useEffect(
    () => () => {
      band.dispose();
      dust.dispose();
      dustMaterial.dispose();
    },
    [band, dust, dustMaterial],
  );

  useFrame(({ scene }) => {
    const p = state.progress;
    const air = at(hp.atmosphere, p);
    const emerge = at(hp.scatterIn, p);
    const lit = at(hp.illuminate, p);
    const dawn = at(hp.dawn, p);
    const night = 1 - dawn;

    scene.environmentIntensity = lerp(lerp(0.25, 0.55, emerge) + lit * 0.3, 1, dawn);
    if (line.current) line.current.opacity = air * night * (0.85 + lit * 0.15);
    if (glow.current) glow.current.opacity = air * night * (0.22 + lit * 0.18);
    dustMaterial.opacity = air * night * 0.45;
    if (key.current) {
      key.current.color.lerpColors(nightKey, dayKey, dawn);
      key.current.intensity = lerp(0.5 + emerge * 0.5, 1.6, dawn);
    }
    if (rim.current) rim.current.intensity = lerp(2.6 * emerge, 0.2, dawn);
  });

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight ref={key} position={[3, 6, 6]} intensity={0.5} />
      <directionalLight ref={rim} position={[-6, -1, -5]} color="#7f9cff" intensity={0} />
      <StudioEnvironment />

      <mesh position={[0, HORIZON_Y, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[HORIZON_RADIUS, 0.045, 6, 360]} />
        <meshBasicMaterial ref={line} color="#dfe8ff" transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, HORIZON_Y, 0]}>
        <cylinderGeometry args={[HORIZON_RADIUS - 0.5, HORIZON_RADIUS - 0.5, 7, 180, 1, true]} />
        <meshBasicMaterial
          ref={glow}
          color="#7d9cff"
          alphaMap={band}
          transparent
          opacity={0}
          side={THREE.BackSide}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <points geometry={dust} material={dustMaterial} />
    </>
  );
}
