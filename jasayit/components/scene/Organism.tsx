"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, Vector2, Vector3, type Group } from "three";
import type { OrganismController } from "@/lib/engine/controller";
import { ParticleEngine } from "@/lib/engine/ParticleEngine";

interface Props {
  controller: OrganismController;
  count: number;
  reducedMotion: boolean;
}

const TAP_MAX_MS = 280;
const TAP_MAX_MOVE = 10;

/** The living particle body: owns the engine, user gestures, and per-frame animation. */
export function Organism({ controller, count, reducedMotion }: Props) {
  const engine = useMemo(() => new ParticleEngine({ count, reducedMotion }), [count]); // eslint-disable-line react-hooks/exhaustive-deps
  const group = useRef<Group>(null);
  const { gl, camera } = useThree();

  // Mutable gesture state lives in a ref: gestures never cause React renders.
  const motion = useRef({
    yaw: 0,
    spin: 0,
    pitch: 0,
    yawVelocity: 0,
    pitchVelocity: 0,
    zoom: 1,
    zoomTarget: 1,
    hover: new Vector2(),
    hovering: false,
    pointerWorld: new Vector3(99, 99, 99),
    pointerStrength: 0,
    typing: 0,
  });

  useEffect(() => {
    controller.attach(engine);
    return () => {
      controller.detach(engine);
      engine.dispose();
    };
  }, [controller, engine]);

  useEffect(() => engine.setReducedMotion(reducedMotion), [engine, reducedMotion]);

  useEffect(() => {
    const el = gl.domElement;
    const m = motion.current;
    const pointers = new Map<number, { x: number; y: number }>();
    let drag: { x: number; y: number; startX: number; startY: number; time: number; moved: number } | null = null;
    let pinch: { distance: number; zoom: number } | null = null;

    const setHover = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      m.hover.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      m.hovering = true;
    };
    const spread = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      setHover(e);
      if (pointers.size === 1) {
        drag = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, time: performance.now(), moved: 0 };
      } else if (pointers.size === 2) {
        drag = null;
        pinch = { distance: spread(), zoom: m.zoomTarget };
      }
    };
    const onMove = (e: PointerEvent) => {
      setHover(e);
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size >= 2) {
        m.zoomTarget = MathUtils.clamp((pinch.zoom * spread()) / Math.max(pinch.distance, 1), 0.65, 1.7);
      } else if (drag) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.x = e.clientX;
        drag.y = e.clientY;
        drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY));
        m.yaw += dx * 0.0075;
        m.pitch = MathUtils.clamp(m.pitch + dy * 0.0055, -0.9, 0.9);
        m.yawVelocity = dx * 0.45;
        m.pitchVelocity = dy * 0.3;
      }
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (drag && pointers.size === 0) {
        if (drag.moved < TAP_MAX_MOVE && performance.now() - drag.time < TAP_MAX_MS) controller.poke();
      }
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) drag = null;
      if (e.pointerType !== "mouse") m.hovering = false;
    };
    const onLeave = () => {
      m.hovering = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      m.zoomTarget = MathUtils.clamp(m.zoomTarget * Math.exp(-e.deltaY * 0.0012), 0.65, 1.7);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, controller]);

  const ray = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const m = motion.current;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const calm = reducedMotion ? 0.25 : 1;
    m.typing += (controller.typing - m.typing) * (1 - Math.exp(-dt * 4));

    // The shapeless body spins; a finished object sways around its best angle so flat forms
    // (fish, heart, pizza) never sit edge-on for long. Drags add on top with inertia.
    if (engine.current === "self") {
      m.spin += 0.16 * calm * dt;
    } else {
      const turn = Math.PI * 2;
      const target = Math.round(m.spin / turn) * turn + Math.sin(t * 0.32) * 0.55 * calm;
      m.spin += (target - m.spin) * (1 - Math.exp(-dt * 0.9));
    }
    m.yaw += m.yawVelocity * dt;
    m.pitch += m.pitchVelocity * dt;
    m.yawVelocity *= Math.exp(-dt * 2.2);
    m.pitchVelocity *= Math.exp(-dt * 2.2);
    // Lean slightly toward the chat while someone is typing; otherwise settle upright.
    const lean = m.typing * 0.16;
    m.pitch += (lean - m.pitch) * (1 - Math.exp(-dt * 0.8));
    m.pitch = MathUtils.clamp(m.pitch, -0.9, 0.9);
    m.zoom += (m.zoomTarget - m.zoom) * (1 - Math.exp(-dt * 6));

    g.rotation.set(m.pitch + Math.sin(t * 0.31) * 0.05 * calm, m.yaw + m.spin, Math.sin(t * 0.37) * 0.04 * calm);
    g.position.y = Math.sin(t * 0.6) * 0.07 * calm;
    g.scale.setScalar(m.zoom * (1 + m.typing * 0.035));

    // Project the pointer onto the z = 0 plane for gentle repulsion.
    if (m.hovering) {
      ray.set(m.hover.x, m.hover.y, 0.5).unproject(camera).sub(camera.position).normalize();
      const k = -camera.position.z / ray.z;
      m.pointerWorld.copy(camera.position).addScaledVector(ray, k);
    }
    m.pointerStrength += ((m.hovering ? 1 : 0) - m.pointerStrength) * (1 - Math.exp(-dt * 4));

    engine.update(dt, t, {
      energy: Math.max(m.typing * 0.55, controller.thinking ? 1 : 0),
      swirlBoost: controller.thinking ? 1 : m.typing * 0.3,
      pointer: m.pointerWorld,
      pointerStrength: m.pointerStrength,
    });
  });

  return (
    <group ref={group}>
      <points geometry={engine.geometry} material={engine.material} frustumCulled={false} />
    </group>
  );
}
