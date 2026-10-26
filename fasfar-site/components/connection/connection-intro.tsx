"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { connectionIntro } from "@/content/connection";
import { MaskedChars } from "@/components/inside/lines";
import { CONDITIONS, CONNECTION_PRIORITY, type Conditions } from "@/components/inside/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Threads that start at different edges of the screen and curve towards one
 * meeting point (the C of CONNECTION), in a 1600×1000 box. A small luminous
 * node marks each origin; a metal bead marks where they meet.
 */
const MEET = { x: 1030, y: 640 };
const THREADS = [
  { from: [0, 120], c1: [380, 80], c2: [700, 560] },
  { from: [0, 860], c1: [420, 980], c2: [780, 700] },
  { from: [520, 0], c1: [560, 300], c2: [880, 420] },
  { from: [1600, 180], c1: [1300, 120], c2: [1180, 520] },
  { from: [1600, 900], c1: [1360, 980], c2: [1220, 720] },
  { from: [1180, 1000], c1: [1120, 860], c2: [1080, 760] },
];
const threadPath = (t: (typeof THREADS)[number]) => `M${t.from[0]} ${t.from[1]} C ${t.c1[0]} ${t.c1[1]}, ${t.c2[0]} ${t.c2[1]}, ${MEET.x} ${MEET.y}`;

/**
 * Part 1 — the transition. Scene 6's linework gives way to threads that
 * draw in from the edges and converge, while GREAT THINGS / BEGIN WITH /
 * A CONNECTION. rise through masks, CONNECTION letter by letter.
 */
export function ConnectionIntro() {
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
            ? { trigger: el, start: "top top", end: "+=150%", pin: true, scrub: 0.8, refreshPriority: CONNECTION_PRIORITY.intro }
            : { trigger: el, start: "top 80%", end: "bottom 65%", scrub: reduced ? true : 0.6, refreshPriority: CONNECTION_PRIORITY.intro },
        });
        tl.fromTo(q("[data-ci=thread]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.05, duration: 0.45, ease: "power2.inOut" }, 0)
          .fromTo(q("[data-ci=origin]"), { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, stagger: 0.05, duration: 0.1, transformOrigin: "50% 50%" }, 0)
          .fromTo(q("[data-ci=bead]"), { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.2, ease: "back.out(2)" }, 0.42)
          .fromTo(q("[data-ci=glow]"), { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.4 }, 0.4)
          .fromTo(q("[data-ci=eyebrow]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.1)
          .fromTo(
            q("[data-ci=line]"),
            { yPercent: reduced ? 0 : 112, autoAlpha: reduced ? 0 : 1 },
            { yPercent: 0, autoAlpha: 1, stagger: 0.14, duration: 0.35, ease: "power3.out" },
            0.15,
          )
          .fromTo(
            q("[data-ci-char]"),
            reduced ? { autoAlpha: 0 } : { yPercent: 115, rotationX: -80, autoAlpha: 1 },
            { yPercent: 0, rotationX: 0, autoAlpha: 1, stagger: 0.035, duration: 0.3, ease: "power3.out" },
            0.5,
          );
        // Once connected, the threads breathe with a slow travelling light.
        tl.fromTo(q("[data-ci=pulse]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 0.8);
        tl.set({}, {}, 1.2);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const [l1, l2, l3] = connectionIntro.lines;
  return (
    <div ref={root} className="relative flex min-h-svh flex-col justify-center overflow-hidden px-5 py-28 md:px-[4.2vw]">
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="ci-bead" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.25" stopColor="#d6d6da" />
            <stop offset="0.6" stopColor="#6f7178" />
            <stop offset="1" stopColor="#2b2c30" />
          </radialGradient>
          <radialGradient id="ci-glow">
            <stop offset="0" stopColor="#ffd9ad" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ffd9ad" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle data-ci="glow" cx={MEET.x} cy={MEET.y} r="220" fill="url(#ci-glow)" />
        {THREADS.map((t, i) => (
          <g key={i}>
            <path data-ci="thread" d={threadPath(t)} fill="none" stroke="#141312" strokeOpacity={0.22 + (i % 3) * 0.08} strokeWidth="1.2" pathLength={1} strokeDasharray="1" />
            <path data-ci="pulse" d={threadPath(t)} fill="none" stroke="#e9b77f" strokeWidth="2.2" strokeLinecap="round" pathLength={1} strokeDasharray="0.025 0.975" className="motion-safe:animate-[link-pulse_5s_linear_infinite]" style={{ animationDelay: `${i * -0.8}s` }} />
            <circle data-ci="origin" cx={t.from[0] + (t.from[0] === 1600 ? -14 : t.from[0] === 0 ? 14 : 0)} cy={t.from[1] + (t.from[1] === 1000 ? -14 : t.from[1] === 0 ? 14 : 0)} r="4" fill="#e9b77f" />
          </g>
        ))}
        <circle data-ci="bead" cx={MEET.x} cy={MEET.y} r="14" fill="url(#ci-bead)" />
      </svg>

      <p data-ci="eyebrow" className="eyebrow relative flex items-center gap-3">
        <span className="tabular-nums">07</span>
        <span className="h-px w-5 bg-current opacity-60" />
        {connectionIntro.eyebrow}
      </p>
      <h2
        aria-label={[l1, l2, `${l3} ${connectionIntro.keyword}`].join(" ")}
        className="relative mt-6 text-[12.4vw] font-medium leading-[0.9] tracking-[-0.055em] text-[#141312] md:mt-8 md:text-[min(10.6vw,19vh)]"
      >
        <span aria-hidden="true" className="block overflow-hidden pb-[0.05em]">
          <span data-ci="line" className="block">
            {l1}
          </span>
        </span>
        <span aria-hidden="true" className="block overflow-hidden pb-[0.05em] md:pl-[1.2em]">
          <span data-ci="line" className="block font-light">
            {l2}
            {/* On phones "A" joins this line, so CONNECTION. has a line of its own. */}
            <span className="md:hidden"> {l3}</span>
          </span>
        </span>
        <span aria-hidden="true" className="block md:pl-[0.4em]">
          <span className="hidden overflow-hidden pb-[0.05em] align-top md:inline-block">
            <span data-ci="line" className="inline-block pr-[0.25em] font-light">
              {l3}
            </span>
          </span>
          <span className="block [perspective:900px] md:inline-block">
            <MaskedChars text={connectionIntro.keyword} charAttr="data-ci-char" />
          </span>
        </span>
      </h2>
    </div>
  );
}
