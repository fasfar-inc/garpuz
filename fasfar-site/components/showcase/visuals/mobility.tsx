"use client";

import { showcase } from "@/content/site";
import type { Venture } from "@/content/ventures";
import { useTilt } from "@/lib/motion/use-tilt";
import { PhoneFrame, VisualNote } from "./phone-frame";

/**
 * GARDAŞ — a floating phone with a route drawing itself across a map, in
 * premium blue and ivory. No GARDAŞ interface assets exist yet, so the screen
 * is an abstract concept: map, route and a neutral sheet without data.
 */
export function MobilityVisual({ venture }: { venture: Venture }) {
  const tilt = useTilt<HTMLDivElement>({ max: 7 });
  const { primary, secondary } = venture.colors;
  return (
    <div className="relative h-full w-full [perspective:1600px]">
      <div data-sv="glow" className="absolute left-1/2 top-1/2 aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-3xl" style={{ background: `radial-gradient(closest-side, ${secondary}88, ${primary}22 60%, transparent)` }} />
      <div data-sv="ring" className="absolute left-1/2 top-1/2 aspect-square w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: `${primary}33` }} />

      <div ref={tilt} className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
        <div data-sv="rig" className="relative [transform-style:preserve-3d]">
          <PhoneFrame tone="light" className="w-[min(15rem,50vw)] md:w-[min(19rem,24vw,38vh)]">
            <MapScreen primary={primary} name={venture.name} />
          </PhoneFrame>
          <Chip label="Mobility" className="-left-[26%] top-[18%] md:-left-[38%]" depth={90} color={primary} />
          <Chip label="Delivery" className="-right-[24%] top-[58%] md:-right-[34%]" depth={140} color={primary} />
          <div data-sv="float" data-depth="60" className="absolute -right-[22%] top-[6%] h-14 w-14 rounded-full border border-white/70 bg-white/40 shadow-[0_20px_40px_-18px_rgba(31,79,216,0.5)] backdrop-blur-md [transform:translateZ(60px)]" />
        </div>
      </div>
      <div data-sv="shadow" className="absolute bottom-[5%] left-1/2 h-[5%] w-[36%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(20,30,60,0.28),transparent)] blur-md" />
      <VisualNote className="absolute bottom-0 right-0 text-[#141312]">{showcase.conceptNote}</VisualNote>
    </div>
  );
}

function Chip({ label, className, depth, color }: { label: string; className: string; depth: number; color: string }) {
  return (
    <div
      data-sv="float"
      data-depth={depth}
      className={`absolute ${className} flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-[#141312] shadow-[0_24px_50px_-24px_rgba(20,30,70,0.45)] backdrop-blur-md`}
      style={{ transform: `translateZ(${depth}px)` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

const STREETS = [
  "M-10 70 C 60 60, 120 90, 210 70",
  "M-10 150 C 70 140, 140 170, 210 140",
  "M-10 250 C 60 240, 150 270, 210 250",
  "M-10 330 C 80 320, 120 350, 210 330",
  "M40 -10 C 50 100, 30 200, 50 430",
  "M120 -10 C 110 120, 140 260, 120 430",
  "M175 -10 C 170 150, 190 300, 170 430",
];

function MapScreen({ primary, name }: { primary: string; name: string }) {
  return (
    <div className="absolute inset-0 bg-[#eef1f6]">
      <svg viewBox="0 0 200 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x="58" y="88" width="48" height="40" rx="6" fill="#e2e7f0" />
        <rect x="130" y="180" width="36" height="54" rx="6" fill="#e2e7f0" />
        <rect x="18" y="270" width="64" height="42" rx="6" fill="#dfe9e2" />
        {STREETS.map((d) => (
          <path key={d} d={d} fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" />
        ))}
        <path d="M50 330 C 52 260, 40 200, 60 150 S 118 110, 122 70" fill="none" stroke={primary} strokeOpacity="0.18" strokeWidth="10" strokeLinecap="round" />
        <path data-sv="route" d="M50 330 C 52 260, 40 200, 60 150 S 118 110, 122 70" fill="none" stroke={primary} strokeWidth="5" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
        <circle cx="50" cy="330" r="7" fill="#fff" stroke={primary} strokeWidth="4" />
        <g data-sv="pin">
          <circle cx="122" cy="70" r="16" fill={primary} opacity="0.16" />
          <circle cx="122" cy="70" r="7" fill={primary} />
        </g>
      </svg>
      <div className="absolute inset-x-[5%] bottom-[3.5%] rounded-[1.4rem] bg-white p-[7%] shadow-[0_-10px_30px_-18px_rgba(20,30,60,0.35)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10" />
        <p className="text-[11px] font-semibold tracking-[0.12em]" style={{ color: primary }}>
          {name}
        </p>
        {["Pickup", "Drop-off"].map((label, i) => (
          <div key={label} className="mt-3 flex items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={i ? { background: primary } : { border: `2px solid ${primary}` }} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-black/45">{label}</p>
              <div className="mt-1 h-2 w-[70%] rounded-full bg-black/[0.08]" />
            </div>
          </div>
        ))}
        <div className="mt-4 h-9 rounded-full" style={{ background: primary }} />
      </div>
    </div>
  );
}
