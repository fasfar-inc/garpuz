"use client";

import { chapters, ecosystem, hero, manifesto, signOff } from "@/content/site";
import { cn } from "@/lib/cn";
import { useStageValue } from "@/lib/stage/store";
import { Globe } from "@/components/ui/icons";

/** Persistent frame around the stage: manifesto, scroll cue, chapter rail, sign-off. */
export function StageChrome() {
  const chapter = useStageValue((s) => s.chapter, 0);
  return (
    <div className="pointer-events-none absolute inset-0 text-(--ink)">
      <p data-intro="rise" className="eyebrow absolute right-[4.2vw] top-[15%] hidden border-l border-(--hairline-strong) py-1 pl-6 tall:block">
        {manifesto.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>

      <div data-intro="rise" className="absolute bottom-7 left-5 flex items-start gap-5 md:bottom-[6.5%] md:left-[4.2vw]">
        <span className="relative flex flex-col items-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-(--hairline-strong)">
            <span className="h-2 w-2 animate-[cue_2.4s_ease-in-out_infinite] rounded-full bg-current motion-reduce:animate-none" />
          </span>
          <span className="h-7 w-px bg-(--hairline-strong)" />
        </span>
        <span className="eyebrow relative mt-8 hidden sm:block">
          <span data-hint="hero" className="block">
            {hero.scrollHint[0]}
            <br />
            {hero.scrollHint[1]}
          </span>
          <span data-hint="eco" className="invisible absolute inset-0 block">
            {ecosystem.scrollHint[0]}
            <br />
            {ecosystem.scrollHint[1]}
          </span>
        </span>
      </div>

      <div data-intro="rise" className="absolute bottom-9 left-1/2 w-[min(46vw,330px)] -translate-x-1/2 md:bottom-[7%]">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-(--hairline)">
          <div data-rail-fill className="h-full w-full origin-left rounded-full bg-(--ink)" style={{ transform: `scaleX(${1 / chapters.length})` }} />
        </div>
        <ol className="mt-4 flex justify-between text-[12px] tabular-nums">
          {chapters.map((c, i) => (
            <li key={c.id} className={cn("transition-colors duration-500", i <= chapter ? "text-(--ink)" : "text-(--ink-muted) opacity-60")}>
              <span className="sr-only">Chapter </span>
              {String(i + 1).padStart(2, "0")}
            </li>
          ))}
        </ol>
      </div>

      <div data-intro="rise" className="absolute bottom-[6.6%] right-[4.2vw] hidden items-center gap-6 md:flex">
        <span className="h-7 w-px bg-(--hairline-strong)" />
        <Globe className="h-6 w-6 opacity-80" />
        <p className="eyebrow">
          {signOff[0]}
          <br />
          {signOff[1]}
        </p>
      </div>
    </div>
  );
}
