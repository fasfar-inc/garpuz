"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { structure, type StructureGroup, type StructureItem } from "@/content/company";
import type { Venture } from "@/content/ventures";
import { cn } from "@/lib/cn";
import { ArrowRight } from "@/components/ui/icons";
import { VentureDetails } from "@/components/showcase/venture-details";
import { CONDITIONS, PRIORITY, type Conditions } from "./motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const groups = structure.groups.filter((g) => g.items.length > 0);

type Placed = { item: StructureItem; group: StructureGroup; ring: number; x: number; y: number };

/** The diagram's box: wider than tall, scaled uniformly (no distorted strokes). */
const BOX = { w: 115, h: 100 };
const C = { x: BOX.w / 2, y: BOX.h / 2 };
const ringRadius = (ring: number) => (groups.length === 1 ? 33 : 22 + ring * (20 / Math.max(1, groups.length - 1)));

/**
 * Lay groups out on concentric rings around the centre: the first group on
 * the inner ring, later groups further out, each ring's nodes spread evenly
 * and offset so they never line up with the ring inside.
 */
function placeNodes(): Placed[] {
  const placed: Placed[] = [];
  groups.forEach((group, ring) => {
    const r = ringRadius(ring);
    const n = group.items.length;
    const offset = n === 4 && ring === 0 ? Math.PI / 4 : -Math.PI / 2 + ring * 0.4;
    group.items.forEach((item, i) => {
      const a = offset + (i / n) * Math.PI * 2;
      placed.push({ item, group, ring, x: C.x + Math.cos(a) * r * 1.2, y: C.y + Math.sin(a) * r });
    });
  });
  return placed;
}
const nodes = placeNodes();

/** Gentle S-curve from the centre to a node. */
const curve = (x: number, y: number) => `M${C.x} ${C.y} C ${C.x + (x - C.x) * 0.5} ${C.y}, ${x - (x - C.x) * 0.15} ${y}, ${x} ${y}`;
const pct = (x: number, y: number) => ({ left: `${(x / BOX.w) * 100}%`, top: `${(y / BOX.h) * 100}%` });

/**
 * Part 3 — The FASFAR structure: FASFAR at the centre, connected to the
 * ventures and platforms it develops. Informational, not a showcase: hover
 * to trace a connection, click for the venture's details. On mobile, a
 * vertical tree with expandable entries.
 */
export function CompanyStructure() {
  const root = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<Venture | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();
      mm.add(CONDITIONS, (ctx) => {
        const { reduced } = ctx.conditions as Conditions;
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 75%", end: "center 55%", scrub: reduced ? true : 0.6, refreshPriority: PRIORITY.structure } })
          .fromTo(q("[data-st=copy]"), { autoAlpha: 0, y: reduced ? 0 : 24 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.4 }, 0)
          .fromTo(q("[data-st=ring]"), { autoAlpha: 0, scale: reduced ? 1 : 0.85 }, { autoAlpha: 1, scale: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" }, 0.1)
          .fromTo(q("[data-st=center]"), { autoAlpha: 0, scale: reduced ? 1 : 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" }, 0.15)
          .fromTo(q("[data-st=link]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.06, duration: 0.5, ease: "power2.inOut" }, 0.3)
          .fromTo(q("[data-st=node]"), { autoAlpha: 0, y: reduced ? 0 : 14 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.35, ease: "power2.out" }, 0.45)
          .fromTo(q("[data-st=tree]"), { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: "power2.out" }, 0.2);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const activate = (item: StructureItem) => item.venture && setSelected(item.venture);

  return (
    <div ref={root} id="structure" className="relative px-5 py-24 md:px-[4.2vw] md:py-32">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:items-center md:gap-[4vw]">
        <div>
          <p data-st="copy" className="eyebrow">
            {structure.eyebrow}
          </p>
          <h2 data-st="copy" className="mt-6 text-[clamp(2.3rem,10vw,3.2rem)] font-light leading-[1] tracking-[-0.05em] text-[#141312] md:text-[clamp(2.6rem,4.2vw,4.4rem)]">
            {structure.title.map((line, i) => (
              <span key={line} className={cn("block", i === 1 && "font-medium")}>
                {line}
              </span>
            ))}
          </h2>
          <p data-st="copy" className="mt-6 max-w-[38ch] text-[15px] leading-[1.6] text-[#141312]/70 md:text-[clamp(15px,1.15vw,17px)]">
            {structure.body}
          </p>
          <ul data-st="copy" className="mt-8 hidden space-y-2 md:block">
            {groups.map((g, ring) => (
              <li key={g.id} className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-[#141312]/55">
                <span className="inline-block h-px w-6 bg-current" style={{ opacity: 1 - ring * 0.3 }} />
                {g.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop diagram. */}
        <div className="relative mx-auto hidden aspect-[1.15/1] w-full max-w-[820px] md:block" onPointerLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${BOX.w} ${BOX.h}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            {groups.map((g, ring) => (
              <ellipse key={g.id} data-st="ring" cx={C.x} cy={C.y} rx={ringRadius(ring) * 1.2} ry={ringRadius(ring)} fill="none" stroke="#141312" strokeWidth={0.12} strokeOpacity={0.18} strokeDasharray="0.5 0.9" />
            ))}
            <circle data-st="ring" cx={C.x} cy={C.y} r={11.5} fill="none" stroke="#141312" strokeWidth={0.12} strokeOpacity={0.2} />
            {nodes.map(({ item, x, y }) => (
              <g key={item.id}>
                <path
                  data-st="link"
                  d={curve(x, y)}
                  fill="none"
                  stroke="#141312"
                  strokeWidth={hover === item.id ? 0.24 : 0.14}
                  strokeOpacity={hover === null ? 0.45 : hover === item.id ? 1 : 0.12}
                  pathLength={1}
                  strokeDasharray="1"
                  className="transition-[stroke-opacity,stroke-width] duration-500"
                />
                {/* A slow pulse travelling outward along each link. */}
                <path d={curve(x, y)} fill="none" stroke={item.venture?.colors.primary ?? "#141312"} strokeWidth={0.4} strokeLinecap="round" strokeOpacity={hover === null || hover === item.id ? 0.8 : 0} pathLength={1} strokeDasharray="0.03 0.97" className="motion-safe:animate-[link-pulse_4.5s_linear_infinite] transition-[stroke-opacity] duration-500" />
              </g>
            ))}
          </svg>

          <div data-st="center" className="absolute left-1/2 top-1/2 flex aspect-square w-[19%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/80 bg-[radial-gradient(circle_at_30%_25%,#ffffff,#ebe6de_55%,#d9d2c6)] text-center shadow-[inset_0_1px_0_#fff,0_30px_60px_-30px_rgba(20,19,18,0.45)]">
            <span className="text-[clamp(14px,1.5vw,22px)] font-medium tracking-[0.18em] text-[#141312]">{structure.center.name}</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#141312]/55">{structure.center.detail}</span>
          </div>

          {nodes.map(({ item, group, x, y }) => (
            <button
              key={item.id}
              type="button"
              data-st="node"
              onPointerEnter={() => setHover(item.id)}
              onFocus={() => setHover(item.id)}
              onBlur={() => setHover(null)}
              onClick={() => activate(item)}
              aria-haspopup={item.venture ? "dialog" : undefined}
              aria-label={`${item.name}, ${item.detail}. ${group.label}`}
              className={cn(
                "group absolute w-[clamp(150px,14vw,190px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-[#f7f4ee]/85 p-4 text-left backdrop-blur-md transition-[border-color,box-shadow,transform,opacity] duration-500",
                "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141312]",
                hover === item.id ? "scale-[1.04] border-[#141312]/40 shadow-[0_24px_50px_-28px_rgba(20,19,18,0.5)]" : "border-[#141312]/12",
                hover !== null && hover !== item.id && "opacity-55",
              )}
              style={pct(x, y)}
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.venture?.colors.primary ?? "#141312" }} />
                <span className="truncate text-[15px] font-medium tracking-[-0.01em] text-[#141312]">{item.name}</span>
              </span>
              <span className="mt-1 block text-[11.5px] leading-[1.35] text-[#141312]/60">{item.detail}</span>
              <span className="mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[#141312]/0 transition-colors duration-300 group-hover:text-[#141312]/70 group-focus-visible:text-[#141312]/70">
                Details <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>

        {/* Mobile tree. */}
        <div className="relative md:hidden">
          <div data-st="center" className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[radial-gradient(circle_at_30%_25%,#ffffff,#ebe6de_55%,#d9d2c6)] text-[10px] font-medium tracking-[0.16em] text-[#141312] shadow-[0_16px_30px_-18px_rgba(20,19,18,0.5)]">
              {structure.center.name.slice(0, 2)}
            </span>
            <span>
              <span className="block text-[17px] font-medium tracking-[0.16em] text-[#141312]">{structure.center.name}</span>
              <span className="block text-[11px] uppercase tracking-[0.2em] text-[#141312]/55">{structure.center.detail}</span>
            </span>
          </div>
          <div className="relative ml-7 mt-2 border-l border-transparent pl-6">
            <span data-st="tree" aria-hidden="true" className="absolute bottom-6 left-0 top-0 w-px origin-top bg-[#141312]/25" />
            {groups.map((g) => (
              <div key={g.id} className="pt-6">
                <p className="eyebrow">{g.label}</p>
                <ul className="mt-3 space-y-2">
                  {g.items.map((item) => {
                    const isOpen = open === item.id;
                    const panelId = `${baseId}-${item.id}`;
                    return (
                      <li key={item.id} data-st="node" className="relative">
                        <span aria-hidden="true" className="absolute -left-6 top-7 h-px w-5 bg-[#141312]/25" />
                        <div className="rounded-2xl border border-[#141312]/12 bg-[#f7f4ee]/80">
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() => setOpen(isOpen ? null : item.id)}
                            className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.venture?.colors.primary ?? "#141312" }} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[16px] font-medium text-[#141312]">{item.name}</span>
                              <span className="block truncate text-[12px] text-[#141312]/60">{item.detail}</span>
                            </span>
                            <span aria-hidden="true" className={cn("relative h-4 w-4 shrink-0 transition-transform duration-300", isOpen && "rotate-45")}>
                              <span className="absolute left-0 top-1/2 h-px w-4 bg-[#141312]" />
                              <span className="absolute left-1/2 top-0 h-4 w-px bg-[#141312]" />
                            </span>
                          </button>
                          <div id={panelId} hidden={!isOpen} className="px-4 pb-4 pl-9">
                            {item.summary && <p className="text-[14px] leading-[1.55] text-[#141312]/70">{item.summary}</p>}
                            {item.venture ? (
                              <button type="button" onClick={() => activate(item)} aria-haspopup="dialog" className="mt-3 inline-flex min-h-11 items-center gap-2 text-[13px] font-medium text-[#141312] underline-offset-4 hover:underline">
                                View details <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              item.href && (
                                <Link href={item.href} className="mt-3 inline-flex min-h-11 items-center gap-2 text-[13px] font-medium text-[#141312]">
                                  Open <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <VentureDetails venture={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
