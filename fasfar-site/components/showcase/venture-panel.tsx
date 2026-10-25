"use client";

import type { Venture } from "@/content/ventures";
import { cn } from "@/lib/cn";
import { useMagnetic } from "@/lib/motion/use-magnetic";
import { ArrowRight, ArrowUpRight } from "@/components/ui/icons";
import { VentureLogo } from "@/components/ventures/venture-logo";
import { VentureVisual } from "./visuals";

type Props = {
  venture: Venture;
  index: number;
  total: number;
  /** Surface colour above this panel; the vertical layout blends from it. */
  previousSurface: string;
  onExplore: (venture: Venture) => void;
};

/**
 * One venture: copy (eyebrow, name, description, actions) and its visual.
 * In the desktop sequence panels are stacked full-screen layers; on mobile
 * (and with reduced motion) they flow vertically, one screen each.
 */
export function VenturePanel({ venture, index, total, previousSurface, onExplore }: Props) {
  const { surface, ink } = venture.colors;
  const flip = index % 2 === 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <article
      data-venture-panel
      data-index={index}
      aria-labelledby={`venture-${venture.slug}`}
      className="relative min-h-svh overflow-hidden [background:var(--sv-surface)] group-data-[mode=cinematic]/showcase:absolute group-data-[mode=cinematic]/showcase:inset-0 group-data-[mode=cinematic]/showcase:min-h-0 group-data-[mode=stacked]/showcase:[background:linear-gradient(180deg,var(--sv-prev)_0,var(--sv-surface)_26svh)]"
      style={{ ["--sv-surface" as string]: surface, ["--sv-prev" as string]: previousSurface, color: ink, zIndex: index + 1 }}
    >
      <div
        data-panel-inner
        className={cn(
          "relative grid min-h-svh grid-cols-1 gap-y-6 px-5 pb-20 pt-28 [grid-template-areas:'head'_'visual'_'body'] md:h-full md:min-h-0 md:gap-x-[4vw] md:gap-y-0 md:px-[4.2vw] md:py-[13vh] group-data-[mode=stacked]/showcase:md:min-h-svh",
          flip
            ? "md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:[grid-template-areas:'visual_head'_'visual_body']"
            : "md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:[grid-template-areas:'head_visual'_'body_visual']",
          "md:grid-rows-[1fr_1fr]",
        )}
      >
        <header className="[grid-area:head] md:self-end">
          <p data-sv-copy className="eyebrow flex items-center gap-3" style={{ color: ink }}>
            <span className="tabular-nums opacity-80">
              {pad(index + 1)} / {pad(total)}
            </span>
            <span className="h-px w-6 bg-current opacity-40" />
            <span className="opacity-70">{venture.industry}</span>
          </p>
          <h3 id={`venture-${venture.slug}`} className="mt-4 overflow-hidden pb-[0.08em] [perspective:800px] md:mt-6">
            <span data-sv-name className="block origin-bottom text-[clamp(3rem,16vw,5.5rem)] font-medium leading-[0.92] tracking-[-0.05em] md:text-[min(7vw,12.5vh)]">
              <VentureLogo venture={venture} />
            </span>
          </h3>
        </header>

        <div className="relative h-[58svh] [grid-area:visual] md:h-auto md:self-stretch">
          <VentureVisual venture={venture} />
        </div>

        <div className="[grid-area:body] md:self-start md:pt-8">
          <p data-sv-copy className="max-w-[34ch] text-[16px] leading-[1.55] opacity-75 md:text-[clamp(16px,1.25vw,19px)]">
            {venture.description}
          </p>
          <div data-sv-copy className="mt-7 flex flex-wrap items-center gap-4 md:mt-9">
            <ExploreButton venture={venture} onExplore={onExplore} />
            {venture.url && (
              <a href={venture.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[14px] underline-offset-4 opacity-80 transition-opacity hover:underline hover:opacity-100">
                Visit website <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ExploreButton({ venture, onExplore }: { venture: Venture; onExplore: (v: Venture) => void }) {
  const magnet = useMagnetic<HTMLDivElement>({ strength: 0.3, radius: 60 });
  const { primary } = venture.colors;
  return (
    <div ref={magnet} className="w-fit">
      <button
        type="button"
        onClick={() => onExplore(venture)}
        aria-haspopup="dialog"
        className="group relative inline-flex h-[52px] items-center gap-5 overflow-hidden rounded-full pl-7 pr-2 text-[15px] tracking-[-0.01em] text-white focus-visible:outline-2 focus-visible:outline-offset-4"
        style={{ background: primary, outlineColor: primary }}
      >
        <span aria-hidden="true" className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-[320%]" />
        <span className="relative">Explore {venture.name}</span>
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white transition-transform duration-500 group-hover:rotate-[-45deg]" style={{ color: primary }}>
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
