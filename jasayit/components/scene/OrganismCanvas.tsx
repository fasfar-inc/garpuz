"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { OrganismController } from "@/lib/engine/controller";
import type { DeviceProfile } from "@/lib/engine/device";
import { Dust } from "./Dust";
import { Organism } from "./Organism";

const FOV = 38;
/** Radius (world units) that must stay visible, including transition flourishes. */
const SUBJECT_RADIUS = 1.6;

interface Props {
  controller: OrganismController;
  profile: DeviceProfile;
  reducedMotion: boolean;
}

export default function OrganismCanvas({ controller, profile, reducedMotion }: Props) {
  return (
    <Canvas
      dpr={[1, profile.maxDpr]}
      flat
      linear
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 0, 7] }}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false, depth: false }}
      onCreated={({ gl }) => {
        gl.setClearColor("#000000", 1);
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          controller.setVisualsUnavailable(true);
        });
        canvas.addEventListener("webglcontextrestored", () => controller.setVisualsUnavailable(false));
      }}
    >
      <CameraRig controller={controller} />
      <Dust count={profile.mobile ? 700 : 1400} fov={FOV} />
      <Organism controller={controller} count={profile.particles} reducedMotion={reducedMotion} />
      <PerformanceGovernor controller={controller} maxDpr={profile.maxDpr} />
    </Canvas>
  );
}

/**
 * Keeps the organism centred in the part of the screen not covered by UI and sized so it
 * never hides behind the chat, on any aspect ratio. Runs per frame without React renders.
 */
function CameraRig({ controller }: { controller: OrganismController }) {
  const last = useRef({ key: "", engine: null as unknown });
  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    const { width, height } = state.size;
    const { top, bottom } = controller.insets;
    const key = `${width}x${height}:${top}:${bottom}:${state.viewport.dpr}`;
    if (key === last.current.key && controller.engine === last.current.engine) return;
    last.current = { key, engine: controller.engine };

    const freeHeight = Math.max(height - top - bottom, height * 0.4);
    const tan = Math.tan((FOV * Math.PI) / 360);
    const fitPixels = Math.min(freeHeight, width) * 0.86;
    const distance = Math.min(16, Math.max(4.6, (SUBJECT_RADIUS * height) / (tan * fitPixels)));
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    const centerOffset = (top - bottom) / 2;
    camera.setViewOffset(width, height, 0, -centerOffset, width, height);
    camera.updateProjectionMatrix();

    const scale = (height * state.viewport.dpr) / (2 * tan);
    controller.engine?.setViewport(scale, distance);
  });
  return null;
}

/** Trades resolution, then particle count, for frame rate on struggling devices. */
function PerformanceGovernor({ controller, maxDpr }: { controller: OrganismController; maxDpr: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const initialDpr = useThree((s) => s.viewport.initialDpr);
  const stats = useRef({ frames: 0, elapsed: 0, dpr: Math.min(maxDpr, initialDpr), drawFraction: 1, warmup: 2 });

  useFrame((_, delta) => {
    const s = stats.current;
    if (delta > 0.25) return; // tab switch or hitch; not representative
    if (s.warmup > 0) {
      s.warmup -= delta;
      return;
    }
    s.frames++;
    s.elapsed += delta;
    if (s.elapsed < 1.5) return;
    const fps = s.frames / s.elapsed;
    s.frames = 0;
    s.elapsed = 0;
    if (fps >= 50) return;
    if (s.dpr > 1.01) {
      s.dpr = Math.max(1, s.dpr - 0.35);
      setDpr(s.dpr);
    } else if (s.drawFraction > 0.35 && controller.engine) {
      s.drawFraction *= 0.8;
      controller.engine.setDrawCount(controller.engine.count * s.drawFraction);
    }
  });
  return null;
}
