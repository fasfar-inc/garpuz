"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { finale } from "@/content/finale";
import { chapters } from "@/content/site";
import { useMagnetic } from "@/lib/motion/use-magnetic";
import { useNear } from "@/lib/motion/use-near";
import { registerPalette } from "@/lib/stage/palette";
import { FINALE_VH, finalePhases as fp } from "@/lib/stage/phases";
import { StageContext } from "@/lib/stage/store";
import { IVORY_THEME, NIGHT_THEME, type ThemeVars } from "@/lib/stage/theme";
import { ArrowUpRight } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/wordmark";
import { CanvasBoundary, supportsWebGL } from "@/components/three/canvas-boundary";
import { createFinaleState } from "@/components/three/finale/finale-state";
import { FINALE_PRIORITY } from "@/components/inside/motion";
import { ContactPanel, type PanelOrigin } from "./contact-panel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FinaleCanvas = dynamic(() => import("@/components/three/finale/finale-canvas"), { ssr: false });

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const subscribeNever = () => () => {};
const CHAPTER = chapters.findIndex((c) => c.id === "finale");
const span = (phase: readonly [number, number]) => phase[1] - phase[0];

/** Scene 8's midnight: Scene 2's blue, a shade deeper. */
const FINALE_NIGHT: ThemeVars = { ...NIGHT_THEME, "--paper": "#050a1c" };
/** Where the `#contact` anchor sits on the pinned timeline: the reveal is complete. */
const CONTACT_AT = 0.965;
/** The header's vertical centre: whichever section is behind it sets its colours. */
export const HEADER_LINE = 47;

/**
 * Scene 8 — The Grand Finale. One pinned, scrubbed sequence:
 * Part 1, Scene 7's lines retract as ivory gives way to midnight and the
 * camera travels down a corridor of luminous threads towards the sculpture.
 * Part 2, the sculpture turns and opens, and its components travel to the
 * edges of the frame as the FASFAR wordmark is revealed behind it.
 * Part 3, dawn: the wordmark rises in ink above WHAT'S NEXT / STARTS HERE.
 * and the invitation to connect. Under reduced motion it is the final
 * composition, unpinned.
 */
export function FinaleScene() {
  const store = useContext(StageContext);
  const section = useRef<HTMLElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const [state] = useState(createFinaleState);
  const [canvasReady, setCanvasReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [panel, setPanel] = useState<PanelOrigin | null>(null);
  const near = useNear(section);
  const visible = useNear(section, 0.15);
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
      const theme: ThemeVars = { ...IVORY_THEME };
      gsap.set(q("[data-fn-mark], [data-fn-char], [data-fn-copy], [data-fn-word]"), { clearProps: "all" });

      // Scene 7's invitation dissolves as the finale arrives (opacity only: it was pinned).
      const invitation = document.getElementById("invitation");
      const arrival = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: true, refreshPriority: FINALE_PRIORITY },
      });
      if (invitation) arrival.to(invitation, { opacity: 0.25, ease: "power1.in" }, 0);

      // ── The pinned sequence ──────────────────────────────────────────────
      const vh = compact ? FINALE_VH.compact : FINALE_VH.desktop;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        paused: reduced,
        scrollTrigger: reduced
          ? undefined
          : {
              trigger: view.current,
              start: "top top",
              end: () => `+=${window.innerHeight * vh}`,
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
              refreshPriority: FINALE_PRIORITY,
              onToggle: (self) => setInView(self.isActive),
              onRefresh: (self) => {
                if (anchor.current) anchor.current.style.top = `${(self.end - self.start) * CONTACT_AT}px`;
              },
            },
        onUpdate: () => {
          state.progress = tl.progress();
          state.invalidate();
        },
      });
      tl.set({}, {}, 1);

      // Part 1 — Scene 7's lines retract, night falls, the corridor appears.
      tl.to(q("[data-fn-line]"), { strokeDashoffset: -1, duration: span(fp.linesOut), stagger: 0.004 }, fp.linesOut[0])
        .to(q("[data-fn-node]"), { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%", duration: span(fp.linesOut) * 0.7 }, fp.linesOut[0])
        .fromTo(q("[data-fn-night]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: span(fp.night), ease: "power1.inOut" }, fp.night[0])
        .fromTo(q("[data-fn-canvas]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: span(fp.threads) }, fp.threads[0])
        .to(theme, { ...FINALE_NIGHT, duration: span(fp.night) }, fp.night[0]);

      // Part 2 — the wordmark opens from the centre behind the sculpture as it parts.
      tl.fromTo(
        q("[data-fn-mark]"),
        { clipPath: "inset(0% 50% 0% 50%)", autoAlpha: 0, letterSpacing: reduced ? "0.07em" : "0.32em" },
        { clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1, letterSpacing: "0.07em", duration: span(fp.wordmark), ease: "power2.inOut" },
        fp.wordmark[0],
      ).fromTo(q("[data-fn-glow]"), { autoAlpha: 0, scaleX: 0.3 }, { autoAlpha: 1, scaleX: 1, duration: span(fp.wordmark), ease: "power2.out" }, fp.wordmark[0]);

      // Part 3 — dawn: the field turns ivory, the wordmark turns to ink and rises.
      tl.fromTo(q("[data-fn-day]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: span(fp.dawn), ease: "power1.inOut" }, fp.dawn[0])
        .to(q("[data-fn-glow]"), { autoAlpha: 0, duration: span(fp.dawn) * 0.6 }, fp.dawn[0])
        .fromTo(q("[data-fn-ink]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: span(fp.dawn) }, fp.dawn[0])
        .to(theme, { ...IVORY_THEME, duration: span(fp.dawn) }, fp.dawn[0])
        .fromTo(
          q("[data-fn-rise]"),
          { yPercent: 0, scale: 1 },
          { yPercent: compact ? -118 : -64, scale: compact ? 0.98 : 0.92, duration: span(fp.rise), ease: "power3.inOut" },
          fp.rise[0],
        )
        .fromTo(
          q("[data-fn-char]"),
          reduced ? { autoAlpha: 0 } : { yPercent: 115, rotationX: -75, autoAlpha: 0 },
          { yPercent: 0, rotationX: 0, autoAlpha: 1, stagger: span(fp.headline) / 26, duration: span(fp.headline) * 0.5, ease: "power3.out" },
          fp.headline[0],
        )
        // Second line drifts a little slower than the first: controlled parallax.
        .fromTo(q("[data-fn-word=l2]"), { xPercent: reduced ? 0 : 6 }, { xPercent: 0, duration: span(fp.headline) + span(fp.copy), ease: "power2.out" }, fp.headline[0])
        .fromTo(q("[data-fn-rule]"), { scaleX: 0 }, { scaleX: 1, duration: span(fp.copy) * 0.8, ease: "power2.inOut" }, fp.copy[0] - 0.02)
        .fromTo(q("[data-fn-copy]"), { autoAlpha: 0, y: reduced ? 0 : 26 }, { autoAlpha: 1, y: 0, stagger: 0.02, duration: span(fp.copy) * 0.7, ease: "power2.out" }, fp.copy[0]);

      if (reduced) {
        tl.progress(1);
        if (anchor.current) anchor.current.style.top = "0px";
      }

      // Header: chapter and palette follow the scene.
      ScrollTrigger.create({
        trigger: sec,
        start: "top 55%",
        end: "bottom 45%",
        refreshPriority: FINALE_PRIORITY,
        onEnter: () => store?.setChapter(CHAPTER),
        onEnterBack: () => store?.setChapter(CHAPTER),
        onLeaveBack: () => store?.setChapter(CHAPTER - 1),
      });
      const unregister = registerPalette({
        // While the section is behind the header: from the moment its view reaches the top.
        owns: () => {
          const r = sec.getBoundingClientRect();
          return r.top <= 1 && r.bottom > HEADER_LINE;
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
    <section ref={section} id="finale" aria-label="What's next" className="relative">
      <span ref={anchor} id="contact" aria-hidden="true" className="pointer-events-none absolute left-0 top-0" />
      <div ref={view} className="relative h-svh overflow-hidden bg-[#e9e5de] text-[#eef1f8]">
        <Backdrop />
        <ConnectionLines />
        <BrandMark />

        <div data-fn-canvas className="invisible absolute inset-0 opacity-0">
          <div className="absolute inset-0 transition-opacity duration-[1400ms] ease-out" style={{ opacity: canvasReady ? 1 : 0 }}>
            {webgl && near && (
              <CanvasBoundary>
                <FinaleCanvas state={state} reducedMotion={reducedMotion} active={inView || visible} onReady={() => setCanvasReady(true)} />
              </CanvasBoundary>
            )}
          </div>
        </div>

        <Reveal onConnect={setPanel} />
      </div>
      <ContactPanel origin={panel} onClose={() => setPanel(null)} />
    </section>
  );
}

/** Ivory (Scene 7's last field) → midnight → luminous warm ivory. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div data-fn-night className="invisible absolute inset-0 opacity-0 bg-[radial-gradient(90%_70%_at_50%_50%,#0d1a3e_0%,#071029_45%,#03060f_100%)]" />
      <div data-fn-glow className="invisible absolute inset-x-0 top-1/2 h-[60%] -translate-y-1/2 opacity-0 bg-[radial-gradient(50%_40%_at_50%_50%,rgba(125,156,255,0.22),rgba(125,156,255,0)_70%)]" />
      <div data-fn-day className="invisible absolute inset-0 opacity-0 bg-[radial-gradient(80%_70%_at_50%_30%,#fdfbf7_0%,#f4f0e9_55%,#ebe5db_100%)]" />
    </div>
  );
}

/** Scene 7's thin connection lines, converging on the centre — the first thing to go. */
function ConnectionLines() {
  const C = { x: 800, y: 500 };
  const starts: [number, number][] = [
    [-40, 120],
    [-40, 520],
    [180, 1040],
    [620, -40],
    [1060, -40],
    [1640, 260],
    [1640, 720],
    [1180, 1040],
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {starts.map(([x, y], i) => {
        const mx = (x + C.x) / 2 + (i % 2 ? 120 : -120);
        const my = (y + C.y) / 2 + (i % 3 ? -90 : 90);
        return (
          <path
            key={i}
            data-fn-line
            d={`M${x} ${y} Q${mx} ${my} ${C.x} ${C.y}`}
            pathLength={1}
            fill="none"
            stroke={i % 3 === 0 ? "#141312" : "#c99863"}
            strokeOpacity={i % 3 === 0 ? 0.28 : 0.6}
            strokeWidth={1.2}
            strokeDasharray="1 1"
            strokeDashoffset={0}
          />
        );
      })}
      <circle data-fn-node cx={C.x} cy={C.y} r={7} fill="#141312" />
      <circle data-fn-node cx={C.x} cy={C.y} r={18} fill="none" stroke="#141312" strokeOpacity={0.25} />
    </svg>
  );
}

const SILVER = "bg-[linear-gradient(180deg,#ffffff_10%,#c9d2ea_55%,#7d88a8_100%)] bg-clip-text text-transparent";
const INK = "bg-[linear-gradient(180deg,#141312_38%,#6b625a_100%)] bg-clip-text text-transparent";

/** The FASFAR wordmark behind the sculpture: silver at night, ink by day. */
function BrandMark() {
  const cls = "text-[23vw] font-medium leading-[0.86] md:text-[min(21vw,40vh)]";
  return (
    <div data-fn-rise aria-hidden="true" className="absolute inset-x-0 top-1/2 -mt-[0.5em] flex justify-center text-[23vw] md:text-[min(21vw,40vh)]">
      <div data-fn-mark className="invisible relative [margin-right:-0.07em]">
        <Wordmark className={cls} letterClassName={SILVER} />
        <div data-fn-ink className="invisible absolute inset-0 opacity-0">
          <Wordmark className={cls} letterClassName={INK} />
        </div>
      </div>
    </div>
  );
}

/** WHAT'S NEXT / STARTS HERE., the supporting line and the invitation to connect. */
function Reveal({ onConnect }: { onConnect: (origin: PanelOrigin) => void }) {
  const [l1, l2] = finale.headline;
  const chars = (line: string, key: string) =>
    line.split(" ").map((word, wi) => (
      <span key={`${key}-${wi}`} className="inline-block whitespace-nowrap [&:not(:last-child)]:mr-[0.24em]">
        {[...word].map((ch, ci) => (
          <span key={ci} className="inline-block overflow-hidden pb-[0.06em] align-top [perspective:700px]">
            <span data-fn-char className="invisible inline-block origin-bottom">
              {ch}
            </span>
          </span>
        ))}
      </span>
    ));
  return (
    <div className="pointer-events-none absolute inset-x-5 bottom-[7svh] text-[#141312] md:inset-x-[4.2vw] md:bottom-[9vh]">
      <h2 aria-label={finale.headline.join(" ")} className="text-[13.4vw] font-medium leading-[0.92] tracking-[-0.055em] md:text-[min(8.4vw,15vh)]">
        <span aria-hidden="true" className="block">
          {chars(l1, "l1")}
        </span>
        <span aria-hidden="true" data-fn-word="l2" className="block font-light md:pl-[9%]">
          {chars(l2, "l2")}
        </span>
      </h2>
      <div className="relative mt-7 flex flex-col gap-6 md:mt-10 md:flex-row md:items-end md:justify-between">
        <span data-fn-rule aria-hidden="true" className="absolute -top-4 left-0 hidden h-px w-[30%] origin-left bg-[#141312]/30 md:block" />
        <p data-fn-copy className="invisible max-w-[28ch] text-[17px] leading-[1.45] tracking-[-0.01em] text-[#141312]/75 md:text-[clamp(17px,1.4vw,22px)]">
          {finale.body}
        </p>
        <div data-fn-copy className="invisible">
          <ConnectButton onConnect={onConnect} />
        </div>
      </div>
    </div>
  );
}

function ConnectButton({ onConnect }: { onConnect: (origin: PanelOrigin) => void }) {
  const magnet = useMagnetic<HTMLDivElement>({ strength: 0.3, radius: 80 });
  return (
    <div ref={magnet} className="w-fit">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onConnect({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }}
        className="group pointer-events-auto relative inline-flex h-16 items-center gap-6 overflow-hidden rounded-full bg-[#141312] pl-8 pr-2.5 text-[13px] font-medium tracking-[0.18em] text-[#f4f1eb] shadow-[0_24px_50px_-24px_rgba(20,19,18,0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141312] md:h-[72px] md:pl-10 md:text-[14px]"
      >
        <span aria-hidden="true" className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,236,210,0.28),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-[340%]" />
        <span className="relative">{finale.cta.label}</span>
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_28%,#ffffff,#e6e3dd_45%,#a7a5a0)] text-[#141312] transition-transform duration-500 group-hover:rotate-45 md:h-[52px] md:w-[52px]">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
