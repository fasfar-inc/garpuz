"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import * as THREE from "three";
import { FINALE_FOV, START_DISTANCE } from "./choreography";
import { FinaleAtmosphere } from "./finale-atmosphere";
import { FinaleCamera } from "./finale-camera";
import { FinaleSculpture } from "./finale-sculpture";
import { FinaleContext, type FinaleState } from "./finale-state";
import { FinaleThreads } from "./finale-threads";

type Props = { state: FinaleState; reducedMotion: boolean; active: boolean; onReady?: () => void };

/**
 * Scene 8's WebGL layer. Like Scene 5's, it reuses the stage's sculpture
 * parts, geometry, materials and studio lighting, and is mounted only around
 * Scene 8 — by then Scene 5's canvas has unmounted, so one WebGL context is
 * live at a time.
 */
export default function FinaleCanvas({ state, reducedMotion, active, onReady }: Props) {
  const [compact] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [maxDpr, setMaxDpr] = useState(() => Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75));
  return (
    <Canvas
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      dpr={[1, maxDpr]}
      camera={{ fov: FINALE_FOV, near: 0.1, far: 200, position: [0, 0, START_DISTANCE] }}
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
      <FinaleContext.Provider value={state}>
        <PerformanceMonitor onDecline={() => setMaxDpr(1)} />
        <Suspense fallback={null}>
          <FinaleCamera />
          <FinaleAtmosphere dustCount={compact ? 90 : 220} />
          <FinaleThreads count={compact ? 12 : 20} pulsesPerThread={compact ? 1 : 2} />
          <FinaleSculpture detail={compact ? "low" : "high"} />
        </Suspense>
      </FinaleContext.Provider>
    </Canvas>
  );
}
