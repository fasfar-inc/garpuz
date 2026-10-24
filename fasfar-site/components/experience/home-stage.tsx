"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { chapters } from "@/content/site";
import { phases, STAGE_SCROLL_VH } from "@/lib/stage/phases";
import { createStageStore, StageContext } from "@/lib/stage/store";
import { SiteHeader } from "@/components/layout/site-header";
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

const span = (phase: readonly [number, number]) => phase[1] - phase[0];

/**
 * Home stage: a pinned viewport where Scene 1 (ivory hero) transforms into
 * Scene 2 (midnight ecosystem). One scrubbed GSAP timeline drives the DOM
 * layers and publishes its progress to the WebGL scene through the store.
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

      // Scroll transformation, normalised to a 0 → 1 timeline.
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage.current,
          start: "top top",
          end: () => `+=${(window.innerHeight * STAGE_SCROLL_VH) / 100}`,
          pin: true,
          scrub: reducedMotion ? true : 0.9,
          invalidateOnRefresh: true,
          snap: reducedMotion
            ? undefined
            : { snapTo: [0, 1], duration: { min: 0.4, max: 1.4 }, delay: 0.15, ease: "power2.inOut" },
        },
        onUpdate: () => {
          const p = tl.progress();
          store.progress = p;
          store.setChapter(Math.min(chapters.length - 1, Math.round(p * (chapters.length - 1))));
          store.invalidate();
        },
      });
      tl.set({}, {}, 1);

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
        .fromTo(q("[data-rail-fill]"), { scaleX: 1 / chapters.length }, { scaleX: 1, duration: 1 }, 0);

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: stage, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  // Hash links (#top / #ecosystem) jump to the matching end of the pinned stage.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.getAttribute("href")?.slice(1);
      const index = id === "top" ? 0 : chapters.findIndex((c) => c.id === id);
      if (!link || index < 0) return;
      e.preventDefault();
      const trigger = ScrollTrigger.getAll().find((t) => t.trigger === stage.current);
      const top = trigger ? trigger.start + (trigger.end - trigger.start) * (index / (chapters.length - 1)) : 0;
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

          <div
            className="absolute inset-0 transition-opacity duration-[1600ms] ease-out"
            style={{ opacity: canvasReady ? 1 : 0 }}
          >
            <StageCanvas store={store} reducedMotion={reducedMotion} onReady={() => setCanvasReady(true)} />
          </div>

          <HeroScene />
          <EcosystemScene />
          <StageChrome />
        </section>
        {chapters.slice(1).map((c, i) => (
          <span
            key={c.id}
            id={c.id}
            aria-hidden="true"
            className="pointer-events-none absolute left-0"
            style={{ top: `${(STAGE_SCROLL_VH * (i + 1)) / (chapters.length - 1)}vh` }}
          />
        ))}
      </div>
    </StageContext.Provider>
  );
}
