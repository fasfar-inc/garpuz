"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useContext, useEffect, useRef, useState } from "react";
import { chapters } from "@/content/site";
import { ventures as allVentures, type Venture } from "@/content/ventures";
import { cn } from "@/lib/cn";
import { StageContext } from "@/lib/stage/store";
import { IVORY_THEME, themeFromColors, type ThemeVars } from "@/lib/stage/theme";
import { enterCopy, recipeFor } from "./recipes";
import { ShowcaseIntro } from "./showcase-intro";
import { VentureDetails } from "./venture-details";
import { VenturePanel } from "./venture-panel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CINEMATIC = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const REDUCED = "(prefers-reduced-motion: reduce)";
/** Scroll distance per venture in the desktop sequence, in viewport heights. */
const VH_PER_VENTURE = 1.15;
const CHAPTER = chapters.findIndex((c) => c.id === "showcase");
/** Matches the intro's background (and the ivory stage before it). */
const INTRO_SURFACE = "#f1ede6";

/** Where each beat of venture `i` sits on the desktop sequence timeline (1 unit per venture). */
const beats = (i: number) => ({
  transition: [i - 0.08, 0.36] as const,
  enter: i === 0 ? null : ([i + 0.08, 0.34] as const),
  dwell: [i === 0 ? 0.04 : i + 0.32, i === 0 ? 0.82 : 0.6] as const,
});

type Seek = { cinematic: boolean; venture: (i: number) => number; step: (i: number, k: number) => number };

/**
 * Scene 4 — Our Ventures. A data-driven showcase: every venture in the
 * registry gets a panel with its own visual and choreography (see recipes.ts).
 *
 * Desktop: the panels are layered full-screen and a pinned, scrubbed
 * timeline hands the stage from one venture to the next. Mobile and reduced
 * motion: the same panels flow vertically, each animating as it scrolls in.
 */
export function VentureShowcase({ ventures = allVentures }: { ventures?: Venture[] }) {
  const store = useContext(StageContext);
  const section = useRef<HTMLElement>(null);
  const seek = useRef<Seek | null>(null);
  const [selected, setSelected] = useState<Venture | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useGSAP(
    () => {
      const sec = section.current!;
      const root = document.documentElement;
      const mm = gsap.matchMedia();

      // `always` makes the callback run for every viewport (matchMedia only
      // calls it when a condition matches); the others pick the mode.
      mm.add({ always: "all", cinematic: CINEMATIC, reduced: REDUCED }, (context) => {
        const { cinematic, reduced } = context.conditions as { cinematic: boolean; reduced: boolean };
        sec.dataset.mode = cinematic ? "cinematic" : "stacked";
        const scrub = reduced ? true : 0.7;
        const intro = sec.querySelector<HTMLElement>("[data-sv-intro]")!;
        const track = sec.querySelector<HTMLElement>("[data-sv-track]")!;
        const panels = gsap.utils.toArray<HTMLElement>("[data-venture-panel]", sec);

        // ── Intro: BIG IDEAS. / DIFFERENT WORLDS. ─────────────────────────
        gsap
          .timeline({ scrollTrigger: { trigger: intro, start: "top 78%", end: "top 8%", scrub, refreshPriority: -1 } })
          .fromTo(
            intro.querySelectorAll("[data-intro-word]"),
            { yPercent: 115, rotationX: reduced ? 0 : -70, autoAlpha: 0 },
            { yPercent: 0, rotationX: 0, autoAlpha: 1, stagger: 0.12, duration: 0.6, ease: "power3.out" },
          )
          .fromTo(intro.querySelectorAll("[data-intro-copy]"), { y: reduced ? 0 : 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.2, duration: 0.4 }, 0.3);
        gsap.fromTo(
          intro.querySelectorAll("[data-intro-gradient]"),
          { backgroundPosition: "0% 0%" },
          {
            backgroundPosition: "100% 0%",
            ease: "none",
            scrollTrigger: cinematic
              ? { trigger: intro, start: "top top", end: "+=70%", pin: true, scrub, refreshPriority: -1 }
              : { trigger: intro, start: "top 40%", end: "bottom 60%", scrub, refreshPriority: -1 },
          },
        );

        // Header highlighting and palette follow the venture in view. One
        // writer at a time: a new palette tween replaces the previous one.
        let themeTween: gsap.core.Tween | null = null;
        const setTheme = (vars: ThemeVars) => {
          themeTween?.kill();
          themeTween = gsap.to(root, { ...vars, duration: 0.6 });
        };
        ScrollTrigger.create({
          trigger: sec,
          start: "top 55%",
          end: "bottom 45%",
          refreshPriority: -1,
          onEnter: () => store?.setChapter(CHAPTER),
          onEnterBack: () => store?.setChapter(CHAPTER),
          onLeaveBack: () => {
            store?.setChapter(CHAPTER - 1);
            setTheme(IVORY_THEME);
          },
        });

        if (cinematic) {
          // ── Desktop: pinned sequence, one timeline unit per venture ─────
          const n = panels.length;
          // The sequence animates its palette on a proxy, written to the page
          // only while the sequence is in view (its scrub smoothing must not
          // repaint the header once the visitor has scrolled elsewhere).
          const theme = { ...themeFromColors(ventures[0].colors) };
          const writeTheme = () => Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v));
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: track,
              start: "top top",
              end: () => `+=${window.innerHeight * VH_PER_VENTURE * n}`,
              pin: true,
              scrub,
              invalidateOnRefresh: true,
              refreshPriority: -1,
              onLeaveBack: () => setTheme(IVORY_THEME),
            },
            onUpdate: () => {
              if (tl.scrollTrigger?.isActive) {
                themeTween?.kill();
                writeTheme();
              }
              const i = Math.min(n - 1, Math.max(0, Math.floor(tl.time() + 0.12)));
              if (i !== activeRef.current) {
                activeRef.current = i;
                setActive(i);
              }
            },
          });
          tl.set({}, {}, n);

          // The first venture arrives while the track scrolls into place.
          const first = gsap.timeline({ scrollTrigger: { trigger: track, start: "top 92%", end: "top top", scrub, refreshPriority: -1 } });
          recipeFor(ventures[0].visual).enter(panels[0], { tl: first, at: 0, dur: 1, reduced });
          enterCopy(panels[0], { tl: first, at: 0.25, dur: 0.75, reduced });

          panels.forEach((panel, i) => {
            const recipe = recipeFor(ventures[i].visual);
            const b = beats(i);
            if (i > 0) {
              const [at, dur] = b.transition;
              recipe.panelEnter(panel, { tl, at, dur, reduced });
              tl.to(panels[i - 1].querySelector("[data-panel-inner]"), { scale: 0.9, yPercent: -5, autoAlpha: 0.25, duration: dur, ease: "power2.in" }, at)
                .to(theme, { ...themeFromColors(ventures[i].colors), duration: dur * 0.6 }, at + dur * 0.2);
              recipe.enter(panel, { tl, at: b.enter![0], dur: b.enter![1], reduced });
              enterCopy(panel, { tl, at: b.enter![0] + 0.04, dur: b.enter![1], reduced });
            }
            recipe.dwell(panel, { tl, at: b.dwell[0], dur: b.dwell[1], reduced });
          });

          const toScroll = (time: number) => {
            const st = tl.scrollTrigger!;
            return st.start + (time / n) * (st.end - st.start);
          };
          seek.current = {
            cinematic: true,
            venture: (i) => toScroll(i === 0 ? 0.02 : i + 0.5),
            step: (i, k) => {
              const steps = recipeFor(ventures[i].visual).steps || 1;
              const [at, dur] = beats(i).dwell;
              return toScroll(at + (dur * (k + 0.5)) / steps);
            },
          };
        } else {
          // ── Mobile / reduced motion: vertical showcase ──────────────────
          const dwells: ScrollTrigger[] = [];
          panels.forEach((panel, i) => {
            const recipe = recipeFor(ventures[i].visual);
            const enter = gsap.timeline({ scrollTrigger: { trigger: panel, start: "top 90%", end: "top 35%", scrub, refreshPriority: -1 } });
            recipe.enter(panel, { tl: enter, at: 0, dur: 1, reduced });
            enterCopy(panel, { tl: enter, at: 0.1, dur: 0.9, reduced });
            // The last venture ends when its bottom reaches the viewport's, so it can finish before the page ends.
            const end = i === panels.length - 1 ? "bottom bottom" : "bottom 55%";
            const dwell = gsap.timeline({ scrollTrigger: { trigger: panel, start: "top 45%", end, scrub, refreshPriority: -1 } });
            recipe.dwell(panel, { tl: dwell, at: 0, dur: 1, reduced });
            dwell.set({}, {}, 1);
            dwells.push(dwell.scrollTrigger!);
            ScrollTrigger.create({
              trigger: panel,
              start: "top 55%",
              end: "bottom 55%",
              refreshPriority: -1,
              onToggle: (self) => self.isActive && setTheme(themeFromColors(ventures[i].colors)),
              onLeaveBack: () => i === 0 && setTheme(IVORY_THEME),
            });
          });
          seek.current = {
            cinematic: false,
            venture: (i) => panels[i].getBoundingClientRect().top + window.scrollY,
            step: (i, k) => {
              const st = dwells[i];
              const steps = recipeFor(ventures[i].visual).steps || 1;
              return st.start + ((k + 0.5) / steps) * (st.end - st.start);
            },
          };
        }

        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        return () => {
          sec.dataset.mode = "stacked";
          seek.current = null;
        };
      });
      return () => mm.revert();
    },
    { scope: section, dependencies: [ventures] },
  );

  // Click-to-step controls (product tiles, menu tabs) scroll the story to that step.
  useEffect(() => {
    const sec = section.current;
    if (!sec) return;
    const onClick = (e: MouseEvent) => {
      const control = (e.target as HTMLElement).closest<HTMLElement>("[data-sv-goto]");
      const panel = control?.closest<HTMLElement>("[data-venture-panel]");
      if (!control || !panel || !seek.current) return;
      const top = seek.current.step(Number(panel.dataset.index), Number(control.dataset.svGoto));
      window.scrollTo({ top, behavior: window.matchMedia(REDUCED).matches ? "auto" : "smooth" });
    };
    sec.addEventListener("click", onClick);
    return () => sec.removeEventListener("click", onClick);
  }, []);

  const goToVenture = (i: number) => {
    if (!seek.current) return;
    window.scrollTo({ top: seek.current.venture(i), behavior: window.matchMedia(REDUCED).matches ? "auto" : "smooth" });
  };

  return (
    <section ref={section} id="showcase" aria-label="Our ventures" data-mode="stacked" className="group/showcase relative">
      <ShowcaseIntro />
      <div data-sv-track className="relative group-data-[mode=cinematic]/showcase:h-svh group-data-[mode=cinematic]/showcase:overflow-hidden">
        {ventures.map((venture, i) => (
          <VenturePanel
            key={venture.slug}
            venture={venture}
            index={i}
            total={ventures.length}
            previousSurface={i === 0 ? INTRO_SURFACE : ventures[i - 1].colors.surface}
            onExplore={setSelected}
          />
        ))}
        <nav
          aria-label="Ventures"
          className="pointer-events-none absolute bottom-[6%] left-[4.2vw] z-50 hidden text-(--ink) group-data-[mode=cinematic]/showcase:block"
        >
          <ol className="pointer-events-auto flex items-center gap-5">
            {ventures.map((v, i) => (
              <li key={v.slug}>
                <button
                  type="button"
                  onClick={() => goToVenture(i)}
                  aria-current={i === active ? "true" : undefined}
                  className={cn("group flex items-center gap-2 text-[12px] tracking-[0.04em] transition-opacity duration-500", i === active ? "opacity-100" : "opacity-45 hover:opacity-80")}
                >
                  <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className={cn("h-px bg-current transition-[width] duration-500", i === active ? "w-8" : "w-3 group-hover:w-5")} />
                  <span className={cn("overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-500", i === active ? "max-w-40 opacity-100" : "max-w-0 opacity-0")}>{v.name}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <VentureDetails venture={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
