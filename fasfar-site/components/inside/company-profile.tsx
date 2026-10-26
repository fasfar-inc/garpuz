"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef } from "react";
import { companyProfile } from "@/content/company";
import { cn } from "@/lib/cn";
import { useMagnetic } from "@/lib/motion/use-magnetic";
import { ArrowUpRight } from "@/components/ui/icons";
import { CompanyInfoBlocks } from "./company-info";
import { HLine, Mark, VLine } from "./lines";
import { CONDITIONS, PRIORITY, type Conditions } from "./motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Part 4 — the company profile, set as an editorial spread: the two-line
 * headline staggered across the grid, the description in a narrow column,
 * linework that draws as you arrive, and a slowly turning compass of lines.
 */
export function CompanyProfile() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();
      mm.add(CONDITIONS, (ctx) => {
        const { reduced } = ctx.conditions as Conditions;
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 80%", end: "center 60%", scrub: reduced ? true : 0.6, refreshPriority: PRIORITY.profile } })
          .fromTo(q("[data-line=h]"), { scaleX: 0 }, { scaleX: 1, stagger: 0.06, duration: 0.4, ease: "power2.inOut" }, 0)
          .fromTo(q("[data-line=v]"), { scaleY: 0 }, { scaleY: 1, stagger: 0.06, duration: 0.4, ease: "power2.inOut" }, 0.05)
          .fromTo(q("[data-mark]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 0.3)
          .fromTo(q("[data-cp=line]"), { yPercent: reduced ? 0 : 110, autoAlpha: reduced ? 0 : 1 }, { yPercent: 0, autoAlpha: 1, stagger: 0.12, duration: 0.45, ease: "power3.out" }, 0.1)
          .fromTo(q("[data-cp=copy]"), { autoAlpha: 0, y: reduced ? 0 : 24 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.35 }, 0.4)
          .fromTo(q("[data-cp=compass] [stroke]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.05, duration: 0.5, ease: "power2.out" }, 0.2);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const [first, second] = companyProfile.headline;
  return (
    <div ref={root} id="company-profile" className="relative overflow-hidden px-5 pb-28 pt-24 md:px-[4.2vw] md:pb-40 md:pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <HLine top="0%" />
        <VLine left="calc(4.2vw + 33.33% - 2.8vw)" top="46%" className="hidden md:block" />
        <VLine left="calc(100% - 4.2vw)" className="hidden md:block" />
        <Mark top="0%" left="calc(4.2vw + 33.33% - 2.8vw)" />
      </div>

      <p data-cp="copy" className="eyebrow relative">
        {companyProfile.eyebrow}
      </p>

      <h2 className="relative mt-8 text-[clamp(2.8rem,13vw,4.2rem)] leading-[0.95] tracking-[-0.055em] text-[#141312] md:mt-12 md:text-[min(7vw,13vh)]">
        <span className="block overflow-hidden pb-[0.06em]">
          <span data-cp="line" className="block font-light">
            {first}
          </span>
        </span>
        <span className="block overflow-hidden pb-[0.06em] md:pl-[33.33%]">
          <span data-cp="line" className="block font-medium">
            {second}
          </span>
        </span>
      </h2>

      <div className="relative mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-x-[4vw]">
        <Compass />
        <div className="md:col-span-2 md:max-w-[56ch]">
          <p data-cp="copy" className="text-[17px] leading-[1.6] text-[#141312]/75 md:text-[clamp(17px,1.45vw,22px)]">
            {companyProfile.body}
          </p>
          <div data-cp="copy" className="mt-10">
            <AboutButton />
          </div>
        </div>
      </div>

      <CompanyInfoBlocks />
    </div>
  );
}

/** Concentric linework that turns very slowly — ideas, structure, growth. */
function Compass() {
  const stroke = { fill: "none", stroke: "#141312", strokeWidth: 0.6, pathLength: 1, strokeDasharray: "1" };
  return (
    <svg data-cp="compass" viewBox="0 0 120 120" aria-hidden="true" className="hidden h-auto w-[min(70%,220px)] motion-safe:animate-[spin_90s_linear_infinite] md:block">
      <circle cx="60" cy="60" r="56" {...stroke} strokeOpacity={0.25} />
      <circle cx="60" cy="60" r="38" {...stroke} strokeOpacity={0.4} />
      <circle cx="60" cy="60" r="18" {...stroke} strokeOpacity={0.7} />
      <path d="M60 2 V118 M2 60 H118" {...stroke} strokeOpacity={0.2} />
      <path d="M19 19 L101 101" {...stroke} strokeOpacity={0.15} />
      <circle cx="60" cy="4" r="2.5" fill="#141312" />
    </svg>
  );
}

function AboutButton() {
  const magnet = useMagnetic<HTMLDivElement>({ strength: 0.3, radius: 70 });
  const { label, href } = companyProfile.cta;
  const classes =
    "group relative inline-flex items-center gap-4 border-b border-[#141312] pb-2 text-[clamp(20px,1.8vw,26px)] tracking-[-0.02em] text-[#141312] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#141312]";
  const content = (
    <>
      <span>{label}</span>
      <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#141312]/30 transition-colors duration-500 group-hover:bg-[#141312] group-hover:text-[#f1ede6]">
        <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
      <span aria-hidden="true" className="absolute -bottom-px left-0 h-px w-full origin-right scale-x-0 bg-[#141312] transition-transform duration-700 group-hover:origin-left group-hover:scale-x-100" />
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
