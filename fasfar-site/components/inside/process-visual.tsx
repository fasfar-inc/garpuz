import type { ProcessVisual as Kind } from "@/content/company";
import { cn } from "@/lib/cn";

/**
 * Abstract linework for each step of How we build, drawn in a 200×200 box.
 * Every stroke has pathLength=1, so a timeline draws or erases it with
 * strokeDashoffset 1 ↔ 0. Steps are separate groups (`data-pv`), so one
 * visual can morph from step to step, or a single step can be shown alone.
 * (No vector-effect: with non-scaling strokes, browsers ignore pathLength for dashes.)
 */
const STROKE = { fill: "none", stroke: "#141312", strokeWidth: 0.7, pathLength: 1, strokeDasharray: "1" };

function Create() {
  // An idea: a point, its field, and the axes it is measured against.
  return (
    <>
      <circle cx="100" cy="100" r="58" {...STROKE} />
      <circle cx="100" cy="100" r="30" {...STROKE} strokeOpacity={0.45} />
      <path d="M100 20 V180 M20 100 H180" {...STROKE} strokeOpacity={0.3} />
      <circle cx="100" cy="100" r="4" fill="#141312" data-pv-dot />
    </>
  );
}

function Build() {
  // Structure: a modular grid, assembled cell by cell.
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(<rect key={`${r}${c}`} x={46 + c * 38} y={46 + r * 38} width="32" height="32" {...STROKE} strokeOpacity={r === 1 && c === 1 ? 1 : 0.55} />);
  return (
    <>
      {cells}
      <path d="M30 170 H170" {...STROKE} />
    </>
  );
}

function Operate() {
  // Systems in motion: two linked rings and an orbit.
  return (
    <>
      <circle cx="80" cy="100" r="40" {...STROKE} />
      <circle cx="120" cy="100" r="40" {...STROKE} />
      <ellipse cx="100" cy="100" rx="82" ry="30" {...STROKE} strokeOpacity={0.4} transform="rotate(-18 100 100)" />
      <circle cx="100" cy="100" r="4" fill="#141312" data-pv-dot />
    </>
  );
}

function Grow() {
  // Growth: a rising profile and widening arcs.
  return (
    <>
      <path d="M30 160 H70 V130 H110 V96 H150 V54 H172" {...STROKE} />
      <path d="M30 160 A40 40 0 0 1 70 120" {...STROKE} strokeOpacity={0.4} />
      <path d="M30 160 A80 80 0 0 1 110 80" {...STROKE} strokeOpacity={0.3} />
      <path d="M30 160 A130 130 0 0 1 160 30" {...STROKE} strokeOpacity={0.2} />
      <circle cx="172" cy="54" r="4" fill="#141312" data-pv-dot />
    </>
  );
}

const SHAPES: Record<Kind, () => React.ReactNode> = { create: Create, build: Build, operate: Operate, grow: Grow };

export function ProcessVisual({ kinds, className }: { kinds: Kind[]; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("overflow-visible", className)} aria-hidden="true">
      {kinds.map((k) => {
        const Shape = SHAPES[k];
        return (
          <g key={k} data-pv={k}>
            <Shape />
          </g>
        );
      })}
    </svg>
  );
}
