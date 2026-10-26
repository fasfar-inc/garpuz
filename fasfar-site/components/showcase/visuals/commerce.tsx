"use client";

import Image from "next/image";
import { showcase } from "@/content/site";
import type { Venture, VentureMedia } from "@/content/ventures";
import { cn } from "@/lib/cn";
import { useTilt } from "@/lib/motion/use-tilt";
import { VentureLogo } from "@/components/ventures/venture-logo";
import { VisualNote } from "./phone-frame";

/**
 * GARPUZ — the real wordmark, watermelon emblem and category imagery from
 * the GARPUZ product, around a price-comparison card that steps through
 * products as you scroll (or click a floating product). Prices and shops are
 * illustrative and labelled as such.
 */
const PRODUCTS = [
  { media: "phones", query: "smartphone 128 GB", title: "Smartphone, 128 GB", offers: [42999, 41499, 43750] },
  { media: "computers", query: "laptop 14 inch", title: "Laptop, 14-inch", offers: [38900, 36450, 37990] },
  { media: "electronics", query: "smart tv 55", title: "Smart TV, 55-inch", offers: [27999, 28750, 26490] },
  { media: "gaming", query: "game console", title: "Game console", offers: [21990, 20750, 22400] },
] as const;

const SHOPS = ["Shop A · Lefkoşa", "Shop B · Girne", "Shop C · Gazimağusa"];
const price = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

/** Floating product tiles: position and depth around the card. */
const TILES = [
  "left-[-4%] top-[-12%] md:left-[-13%] md:top-[-9%] [--z:120px]",
  "left-[-7%] bottom-[30%] md:left-[-19%] md:bottom-[24%] [--z:60px]",
  "right-[-6%] top-[24%] md:right-[-17%] md:top-[30%] [--z:150px]",
  "right-[-4%] bottom-[-10%] md:right-[-11%] md:bottom-[-8%] [--z:90px]",
];

export function CommerceVisual({ venture }: { venture: Venture }) {
  const tilt = useTilt<HTMLDivElement>({ max: 6 });
  const { primary, secondary } = venture.colors;
  const media = (key: string) => venture.media[key] as VentureMedia | undefined;
  const emblem = media("emblem");

  return (
    <div className="relative h-full w-full [perspective:1600px]">
      <div data-sv="glow" className="absolute right-[2%] top-[4%] aspect-square w-[55%] rounded-full opacity-70 blur-3xl" style={{ background: `radial-gradient(closest-side, ${secondary}55, transparent)` }} />
      <div data-sv="glow" className="absolute bottom-[0%] left-[6%] aspect-square w-[45%] rounded-full opacity-60 blur-3xl" style={{ background: `radial-gradient(closest-side, ${primary}40, transparent)` }} />
      {emblem && (
        <div data-sv="emblem" className="absolute right-[-4%] top-[-4%] w-[46%] md:right-[-2%] md:top-[-6%]">
          <Image src={emblem.src} alt={emblem.alt} width={emblem.width} height={emblem.height} className="h-auto w-full drop-shadow-[0_30px_40px_rgba(120,20,30,0.25)]" />
        </div>
      )}

      <div ref={tilt} className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
        <div data-sv="rig" className="relative w-[min(26rem,86%)] [transform-style:preserve-3d]">
          <div data-sv="card" className="relative rounded-[1.75rem] bg-white p-5 text-[#10241a] shadow-[0_50px_100px_-40px_rgba(16,36,26,0.45)] md:p-6">
            <div className="flex items-center justify-between">
              <VentureLogo venture={venture} className="text-[22px]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">{showcase.illustrativeNote}</span>
            </div>

            <div className="mt-4 grid">
              {PRODUCTS.map((p, k) => (
                <div key={p.media} data-sv-step={k} className={cn("[grid-area:1/1]", k > 0 && "invisible")}>
                  <div className="flex items-center gap-2.5 rounded-full border border-black/10 bg-[#f6f7f5] px-4 py-2.5 text-[13px]">
                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-black/40" aria-hidden="true">
                      <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      <path d="m13.2 13.2 3.3 3.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    <span className="text-black/75">{p.query}</span>
                    <span className="ml-auto h-4 w-px animate-pulse bg-black/40 motion-reduce:animate-none" />
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div data-sv="product" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#f6f7f5] p-2 md:h-24 md:w-24">
                      {media(p.media) && (
                        <Image src={media(p.media)!.src} alt={media(p.media)!.alt} width={media(p.media)!.width} height={media(p.media)!.height} className="max-h-full w-auto object-contain" />
                      )}
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold tracking-[-0.01em]">{p.title}</p>
                      <p className="mt-0.5 text-[12px] text-black/50">{p.offers.length} offers</p>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {p.offers.map((amount, s) => {
                      const best = amount === Math.min(...p.offers);
                      return (
                        <li
                          key={s}
                          data-sv="offer"
                          className={cn(
                            "group flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-[13px] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(16,36,26,0.45)]",
                            best ? "border-transparent" : "border-black/[0.07]",
                          )}
                          style={best ? { background: `${primary}12`, boxShadow: `inset 0 0 0 1.5px ${primary}` } : undefined}
                        >
                          <span className="text-black/70">{SHOPS[s]}</span>
                          <span className="flex items-center gap-2">
                            {best && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white" style={{ background: primary }}>
                                Lowest
                              </span>
                            )}
                            <span className="font-semibold tabular-nums">{price.format(amount)}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {PRODUCTS.map((p, k) => {
            const m = media(p.media);
            return (
              <button
                key={p.media}
                type="button"
                data-sv="tile"
                data-sv-goto={k}
                aria-label={`Show ${p.title}`}
                className={cn(
                  "group absolute flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_24px_50px_-24px_rgba(16,36,26,0.5)] transition-transform duration-500 [transform:translateZ(var(--z))] hover:[transform:translateZ(var(--z))_translateY(-6px)_scale(1.06)] md:h-20 md:w-20",
                  TILES[k],
                )}
              >
                {m && <Image src={m.src} alt="" width={m.width} height={m.height} className="max-h-full w-auto object-contain" />}
                <span data-sv-dot className="absolute -bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full opacity-0" style={{ background: primary }} />
              </button>
            );
          })}
        </div>
      </div>
      <VisualNote className="absolute bottom-0 left-0 text-[#10241a]">Illustrative prices and shops</VisualNote>
    </div>
  );
}

export const COMMERCE_STEPS = PRODUCTS.length;
