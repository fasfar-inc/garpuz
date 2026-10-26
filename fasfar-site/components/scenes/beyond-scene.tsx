"use client";

import Link from "next/link";
import { beyond } from "@/content/site";
import { cn } from "@/lib/cn";
import { useMagnetic } from "@/lib/motion/use-magnetic";
import { ArrowRight } from "@/components/ui/icons";

/**
 * Scene 3 — "Beyond the ordinary". Split into layers around the WebGL canvas:
 * the backdrop and the giant statements sit beneath it (so the floating 3D
 * pieces drift in front of the words), the copy sits above it. The stage
 * timeline drives everything through the `data-beyond*` attributes.
 */

/** Warm studio light that replaces the midnight sky. Below the canvas. */
export function BeyondBackdrop() {
  return (
    <div data-beyond-backdrop aria-hidden="true" className="invisible absolute inset-0 overflow-hidden opacity-0">
      <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_78%_18%,rgba(255,238,214,0.9)_0%,rgba(255,238,214,0)_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(45%_40%_at_12%_88%,rgba(205,196,184,0.45)_0%,rgba(205,196,184,0)_70%)]" />
      <div data-beyond-rule className="absolute bottom-[13%] left-[61%] top-[58%] hidden w-px origin-top bg-(--hairline-strong) md:block" />
    </div>
  );
}

const STATEMENT_FILLS = [
  "bg-[linear-gradient(180deg,#141312_38%,#6b625a_100%)]",
  "bg-[linear-gradient(180deg,#141312_38%,#6b625a_100%)]",
  "bg-[linear-gradient(180deg,#141312_30%,#93694a_100%)]",
];

/** WE THINK. / WE CREATE. / WE BUILD. — outlined, then filled by a clipping wipe. Below the canvas. */
export function BeyondStatements() {
  return (
    <div data-beyond-layer="statements" className="pointer-events-none absolute inset-0">
      <div
        data-beyond-statements
        className="absolute left-5 top-[21%] origin-top-left text-[14.6vw] font-medium leading-[0.94] tracking-[-0.045em] text-(--ink) [--indent:0.45em] md:left-[4.2vw] md:top-[19.5%] md:text-[min(9.4vw,15vh)] md:[--indent:0.85em]"
      >
        {beyond.statements.map((statement, i) => (
          <StatementLine key={statement} text={statement} index={i} />
        ))}
      </div>
    </div>
  );
}

function StatementLine({ text, index }: { text: string; index: number }) {
  const magnet = useMagnetic<HTMLDivElement>({ strength: 0.06, radius: 140 });
  return (
    <div data-beyond-line className="relative" style={{ marginLeft: `calc(var(--indent) * ${index})` }}>
      <div ref={magnet} className="w-fit">
        <div className="overflow-hidden pb-[0.06em] [perspective:900px]">
          <div data-beyond-word className="invisible relative w-fit origin-[50%_100%] will-change-transform">
            <span className="block whitespace-nowrap text-transparent [-webkit-text-stroke:1.5px_rgba(20,19,18,0.5)]">{text}</span>
            <span
              data-beyond-fill
              aria-hidden="true"
              className={cn("absolute inset-0 block whitespace-nowrap bg-clip-text text-transparent [clip-path:inset(0_100%_0_0)]", STATEMENT_FILLS[index])}
            >
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Eyebrow, headline, supporting text and the magnetic CTA. Above the canvas. */
export function BeyondCopy() {
  return (
    <div data-beyond-layer="copy" className="pointer-events-none absolute inset-0">
      <div className="absolute left-5 top-[92px] md:left-[4.2vw] md:top-[13%]">
        <span data-beyond="rise" className="invisible block h-px w-9 bg-(--ink)/60" />
        <p data-beyond="rise" className="eyebrow invisible mt-4">
          <span className="tabular-nums">03</span>
          <span className="mx-3 inline-block h-px w-5 translate-y-[-0.3em] bg-current align-middle opacity-60" />
          {beyond.eyebrow}
        </p>
      </div>

      <div className="absolute inset-x-5 bottom-[112px] md:inset-x-auto md:bottom-[15%] md:right-[4.2vw] md:w-[min(33vw,500px)] tall:bottom-[16.5%]">
        <h2 className="text-[clamp(1.9rem,8.4vw,2.4rem)] font-light leading-[1.04] tracking-[-0.045em] text-(--ink) md:text-[clamp(2rem,min(3.3vw,6vh),3.5rem)]">
          {beyond.headline.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.07em]">
              <span data-beyond="line" className={cn("invisible block", i === 1 && "font-medium")}>
                {line}
              </span>
            </span>
          ))}
        </h2>
        <p data-beyond="copy" className="invisible mt-4 max-w-[38ch] text-[15px] leading-[1.55] text-(--ink-muted) md:mt-6 md:text-[clamp(15px,1.2vw,17.5px)]">
          {beyond.body}
        </p>
        <div data-beyond="copy" className="invisible mt-6 md:mt-9">
          <DiscoverButton />
        </div>
      </div>
    </div>
  );
}

function DiscoverButton() {
  const magnet = useMagnetic<HTMLDivElement>({ strength: 0.35, radius: 70 });
  const { label, href } = beyond.cta;
  const classes =
    "group pointer-events-auto relative inline-flex h-12 items-center gap-5 overflow-hidden rounded-full bg-(--ink) pl-7 pr-2 text-[15px] tracking-[-0.01em] text-(--paper) md:h-[54px] md:pl-8";
  const content = (
    <>
      {/* Hover sheen sweeps across the pill. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-[320%]"
      />
      <span className="relative">{label}</span>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-(--paper) text-(--ink) transition-transform duration-500 ease-out group-hover:rotate-[-45deg] md:h-10 md:w-10">
        <ArrowRight className="h-4 w-4" />
      </span>
    </>
  );
  return (
    <div ref={magnet} className="w-fit">
      {href ? (
        <Link href={href} className={cn(classes, "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--ink)")}>
          {content}
        </Link>
      ) : (
        <button
          type="button"
          aria-disabled="true"
          title="Coming soon"
          className={cn(classes, "cursor-default focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--ink)")}
        >
          {content}
        </button>
      )}
    </div>
  );
}
