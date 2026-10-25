"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";
import { enabledCategories, network, type OpportunityCategory } from "@/content/connection";
import { cn } from "@/lib/cn";
import { ArrowUpRight } from "@/components/ui/icons";
import { CONDITIONS, CONNECTION_PRIORITY, type Conditions } from "@/components/inside/motion";
import { OpportunityPanel } from "./opportunity-panel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const pad = (n: number) => String(n).padStart(2, "0");

/** Desktop constellation box. Destinations are spread around FASFAR from data, so any count works. */
const BOX = { w: 1000, h: 620 };
const C = { x: BOX.w / 2, y: BOX.h / 2 };

type Point = { x: number; y: number };
type Link = { from: Point; c1: Point; c2: Point; to: Point };

const bezier = (l: Link, t: number): Point => {
  const u = 1 - t;
  const f = (a: number, b: number, c: number, d: number) => u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  return { x: f(l.from.x, l.c1.x, l.c2.x, l.to.x), y: f(l.from.y, l.c1.y, l.c2.y, l.to.y) };
};

/**
 * Lay destinations on a wide ellipse, starting upper-left and going round.
 * Links leave the centre at a swirl (rotated control points), so the whole
 * reads as a gesture rather than an org chart.
 */
const layout = enabledCategories.map((category, i, all) => {
  const n = all.length;
  const angle = (-150 + (360 / n) * i) * (Math.PI / 180);
  const to = { x: C.x + Math.cos(angle) * 380, y: C.y + Math.sin(angle) * 215 };
  const swirl = 0.7;
  const dx = to.x - C.x;
  const dy = to.y - C.y;
  const c1 = { x: C.x + (dx * Math.cos(swirl) - dy * Math.sin(swirl)) * 0.45, y: C.y + (dx * Math.sin(swirl) + dy * Math.cos(swirl)) * 0.45 };
  const c2 = { x: to.x - dx * 0.3 + dy * 0.12, y: to.y - dy * 0.3 - dx * 0.08 };
  const link: Link = { from: C, c1, c2, to };
  return {
    category,
    link,
    d: `M${C.x} ${C.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`,
    relays: [0.38, 0.7].map((t) => bezier(link, t)),
    side: to.x < C.x - 40 ? "left" : to.x > C.x + 40 ? "right" : "center",
    below: to.y > C.y,
  };
});

/**
 * Part 2 — the interactive network. Desktop: a constellation with FASFAR at
 * the centre; hover or focus a destination to light its connection, click
 * to open its panel. Mobile: a vertical path with large tap targets.
 */
export function ConnectionNetwork() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState<{ category: OpportunityCategory; index: number } | null>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();
      mm.add(CONDITIONS, (ctx) => {
        const { reduced, cinematic } = ctx.conditions as Conditions;
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 75%", end: "center 55%", scrub: reduced ? true : 0.6, refreshPriority: CONNECTION_PRIORITY.network } })
          .fromTo(q("[data-cn=copy]"), { autoAlpha: 0, y: reduced ? 0 : 20 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.3 }, 0)
          .fromTo(q("[data-cn=orbit]"), { autoAlpha: 0, scale: reduced ? 1 : 0.8, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, stagger: 0.08, duration: 0.5 }, 0.05)
          .fromTo(q("[data-cn=center]"), { autoAlpha: 0, scale: reduced ? 1 : 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, 0.1)
          .fromTo(q("[data-cn=link]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.1, duration: 0.5, ease: "power2.inOut" }, 0.25)
          .fromTo(q("[data-cn=relay]"), { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, stagger: 0.05, duration: 0.15, transformOrigin: "50% 50%" }, 0.45)
          .fromTo(q("[data-cn=dest]"), { autoAlpha: 0, y: reduced ? 0 : 24 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.3, ease: "power2.out" }, 0.55)
          .fromTo(q("[data-cn=spine]"), { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: "power2.out" }, 0.1)
          .fromTo(q("[data-cn=row]"), { autoAlpha: 0, x: reduced ? 0 : 24 }, { autoAlpha: 1, x: 0, stagger: 0.12, duration: 0.3, ease: "power2.out" }, 0.3);

        // Soft depth: the threads drift less than the type as the cursor moves.
        if (cinematic && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          const scene = el.querySelector<HTMLElement>("[data-cn=scene]");
          const back = gsap.utils.toArray<HTMLElement>("[data-depth]", el);
          if (scene && back.length) {
            const movers = back.map((layer) => ({
              x: gsap.quickTo(layer, "x", { duration: 1.1, ease: "power3.out" }),
              y: gsap.quickTo(layer, "y", { duration: 1.1, ease: "power3.out" }),
              depth: Number(layer.dataset.depth),
            }));
            const onMove = (e: PointerEvent) => {
              const r = scene.getBoundingClientRect();
              const nx = (e.clientX - r.left) / r.width - 0.5;
              const ny = (e.clientY - r.top) / r.height - 0.5;
              movers.forEach((m) => {
                m.x(nx * m.depth);
                m.y(ny * m.depth * 0.7);
              });
            };
            const onLeave = () => movers.forEach((m) => (m.x(0), m.y(0)));
            scene.addEventListener("pointermove", onMove);
            scene.addEventListener("pointerleave", onLeave);
            return () => {
              scene.removeEventListener("pointermove", onMove);
              scene.removeEventListener("pointerleave", onLeave);
            };
          }
        }
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const openPanel = (category: OpportunityCategory, index: number) => setOpen({ category, index });
  const dim = (id: string) => active !== null && active !== id;

  return (
    <div ref={root} id="connect-network" className="relative overflow-x-clip px-5 py-24 md:px-[4.2vw] md:py-28">
      <div className="flex items-end justify-between gap-6">
        <p data-cn="copy" className="eyebrow">
          {network.eyebrow}
        </p>
        <p data-cn="copy" className="eyebrow hidden md:block">
          {network.hint}
        </p>
      </div>

      {/* Desktop constellation. */}
      <div
        data-cn="scene"
        className="relative mx-auto mt-6 hidden aspect-[1000/620] w-full max-w-[1240px] md:block"
        onPointerLeave={() => setActive(null)}
      >
        <div data-depth="14" className="absolute inset-0">
          <svg viewBox={`0 0 ${BOX.w} ${BOX.h}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs>
              <radialGradient id="cn-metal" cx="35%" cy="30%" r="75%">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.3" stopColor="#dcdcdf" />
                <stop offset="0.65" stopColor="#7d7f86" />
                <stop offset="1" stopColor="#2d2e33" />
              </radialGradient>
              <radialGradient id="cn-glow">
                <stop offset="0" stopColor="#ffd6a6" stopOpacity="0.85" />
                <stop offset="1" stopColor="#ffd6a6" stopOpacity="0" />
              </radialGradient>
            </defs>
            {[150, 250, 340].map((r, i) => (
              <ellipse key={r} data-cn="orbit" cx={C.x} cy={C.y} rx={r * 1.15} ry={r * 0.62} fill="none" stroke="#141312" strokeOpacity={0.09 - i * 0.02} strokeDasharray={i === 1 ? "2 7" : undefined} transform={`rotate(${-8 + i * 6} ${C.x} ${C.y})`} />
            ))}
            {layout.map(({ category, d, relays, link }) => {
              const on = active === category.id;
              return (
                <g key={category.id} className="transition-opacity duration-500" opacity={dim(category.id) ? 0.18 : 1}>
                  <path data-cn="link" d={d} fill="none" stroke="#141312" strokeOpacity={on ? 0.9 : 0.35} strokeWidth={on ? 1.6 : 1} pathLength={1} strokeDasharray="1" className="transition-[stroke-opacity,stroke-width] duration-500" />
                  {/* The illuminated connection: a warm stroke over the line and a light travelling along it. */}
                  <path d={d} fill="none" stroke="#e9b77f" strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={on ? 0 : 1} opacity={on ? 0.55 : 0} className="transition-[stroke-dashoffset,opacity] duration-700 ease-out" />
                  <path d={d} fill="none" stroke="#fff3e0" strokeWidth={3.5} strokeLinecap="round" pathLength={1} strokeDasharray="0.03 0.97" opacity={on ? 1 : 0.45} className="motion-safe:animate-[link-pulse_3.6s_linear_infinite] transition-opacity duration-500" />
                  {relays.map((p, k) => (
                    // Outer group: scroll entrance (GSAP). Inner group: hover response (CSS).
                    <g key={k} data-cn="relay">
                      <g className="transition-transform duration-500" style={{ transformOrigin: `${p.x}px ${p.y}px`, transform: on ? "scale(1.8)" : "scale(1)" }}>
                        <circle cx={p.x} cy={p.y} r={10} fill="url(#cn-glow)" opacity={on ? 1 : 0} className="transition-opacity duration-500" />
                        <circle cx={p.x} cy={p.y} r={2.4} fill={on ? "#e9b77f" : "#141312"} fillOpacity={on ? 1 : 0.45} className="transition-[fill,fill-opacity] duration-500" />
                      </g>
                    </g>
                  ))}
                  <circle cx={link.to.x} cy={link.to.y} r={on ? 18 : 0} fill="url(#cn-glow)" className="transition-[r] duration-500" />
                  <circle cx={link.to.x} cy={link.to.y} r={6} fill="url(#cn-metal)" />
                </g>
              );
            })}
          </svg>
        </div>

        <div data-depth="6" className="absolute inset-0">
          <div
            data-cn="center"
            className="absolute left-1/2 top-1/2 flex aspect-square w-[13%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-[radial-gradient(circle_at_32%_26%,#ffffff,#ece7df_45%,#cfc8bc_100%)] shadow-[inset_0_1px_0_#fff,inset_0_-10px_24px_rgba(20,19,18,0.12),0_30px_60px_-28px_rgba(20,19,18,0.55)]"
          >
            <span className="absolute inset-[-14%] rounded-full border border-[#141312]/10 motion-safe:animate-[spin_40s_linear_infinite] [border-top-color:rgba(233,183,127,0.9)]" aria-hidden="true" />
            <span className="text-[clamp(12px,1.25vw,18px)] font-medium tracking-[0.2em] text-[#141312]">{network.center}</span>
          </div>
        </div>

        <div data-depth="-10" className="absolute inset-0">
          {layout.map(({ category, link, side, below }, i) => {
            const on = active === category.id;
            return (
              <button
                key={category.id}
                type="button"
                data-cn="dest"
                aria-haspopup="dialog"
                onPointerEnter={() => setActive(category.id)}
                onFocus={() => setActive(category.id)}
                onBlur={() => setActive(null)}
                onClick={() => openPanel(category, i)}
                className={cn(
                  "group absolute p-3 text-left transition-opacity duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141312]",
                  // Side labels sit near the screen edges, so they get a narrower measure.
                  side === "left" && "w-[min(24vw,340px)] -translate-x-[95%] text-right",
                  side === "right" && "w-[min(21vw,300px)] -translate-x-[5%]",
                  side === "center" && "w-[min(28vw,380px)] -translate-x-1/2 text-center",
                  below ? "translate-y-[10%]" : "-translate-y-[110%]",
                  dim(category.id) && "opacity-40",
                )}
                style={{ left: `${(link.to.x / BOX.w) * 100}%`, top: `${(link.to.y / BOX.h) * 100}%` }}
              >
                <span className="eyebrow tabular-nums">{pad(i + 1)}</span>
                <span
                  className={cn(
                    "mt-2 block text-[clamp(20px,2.3vw,34px)] font-medium leading-[1.05] text-[#141312] transition-[letter-spacing] duration-500 ease-out",
                    on ? "tracking-[0.02em]" : "tracking-[-0.02em]",
                  )}
                >
                  {category.title}
                </span>
                <span className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-out", on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <span className="overflow-hidden">
                    <span className="mt-3 block text-[14px] leading-[1.5] text-[#141312]/70">{category.summary}</span>
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#141312]/30 transition-[opacity,transform] duration-500",
                    on ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                  )}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </span>
                <span className="sr-only">. {category.summary} Opens details.</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile path: FASFAR at the top, each destination a large tap target on the thread. */}
      <div className="mt-10 md:hidden">
        <div data-cn="center" className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/80 bg-[radial-gradient(circle_at_32%_26%,#ffffff,#ece7df_45%,#cfc8bc_100%)] shadow-[0_24px_40px_-24px_rgba(20,19,18,0.55)]">
          <span className="text-[13px] font-medium tracking-[0.2em]">{network.center}</span>
        </div>
        <div className="relative mt-4">
          <span data-cn="spine" aria-hidden="true" className="absolute bottom-10 left-1/2 top-0 w-px origin-top -translate-x-1/2 bg-[linear-gradient(180deg,#141312_0%,rgba(20,19,18,0.25)_100%)]" />
          <ul className="relative space-y-4 pt-10">
            {enabledCategories.map((category, i) => (
              <li key={category.id} data-cn="row">
                <span aria-hidden="true" className="mx-auto mb-4 block h-3 w-3 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#9a9ca2_55%,#3a3b40)] shadow-[0_0_0_6px_rgba(233,183,127,0.25)]" />
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => openPanel(category, i)}
                  className="flex w-full items-center gap-4 rounded-[1.4rem] border border-[#141312]/12 bg-[#f7f4ee]/90 px-5 py-5 text-left shadow-[0_20px_40px_-32px_rgba(20,19,18,0.6)] backdrop-blur-sm transition-transform active:scale-[0.98]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow tabular-nums">{pad(i + 1)}</span>
                    <span className="mt-1.5 block text-[22px] font-medium leading-[1.05] tracking-[-0.02em] text-[#141312]">{category.title}</span>
                    <span className="mt-2 block text-[14px] leading-[1.45] text-[#141312]/65">{category.summary}</span>
                  </span>
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141312] text-[#f4f1eb]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <OpportunityPanel category={open?.category ?? null} index={open?.index ?? 0} onClose={() => setOpen(null)} />
    </div>
  );
}
