"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp, smoothstep } from "@/lib/stage/math";
import { phases } from "@/lib/stage/phases";
import { useStage } from "@/lib/stage/store";
import { radialTexture } from "./sculpture/materials";

/**
 * Procedural studio lighting (no HDR download): softboxes and strips give
 * the chrome its reflections. Night shifts the key light cool and dims the
 * environment as the background turns midnight blue.
 */
export function Atmosphere({ starCount }: { starCount: number }) {
  const store = useStage();
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const ivoryKey = useMemo(() => new THREE.Color("#fff6ea"), []);
  const nightKey = useMemo(() => new THREE.Color("#a9bfff"), []);

  useFrame(({ scene }) => {
    const night = smoothstep(phases.night[0], phases.night[1], store.progress);
    scene.environmentIntensity = lerp(1, 0.62, night);
    if (key.current) {
      key.current.color.lerpColors(ivoryKey, nightKey, night);
      key.current.intensity = lerp(1.6, 0.9, night);
    }
    if (rim.current) rim.current.intensity = lerp(0.2, 3.2, night);
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight ref={key} position={[3, 6, 6]} intensity={1.6} />
      <directionalLight ref={rim} position={[-6, -2, -4]} color="#7f9cff" intensity={0.2} />
      <Environment resolution={512} frames={1}>
        <color attach="background" args={["#5f5c58"]} />
        <Lightformer form="rect" intensity={3.2} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[14, 1.4, 1]} />
        <Lightformer form="rect" intensity={1.8} position={[6, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[14, 0.9, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 0.5, 9]} scale={[7, 2.4, 1]} />
        <Lightformer form="rect" intensity={0.35} color="#1d1d22" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
        <Lightformer form="ring" intensity={2.4} color="#ffd6ab" position={[3.5, -2.5, 5]} scale={2.6} />
      </Environment>
      <Stars count={starCount} />
    </>
  );
}

function Stars({ count }: { count: number }) {
  const store = useStage();
  const texture = useMemo(() => radialTexture("rgba(225,234,255,1)", "rgba(225,234,255,0)"), []);
  const geometry = useMemo(() => {
    const random = seededRandom(7);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 70;
      positions[i * 3 + 1] = (random() - 0.5) * 40;
      positions[i * 3 + 2] = -12 - random() * 40;
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.16,
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [texture],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
    [geometry, material, texture],
  );

  useFrame(({ clock }) => {
    const night = smoothstep(phases.night[0] + 0.15, phases.night[1] + 0.1, store.progress);
    const twinkle = store.reducedMotion ? 1 : 0.85 + Math.sin(clock.elapsedTime * 0.8) * 0.15;
    material.opacity = night * 0.85 * twinkle;
  });

  return <points geometry={geometry} material={material} />;
}

/** Deterministic PRNG (mulberry32) so the star field is stable between renders. */
function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
