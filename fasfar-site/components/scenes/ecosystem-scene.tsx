"use client";

import { ecosystem } from "@/content/site";
import { featuredVentures } from "@/content/ventures";
import { cn } from "@/lib/cn";
import { useStage, useStageValue } from "@/lib/stage/store";
import { VentureCard } from "@/components/ventures/venture-card";

/**
 * Desktop card slots, in registry order. They mirror the sculpture's anchor
 * points; add a slot when featuring more ventures.
 */
const slots = [
  "md:right-[3%] md:top-[25%] tall:right-[3.6%] tall:top-[21.5%]",
  "md:left-[3%] md:top-[50%] tall:left-[21.8%] tall:top-[45%]",
  "md:right-[3%] md:top-[55%] tall:right-[4%] tall:top-[52.5%]",
  "md:left-[3%] md:top-[66%] tall:left-[21%] tall:top-[64.5%]",
  "md:left-[3%] md:top-[88%] tall:left-[4%] tall:top-[80%]",
  "md:right-[3%] md:top-[80%] tall:right-[4%] tall:top-[76%]",
];

/** Scene 2 copy, venture cards and the leader lines the canvas bends. */
export function EcosystemScene() {
  const ventures = featuredVentures.slice(0, slots.length);
  return (
    <div className="pointer-events-none absolute inset-0">
      <LeaderLines count={ventures.length} />

      <div className="absolute left-5 top-[92px] md:left-[4.2vw] md:top-[13%]">
        <span data-eco="rise" className="invisible block h-px w-9 bg-(--ink)/60" />
        <p data-eco="rise" className="eyebrow invisible mt-4">
          {ecosystem.eyebrow}
        </p>
        <h2 className="mt-3 text-[clamp(2.3rem,10vw,3.1rem)] font-light leading-[0.98] tracking-[-0.05em] text-(--ink) md:mt-7 md:text-[clamp(3rem,5.6vw,5.6rem)]">
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-eco="line" className="invisible block text-white">
              {ecosystem.headline[0]}
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-eco="line" className="invisible block text-[#b9c5de]">
              {ecosystem.headline[1]}
            </span>
          </span>
        </h2>
        <p data-eco="rise" className="invisible mt-6 hidden max-w-[34ch] text-[clamp(15px,1.2vw,17.5px)] leading-[1.5] text-(--ink-muted) tall:block">
          {ecosystem.body}
        </p>
      </div>

      <div className="absolute inset-x-4 bottom-[92px] grid grid-cols-2 gap-2.5 md:inset-0 md:block">
        {ventures.map((venture, i) => (
          <div key={venture.slug} data-card-slot className={cn("invisible md:absolute md:w-[clamp(220px,25vw,260px)] tall:w-[clamp(232px,20vw,292px)]", slots[i])}>
            <VentureCard venture={venture} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderLines({ count }: { count: number }) {
  const store = useStage();
  const hovered = useStageValue((s) => s.hovered, null);
  return (
    <svg aria-hidden="true" className="absolute inset-0 hidden h-full w-full overflow-visible md:block">
      <defs>
        <filter id="anchor-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {Array.from({ length: count }, (_, i) => (
        <g key={i} data-leader className="invisible">
          <path
            ref={(el) => store.attach("lines", i, el)}
            data-leader-path
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset="1"
            fill="none"
            stroke={hovered === i ? "rgba(255,226,196,0.95)" : "rgba(214,224,246,0.5)"}
            strokeWidth={hovered === i ? 1.4 : 1}
            className="transition-[stroke,stroke-width] duration-300"
          />
          <circle ref={(el) => store.attach("cardDots", i, el)} r="3" fill="#ffd2a6" />
          <circle ref={(el) => store.attach("anchorDots", i, el)} r={hovered === i ? 5 : 3.6} fill="#ffe3c4" filter="url(#anchor-glow)" />
        </g>
      ))}
    </svg>
  );
}
