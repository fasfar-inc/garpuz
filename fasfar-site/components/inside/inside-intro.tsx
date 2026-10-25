"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { insideIntro } from "@/content/company";
import { HLine, Mark, MaskedChars, VLine } from "./lines";
import { CONDITIONS, PRIORITY, type Conditions } from "./motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Part 1: the cinematic atmosphere gives way to a drafting table. Fine lines
 * draw across the ivory, then INSIDE FASFAR rises letter by letter and
 * ONE COMPANY. / ENDLESS POSSIBILITIES. follow. Pinned briefly on desktop;
 * a normal scroll-through on mobile and with reduced motion.
 */
export function InsideIntro() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();
      mm.add(CONDITIONS, (ctx) => {
        const { cinematic, reduced } = ctx.conditions as Conditions;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: cinematic
            ? { trigger: el, start: "top top", end: "+=120%", pin: true, scrub: 0.7, refreshPriority: PRIORITY.intro }
            : { trigger: el, start: "top 85%", end: "bottom 70%", scrub: reduced ? true : 0.6, refreshPriority: PRIORITY.intro },
        });
        tl.fromTo(q("[data-line=h]"), { scaleX: 0 }, { scaleX: 1, stagger: 0.04, duration: 0.3, ease: "power2.inOut" }, 0)
          .fromTo(q("[data-line=v]"), { scaleY: 0 }, { scaleY: 1, stagger: 0.04, duration: 0.3, ease: "power2.inOut" }, 0.05)
          .fromTo(q("[data-mark]"), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, stagger: 0.03, duration: 0.12 }, 0.25)
          .fromTo(q("[data-ii=eyebrow]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.2)
          .fromTo(
            q("[data-ii-char]"),
            { yPercent: reduced ? 0 : 110, autoAlpha: reduced ? 0 : 1 },
            { yPercent: 0, autoAlpha: 1, stagger: 0.018, duration: 0.3, ease: "power3.out" },
            0.25,
          )
          .fromTo(
            q("[data-ii=line]"),
            { yPercent: reduced ? 0 : 110, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, stagger: 0.12, duration: 0.3, ease: "power3.out" },
            0.62,
          )
          .fromTo(q("[data-ii=glass]"), { autoAlpha: 0, rotation: -8, scale: 0.9 }, { autoAlpha: 1, rotation: 0, scale: 1, duration: 0.5, ease: "power2.out" }, 0.35);
        tl.set({}, {}, 1.1);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const [first, second] = insideIntro.title;
  return (
    <div ref={root} className="relative flex min-h-svh flex-col justify-center overflow-hidden px-5 py-28 md:px-[4.2vw]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <HLine top="18%" />
        <HLine top="78%" />
        <VLine left="4.2vw" className="hidden md:block" />
        <VLine left="50%" className="hidden md:block" />
        <VLine left="calc(100% - 4.2vw)" className="hidden md:block" />
        <Mark top="18%" left="50%" />
        <Mark top="78%" left="50%" />
        {/* A glass pane catching the light — the one material accent here. */}
        <span
          data-ii="glass"
          className="absolute right-[6%] top-[22%] hidden aspect-[3/4] w-[min(18vw,260px)] rounded-[28px] border border-white/70 bg-[linear-gradient(140deg,rgba(255,255,255,0.75),rgba(255,255,255,0.15)_45%,rgba(203,196,186,0.35))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_40px_80px_-40px_rgba(20,19,18,0.35)] backdrop-blur-md md:block"
        />
      </div>

      <p data-ii="eyebrow" className="eyebrow relative flex items-center gap-3">
        <span className="tabular-nums">06</span>
        <span className="h-px w-5 bg-current opacity-60" />
        {insideIntro.eyebrow}
      </p>
      <h2 aria-label={insideIntro.title.join(" ")} className="relative mt-6 text-[19vw] font-medium leading-[0.86] tracking-[-0.055em] text-[#141312] md:mt-8 md:text-[min(13.5vw,24vh)]">
        <MaskedChars text={first} charAttr="data-ii-char" className="block" />
        <MaskedChars text={second} charAttr="data-ii-char" className="block md:ml-[0.9em]" />
      </h2>
      <div className="relative mt-10 md:ml-auto md:mt-14 md:w-[46%]">
        {insideIntro.lines.map((line, i) => (
          <span key={line} className="block overflow-hidden pb-[0.06em]">
            <span data-ii="line" className={`block text-[clamp(1.6rem,7.4vw,2.2rem)] leading-[1.05] tracking-[-0.04em] text-[#141312] md:text-[clamp(2rem,3.6vw,3.6rem)] ${i ? "font-medium" : "font-light"}`}>
              {line}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
