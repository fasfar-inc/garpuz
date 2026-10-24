"use client";

import type { Venture } from "@/content/ventures";
import { cn } from "@/lib/cn";
import { useStage, useStageValue } from "@/lib/stage/store";
import { ArrowRight } from "@/components/ui/icons";
import { VentureMark } from "./venture-mark";

type Props = { venture: Venture; index: number; className?: string };

/**
 * Glass venture card. Hovering or focusing it highlights the sculpture
 * component it is linked to (and vice versa), and registers its element so
 * the WebGL layer can draw a leader line to it.
 */
export function VentureCard({ venture, index, className }: Props) {
  const store = useStage();
  const active = useStageValue((s) => s.hovered === index, false);
  const capsName = venture.name === venture.name.toUpperCase();
  const number = String(index + 1).padStart(2, "0");

  const body = (
    <>
      <div className="flex items-start gap-3.5 md:gap-4">
        <VentureMark slug={venture.slug} name={venture.name} accent={venture.accent} className="h-8 w-8 shrink-0 tall:h-10 tall:w-10" />
        <div className="min-w-0">
          <h3 className={cn("truncate text-[15px] font-medium text-white tall:text-[18px]", capsName ? "tracking-[0.14em]" : "tracking-[-0.01em]")}>
            {venture.name}
          </h3>
          <p className="mt-0.5 truncate text-[11.5px] text-white/60 tall:text-[13.5px]">{venture.sector}</p>
        </div>
      </div>
      <div className="mt-5 hidden items-end justify-between gap-4 tall:flex">
        <p className="max-w-[24ch] text-[13.5px] leading-[1.45] text-white/78">{venture.tagline}</p>
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <span className="text-[17px] font-light text-white/70 tabular-nums">{number}</span>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border border-white/45 transition-[background-color,color,transform] duration-500",
              active ? "rotate-[-45deg] bg-white text-[#0b1330]" : "text-white",
            )}
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
      <span className="absolute right-3.5 top-3 text-[12px] font-light text-white/55 tabular-nums tall:hidden">{number}</span>
    </>
  );

  const shared = {
    ref: (el: HTMLElement | null) => store.attach("cards", index, el),
    onPointerEnter: () => store.setHovered(index),
    onPointerLeave: () => store.setHovered(null),
    onFocus: () => store.setHovered(index),
    onBlur: () => store.setHovered(null),
    "data-card": "",
    className: cn(
      "pointer-events-auto relative block rounded-[14px] border p-3.5 text-left backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-500 md:rounded-[16px] md:p-5 tall:p-6",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
      active
        ? "border-white/40 bg-white/[0.11] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_80px_-30px_rgba(255,190,140,0.35)]"
        : "border-white/[0.16] bg-white/[0.055] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]",
      className,
    ),
  };

  return venture.url ? (
    <a href={venture.url} target="_blank" rel="noreferrer" {...shared}>
      {body}
    </a>
  ) : (
    <article tabIndex={0} aria-label={`${venture.name}, ${venture.sector}`} {...shared}>
      {body}
    </article>
  );
}
