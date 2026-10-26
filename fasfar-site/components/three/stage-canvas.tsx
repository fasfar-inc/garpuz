"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { StageContext, type StageStore } from "@/lib/stage/store";
import { Atmosphere } from "./atmosphere";
import { CameraRig } from "./camera-rig";
import { Floaters } from "./floaters";
import { Sculpture } from "./sculpture/sculpture";

type Props = { store: StageStore; reducedMotion: boolean; onReady?: () => void };

/**
 * The WebGL layer of the home stage. Loaded client-side only (see
 * `HomeStage`), it renders on demand under reduced motion, pauses when the
 * stage is off screen, and drops resolution if the frame rate suffers.
 */
export default function StageCanvas({ store, reducedMotion, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [compact] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [maxDpr, setMaxDpr] = useState(() => Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75));
  const [visible, setVisible] = useState(true);

  // A remounted canvas registers a fresh invalidate; drop the dead one on unmount.
  useEffect(() => () => store.setInvalidate(() => {}), [store]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={host} className="absolute inset-0">
      <Canvas
        frameloop={!visible ? "never" : reducedMotion ? "demand" : "always"}
        dpr={[1, maxDpr]}
        camera={{ fov: 30, near: 0.1, far: 120, position: [0, 0.15, 14] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl, invalidate }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          store.setInvalidate(invalidate);
          onReady?.();
        }}
        style={{ touchAction: "pan-y" }}
      >
        <StageContext.Provider value={store}>
          <PerformanceMonitor onDecline={() => setMaxDpr(1)} />
          <Suspense fallback={null}>
            <CameraRig />
            <Atmosphere starCount={compact ? 350 : 900} />
            <Sculpture detail={compact ? "low" : "high"} />
            <Floaters detail={compact ? "low" : "high"} />
          </Suspense>
        </StageContext.Provider>
      </Canvas>
    </div>
  );
}
