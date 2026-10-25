"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { chapters } from "@/content/site";
import { clamp01 } from "@/lib/stage/math";
import {
  beyondPhases,
  CHAPTER_TIMES,
  phases,
  SEGMENT_DURATIONS,
  STAGE_TOTAL_VH,
  TIMELINE_DURATION,
} from "@/lib/stage/phases";
import { createStageStore, StageContext } from "@/lib/stage/store";
import { SiteHeader } from "@/components/layout/site-header";
import { BeyondBackdrop, BeyondCopy, BeyondStatements } from "@/components/scenes/beyond-scene";
import { EcosystemScene } from "@/components/scenes/ecosystem-scene";
import { HeroScene } from "@/components/scenes/hero-scene";
import { StageBackdrop } from "@/components/scenes/stage-backdrop";
import { StageChrome } from "@/components/scenes/stage-chrome";
import { Wordmark } from "@/components/ui/wordmark";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const StageCanvas = dynamic(() => import("@/components/three/stage-canvas"), { ssr: false });

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Night palette for the theme variables the header and copy read. */
const NIGHT_THEME = {
  "--ink": "#eef1f8",
  "--ink-muted": "rgba(222,229,244,0.68)",
  "--hairline": "rgba(222,229,244,0.16)",
  "--hairline-strong": "rgba(222,229,244,0.42)",
  "--paper": "#0a1430",
};

/** Ivory palette, matching the `:root` defaults in globals.css. */
const IVORY_THEME = {
  "--ink": "#141312",
  "--ink-muted": "rgba(20,19,18,0.62)",
  "--hairline": "rgba(20,19,18,0.12)",
  "--hairline-strong": "rgba(20,19,18,0.34)",
  "--paper": "#f1ede6",
};

const span = (phase: readonly [number, number]) => phase[1] - phase[0];

/** Scene 3 lives on the second timeline segment: map its 0 → 1 phases to timeline time. */
const S2 = SEGMENT_DURATIONS[1];
const at3 = (o: number) => CHAPTER_TIMES[1] + o * S2;
const span3 = (phase: readonly [number, number]) => (phase[1] - phase[0]) * S2;

/** Index of the chapter nearest to a timeline time. */
const chapterAt = (time: number) =>
  CHAPTER_TIMES.reduce((index, t, i) => (i > 0 && time >= (CHAPTER_TIMES[i - 1] + t) / 2 ? i : index), 0);

/**
 * Home stage: one pinned viewport in which Scene 1 (ivory hero) becomes
 * Scene 2 (midnight ecosystem), which becomes Scene 3 (beyond the ordinary).
 * One scrubbed GSAP timeline drives the DOM layers and publishes each
 * segment's progress to the WebGL scene through the store.
 */
export function HomeStage() {
  const [store] = useState(createStageStore);
  const stage = useRef<HTMLElement>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);
  useEffect(() => store.setReducedMotion(reducedMotion), [store, reducedMotion]);

  // Pointer parallax input.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      store.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      store.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [store]);

  useGSAP(
    () => {
      const q = gsap.utils.selector(stage);
      const root = document.documentElement;
      const intro = document.querySelectorAll<HTMLElement>("[data-intro]");

      // Entrance.
      if (reducedMotion) {
        gsap.set(intro, { autoAlpha: 1 });
      } else {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.15 });
        tl.from(q("[data-letter]"), { yPercent: 105, duration: 1.6, stagger: 0.07 }, 0)
          .from(document.querySelector("[data-intro=header]"), { y: -24, autoAlpha: 0, duration: 1.3 }, 0.35)
          .from(q("[data-intro=line]"), { yPercent: 110, duration: 1.3, stagger: 0.1 }, 0.55)
          .from(q("[data-intro=rise]"), { y: 22, autoAlpha: 0, duration: 1.2, stagger: 0.06 }, 0.7);
      }

      // Scroll transformation. Segment 1 (Scene 1 → 2) spans timeline time
      // 0 → 1; each later segment is sized by its scroll distance.
      const segment1End = CHAPTER_TIMES[1] / TIMELINE_DURATION;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage.current,
          start: "top top",
          end: () => `+=${(window.innerHeight * STAGE_TOTAL_VH) / 100}`,
          pin: true,
          scrub: reducedMotion ? true : 0.9,
          invalidateOnRefresh: true,
          // Scene 1 ↔ 2 settles on either scene, in the scroll direction;
          // Scene 3 is a continuous read, so it scrolls freely.
          snap: reducedMotion
            ? undefined
            : {
                snapTo: (value: number) => {
                  if (value >= segment1End) return value;
                  const direction = tl.scrollTrigger?.direction ?? 1;
                  return direction > 0 ? segment1End : 0;
                },
                duration: { min: 0.4, max: 1.4 },
                delay: 0.15,
                ease: "power2.inOut",
              },
        },
        onUpdate: () => {
          const time = tl.time();
          store.progress = clamp01(time / CHAPTER_TIMES[1]);
          store.outro = clamp01((time - CHAPTER_TIMES[1]) / S2);
          store.setChapter(chapterAt(time));
          store.invalidate();
        },
      });
      tl.set({}, {}, TIMELINE_DURATION);

      tl.to(q("[data-hero]"), { y: -70, autoAlpha: 0, stagger: 0.015, duration: span(phases.heroOut) * 0.8 }, phases.heroOut[0])
        .to(q("[data-wordmark]"), { yPercent: -18, scale: 1.12, autoAlpha: 0, filter: "blur(14px)", duration: span(phases.heroOut) }, phases.heroOut[0])
        .to(q("[data-ivory-decor]"), { autoAlpha: 0, duration: 0.3 }, 0.05)
        .to(q("[data-night]"), { autoAlpha: 1, duration: span(phases.night) }, phases.night[0])
        .fromTo(q("[data-horizon]"), { yPercent: 45 }, { yPercent: 0, duration: 0.7, ease: "power1.out" }, 0.1)
        .fromTo(q("[data-planet]"), { xPercent: 18, yPercent: -18, scale: 0.9 }, { xPercent: 0, yPercent: 0, scale: 1, duration: 0.8 }, 0.1)
        .to(root, { ...NIGHT_THEME, duration: span(phases.night) }, phases.night[0])
        .to(q("[data-hint=hero]"), { autoAlpha: 0, y: -8, duration: 0.08 }, 0.4)
        .fromTo(q("[data-hint=eco]"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.46)
        .fromTo(
          q("[data-eco=line]"),
          { yPercent: 110, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, stagger: 0.05, duration: span(phases.headlineIn) * 0.7, ease: "power2.out" },
          phases.headlineIn[0],
        )
        .fromTo(
          q("[data-eco=rise]"),
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.03, duration: 0.14, ease: "power2.out" },
          phases.headlineIn[0] + 0.02,
        )
        .fromTo(
          q("[data-card-slot]"),
          { y: 60, autoAlpha: 0, scale: 0.94, filter: "blur(10px)" },
          { y: 0, autoAlpha: 1, scale: 1, filter: "blur(0px)", stagger: 0.045, duration: 0.16, ease: "power2.out" },
          phases.cardsIn[0],
        )
        .fromTo(q("[data-leader]"), { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.045, duration: 0.05 }, phases.cardsIn[0] + 0.06)
        .fromTo(q("[data-leader-path]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.045, duration: 0.14 }, phases.cardsIn[0] + 0.06)
        .fromTo(q("[data-rail-fill]"), { scaleX: 1 / chapters.length }, { scaleX: 2 / chapters.length, duration: 1 }, 0);

      // ── Scene 2 → Scene 3: beyond the ordinary ────────────────────────────
      const statements = q("[data-beyond-statements]")[0];
      const lines = q<HTMLElement>("[data-beyond-line]");
      const words = q<HTMLElement>("[data-beyond-word]");
      const fills = q<HTMLElement>("[data-beyond-fill]");
      const compact = window.matchMedia("(max-width: 767px)").matches;

      // The statements first appear enormous, one at a time, with the block
      // panned so the current line is centred; then they settle into the
      // asymmetric composition. Positions are measured from layout (not
      // transforms), so they stay right after a resize.
      const zoom = (i: number) =>
        reducedMotion ? 1 : Math.min(compact ? 1.4 : 1.7, (window.innerWidth * 0.88) / words[i].offsetWidth);
      const pan = (i: number) => ({
        scale: () => zoom(i),
        x: () => {
          if (reducedMotion) return 0;
          return window.innerWidth / 2 - statements.offsetLeft - (lines[i].offsetLeft + words[i].offsetWidth / 2) * zoom(i);
        },
        y: () => {
          if (reducedMotion) return 0;
          return window.innerHeight / 2 - statements.offsetTop - (lines[i].offsetTop + lines[i].offsetHeight / 2) * zoom(i);
        },
      });

      tl.to(q("[data-eco=line]"), { yPercent: -110, autoAlpha: 0, stagger: 0.02, duration: span3(beyondPhases.ecosystemOut) * 0.8, ease: "power2.in" }, at3(0))
        .to(q("[data-eco=rise]"), { y: -30, autoAlpha: 0, duration: span3(beyondPhases.ecosystemOut) * 0.7 }, at3(0))
        .to(q("[data-leader-path]"), { strokeDashoffset: 1, duration: span3(beyondPhases.ecosystemOut) * 0.5 }, at3(0))
        .to(q("[data-leader]"), { autoAlpha: 0, duration: span3(beyondPhases.ecosystemOut) * 0.5 }, at3(0.03))
        .to(
          q("[data-card-slot]"),
          { y: 90, autoAlpha: 0, scale: 0.94, filter: "blur(10px)", stagger: 0.02, duration: span3(beyondPhases.ecosystemOut), ease: "power2.in" },
          at3(0),
        )
        .to(q("[data-night]"), { autoAlpha: 0, duration: span3(beyondPhases.day) }, at3(beyondPhases.day[0]))
        .to(q("[data-horizon]"), { yPercent: 70, duration: span3(beyondPhases.day) * 1.2, ease: "power1.in" }, at3(beyondPhases.day[0] - 0.04))
        .to(q("[data-planet]"), { yPercent: -35, xPercent: 12, duration: span3(beyondPhases.day) * 1.2 }, at3(beyondPhases.day[0] - 0.04))
        .to(root, { ...IVORY_THEME, duration: span3(beyondPhases.day) }, at3(beyondPhases.day[0]))
        .to(q("[data-beyond-backdrop]"), { autoAlpha: 1, duration: span3(beyondPhases.day) }, at3(beyondPhases.day[0]))
        .to(q("[data-manifesto]"), { autoAlpha: 0, duration: span3(beyondPhases.day) * 0.5 }, at3(beyondPhases.day[0]))
        .to(q("[data-hint=eco]"), { autoAlpha: 0, y: -8, duration: 0.08 }, at3(0.26))
        .fromTo(q("[data-hint=beyond]"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.08 }, at3(0.3))
        .fromTo(
          q("[data-beyond=rise]"),
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.03, duration: span3(beyondPhases.eyebrowIn), ease: "power2.out" },
          at3(beyondPhases.eyebrowIn[0]),
        )
        .set(statements, { transformOrigin: "0 0", ...pan(0) }, at3(beyondPhases.statements[0].reveal[0] - 0.01));

      beyondPhases.statements.forEach(({ reveal, fill }, i) => {
        if (i > 0) {
          tl.to(statements, { ...pan(i), duration: span3(reveal) * 1.1, ease: "power2.inOut" }, at3(reveal[0] - 0.05))
            .to(lines[i - 1], { opacity: 0.22, duration: span3(reveal) * 0.8 }, at3(reveal[0] - 0.04));
        }
        tl.fromTo(
          words[i],
          { yPercent: 115, rotateX: reducedMotion ? 0 : -72, autoAlpha: 0 },
          { yPercent: 0, rotateX: 0, autoAlpha: 1, duration: span3(reveal), ease: "power3.out" },
          at3(reveal[0]),
        ).fromTo(
          fills[i],
          { clipPath: "inset(0% 100% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: span3(fill), ease: "power1.inOut" },
          at3(fill[0]),
        );
      });

      tl.to(statements, { x: 0, y: 0, scale: 1, duration: span3(beyondPhases.settle), ease: "power3.inOut" }, at3(beyondPhases.settle[0]))
        .to(lines, { opacity: 1, duration: span3(beyondPhases.settle) * 0.6 }, at3(beyondPhases.settle[0]))
        // The middle line drains back to an outline: solid / outline / solid.
        .to(fills[1], { clipPath: "inset(0% 0% 0% 100%)", duration: span3(beyondPhases.settle) * 0.7, ease: "power1.inOut" }, at3(beyondPhases.settle[0] + 0.04))
        .fromTo(q("[data-beyond-rule]"), { scaleY: 0 }, { scaleY: 1, duration: span3(beyondPhases.copyIn), ease: "power2.out" }, at3(beyondPhases.copyIn[0] - 0.04))
        .fromTo(
          q("[data-beyond=line]"),
          { yPercent: 110, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, stagger: 0.04, duration: span3(beyondPhases.copyIn) * 0.6, ease: "power2.out" },
          at3(beyondPhases.copyIn[0]),
        )
        .fromTo(
          q("[data-beyond=copy]"),
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.05, duration: span3(beyondPhases.copyIn) * 0.6, ease: "power2.out" },
          at3(beyondPhases.copyIn[0] + 0.05),
        )
        .to(q("[data-rail-fill]"), { scaleX: 1, duration: S2 }, at3(0));

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: stage, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  // Hash links (#top / #ecosystem / #beyond) jump to that chapter on the pinned stage.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.getAttribute("href")?.slice(1);
      const index = id === "top" ? 0 : chapters.findIndex((c) => c.id === id);
      if (!link || index < 0) return;
      e.preventDefault();
      const trigger = ScrollTrigger.getAll().find((t) => t.trigger === stage.current);
      const top = trigger ? trigger.start + (trigger.end - trigger.start) * (CHAPTER_TIMES[index] / TIMELINE_DURATION) : 0;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
      history.replaceState(null, "", index === 0 ? location.pathname : `#${id}`);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [reducedMotion]);

  return (
    <StageContext.Provider value={store}>
      <SiteHeader />
      <div className="relative">
        <section ref={stage} id="top" aria-label="FASFAR — ventures" className="relative h-svh w-full overflow-hidden">
          <StageBackdrop />

          <div data-wordmark className="absolute inset-x-0 top-[22%] flex justify-center will-change-transform md:top-[23%] tall:top-[25%]">
            <Wordmark
              masked
              className="text-[23.4vw] font-medium md:text-[min(23.4vw,31vh)] tall:text-[23.4vw] leading-[0.86] tracking-[0.07em] [margin-right:-0.07em]"
              letterClassName="bg-[linear-gradient(180deg,#141312_38%,#6b625a_100%)] bg-clip-text text-transparent"
            />
          </div>

          <BeyondBackdrop />
          <BeyondStatements />

          <div
            className="absolute inset-0 transition-opacity duration-[1600ms] ease-out"
            style={{ opacity: canvasReady ? 1 : 0 }}
          >
            <StageCanvas store={store} reducedMotion={reducedMotion} onReady={() => setCanvasReady(true)} />
          </div>

          <HeroScene />
          <EcosystemScene />
          <BeyondCopy />
          <StageChrome />
        </section>
        {chapters.slice(1).map((c, i) => (
          <span
            key={c.id}
            id={c.id}
            aria-hidden="true"
            className="pointer-events-none absolute left-0"
            style={{ top: `${(STAGE_TOTAL_VH * CHAPTER_TIMES[i + 1]) / TIMELINE_DURATION}vh` }}
          />
        ))}
      </div>
    </StageContext.Provider>
  );
}
