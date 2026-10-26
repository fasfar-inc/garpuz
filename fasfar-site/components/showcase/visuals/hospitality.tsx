"use client";

import { showcase } from "@/content/site";
import type { Venture } from "@/content/ventures";
import { cn } from "@/lib/cn";
import { useTilt } from "@/lib/motion/use-tilt";
import { PhoneFrame, VisualNote } from "./phone-frame";

/**
 * MenuFlex — warm, low-lit restaurant mood: a phone showing a digital menu
 * whose categories change as you scroll (or tap a tab), and a QR card that
 * "scans" on hover. The menu is a concept with illustrative dishes, and the
 * QR pattern is decorative — it encodes nothing.
 */
const CATEGORIES = [
  { name: "Starters", items: [["Burrata", "Heirloom tomato, basil oil", 320], ["Halloumi", "Grilled, honey, thyme", 280], ["Soup of the day", "Ask your server", 210]] },
  { name: "Mains", items: [["Sea bass", "Lemon butter, greens", 690], ["Lamb shank", "Slow-cooked, orzo", 750], ["Wild mushroom risotto", "Parmesan, truffle", 540]] },
  { name: "Desserts", items: [["Künefe", "Pistachio, syrup", 290], ["Chocolate fondant", "Vanilla ice cream", 260], ["Seasonal fruit", "Mint, lime", 190]] },
  { name: "Drinks", items: [["Fresh lemonade", "Mint", 120], ["Turkish coffee", "Served with lokum", 110], ["House wine", "Glass", 240]] },
] as const;

const price = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export function HospitalityVisual({ venture }: { venture: Venture }) {
  const tilt = useTilt<HTMLDivElement>({ max: 6 });
  const { primary, secondary } = venture.colors;
  return (
    <div className="relative h-full w-full [perspective:1600px]">
      {/* Candle-like warm light. */}
      <div data-sv="glow" className="absolute left-[30%] top-[18%] aspect-square w-[60%] rounded-full opacity-80 blur-3xl motion-safe:animate-[breathe_7s_ease-in-out_infinite]" style={{ background: `radial-gradient(closest-side, ${primary}55, transparent)` }} />
      <div data-sv="glow" className="absolute bottom-[8%] left-[2%] aspect-square w-[36%] rounded-full opacity-60 blur-3xl motion-safe:animate-[breathe_9s_ease-in-out_infinite_1s]" style={{ background: `radial-gradient(closest-side, ${secondary}40, transparent)` }} />

      <div ref={tilt} className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
        <div data-sv="rig" className="relative translate-x-[14%] [transform-style:preserve-3d] md:translate-x-[8%]">
          <PhoneFrame className="w-[min(14.5rem,48vw)] md:w-[min(18.5rem,23vw,37vh)]">
            <MenuScreen primary={primary} />
          </PhoneFrame>
          <QrCard primary={primary} />
          <svg data-sv="link" className="pointer-events-none absolute -left-[46%] top-[40%] h-[30%] w-[50%] overflow-visible" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
            <path data-sv="link-path" d="M8 52 C 40 50, 60 10, 98 8" fill="none" stroke={primary} strokeOpacity="0.7" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
      <VisualNote className="absolute bottom-0 right-0 text-[#f6ece1]">
        {showcase.conceptNote} · {showcase.illustrativeNote}
      </VisualNote>
    </div>
  );
}

function MenuScreen({ primary }: { primary: string }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#15100c] px-[7%] pt-[17%] text-[#f6ece1]">
      <p className="text-[9px] uppercase tracking-[0.3em] text-[#f6ece1]/45">Your restaurant</p>
      <p className="mt-1 font-serif text-[22px] italic leading-none tracking-[-0.01em]">Menu</p>

      <div className="relative mt-4 flex gap-3 border-b border-white/10 pb-2 text-[10.5px]">
        {CATEGORIES.map((c, k) => (
          <button key={c.name} type="button" data-sv-goto={k} data-sv="tab" className="relative text-[#f6ece1]/50 transition-colors hover:text-[#f6ece1] data-[active=true]:text-[#f6ece1]">
            {c.name}
          </button>
        ))}
        <span data-sv="tab-bar" className="absolute -bottom-px left-0 h-[2px] w-[2.6rem] rounded-full" style={{ background: primary }} />
      </div>

      <div className="mt-3 grid flex-1">
        {CATEGORIES.map((c, k) => (
          <ul key={c.name} data-sv-step={k} className={cn("space-y-2.5 [grid-area:1/1]", k > 0 && "invisible")}>
            {c.items.map(([dish, note, amount]) => (
              <li key={dish} data-sv="dish" className="flex items-start justify-between gap-3 rounded-xl bg-white/[0.04] p-2.5">
                <div className="flex gap-2.5">
                  <span className="mt-0.5 h-8 w-8 shrink-0 rounded-lg" style={{ background: `radial-gradient(circle at 35% 30%, ${primary}cc, #5a2e17)` }} />
                  <div>
                    <p className="text-[11.5px] font-medium leading-tight">{dish}</p>
                    <p className="mt-0.5 text-[9.5px] text-[#f6ece1]/50">{note}</p>
                  </div>
                </div>
                <span className="text-[11px] tabular-nums" style={{ color: primary }}>
                  {price.format(amount)}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Decorative QR-style pattern: three finder squares and seeded modules. Not scannable. */
function qrModules() {
  const n = 21;
  const cells: [number, number][] = [];
  let seed = 11;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const finder = (x: number, y: number) => x >= 0 && x < 7 && y >= 0 && y < 7;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (finder(x, y) || finder(x - (n - 7), y) || finder(x, y - (n - 7))) continue;
      if (rand() > 0.52) cells.push([x, y]);
    }
  return cells;
}
const MODULES = qrModules();

function QrCard({ primary }: { primary: string }) {
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" rx="1.4" fill="#1b120e" />
      <rect x={x + 1} y={y + 1} width="5" height="5" rx="1" fill="#fbf4ea" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.6" fill="#1b120e" />
    </g>
  );
  return (
    <div
      data-sv="qr"
      className="group absolute -left-[56%] top-[50%] w-[50%] rotate-[-8deg] rounded-2xl bg-[#fbf4ea] p-3 shadow-[0_40px_70px_-30px_rgba(0,0,0,0.7)] transition-[transform,box-shadow] duration-500 [transform:translateZ(80px)_rotate(-8deg)] hover:[transform:translateZ(110px)_rotate(-3deg)] md:-left-[70%]"
      style={{ ["--qr" as string]: primary }}
    >
      <div className="relative overflow-hidden rounded-lg">
        <svg viewBox="-1 -1 23 23" className="block w-full" role="img" aria-label="Decorative QR-style pattern">
          <rect x="-1" y="-1" width="23" height="23" fill="#fbf4ea" />
          {MODULES.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x + 0.1} y={y + 0.1} width="0.8" height="0.8" rx="0.2" fill="#1b120e" />
          ))}
          {finder(0, 0)}
          {finder(14, 0)}
          {finder(0, 14)}
        </svg>
        <span className="absolute inset-x-0 top-0 h-0.5 opacity-0 shadow-[0_0_14px_3px_var(--qr)] transition-opacity group-hover:opacity-100 group-hover:motion-safe:animate-[scan_1.6s_ease-in-out_infinite]" style={{ background: primary }} />
      </div>
      <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-[#1b120e]/70">Scan for the menu</p>
    </div>
  );
}

export const HOSPITALITY_STEPS = CATEGORIES.length;
