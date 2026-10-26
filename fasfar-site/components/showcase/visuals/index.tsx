"use client";

import type { ComponentType } from "react";
import type { ShowcaseVisual, Venture } from "@/content/ventures";
import { useTilt } from "@/lib/motion/use-tilt";
import { VentureLogo } from "@/components/ventures/venture-logo";
import { AutomationVisual } from "./automation";
import { CommerceVisual } from "./commerce";
import { HospitalityVisual } from "./hospitality";
import { MobilityVisual } from "./mobility";

const visuals: Record<ShowcaseVisual, ComponentType<{ venture: Venture }>> = {
  mobility: MobilityVisual,
  commerce: CommerceVisual,
  hospitality: HospitalityVisual,
  automation: AutomationVisual,
};

/** The bespoke visual for a venture, or a brand-coloured generic one for new ventures. */
export function VentureVisual({ venture }: { venture: Venture }) {
  const Visual = visuals[venture.visual] ?? GenericVisual;
  return <Visual venture={venture} />;
}

function GenericVisual({ venture }: { venture: Venture }) {
  const tilt = useTilt<HTMLDivElement>();
  const { primary, secondary } = venture.colors;
  return (
    <div className="relative flex h-full w-full items-center justify-center [perspective:1400px]">
      <div ref={tilt} className="[transform-style:preserve-3d]">
        <div data-sv="rig" className="flex aspect-square w-[min(22rem,70vw)] items-center justify-center rounded-[2.5rem] text-[clamp(2rem,5vw,3.5rem)] font-medium shadow-[0_50px_100px_-40px_rgba(0,0,0,0.5)]" style={{ background: `linear-gradient(140deg, ${primary}, ${secondary})`, color: venture.colors.surface }}>
          <VentureLogo venture={venture} />
        </div>
      </div>
    </div>
  );
}
