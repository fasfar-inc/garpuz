"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { beyondAt } from "@/lib/stage/levels";
import { getBeyondFloaters } from "@/lib/stage/layout";
import { damp, easeOutCubic } from "@/lib/stage/math";
import { beyondPhases } from "@/lib/stage/phases";
import { useStage } from "@/lib/stage/store";
import { createPartGeometry } from "./sculpture/geometry";
import { createMaterials } from "./sculpture/materials";

const DEPTH = 9;

/**
 * Scene 3's floating pieces: chrome, pearl and glass forms from the sculpture's
 * own material set, flying into the gaps of the editorial layout. They live in
 * camera space, so their screen positions hold whatever the camera does.
 */
export function Floaters({ detail }: { detail: "high" | "low" }) {
  const store = useStage();
  const size = useThree((s) => s.size);
  const slots = useMemo(() => getBeyondFloaters(size.width, size.height), [size.width, size.height]);
  const materials = useMemo(() => createMaterials(), []);
  const geometries = useMemo(
    () =>
      slots.map((s) =>
        s.kind === "sphere"
          ? new THREE.SphereGeometry(1, detail === "high" ? 48 : 28, detail === "high" ? 32 : 18)
          : createPartGeometry(s.kind, 1, s.thickness ?? 0.3, detail),
      ),
    [slots, detail],
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(
    () => () =>
      Object.values(materials).forEach((m) => {
        m.roughnessMap?.dispose();
        m.dispose();
      }),
    [materials],
  );

  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame(({ camera, clock }, rawDt) => {
    const g = group.current;
    if (!g) return;
    g.visible = store.outro > beyondPhases.floatersIn[0] - 0.02;
    if (!g.visible) return;

    const dt = Math.min(rawDt, 1 / 20);
    const still = store.reducedMotion;
    const idle = still ? 0 : 1;
    const t = clock.elapsedTime;
    pointer.current.x = still ? 0 : damp(pointer.current.x, store.pointer.x, 3, dt);
    pointer.current.y = still ? 0 : damp(pointer.current.y, store.pointer.y, 3, dt);

    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);
    const cam = camera as THREE.PerspectiveCamera;
    const halfH = DEPTH * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const halfW = halfH * cam.aspect;

    slots.forEach((s, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const k = easeOutCubic(beyondAt(store, s.enter));
      mesh.visible = k > 0.001;
      if (!mesh.visible) return;
      const away = 1 - k;
      const bob = Math.sin(t * 0.7 + i * 1.7) * 0.025 * halfH * idle;
      mesh.position.set(
        (s.x - 0.5) * 2 * halfW + s.from[0] * 2 * halfH * away - pointer.current.x * s.pull * 0.06 * halfH,
        (0.5 - s.y) * 2 * halfH + s.from[1] * 2 * halfH * -away + bob + pointer.current.y * s.pull * 0.05 * halfH,
        -DEPTH,
      );
      mesh.rotation.set(
        s.rotation[0] + away * 1.4 + pointer.current.y * 0.15 * s.pull,
        s.rotation[1] + away * 2.2 + t * 0.12 * idle + pointer.current.x * 0.2 * s.pull,
        s.rotation[2] - away * 0.8 + Math.sin(t * 0.4 + i) * 0.05 * idle,
      );
      mesh.scale.setScalar(s.size * 2 * halfH * (0.55 + 0.45 * k));
    });
  });

  return (
    <group ref={group} visible={false}>
      {slots.map((s, i) => (
        <mesh
          key={`${s.kind}-${i}`}
          ref={(el) => void (meshes.current[i] = el)}
          geometry={geometries[i]}
          material={materials[s.material]}
          renderOrder={s.material === "glass" ? 2 : 0}
        />
      ))}
    </group>
  );
}
