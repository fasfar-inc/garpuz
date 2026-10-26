"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { footer } from "@/content/finale";
import { registerPalette } from "@/lib/stage/palette";
import { NIGHT_THEME, type ThemeVars } from "@/lib/stage/theme";
import { CONDITIONS, FOOTER_PRIORITY, type Conditions } from "@/components/inside/motion";
import { HEADER_LINE } from "./finale-scene";
import { MiniSculpture } from "./mini-sculpture";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FOOTER_THEME: ThemeVars = { ...NIGHT_THEME, "--paper": "#050a1c" };
const pad = (n: number) => String(n).padStart(2, "0");
const subscribeNever = () => () => {};
const BUILD_YEAR = new Date().getFullYear();

/** The current year, read in the browser (the page itself is prerendered). */
function useYear() {
  return useSyncExternalStore(subscribeNever, () => new Date().getFullYear(), () => BUILD_YEAR);
}

/**
 * The signature footer: midnight, thin architectural lines, a minimal index
 * of the journey, and the wordmark at a scale that runs off the page. The
 * small sculpture takes you back to where it all began.
 */
export function SiteFooter() {
  const root = useRef<HTMLElement>(null);
  const year = useYear();
  const { legalName, registration, address } = footer.company;
  const details = [legalName, registration, address].filter(Boolean) as string[];

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();
      mm.add(CONDITIONS, (ctx) => {
        const { reduced } = ctx.conditions as Conditions;
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 85%", end: "top 25%", scrub: reduced ? true : 0.6, refreshPriority: FOOTER_PRIORITY } })
          .fromTo(q("[data-ft=h]"), { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", stagger: 0.1, duration: 0.6, ease: "power2.inOut" }, 0)
          .fromTo(q("[data-ft=v]"), { scaleY: 0 }, { scaleY: 1, transformOrigin: "top", stagger: 0.08, duration: 0.6, ease: "power2.inOut" }, 0.1)
          .fromTo(q("[data-ft=item]"), { autoAlpha: 0, y: reduced ? 0 : 22 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power2.out" }, 0.2);
        // The wordmark rises out of the bottom edge as you reach the end.
        gsap.fromTo(
          q("[data-ft=letter]"),
          { yPercent: reduced ? 0 : 70, autoAlpha: reduced ? 0 : 1 },
          {
            yPercent: 0,
            autoAlpha: 1,
            stagger: 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: q("[data-ft=mark]")[0], start: "top bottom", end: "bottom bottom", scrub: reduced ? true : 0.8, refreshPriority: FOOTER_PRIORITY },
          },
        );
      });

      const unregister = registerPalette({
        owns: () => el.getBoundingClientRect().top <= HEADER_LINE,
        values: FOOTER_THEME,
      });
      return () => {
        unregister();
        mm.revert();
      };
    },
    { scope: root },
  );

  // After the scroll back to Scene 1, keyboard focus starts at the top again.
  const focusTop = () =>
    requestAnimationFrame(() => document.querySelector<HTMLElement>('header a[href="#top"]')?.focus({ preventScroll: true }));

  return (
    <footer ref={root} id="site-footer" className="relative overflow-hidden bg-[#050a1c] text-[#eef1f8]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] bottom-[-20%] h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle,rgba(125,156,255,0.12),rgba(125,156,255,0)_65%)]" />
      </div>

      {/* The top line, with a light travelling along it. */}
      <div className="relative h-px overflow-hidden">
        <span data-ft="h" className="absolute inset-0 bg-white/15" />
        <span aria-hidden="true" className="footer-pulse absolute top-0 h-px w-40 bg-[linear-gradient(90deg,transparent,#e9b77f,transparent)]" />
      </div>

      <div className="relative mx-auto grid max-w-[1600px] gap-14 px-5 pb-10 pt-16 md:grid-cols-12 md:gap-0 md:px-[4.2vw] md:pt-24">
        <span data-ft="v" aria-hidden="true" className="absolute bottom-0 top-0 left-[calc(4.2vw+(100%-8.4vw)*5/12)] hidden w-px bg-white/10 md:block" />
        <span data-ft="v" aria-hidden="true" className="absolute bottom-0 top-0 left-[calc(4.2vw+(100%-8.4vw)*8/12)] hidden w-px bg-white/10 md:block" />

        <div className="md:col-span-5 md:pr-[4vw]">
          <p data-ft="item" className="text-[12px] uppercase tracking-[0.3em] text-[#eef1f8]/55">
            FASFAR
          </p>
          <p data-ft="item" className="mt-6 max-w-[16ch] text-[clamp(2rem,8.5vw,2.6rem)] font-light leading-[1.05] tracking-[-0.045em] md:text-[clamp(2.2rem,3.2vw,3.4rem)]">
            {footer.tagline}
          </p>
        </div>

        <nav aria-label="Footer" className="md:col-span-3 md:px-[3vw]">
          <p data-ft="item" className="text-[12px] uppercase tracking-[0.3em] text-[#eef1f8]/55">
            Index
          </p>
          <ul className="mt-6">
            {footer.links.map((link, i) => (
              <li key={link.href} data-ft="item">
                <Link href={link.href} className="group flex items-baseline gap-4 py-2 text-[17px] tracking-[-0.01em] text-[#eef1f8]/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  <span className="text-[11px] tabular-nums tracking-[0.2em] text-[#eef1f8]/40">{pad(i + 1)}</span>
                  <span className="relative">
                    {link.label}
                    <span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 group-hover:scale-x-100" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {footer.groups
            .filter((g) => g.links.length)
            .map((g) => (
              <div key={g.label} data-ft="item" className="mt-10">
                <p className="text-[12px] uppercase tracking-[0.3em] text-[#eef1f8]/55">{g.label}</p>
                <ul className="mt-4">
                  {g.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="block py-1.5 text-[15px] text-[#eef1f8]/75 hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </nav>

        <div className="flex md:col-span-4 md:justify-end">
          <a
            href="#top"
            onClick={focusTop}
            data-ft="item"
            className="group flex items-center gap-6 self-start rounded-full focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-white md:flex-col md:items-end md:gap-5"
          >
            <span className="relative flex h-32 w-32 items-center justify-center rounded-full border border-white/15 transition-[border-color,transform] duration-700 group-hover:border-white/35 md:h-40 md:w-40">
              <span aria-hidden="true" className="absolute inset-3 rounded-full border border-dashed border-white/10 motion-safe:animate-[spin_40s_linear_infinite]" />
              <MiniSculpture className="mini-sculpture h-[68%] w-[68%] transition-transform duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-translate-y-1 group-hover:rotate-[8deg] group-focus-visible:rotate-[8deg]" />
            </span>
            <span className="flex flex-col md:items-end">
              <span className="text-[12px] uppercase tracking-[0.3em] text-[#eef1f8]/55">Scene 01</span>
              <span className="mt-2 inline-flex items-center gap-3 text-[17px] tracking-[-0.01em]">
                {footer.backToTop}
                <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-1" aria-hidden="true">
                  <path d="M10 16V4.5M5.5 9 10 4.5 14.5 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </a>
        </div>
      </div>

      {/* The wordmark, larger than the page, rising from the bottom edge. */}
      <div data-ft="mark" aria-hidden="true" className="relative -mb-[4.6vw] flex justify-center overflow-hidden px-[2vw] pt-6">
        <span className="inline-flex text-[25vw] font-medium leading-[0.86] tracking-[0.04em] [margin-right:-0.04em]">
          {["F", "Λ", "S", "F", "Λ", "R"].map((l, i) => (
            <span key={i} className="inline-block overflow-hidden">
              <span data-ft="letter" className="inline-block bg-[linear-gradient(180deg,#eef1f8_0%,#8d97b4_55%,rgba(141,151,180,0)_100%)] bg-clip-text text-transparent">
                {l}
              </span>
            </span>
          ))}
        </span>
      </div>

      <div className="relative mx-auto max-w-[1600px] px-5 md:px-[4.2vw]">
        <span data-ft="h" aria-hidden="true" className="block h-px bg-white/15" />
        <div className="flex flex-col gap-4 py-6 text-[12.5px] text-[#eef1f8]/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} FASFAR. All rights reserved.
            {details.length > 0 && <span className="md:ml-4">{details.join(" · ")}</span>}
          </p>
          {footer.social.length > 0 && (
            <ul className="flex gap-6">
              {footer.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener noreferrer" target="_blank" className="hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
