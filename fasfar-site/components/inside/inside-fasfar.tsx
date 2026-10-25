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
import { CompanyProfile } from "./company-profile";
import { CompanyStructure } from "./company-structure";
import { HowWeBuild } from "./how-we-build";
import { InsideIntro } from "./inside-intro";
import { CONDITIONS, PRIORITY, type Conditions } from "./motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CHAPTER = chapters.findIndex((c) => c.id === "inside");

/**
 * Scene 6 — Inside FASFAR. The corporate chapter: a quieter, editorial
 * register after the cinematic scenes. Part 1 introduces it, Part 2 explains
 * how FASFAR builds, Part 3 maps the structure, Part 4 profiles the company.
 */
export function InsideFasfar() {
  const store = useContext(StageContext);
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const sec = section.current!;
      const mm = gsap.matchMedia();
      mm.add(CONDITIONS, (ctx) => {
        const { reduced } = ctx.conditions as Conditions;
        // As Scene 6 rises, Scene 5's last frame (sculpture and vision) fades back into
        // the ivory. Opacity only: a transform or filter on #horizon would become the
        // containing block for its pinned (position: fixed) view and break the pin.
        const horizon = document.getElementById("horizon");
        if (horizon) {
          gsap.fromTo(
            horizon,
            { autoAlpha: 1 },
            {
              autoAlpha: 0,
              ease: reduced ? "none" : "power1.in",
              scrollTrigger: { trigger: sec, start: "top bottom", end: "top 25%", scrub: true, refreshPriority: PRIORITY.arrival },
            },
          );
        }
      });

      const st = ScrollTrigger.create({
        trigger: sec,
        start: "top 55%",
        end: "bottom top",
        refreshPriority: PRIORITY.arrival,
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
    <section
      ref={section}
      id="inside"
      aria-label="Inside FASFAR"
      className="relative bg-[radial-gradient(80%_40%_at_60%_0%,#fbf9f5_0%,#f1ede6_70%)] text-[#141312]"
    >
      <InsideIntro />
      <HowWeBuild />
      <CompanyStructure />
      <CompanyProfile />
    </section>
  );
}
