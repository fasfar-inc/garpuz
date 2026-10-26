"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { frameAt, getHorizonLayout } from "@/lib/stage/horizon-layout";
import { damp, easeInOutCubic, lerp, smoothstep } from "@/lib/stage/math";
import { horizonPhases as hp } from "@/lib/stage/phases";
import { useHorizon } from "./horizon-state";

const at = (phase: readonly [number, number], p: number) => smoothstep(phase[0], phase[1], p);
const target = new THREE.Vector3();

/**
 * Scene 5's camera: a slow forward travel towards the scattered parts, then
 * an arc around the assembled sculpture that keeps turning, gently, as the
 * scene brightens. Under reduced motion it holds one quiet viewpoint.
 */
export function HorizonCamera() {
  const state = useHorizon();
  const size = useThree((s) => s.size);
  const layout = useMemo(() => getHorizonLayout(size.width, size.height), [size.width, size.height]);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const p = state.progress;
    const still = state.reducedMotion;
    pointer.current.x = still ? 0 : damp(pointer.current.x, state.pointer.x, 2.5, dt);
    pointer.current.y = still ? 0 : damp(pointer.current.y, state.pointer.y, 2.5, dt);

    const approach = still ? 1 : easeInOutCubic(at(hp.approach, p));
    const orbit = still ? 0 : easeInOutCubic(at(hp.orbit, p));
    const settle = still ? 0 : easeInOutCubic(at([hp.dawn[0], hp.vision[1]], p));
    const radius = lerp(26, 12.5, approach) + settle * 1.5;
    // A full circle: most of it while the lit sculpture turns in the dark,
    // the rest as day breaks, ending on Scene 1's front view.
    const azimuth = (orbit * 0.8 + settle * 0.2) * Math.PI * 2 + pointer.current.x * 0.06;
    const elevation = lerp(0.03, 0.17, approach) + pointer.current.y * 0.03;

    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * radius,
      Math.sin(elevation) * radius + 0.4,
      Math.cos(azimuth) * Math.cos(elevation) * radius,
    );
    camera.lookAt(target.set(0, lerp(0.5, 0, approach), 0));

    const cam = camera as THREE.PerspectiveCamera;
    const { x, y } = frameAt(layout, easeInOutCubic(at(hp.dawn, p)), easeInOutCubic(at(hp.vision, p)));
    const { width: w, height: h } = size;
    cam.setViewOffset(w, h, (0.5 - x) * w, (0.5 - y) * h, w, h);
    cam.updateProjectionMatrix();
  });

  return null;
}
