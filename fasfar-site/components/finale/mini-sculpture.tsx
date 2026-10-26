import { useId } from "react";
import { orbiters, sculptureParts } from "@/components/three/sculpture/parts";
import { cn } from "@/lib/cn";

/**
 * A small drawing of the signature sculpture, generated from the same part
 * list as the 3D one (parts.ts), so the two always match. SVG rather than
 * another WebGL canvas. Inside a `group` parent, hovering or focusing the
 * parent lets the components part gently, as they did in Scene 2.
 */
export function MiniSculpture({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const parts = [...sculptureParts].sort((a, b) => a.assembled.position[1] - b.assembled.position[1]);
  return (
    <svg viewBox="-2.6 -2.7 5.2 5.4" className={cn("overflow-visible", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5d6372" />
          <stop offset="0.28" stopColor="#f4f6fb" />
          <stop offset="0.52" stopColor="#9aa1b2" />
          <stop offset="0.78" stopColor="#e8ebf2" />
          <stop offset="1" stopColor="#4a4f5c" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#b9bfcc" />
        </linearGradient>
        <radialGradient id={`${id}-pearl`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fffaf2" />
          <stop offset="0.55" stopColor="#e6dccd" />
          <stop offset="1" stopColor="#9c8f7f" />
        </radialGradient>
        <radialGradient id={`${id}-sphere`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#b8bdc8" />
          <stop offset="1" stopColor="#3b3f49" />
        </radialGradient>
      </defs>
      <g transform="rotate(-18)">
        {parts.map((part) => {
          const [x, y] = part.assembled.position;
          const r = part.radius * (part.assembled.scale ?? 1);
          const ry = r * 0.27;
          const flipped = part.assembled.rotation[0] > 1;
          // Components part along the stack on hover, outer ones furthest.
          const spread = -y * 0.32;
          const style = { ["--spread" as string]: `${spread}px` };
          let shape;
          if (part.kind === "ring") {
            shape = <ellipse rx={r} ry={ry} fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={0.045} />;
          } else if (part.kind === "lens") {
            const h = ry + part.thickness * 0.42 * (part.assembled.scale ?? 1);
            shape = (
              <>
                <ellipse rx={r} ry={h} fill={part.material === "pearl" ? `url(#${id}-pearl)` : "rgba(255,255,255,0.12)"} stroke={part.material === "glass" ? "rgba(255,255,255,0.6)" : "none"} strokeWidth={0.03} />
                <ellipse rx={r * 0.62} ry={h * 0.32} cy={-h * 0.35} fill="#ffffff" opacity={0.28} />
              </>
            );
          } else {
            const depth = ry + part.thickness * 0.9;
            shape = (
              <g transform={flipped ? "scale(1,-1)" : undefined}>
                <path d={`M${-r} 0 A${r} ${depth} 0 0 0 ${r} 0 Z`} fill={`url(#${id}-chrome)`} />
                <ellipse rx={r} ry={ry} fill={`url(#${id}-rim)`} opacity={0.9} />
                <ellipse rx={r * 0.8} ry={ry * 0.7} fill="#20242f" opacity={0.35} />
              </g>
            );
          }
          return (
            <g key={part.id} transform={`translate(${x} ${-y})`}>
              <g style={style} className="mini-part">
                {shape}
              </g>
            </g>
          );
        })}
        {orbiters.map((o, i) => (
          <g key={i} transform={`translate(${o.assembled[0]} ${-o.assembled[1]})`}>
            <g style={{ ["--spread" as string]: `${-o.assembled[1] * 0.4}px` }} className="mini-part">
              <circle r={o.radius * 1.15} fill={`url(#${id}-sphere)`} />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
