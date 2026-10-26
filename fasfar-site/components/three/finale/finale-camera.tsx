"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { damp, easeInOutCubic, lerp, smoothstep } from "@/lib/stage/math";
import { finalePhases as fp } from "@/lib/stage/phases";
import { FINAL_DISTANCE, START_DISTANCE } from "./choreography";
import { useFinale } from "./finale-state";

const at = (phase: readonly [number, number], p: number) => smoothstep(phase[0], phase[1], p);
const target = new THREE.Vector3();

/**
 * Scene 8's camera. Part 1: a long travel down the corridor of connection
 * lines, weaving gently, until the sculpture fills the centre. Part 2: it
 * swings round to a three-quarter view while the sculpture opens, then pulls
 * back and settles exactly front-on for the reveal. Part 3 holds that view.
 * Under reduced motion it holds the final, front-on viewpoint.
 */
export function FinaleCamera() {
  const state = useFinale();
  const pointer = useRef({ x: 0, y: 0 });

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const p = state.reducedMotion ? 1 : state.progress;
    const still = state.reducedMotion;
    pointer.current.x = still ? 0 : damp(pointer.current.x, state.pointer.x, 2, dt);
    pointer.current.y = still ? 0 : damp(pointer.current.y, state.pointer.y, 2, dt);

    const travel = easeInOutCubic(at(fp.travel, p));
    const frontal = easeInOutCubic(at(fp.frontal, p));
    const swing = Math.sin(at([fp.turn[0], fp.frontal[1]], p) * Math.PI);

    const distance = lerp(START_DISTANCE, 15, travel) + (FINAL_DISTANCE - 15) * frontal;
    const azimuth = swing * 0.5 + pointer.current.x * 0.035;
    const elevation = lerp(lerp(0.1, 0.2, travel), 0, frontal) - pointer.current.y * 0.02;
    // A slow weave through the threads on the way in.
    const weave = Math.sin(travel * Math.PI) * 1.3;

    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * distance + weave,
      Math.sin(elevation) * distance + Math.sin(travel * Math.PI) * 0.5,
      Math.cos(azimuth) * Math.cos(elevation) * distance,
    );
    camera.lookAt(target.set(weave * 0.4 * (1 - travel), lerp(0.7, 0, travel), 0));
  });

  return null;
}
