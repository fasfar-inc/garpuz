"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getStageLayout } from "@/lib/stage/layout";
import { damp, easeInOutCubic, lerp, smoothstep } from "@/lib/stage/math";
import { beyondPhases, phases } from "@/lib/stage/phases";
import { useStage } from "@/lib/stage/store";

const HERO = new THREE.Vector3(0, 0.15, 14);
const ECOSYSTEM = new THREE.Vector3(-2.7, 1.5, 12.6);
const BEYOND = new THREE.Vector3(0.8, -0.6, 13.4);
const target = new THREE.Vector3();

/**
 * Scroll-driven camera. It swings round and dollies in through the
 * transition, while a view offset keeps the sculpture where the responsive
 * layout wants it on screen.
 */
export function CameraRig() {
  const store = useStage();
  const size = useThree((s) => s.size);
  const layout = useMemo(() => getStageLayout(size.width, size.height), [size.width, size.height]);
  const smooth = useRef({ p: 0, o: 0, px: 0, py: 0 });

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const s = smooth.current;
    const still = store.reducedMotion;
    const raw = smoothstep(phases.camera[0], phases.camera[1], store.progress);
    s.p = still ? raw : damp(s.p, raw, 6, dt);
    s.px = still ? 0 : damp(s.px, store.pointer.x, 2.5, dt);
    s.py = still ? 0 : damp(s.py, store.pointer.y, 2.5, dt);
    const rawOutro = smoothstep(beyondPhases.camera[0], beyondPhases.camera[1], store.outro);
    s.o = still ? rawOutro : damp(s.o, rawOutro, 6, dt);
    const p = easeInOutCubic(s.p);
    const o = easeInOutCubic(s.o);
    const swing = Math.sin(p * Math.PI);
    const drift = Math.sin(o * Math.PI);

    camera.position.lerpVectors(HERO, ECOSYSTEM, p).lerp(BEYOND, o);
    camera.position.x += -1.4 * swing + 1.2 * drift + s.px * 0.45;
    camera.position.y += 0.4 * swing + s.py * 0.3;
    camera.position.z -= 1.3 * swing + 0.9 * drift;
    camera.lookAt(target.set(0, 0, 0));
    camera.rotateZ(lerp(lerp(0, -0.045, p), 0, o));

    // Scene 3 recentres the projection so the editorial floaters sit in plain screen space.
    const cam = camera as THREE.PerspectiveCamera;
    const x = lerp(lerp(layout.hero.x, layout.ecosystem.x, p), 0.5, o);
    const y = lerp(lerp(layout.hero.y, layout.ecosystem.y, p), 0.5, o);
    const { width: w, height: h } = size;
    cam.setViewOffset(w, h, (0.5 - x) * w, (0.5 - y) * h, w, h);
    cam.fov = lerp(30, 32, swing) + drift * 1.5;
    cam.updateProjectionMatrix();
  });

  return null;
}
