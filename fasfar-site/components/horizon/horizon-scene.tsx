"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { chapters, horizon } from "@/content/site";
import { ventures } from "@/content/ventures";
import { cn } from "@/lib/cn";
import { useMagnetic } from "@/lib/motion/use-magnetic";
import { useNear } from "@/lib/motion/use-near";
import { registerPalette } from "@/lib/stage/palette";
import { HORIZON_VH, horizonPhases as hp } from "@/lib/stage/phases";
import { StageContext } from "@/lib/stage/store";
import { IVORY_THEME, themeFromColors, type ThemeVars } from "@/lib/stage/theme";
import { ArrowUpRight } from "@/components/ui/icons";
import { CanvasBoundary, supportsWebGL } from "@/components/three/canvas-boundary";
import { createHorizonState } from "@/components/three/horizon/horizon-state";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HorizonCanvas = dynamic(() => import("@/components/three/horizon/horizon-canvas"), { ssr: false });

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const subscribeNever = () => () => {};
const CHAPTER = chapters.findIndex((c) => c.id === "horizon");

/** The night palette of the horizon: deeper than Scene 2's midnight. */
const HORIZON_NIGHT: ThemeVars = {
  "--ink": "#eef1f8",
  "--ink-muted": "rgba(222,229,244,0.66)",
  "--hairline": "rgba(222,229,244,0.14)",
  "--hairline-strong": "rgba(222,229,244,0.4)",
  "--paper": "#03050c",
};

/** The showcase hands over from whichever venture comes last. */
const lastSurface = ventures[ventures.length - 1]?.colors ?? { ink: "#141312", surface: "#f1ede6", primary: "#141312", secondary: "#141312" };

const span = (phase: readonly [number, number]) => phase[1] - phase[0];

/**
 * Scene 5 — The Horizon. A pinned, scrubbed sequence after the venture
 * showcase. Part 1: the showcase dissolves into night and a luminous horizon;
 * THE FUTURE ISN'T WAITING. / WE BUILD IT. Part 2: the signature sculpture
 * assembles from floating parts and lights up as the camera circles it.
 * Part 3: dawn — NO LIMITS. / NO BOUNDARIES. / JUST POSSIBILITIES.
 * Part 4: the company vision. Every beat scrubs in both directions.
 */
export function HorizonScene() {
  const store = useContext(StageContext);
  const section = useRef<HTMLElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const [state] = useState(createHorizonState);
  const [canvasReady, setCanvasReady] = useState(false);
  const [inView, setInView] = useState(false);
  const near = useNear(section);
  const webgl = useSyncExternalStore(subscribeNever, supportsWebGL, () => false);
  const reducedMotion = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);

  useEffect(() => state.setReducedMotion(reducedMotion), [state, reducedMotion]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      state.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [state]);

  useGSAP(
    () => {
      const sec = section.current!;
      const q = gsap.utils.selector(sec);
      const compact = window.matchMedia("(max-width: 767px)").matches;
      const reduced = reducedMotion;
      const theme: ThemeVars = { ...themeFromColors(lastSurface) };
      // This runs again when the reduced-motion preference resolves after hydration;
      // start each build from clean transforms so nothing from the previous one lingers.
      gsap.set(q("[data-hz-headline], [data-hz-s1], [data-hz-s2-track], [data-hz-s3]"), { clearProps: "transform,filter,letterSpacing" });

      // ── Arrival: the last venture dissolves into the night ──────────────
      const lastPanel = document.querySelector<HTMLElement>("[data-venture-panel]:last-of-type [data-panel-inner]");
      const arrival = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: true, refreshPriority: -2 },
      });
      if (lastPanel) arrival.to(lastPanel, { autoAlpha: 0, scale: reduced ? 1 : 0.94, filter: reduced ? "none" : "blur(10px)" }, 0);
      arrival
        .to(document.querySelectorAll('nav[aria-label="Ventures"]'), { autoAlpha: 0 }, 0)
        .fromTo(q("[data-hz-night]"), { autoAlpha: 0 }, { autoAlpha: 1, ease: "power1.in" }, 0)
        .to(theme, { ...HORIZON_NIGHT }, 0);

      // ── The pinned sequence ──────────────────────────────────────────────
      const vh = compact ? HORIZON_VH.compact : HORIZON_VH.desktop;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: view.current,
          start: "top top",
          end: () => `+=${window.innerHeight * vh}`,
          pin: true,
          scrub: reduced ? true : 0.8,
          invalidateOnRefresh: true,
          refreshPriority: -2,
          onToggle: (self) => setInView(self.isActive),
        },
        onUpdate: () => {
          state.progress = tl.progress();
          state.invalidate();
        },
      });
      tl.set({}, {}, 1);

      // Part 1 — the horizon, and the words.
      tl.fromTo(q("[data-hz-glow]"), { autoAlpha: 0, scaleX: 0.4 }, { autoAlpha: 1, scaleX: 1, duration: span(hp.atmosphere) * 1.6, ease: "power2.out" }, hp.atmosphere[0])
        .fromTo(
          q("[data-hz-tag]"),
          { yPercent: 110, autoAlpha: 0, filter: reduced ? "none" : "blur(8px)" },
          { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", stagger: span(hp.tagline) / 8, duration: span(hp.tagline) * 0.6, ease: "power3.out" },
          hp.tagline[0],
        )
        .fromTo(
          q("[data-hz-char]"),
          reduced ? { autoAlpha: 0 } : { yPercent: 120, rotationX: -70, autoAlpha: 0 },
          { yPercent: 0, rotationX: 0, autoAlpha: 1, stagger: span(hp.headline) / 22, duration: span(hp.headline) * 0.55, ease: "power3.out" },
          hp.headline[0],
        )
        .to(q("[data-hz-part1] [data-hz-tagline]"), { yPercent: -60, autoAlpha: 0, duration: span(hp.part1Out) * 0.7, ease: "power2.in" }, hp.part1Out[0])
        // WE BUILD IT. rushes past the camera as it travels forward.
        .to(
          q("[data-hz-headline]"),
          reduced ? { autoAlpha: 0, duration: span(hp.part1Out) } : { scale: 1.45, autoAlpha: 0, filter: "blur(14px)", duration: span(hp.part1Out), ease: "power2.in" },
          hp.part1Out[0],
        );

      // Part 3 — dawn, and the three statements (behind the sculpture).
      tl.to(q("[data-hz-glow]"), { autoAlpha: 0, duration: span(hp.dawn) }, hp.dawn[0])
        .fromTo(q("[data-hz-day]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: span(hp.dawn), ease: "power1.inOut" }, hp.dawn[0])
        .to(theme, { ...IVORY_THEME, duration: span(hp.dawn) }, hp.dawn[0]);

      const [s1, s2, s3] = hp.statements;
      // NO LIMITS. — tracking collapses from wide open to tight; leaves by rushing towards the camera.
      tl.fromTo(
        q("[data-hz-s1]"),
        reduced ? { autoAlpha: 0 } : { autoAlpha: 0, letterSpacing: "0.55em", yPercent: 30 },
        { autoAlpha: 1, letterSpacing: "-0.045em", yPercent: 0, duration: span(s1.in), ease: "power3.out" },
        s1.in[0],
      ).to(q("[data-hz-s1]"), reduced ? { autoAlpha: 0, duration: span(s1.out) } : { autoAlpha: 0, scale: 1.5, filter: "blur(10px)", duration: span(s1.out), ease: "power2.in" }, s1.out[0]);
      // NO BOUNDARIES. — wider than the screen, it travels straight through the frame.
      tl.fromTo(q("[data-hz-s2]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: span(s2.in) * 0.5 }, s2.in[0])
        .fromTo(q("[data-hz-s2-track]"), { xPercent: reduced ? 0 : 38 }, { xPercent: reduced ? 0 : -38, duration: s2.out[1] - s2.in[0] }, s2.in[0])
        .to(q("[data-hz-s2]"), { autoAlpha: 0, duration: span(s2.out) * 0.8 }, s2.out[0] + span(s2.out) * 0.2);
      // JUST POSSIBILITIES. — opens outward from the centre, then lifts away.
      tl.fromTo(q("[data-hz-s3-just]"), { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: span(s3.in) * 0.6, ease: "power3.out" }, s3.in[0])
        .fromTo(
          q("[data-hz-s3-word]"),
          reduced ? { autoAlpha: 0 } : { autoAlpha: 0, clipPath: "inset(0% 50% 0% 50%)", scale: 0.92 },
          { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: span(s3.in), ease: "power3.inOut" },
          s3.in[0] + span(s3.in) * 0.15,
        )
        .to(q("[data-hz-s3]"), reduced ? { autoAlpha: 0, duration: span(s3.out) } : { yPercent: -35, autoAlpha: 0, filter: "blur(8px)", duration: span(s3.out), ease: "power2.in" }, s3.out[0]);

      // Part 4 — the company vision.
      tl.fromTo(q("[data-hz-v=rise]"), { y: reduced ? 0 : 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.008, duration: span(hp.vision) * 0.4, ease: "power2.out" }, hp.vision[0])
        .fromTo(q("[data-hz-v=line]"), { yPercent: reduced ? 0 : 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.01, duration: span(hp.vision) * 0.5, ease: "power3.out" }, hp.vision[0] + 0.01)
        .fromTo(q("[data-hz-v=copy]"), { y: reduced ? 0 : 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.012, duration: span(hp.vision) * 0.5, ease: "power2.out" }, hp.vision[0] + 0.03);

      // Header: chapter and palette follow the scene.
      ScrollTrigger.create({
        trigger: sec,
        start: "top 55%",
        end: "bottom 45%",
        refreshPriority: -2,
        onEnter: () => store?.setChapter(CHAPTER),
        onEnterBack: () => store?.setChapter(CHAPTER),
        onLeaveBack: () => store?.setChapter(CHAPTER - 1),
      });
      const unregister = registerPalette({
        owns: () => {
          const a = arrival.scrollTrigger!;
          const m = tl.scrollTrigger!;
          const y = m.scroll();
          return y >= a.start && y <= m.end;
        },
        values: theme,
      });

      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      return unregister;
    },
    { scope: section, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return (
    <section ref={section} id="horizon" aria-label={horizon.eyebrow} className="relative">
      <div ref={view} className="relative h-svh overflow-hidden text-[#eef1f8]" style={{ background: lastSurface.surface }}>
        <Backdrop />

        <Statements />

        <div className="absolute inset-0 transition-opacity duration-[1400ms] ease-out" style={{ opacity: canvasReady ? 1 : 0 }}>
          {webgl && near && (
            <CanvasBoundary>
              <HorizonCanvas state={state} reducedMotion={reducedMotion} active={inView || near} onReady={() => setCanvasReady(true)} />
            </CanvasBoundary>
          )}
        </div>

        <PartOne />
        <Vision />
      </div>
    </section>
  );
}

/** Night sky, the horizon's atmospheric glow and the daylight it gives way to. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div data-hz-night className="invisible absolute inset-0 opacity-0 bg-[radial-gradient(120%_70%_at_50%_58%,#0b1430_0%,#060a18_45%,#020308_100%)]" />
      <div data-hz-glow className="invisible absolute inset-x-0 top-[50%] h-[44%] -translate-y-1/2 opacity-0 bg-[radial-gradient(60%_45%_at_50%_50%,rgba(125,156,255,0.22),rgba(125,156,255,0)_70%)]" />
      <div data-hz-day className="invisible absolute inset-0 opacity-0 bg-[radial-gradient(70%_60%_at_60%_40%,#fbf9f5_0%,#f1ede6_60%,#ebe5db_100%)]" />
    </div>
  );
}

/** THE FUTURE ISN'T WAITING. / WE BUILD IT. */
function PartOne() {
  const words = horizon.tagline.split(" ");
  const headline = horizon.headline.split(" ");
  return (
    <div data-hz-part1 className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
      <p data-hz-tagline aria-label={horizon.tagline} className="text-[12px] uppercase tracking-[0.42em] text-[#c9d6f2] md:text-[13px]">
        {words.map((w) => (
          <span key={w} aria-hidden="true" className="inline-block overflow-hidden pb-[0.1em] align-top [&:not(:last-child)]:mr-[0.5em]">
            <span data-hz-tag className="invisible inline-block">
              {w}
            </span>
          </span>
        ))}
      </p>
      <h2
        data-hz-headline
        aria-label={horizon.headline}
        className="mt-6 text-[17vw] font-medium leading-[0.9] tracking-[-0.05em] md:mt-8 md:text-[min(15vw,26vh)]"
      >
        <span aria-hidden="true" className="inline-block text-[#f4f6fc] [filter:drop-shadow(0_0_36px_rgba(125,156,255,0.4))]">
          {headline.map((word, wi) => (
            <span key={word} className="inline-block whitespace-nowrap [&:not(:last-child)]:mr-[0.25em]">
              {[...word].map((ch, ci) => (
                <span key={`${wi}-${ci}`} className="inline-block overflow-hidden pb-[0.05em] align-top [perspective:800px]">
                  <span data-hz-char className="invisible inline-block origin-bottom">
                    {ch}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </span>
      </h2>
    </div>
  );
}

const INK = "bg-[linear-gradient(180deg,#141312_38%,#6b625a_100%)] bg-clip-text text-transparent";

/** NO LIMITS. / NO BOUNDARIES. / JUST POSSIBILITIES. — beneath the canvas, so the sculpture floats in front. */
function Statements() {
  const [s1, s2, s3] = horizon.statements;
  const [just, ...rest] = s3.split(" ");
  return (
    <div aria-label={horizon.statements.join(" ")} role="group" className="pointer-events-none absolute inset-0 overflow-hidden">
      <p data-hz-s1 aria-hidden="true" className={cn("invisible absolute inset-x-0 top-[66%] -translate-y-1/2 md:top-[64%] whitespace-nowrap text-center text-[17vw] font-medium leading-none tracking-[-0.045em] md:text-[min(15vw,27vh)]", INK)}>
        {s1}
      </p>
      <div data-hz-s2 aria-hidden="true" className="invisible absolute inset-x-0 top-[66%] flex -translate-y-1/2 justify-center md:top-[64%]">
        <p data-hz-s2-track className={cn("whitespace-nowrap text-[24vw] font-medium leading-none tracking-[-0.05em] md:text-[min(17vw,30vh)]", INK)}>
          {s2}
        </p>
      </div>
      <div data-hz-s3 aria-hidden="true" className="absolute inset-x-0 top-[66%] -translate-y-1/2 text-center md:top-[63%]">
        <span className="block overflow-hidden">
          <span data-hz-s3-just className="invisible block text-[7vw] font-light tracking-[0.3em] text-[#141312]/70 md:text-[min(3.4vw,6vh)]">
            {just}
          </span>
        </span>
        <span data-hz-s3-word className={cn("invisible mt-2 block whitespace-nowrap text-[11vw] font-medium leading-[0.95] tracking-[-0.05em] md:text-[min(10.4vw,19vh)]", INK)}>
          {rest.join(" ")}
        </span>
      </div>
    </div>
  );
}

/** Building what comes next. */
function Vision() {
  return (
    <div className="pointer-events-none absolute inset-0 text-[#141312]">
      <div className="absolute inset-x-5 bottom-[11%] md:inset-x-auto md:bottom-auto md:left-[4.2vw] md:top-1/2 md:w-[min(42vw,620px)] md:-translate-y-1/2">
        <p data-hz-v="rise" className="eyebrow invisible flex items-center gap-3 !text-[#141312]/60">
          <span className="tabular-nums">05</span>
          <span className="h-px w-5 bg-current opacity-60" />
          {horizon.visionEyebrow}
        </p>
        <h2 className="mt-5 text-[clamp(2.4rem,10.5vw,3.4rem)] font-light leading-[1] tracking-[-0.05em] md:mt-7 md:text-[clamp(3rem,min(5.6vw,10vh),6rem)]">
          {horizon.visionHeadline.split(" ").reduce<string[][]>((lines, word, i) => {
            // Two lines: "Building what" / "comes next."
            (lines[i < 2 ? 0 : 1] ??= []).push(word);
            return lines;
          }, []).map((line, i) => (
            <span key={i} className="block overflow-hidden pb-[0.08em]">
              <span data-hz-v="line" className={cn("invisible block", i === 1 && "font-medium")}>
                {line.join(" ")}
              </span>
            </span>
          ))}
        </h2>
        <p data-hz-v="copy" className="invisible mt-5 max-w-[46ch] text-[15px] leading-[1.6] text-[#141312]/70 md:mt-7 md:text-[clamp(15px,1.2vw,18px)]">
          {horizon.visionBody}
        </p>
        <div data-hz-v="copy" className="invisible mt-7 md:mt-10">
          <VisionButton />
        </div>
      </div>
    </div>
  );
}

function VisionButton() {
  const magnet = useMagnetic<HTMLDivElement>({ strength: 0.35, radius: 70 });
  const { label, href } = horizon.cta;
  const classes =
    "group pointer-events-auto relative inline-flex h-12 items-center gap-5 overflow-hidden rounded-full bg-[#141312] pl-7 pr-2 text-[15px] tracking-[-0.01em] text-[#f1ede6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141312] md:h-[54px] md:pl-8";
  const content = (
    <>
      <span aria-hidden="true" className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-[320%]" />
      <span className="relative">{label}</span>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#f1ede6] text-[#141312] transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 md:h-10 md:w-10">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </>
  );
  return (
    <div ref={magnet} className="w-fit">
      {href ? (
        <Link href={href} className={classes}>
          {content}
        </Link>
      ) : (
        <button type="button" aria-disabled="true" title="Coming soon" className={cn(classes, "cursor-default")}>
          {content}
        </button>
      )}
    </div>
  );
}
