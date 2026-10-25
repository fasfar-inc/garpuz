"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import * as THREE from "three";
import { AssemblingSculpture } from "./assembling-sculpture";
import { HorizonAtmosphere } from "./horizon-atmosphere";
import { HorizonCamera } from "./horizon-camera";
import { HorizonContext, type HorizonState } from "./horizon-state";

type Props = { state: HorizonState; reducedMotion: boolean; active: boolean; onReady?: () => void };

/**
 * Scene 5's WebGL layer. It reuses the stage's sculpture parts, geometry,
 * materials and studio lighting, and is only mounted around Scene 5 — the
 * stage canvas is unmounted by then, so one WebGL context is live at a time.
 */
export default function HorizonCanvas({ state, reducedMotion, active, onReady }: Props) {
  const [compact] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [maxDpr, setMaxDpr] = useState(() => Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75));
  return (
    <Canvas
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      dpr={[1, maxDpr]}
      camera={{ fov: 32, near: 0.1, far: 200, position: [0, 1, 26] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl, invalidate }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        state.invalidate = invalidate;
        onReady?.();
      }}
      style={{ touchAction: "pan-y" }}
    >
      <HorizonContext.Provider value={state}>
        <PerformanceMonitor onDecline={() => setMaxDpr(1)} />
        <Suspense fallback={null}>
          <HorizonCamera />
          <HorizonAtmosphere dustCount={compact ? 110 : 260} />
          <AssemblingSculpture detail={compact ? "low" : "high"} />
        </Suspense>
      </HorizonContext.Provider>
    </Canvas>
  );
}
