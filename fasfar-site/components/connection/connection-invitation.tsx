"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef } from "react";
import { conversationCta, invitation } from "@/content/connection";
import { cn } from "@/lib/cn";
import { useMagnetic } from "@/lib/motion/use-magnetic";
import { ArrowUpRight } from "@/components/ui/icons";
import { CONDITIONS, CONNECTION_PRIORITY, type Conditions } from "@/components/inside/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Part 3 — the invitation. Three enormous lines on a pale warm-grey field.
 * On desktop the section holds while the lines slide in from alternating
 * sides through masks and settle into a staggered composition; elsewhere
 * they rise as they scroll into view.
 */
export function ConnectionInvitation() {
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
            ? { trigger: el, start: "top top", end: "+=140%", pin: true, scrub: 0.8, refreshPriority: CONNECTION_PRIORITY.invitation }
            : { trigger: el, start: "top 80%", end: "bottom 75%", scrub: reduced ? true : 0.6, refreshPriority: CONNECTION_PRIORITY.invitation },
        });
        const lines = q("[data-inv=line]");
        lines.forEach((line, i) => {
          const fromX = cinematic ? (i % 2 ? 18 : -18) : 0;
          tl.fromTo(
            line,
            reduced ? { autoAlpha: 0 } : { xPercent: fromX, yPercent: 105, autoAlpha: 1 },
            { xPercent: 0, yPercent: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" },
            i * 0.18,
          );
        });
        tl.fromTo(q("[data-inv=rule]"), { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, 0.35)
          .fromTo(q("[data-inv=copy]"), { autoAlpha: 0, y: reduced ? 0 : 20 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.3 }, 0.6)
          .fromTo(q("[data-inv=bg]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0);
        tl.set({}, {}, 1.1);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const [l1, l2, l3] = invitation.lines;
  return (
    <div ref={root} id="invitation" className="relative flex min-h-svh flex-col justify-center overflow-hidden px-5 py-28 md:px-[4.2vw]">
      {/* The field cools from ivory to a pale warm grey, with one soft warm light. */}
      <div data-inv="bg" aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_78%_70%,rgba(255,226,190,0.55),rgba(255,226,190,0)_70%),linear-gradient(180deg,#f1ede6_0%,#e9e5de_100%)]" />

      <h2 aria-label={invitation.lines.join(" ")} className="relative text-[15vw] font-medium leading-[0.88] tracking-[-0.06em] text-[#141312] md:text-[min(12.5vw,23vh)]">
        {[l1, l2, l3].map((line, i) => (
          <span key={line} aria-hidden="true" className={cn("block overflow-hidden pb-[0.05em]", i === 1 && "md:pl-[18%]", i === 2 && "md:pl-[6%]")}>
            <span data-inv="line" className={cn("block", i === 1 && "font-light")}>
              {line}
            </span>
          </span>
        ))}
      </h2>

      <div className="relative mt-12 flex flex-col gap-8 md:mt-16 md:flex-row md:items-end md:justify-between">
        <span data-inv="rule" aria-hidden="true" className="absolute -top-6 left-0 hidden h-px w-[38%] origin-left bg-[#141312]/30 md:block" />
        <p data-inv="copy" className="max-w-[26ch] text-[clamp(1.3rem,5.4vw,1.6rem)] font-light leading-[1.25] tracking-[-0.03em] text-[#141312] md:text-[clamp(1.4rem,2vw,2.1rem)]">
          {invitation.body}
        </p>
        <div data-inv="copy">
          <ConversationButton />
        </div>
      </div>
    </div>
  );
}

function ConversationButton() {
  const magnet = useMagnetic<HTMLDivElement>({ strength: 0.3, radius: 80 });
  const { label, href } = conversationCta;
  const classes =
    "group relative inline-flex h-16 items-center gap-6 overflow-hidden rounded-full bg-[#141312] pl-8 pr-2.5 text-[13px] font-medium tracking-[0.16em] text-[#f4f1eb] shadow-[0_24px_50px_-24px_rgba(20,19,18,0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141312] md:h-[72px] md:pl-10 md:text-[14px]";
  const content = (
    <>
      {/* A metallic sheen crossing the button on hover. */}
      <span aria-hidden="true" className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,236,210,0.28),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-[340%]" />
      <span className="relative">{label}</span>
      <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_28%,#ffffff,#e6e3dd_45%,#a7a5a0)] text-[#141312] transition-transform duration-500 group-hover:rotate-45 md:h-[52px] md:w-[52px]">
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
