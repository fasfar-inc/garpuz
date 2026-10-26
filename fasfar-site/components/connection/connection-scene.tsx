"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useContext, useRef } from "react";
import { chapters } from "@/content/site";
import { registerPalette } from "@/lib/stage/palette";
import { inRange } from "@/lib/stage/scroll";
import { StageContext } from "@/lib/stage/store";
import { IVORY_THEME } from "@/lib/stage/theme";
import { CONDITIONS, CONNECTION_PRIORITY, type Conditions } from "@/components/inside/motion";
import { ConnectionIntro } from "./connection-intro";
import { ConnectionInvitation } from "./connection-invitation";
import { ConnectionNetwork } from "./connection-network";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CHAPTER = chapters.findIndex((c) => c.id === "connection");

/**
 * Scene 7 — The Connection. Self-contained: drop it after any section.
 * Part 1 dissolves the previous layout into converging threads and type,
 * Part 2 is the interactive network of ways to connect, Part 3 invites a
 * conversation. Categories and copy live in content/connection.ts.
 */
export function ConnectionScene() {
  const store = useContext(StageContext);
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const sec = section.current!;
      const mm = gsap.matchMedia();
      mm.add(CONDITIONS, (ctx) => {
        const { reduced } = ctx.conditions as Conditions;
        // Scene 6's architecture dissolves as the threads arrive: its lines retract,
        // then its content fades. (Opacity and scale only on the section's children —
        // never a transform or filter on a section that contains a pin.)
        const previous = sec.previousElementSibling as HTMLElement | null;
        if (previous) {
          const profile = previous.querySelector<HTMLElement>("#company-profile");
          gsap
            .timeline({ scrollTrigger: { trigger: sec, start: "top bottom", end: "top 30%", scrub: true, refreshPriority: CONNECTION_PRIORITY.arrival } })
            .to(previous.querySelectorAll("#company-profile [data-line=h]"), { scaleX: 0, transformOrigin: "right", ease: "power1.in" }, 0)
            .to(previous.querySelectorAll("#company-profile [data-line=v]"), { scaleY: 0, transformOrigin: "bottom", ease: "power1.in" }, 0)
            .to(profile, { autoAlpha: 0, y: reduced ? 0 : -40, ease: "power1.in" }, 0.15);
        }
      });

      const st = ScrollTrigger.create({
        trigger: sec,
        start: "top 55%",
        end: "bottom top",
        refreshPriority: CONNECTION_PRIORITY.arrival,
        onEnter: () => store?.setChapter(CHAPTER),
        onEnterBack: () => store?.setChapter(CHAPTER),
        onLeaveBack: () => store?.setChapter(CHAPTER - 1),
      });
      const unregister = registerPalette({ owns: () => inRange(st), values: IVORY_THEME });
      ScrollTrigger.sort();
      return () => {
        unregister();
        mm.revert();
      };
    },
    { scope: section },
  );

  return (
    <section ref={section} id="connection" aria-label="The connection" className="relative bg-[#f1ede6] text-[#141312]">
      <ConnectionIntro />
      <ConnectionNetwork />
      <ConnectionInvitation />
    </section>
  );
}
