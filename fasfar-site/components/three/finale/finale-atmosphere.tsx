"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp, smoothstep } from "@/lib/stage/math";
import { finalePhases as fp } from "@/lib/stage/phases";
import { StudioEnvironment } from "../studio-environment";
import { useFinale } from "./finale-state";

const at = (phase: readonly [number, number], p: number) => smoothstep(phase[0], phase[1], p);

/**
 * Light for the finale: near-darkness at first, then a light that sweeps
 * across the sculpture and cool rim lights that pick out its chrome and
 * glass edges, then the warm studio daylight of Scene 1 for the reveal.
 */
export function FinaleAtmosphere({ dustCount }: { dustCount: number }) {
  const state = useFinale();
  const key = useRef<THREE.DirectionalLight>(null);
  const sweep = useRef<THREE.DirectionalLight>(null);
  const rimL = useRef<THREE.DirectionalLight>(null);
  const rimR = useRef<THREE.DirectionalLight>(null);
  const nightKey = useMemo(() => new THREE.Color("#a9bcff"), []);
  const dayKey = useMemo(() => new THREE.Color("#fff6ea"), []);

  const dust = useMemo(() => {
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) pos.set([(rand() - 0.5) * 30, (rand() - 0.5) * 18, rand() * 60 - 6], i * 3);
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3));
  }, [dustCount]);
  const dustMaterial = useMemo(
    () => new THREE.PointsMaterial({ color: "#cfdcff", size: 0.06, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true }),
    [],
  );
  useEffect(
    () => () => {
      dust.dispose();
      dustMaterial.dispose();
    },
    [dust, dustMaterial],
  );

  useFrame(({ scene }) => {
    const p = state.reducedMotion ? 1 : state.progress;
    const night = at(fp.night, p) * (1 - at(fp.dawn, p));
    const reveal = at(fp.reveal, p);
    const dawn = at(fp.dawn, p);

    scene.environmentIntensity = lerp(lerp(0.08, 0.6, reveal), 1, dawn);
    dustMaterial.opacity = night * 0.4;
    if (key.current) {
      key.current.color.lerpColors(nightKey, dayKey, dawn);
      key.current.intensity = lerp(0.2 + reveal * 0.9, 1.6, dawn);
    }
    if (sweep.current) {
      // A light passes across the surfaces, left to right, as the sculpture arrives.
      const k = at([fp.reveal[0], fp.turn[1]], p);
      sweep.current.position.set(lerp(-10, 10, k), 3, 6);
      sweep.current.intensity = Math.sin(k * Math.PI) * 2.2 * (1 - dawn);
    }
    if (rimL.current) rimL.current.intensity = reveal * (1 - dawn) * 3;
    if (rimR.current) rimR.current.intensity = reveal * (1 - dawn) * 2;
  });

  return (
    <>
      <ambientLight intensity={0.16} />
      <directionalLight ref={key} position={[3, 6, 8]} intensity={0.2} />
      <directionalLight ref={sweep} color="#e8eeff" intensity={0} />
      <directionalLight ref={rimL} position={[-7, 2, -5]} color="#7f9cff" intensity={0} />
      <directionalLight ref={rimR} position={[7, -1, -4]} color="#ffcf9e" intensity={0} />
      <StudioEnvironment />
      <points geometry={dust} material={dustMaterial} />
    </>
  );
}
