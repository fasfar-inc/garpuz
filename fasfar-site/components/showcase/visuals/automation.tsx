"use client";

import { showcase } from "@/content/site";
import type { Venture } from "@/content/ventures";
import { cn } from "@/lib/cn";
import { useTilt } from "@/lib/motion/use-tilt";
import { VisualNote } from "./phone-frame";

/**
 * FFMate — a quiet, luminous AI space: a conversation that builds up as you
 * scroll, next to an automation flow whose connections draw in and pulse.
 * Everything here is a concept; no FFMate interface assets exist yet.
 */
const MESSAGES = [
  { from: "user", text: "When a new request comes in, sort it and let the right person know." },
  { from: "ai", text: "Understood. I'll classify each request, update the records and notify the owner." },
  { from: "user", text: "And send me a short summary every evening." },
  { from: "ai", text: "Scheduled — a daily summary at 18:00." },
] as const;

const NODES = [
  { label: "New request", kind: "Trigger", x: 8, y: 10 },
  { label: "Understand", kind: "AI", x: 52, y: 30 },
  { label: "Update records", kind: "Action", x: 10, y: 56 },
  { label: "Notify owner", kind: "Action", x: 54, y: 78 },
];
const LINKS = ["M30 17 C 44 18, 46 34, 56 36", "M60 42 C 54 56, 40 56, 30 62", "M30 68 C 42 74, 48 80, 58 84"];

export function AutomationVisual({ venture }: { venture: Venture }) {
  const tilt = useTilt<HTMLDivElement>({ max: 5 });
  const { primary, secondary } = venture.colors;
  return (
    <div className="relative h-full w-full [perspective:1600px]">
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(158,240,255,0.18)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(closest-side,black,transparent)]" />
      <div data-sv="glow" className="absolute left-1/2 top-1/2 aspect-square w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl" style={{ background: `radial-gradient(closest-side, ${primary}50, transparent)` }} />

      <div ref={tilt} className="absolute inset-0 [transform-style:preserve-3d]">
        <div data-sv="rig" className="absolute inset-0 grid grid-rows-[auto_1fr] gap-4 md:grid-cols-[1.05fr_1fr] md:grid-rows-1 md:items-center md:gap-8 [transform-style:preserve-3d]">
          {/* Conversation. */}
          <div data-sv="panel" className="relative mx-auto w-full max-w-[24rem] rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(91,140,255,0.08),0_40px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl [transform:translateZ(40px)] md:p-5">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full" style={{ background: `${primary}26` }}>
                <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px_2px_var(--g)]" style={{ background: secondary, ["--g" as string]: secondary }} />
              </span>
              <span className="text-[13px] font-medium text-white/90">{venture.name}</span>
              <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-white/35">Assistant</span>
            </div>
            <div className="mt-3 flex min-h-[15.5rem] flex-col gap-2.5 md:min-h-[17rem]">
              {MESSAGES.map((m, k) => (
                <p
                  key={k}
                  data-sv="bubble"
                  className={cn(
                    "invisible max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-[1.45]",
                    m.from === "user" ? "self-end rounded-br-md bg-white/[0.09] text-white/85" : "self-start rounded-bl-md text-white",
                  )}
                  style={m.from === "ai" ? { background: `linear-gradient(135deg, ${primary}cc, ${primary}88)`, boxShadow: `0 10px 30px -12px ${primary}` } : undefined}
                >
                  {m.text}
                </p>
              ))}
            </div>
          </div>

          {/* Automation flow. */}
          <div data-sv="flow" className="relative hidden aspect-[4/5] w-full max-w-[22rem] md:block [transform:translateZ(90px)]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <filter id="ffmate-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.2" />
                </filter>
              </defs>
              {LINKS.map((d) => (
                <g key={d}>
                  <path data-sv="wire" d={d} fill="none" stroke={primary} strokeOpacity="0.35" strokeWidth="0.6" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
                  <path d={d} fill="none" stroke={secondary} strokeWidth="0.9" strokeDasharray="4 22" filter="url(#ffmate-glow)" className="motion-safe:animate-[flow_2.6s_linear_infinite]" data-sv="pulse" opacity="0" />
                </g>
              ))}
            </svg>
            {NODES.map((n) => (
              <div
                key={n.label}
                data-sv="node"
                className="group absolute flex w-[46%] items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0b1222]/90 px-3 py-2.5 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:border-[var(--p)] hover:shadow-[0_0_30px_-6px_var(--p)]"
                style={{ left: `${n.x}%`, top: `${n.y}%`, ["--p" as string]: primary }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold" style={{ background: `${primary}22`, color: secondary }}>
                  {n.kind === "AI" ? "AI" : n.kind[0]}
                </span>
                <span>
                  <span className="block text-[9px] uppercase tracking-[0.18em] text-white/40">{n.kind}</span>
                  <span className="block text-[12px] text-white/90">{n.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <span data-sv="float" data-depth="120" className="absolute right-[6%] top-[4%] hidden rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] text-white/60 backdrop-blur md:block [transform:translateZ(120px)]">
          Automate
        </span>
        <span data-sv="float" data-depth="70" className="absolute bottom-[6%] left-[2%] hidden rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] text-white/60 backdrop-blur md:block [transform:translateZ(70px)]">
          Understand
        </span>
      </div>
      <VisualNote className="absolute bottom-0 right-0 text-[#e8eeff]">{showcase.conceptNote}</VisualNote>
    </div>
  );
}

export const AUTOMATION_STEPS = MESSAGES.length;
