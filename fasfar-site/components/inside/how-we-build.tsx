"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { howWeBuild } from "@/content/company";
import { cn } from "@/lib/cn";
import { HLine, VLine } from "./lines";
import { CONDITIONS, PRIORITY, type Conditions } from "./motion";
import { ProcessVisual } from "./process-visual";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const steps = howWeBuild.steps;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Per-step composition: where the architectural lines sit (% of width /
 * height), where the metal sphere rests in the visual, and the tint of the
 * background accent. One entry per step; add one with a new step.
 */
const layouts = [
  { v: [8, 38, 62, 92], h: 30, sphere: { x: 50, y: 50, s: 0.55 }, accent: { x: 72, y: 30, c: "rgba(232,214,190,0.55)" } },
  { v: [8, 30, 66, 92], h: 66, sphere: { x: 82, y: 18, s: 0.8 }, accent: { x: 30, y: 70, c: "rgba(214,220,232,0.6)" } },
  { v: [8, 46, 58, 92], h: 40, sphere: { x: 26, y: 78, s: 0.7 }, accent: { x: 78, y: 72, c: "rgba(224,206,196,0.55)" } },
  { v: [8, 22, 74, 92], h: 74, sphere: { x: 86, y: 26, s: 1 }, accent: { x: 50, y: 24, c: "rgba(236,222,196,0.6)" } },
];
const layoutAt = (i: number) => layouts[i % layouts.length];

/**
 * Part 2 — How we build. On desktop a pinned sequence: the giant word swaps
 * through masks, the lines re-organise, the linework redraws and the
 * description follows, one step per unit of scroll. On mobile and with
 * reduced motion, the same content as a vertical progression.
 */
export function HowWeBuild() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add(CONDITIONS, (ctx) => {
        const { cinematic, reduced } = ctx.conditions as Conditions;
        el.dataset.mode = cinematic ? "cinematic" : "stacked";

        if (cinematic) {
          const stage = el.querySelector<HTMLElement>("[data-hb-stage]")!;
          const q = gsap.utils.selector(stage);
          const words = q("[data-hb-word]");
          const nums = q("[data-hb-num]");
          const descs = q("[data-hb-desc]");
          const groups = steps.map((s) => stage.querySelectorAll(`[data-pv="${s.visual}"] [stroke]`));
          const dots = steps.map((s) => stage.querySelectorAll(`[data-pv="${s.visual}"] [data-pv-dot]`));
          const vlines = q("[data-line=v]");
          const hline = q("[data-line=h]")[0];

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () => `+=${window.innerHeight * 0.9 * steps.length}`,
              pin: true,
              scrub: 0.7,
              invalidateOnRefresh: true,
              refreshPriority: PRIORITY.process,
            },
          });
          tl.set({}, {}, steps.length);

          // Opening state: the first step draws in as the pin begins.
          const first = layoutAt(0);
          gsap.set([...words.slice(1), ...nums.slice(1)], { yPercent: 110 });
          gsap.set(descs.slice(1), { autoAlpha: 0, y: 24 });
          gsap.set(groups.slice(1).flatMap((g) => [...g]), { strokeDashoffset: 1 });
          gsap.set(dots.slice(1).flatMap((d) => [...d]), { autoAlpha: 0 });
          vlines.forEach((l, k) => gsap.set(l, { left: `${first.v[k]}%` }));
          gsap.set(hline, { top: `${first.h}%` });
          gsap.set(q("[data-hb-sphere]"), { left: `${first.sphere.x}%`, top: `${first.sphere.y}%`, scale: first.sphere.s });
          gsap.set(q("[data-hb-accent]"), { left: `${first.accent.x}%`, top: `${first.accent.y}%`, backgroundColor: first.accent.c });
          tl.fromTo(groups[0], { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.03, duration: 0.3, ease: "power2.out" }, 0)
            .fromTo(dots[0], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.2);

          steps.forEach((_, i) => {
            if (i === 0) return;
            const at = i - 0.25;
            const d = 0.5;
            const L = layoutAt(i);
            tl.to(words[i - 1], { yPercent: -110, duration: d * 0.8, ease: "power3.in" }, at)
              .to(words[i], { yPercent: 0, duration: d * 0.8, ease: "power3.out" }, at + d * 0.35)
              .to(nums[i - 1], { yPercent: -110, duration: d * 0.5, ease: "power2.in" }, at)
              .to(nums[i], { yPercent: 0, duration: d * 0.5, ease: "power2.out" }, at + d * 0.3)
              .to(descs[i - 1], { autoAlpha: 0, y: -18, duration: d * 0.4 }, at)
              .to(descs[i], { autoAlpha: 1, y: 0, duration: d * 0.5, ease: "power2.out" }, at + d * 0.5)
              .to(groups[i - 1], { strokeDashoffset: 1, stagger: 0.02, duration: d * 0.5, ease: "power2.in" }, at)
              .to(dots[i - 1], { autoAlpha: 0, duration: d * 0.2 }, at)
              .to(groups[i], { strokeDashoffset: 0, stagger: 0.03, duration: d * 0.7, ease: "power2.out" }, at + d * 0.4)
              .to(dots[i], { autoAlpha: 1, duration: d * 0.2 }, at + d * 0.8)
              .to(hline, { top: `${L.h}%`, duration: d, ease: "power2.inOut" }, at)
              .to(q("[data-hb-sphere]"), { left: `${L.sphere.x}%`, top: `${L.sphere.y}%`, scale: L.sphere.s, duration: d, ease: "power2.inOut" }, at)
              .to(q("[data-hb-accent]"), { left: `${L.accent.x}%`, top: `${L.accent.y}%`, backgroundColor: L.accent.c, duration: d, ease: "power1.inOut" }, at)
              .to(q("[data-hb-glass]"), { rotation: i * 6 - 6, xPercent: (i % 2 ? 1 : -1) * 6, duration: d, ease: "power2.inOut" }, at)
              .to(q("[data-hb-progress]"), { scaleY: (i + 1) / steps.length, duration: d, ease: "power2.inOut" }, at);
            vlines.forEach((l, k) => tl.to(l, { left: `${L.v[k]}%`, duration: d, ease: "power3.inOut" }, at));
          });
        } else {
          // Vertical progression: each step draws in as it scrolls into view.
          el.querySelectorAll<HTMLElement>("[data-hb-item]").forEach((item) => {
            const q = gsap.utils.selector(item);
            gsap
              .timeline({ scrollTrigger: { trigger: item, start: "top 85%", end: "top 35%", scrub: reduced ? true : 0.5, refreshPriority: PRIORITY.process } })
              .fromTo(q("[data-line]"), { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.out" }, 0)
              .fromTo(q("[data-hb-word]"), { yPercent: reduced ? 0 : 110, autoAlpha: reduced ? 0 : 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, 0.05)
              .fromTo(q("[stroke]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.04, duration: 0.5, ease: "power2.out" }, 0.15)
              .fromTo(q("[data-hb-desc]"), { autoAlpha: 0, y: reduced ? 0 : 16 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.35);
          });
        }
        return () => {
          el.dataset.mode = "stacked";
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} id="how-we-build" data-mode="stacked" className="group/hb relative">
      {/* Desktop: one pinned composition. */}
      <div data-hb-stage aria-hidden="true" className="relative hidden h-svh overflow-hidden group-data-[mode=cinematic]/hb:block">
        <span data-hb-accent className="absolute h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-3xl" />
        {layoutAt(0).v.map((_, k) => (
          <VLine key={k} left="0%" />
        ))}
        <HLine top="30%" />

        <p className="eyebrow absolute left-[4.2vw] top-[15%] flex items-center gap-3">
          <span className="relative inline-block h-[1.45em] overflow-hidden tabular-nums">
            {steps.map((s, i) => (
              <span key={s.id} data-hb-num className={cn("block", i > 0 && "absolute inset-x-0 top-0")}>
                {pad(i + 1)}
              </span>
            ))}
          </span>
          <span>/ {pad(steps.length)}</span>
          <span className="h-px w-5 bg-current opacity-60" />
          {howWeBuild.eyebrow}
        </p>

        <div className="absolute left-[4.2vw] top-1/2 -translate-y-1/2">
          <div className="relative overflow-hidden pb-[0.04em] text-[min(12.5vw,22vh)] font-medium leading-[0.9] tracking-[-0.055em] text-[#141312]">
            {steps.map((s, i) => (
              <span key={s.id} data-hb-word className={cn("block whitespace-nowrap", i > 0 && "absolute left-0 top-0")}>
                {s.title}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute right-[4.2vw] top-1/2 w-[min(30vw,46vh)] -translate-y-[58%]">
          <div className="relative aspect-square">
            <span data-hb-glass className="absolute inset-[8%] rounded-[32px] border border-white/70 bg-[linear-gradient(140deg,rgba(255,255,255,0.7),rgba(255,255,255,0.12)_50%,rgba(203,196,186,0.3))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm" />
            <ProcessVisual kinds={steps.map((s) => s.visual)} className="absolute inset-0 h-full w-full" />
            <span
              data-hb-sphere
              className="absolute h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#d9d9dc_18%,#7b7d84_48%,#2b2c30_72%,#a3a5ab_100%)] shadow-[0_18px_30px_-12px_rgba(20,19,18,0.45)]"
            />
          </div>
          <div className="relative mt-8 min-h-[3.2em] text-[clamp(16px,1.35vw,20px)] leading-[1.45] text-[#141312]/75">
            {steps.map((s, i) => (
              <p key={s.id} data-hb-desc className={cn(i > 0 && "absolute inset-x-0 top-0")}>
                {s.description}
              </p>
            ))}
          </div>
        </div>

        <div className="absolute bottom-[12%] left-[4.2vw] top-[30%] w-px bg-[#141312]/10">
          <span data-hb-progress className="absolute inset-0 origin-top bg-[#141312]" style={{ transform: `scaleY(${1 / steps.length})` }} />
        </div>
      </div>

      {/* Mobile, reduced motion and assistive tech: the readable list. */}
      <ol className="px-5 py-20 group-data-[mode=cinematic]/hb:sr-only md:px-[4.2vw]">
        <li className="eyebrow mb-10">{howWeBuild.eyebrow}</li>
        {steps.map((s, i) => (
          <li key={s.id} data-hb-item className="relative grid grid-cols-[1fr_auto] items-end gap-x-6 border-t border-transparent pb-14 pt-8">
            <span data-line="h" aria-hidden="true" className="absolute inset-x-0 top-0 h-px origin-left bg-[#141312]/20" />
            <div>
              <p className="eyebrow tabular-nums">
                {pad(i + 1)} / {pad(steps.length)}
              </p>
              <h3 className="mt-4 overflow-hidden pb-[0.04em]">
                <span data-hb-word className="block text-[17vw] font-medium leading-[0.9] tracking-[-0.055em] text-[#141312] md:text-[9vw]">
                  {s.title}
                </span>
              </h3>
              <p data-hb-desc className="mt-4 max-w-[30ch] text-[16px] leading-[1.5] text-[#141312]/70">
                {s.description}
              </p>
            </div>
            <ProcessVisual kinds={[s.visual]} className="h-20 w-20 md:h-32 md:w-32 [&_[stroke]]:[stroke-width:1.6]" />
          </li>
        ))}
      </ol>
    </div>
  );
}
