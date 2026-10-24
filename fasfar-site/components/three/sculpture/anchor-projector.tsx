"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { featuredVentures } from "@/content/ventures";
import { damp } from "@/lib/stage/math";
import { phases } from "@/lib/stage/phases";
import { useStage } from "@/lib/stage/store";
import { sculptureParts } from "./parts";

const RIM_SAMPLES = 20;
const point = new THREE.Vector3();

/** Rim points (part-local) a leader line may attach to, per sculpture part. */
const rims = sculptureParts.map((part) => {
  const y = part.kind === "bowl" ? part.thickness / 2 : 0;
  const r = part.radius * 0.94;
  return Array.from({ length: RIM_SAMPLES }, (_, i) => {
    const a = (i / RIM_SAMPLES) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
  });
});

const partIndexFor = featuredVentures.map((v) => sculptureParts.findIndex((p) => p.id === v.anchor));

/**
 * Projects each venture's sculpture component to screen space every frame
 * and bends the SVG leader line from its card to the rim point nearest that
 * card, so the lines stay attached as the sculpture floats, separates and
 * reacts to the pointer.
 *
 * Call it after the sculpture's own `useFrame` so it projects this frame's
 * poses (subscription order is call order).
 */
export function useAnchorProjector(parts: RefObject<(THREE.Group | null)[]>, enabled: boolean) {
  const store = useStage();
  const smoothed = useRef(featuredVentures.map(() => ({ x: 0, y: 0, init: false })));

  useFrame(({ camera, gl }, dt) => {
    if (!enabled || store.progress < phases.cardsIn[0] - 0.02) return;
    const host = gl.domElement.getBoundingClientRect();
    // World matrices are refreshed during render, after useFrame. Update them
    // now so on-demand frames (reduced motion) never project stale poses.
    camera.updateMatrixWorld();

    partIndexFor.forEach((partIndex, i) => {
      const group = partIndex >= 0 ? parts.current[partIndex] : null;
      const card = store.cards[i];
      const line = store.lines[i];
      if (!group || !card || !line) return;
      group.updateWorldMatrix(true, false);

      const r = card.getBoundingClientRect();
      const left = r.left - host.left;
      const top = r.top - host.top;
      const cardCenter = left + r.width / 2;

      // Card side faces the sculpture centre.
      group.getWorldPosition(point).project(camera);
      const fromRight = cardCenter < (point.x * 0.5 + 0.5) * host.width;
      const cx = fromRight ? left + r.width : left;
      const cy = top + r.height * (fromRight ? 0.18 : 0.42);

      let best = Infinity;
      let ax = 0;
      let ay = 0;
      for (const local of rims[partIndex]) {
        point.copy(local);
        group.localToWorld(point).project(camera);
        const x = (point.x * 0.5 + 0.5) * host.width;
        const y = (-point.y * 0.5 + 0.5) * host.height;
        const d = (x - cx) ** 2 + (y - cy) ** 2;
        if (d < best) {
          best = d;
          ax = x;
          ay = y;
        }
      }

      const s = smoothed.current[i];
      if (!s.init || store.reducedMotion) {
        s.x = ax;
        s.y = ay;
        s.init = true;
      } else {
        s.x = damp(s.x, ax, 12, dt);
        s.y = damp(s.y, ay, 12, dt);
      }

      const elbow = cx + (fromRight ? 1 : -1) * Math.min(56, Math.abs(s.x - cx) * 0.35);
      line.setAttribute("d", `M ${cx} ${cy} L ${elbow} ${cy} L ${s.x} ${s.y}`);
      store.cardDots[i]?.setAttribute("cx", String(cx));
      store.cardDots[i]?.setAttribute("cy", String(cy));
      store.anchorDots[i]?.setAttribute("cx", String(s.x));
      store.anchorDots[i]?.setAttribute("cy", String(s.y));
    });
  });
}
