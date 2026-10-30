"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { DustField } from "@/lib/engine/DustField";

export function Dust({ count, fov }: { count: number; fov: number }) {
  const dust = useMemo(() => new DustField(count), [count]);
  useEffect(() => () => dust.dispose(), [dust]);

  useFrame((state) => {
    dust.update(state.clock.elapsedTime, (state.size.height * state.viewport.dpr) / (2 * Math.tan((fov * Math.PI) / 360)));
  });

  return <points geometry={dust.geometry} material={dust.material} frustumCulled={false} renderOrder={-1} />;
}
