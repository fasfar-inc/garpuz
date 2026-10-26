import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A smartphone built from layered DOM planes. Its back layers sit deeper on
 * the Z axis, so when a parent applies a 3D rotation the phone shows real
 * thickness and perspective — no WebGL, and the screen stays crisp.
 */
export function PhoneFrame({
  children,
  className,
  tone = "dark",
}: {
  children: ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div data-sv="phone" className={cn("relative aspect-[9/19] [transform-style:preserve-3d]", className)}>
      {/* Body thickness and rim. */}
      <div className="absolute inset-0 rounded-[13%/6.2%] bg-[#0b0c0f] [transform:translateZ(-16px)] shadow-[0_60px_90px_-30px_rgba(0,0,0,0.55)]" />
      <div className="absolute inset-0 rounded-[13%/6.2%] bg-[linear-gradient(135deg,#d9dbe0,#7d8189_35%,#e7e8ec_55%,#5f636b)] [transform:translateZ(-8px)]" />
      <div className="absolute inset-0 rounded-[13%/6.2%] bg-[linear-gradient(135deg,#c9ccd2,#6e727a_40%,#d4d6db)] p-[2.6%]">
        <div className="h-full w-full rounded-[11%/5.3%] bg-[#07080a] p-[2.4%]">
          <div className={cn("relative h-full w-full overflow-hidden rounded-[10%/4.7%]", tone === "dark" ? "bg-[#0d0f14]" : "bg-white")}>
            {children}
            {/* Dynamic island. */}
            <div className="absolute left-1/2 top-[1.6%] z-20 h-[3.4%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
          </div>
        </div>
      </div>
      {/* Glass glare, floating just above the screen. */}
      <div className="pointer-events-none absolute inset-[2.6%] rounded-[11%/5.3%] bg-[linear-gradient(115deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_32%,rgba(255,255,255,0)_70%,rgba(255,255,255,0.08)_100%)] [transform:translateZ(2px)]" />
    </div>
  );
}

/** Small "concept" disclosure shown with visuals of interfaces that are not shipped screens. */
export function VisualNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p data-sv="note" className={cn("pointer-events-none text-[10.5px] uppercase tracking-[0.22em] opacity-55", className)}>
      {children}
    </p>
  );
}
