"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * The FASFAR studio light: procedural softboxes and strips (no HDR download)
 * that give the chrome and glass their reflections. Shared by every canvas
 * so the sculpture looks the same wherever it appears.
 */
export function StudioEnvironment() {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={["#5f5c58"]} />
      <Lightformer form="rect" intensity={3.2} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
      <Lightformer form="rect" intensity={2.2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[14, 1.4, 1]} />
      <Lightformer form="rect" intensity={1.8} position={[6, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[14, 0.9, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[0, 0.5, 9]} scale={[7, 2.4, 1]} />
      <Lightformer form="rect" intensity={0.35} color="#1d1d22" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
      <Lightformer form="ring" intensity={2.4} color="#ffd6ab" position={[3.5, -2.5, 5]} scale={2.6} />
    </Environment>
  );
}
