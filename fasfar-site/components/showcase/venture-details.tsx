"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { showcase } from "@/content/site";
import type { Venture } from "@/content/ventures";
import { ArrowUpRight } from "@/components/ui/icons";
import { VentureLogo } from "@/components/ventures/venture-logo";

/**
 * A venture's details in a modal side sheet, so visitors can dig into one
 * venture without losing their place in the scroll story. Links appear only
 * for configured destinations (website, dedicated page).
 */
export function VentureDetails({ venture, onClose }: { venture: Venture | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el || !venture) return;
    el.showModal();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
      if (el.open) el.close();
    };
  }, [venture]);

  const media = venture ? Object.values(venture.media) : [];

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      aria-labelledby="venture-details-title"
      className="venture-sheet m-0 ml-auto mt-auto h-[88svh] max-h-none w-full max-w-none overflow-y-auto rounded-t-[1.75rem] p-0 backdrop:bg-black/45 backdrop:backdrop-blur-sm md:mt-0 md:h-svh md:w-[min(30rem,92vw)] md:rounded-none md:rounded-l-[1.75rem]"
      style={venture ? { background: venture.colors.surface, color: venture.colors.ink } : undefined}
    >
      {venture && (
        <div className="flex min-h-full flex-col px-6 pb-10 pt-6 md:px-10 md:pt-10">
          <div className="flex items-center justify-between">
            <p className="eyebrow" style={{ color: venture.colors.ink }}>
              {venture.industry}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-current/20 transition-colors hover:bg-current/10"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <h2 id="venture-details-title" className="mt-10 text-[clamp(2.6rem,9vw,3.6rem)] font-medium leading-[0.95] tracking-[-0.045em]">
            <VentureLogo venture={venture} />
          </h2>
          <p className="mt-5 text-[17px] leading-[1.55] opacity-80">{venture.description}</p>

          <div className="mt-10">
            <p className="eyebrow" style={{ color: venture.colors.ink }}>
              Brand colours
            </p>
            <ul className="mt-4 flex gap-3">
              {(["primary", "secondary", "surface"] as const).map((key) => (
                <li key={key} className="text-[11px] opacity-80">
                  <span className="block h-12 w-12 rounded-2xl ring-1 ring-current/15" style={{ background: venture.colors[key] }} />
                  <span className="mt-1.5 block font-mono uppercase">{venture.colors[key]}</span>
                </li>
              ))}
            </ul>
          </div>

          {media.length > 0 && (
            <div className="mt-10">
              <p className="eyebrow" style={{ color: venture.colors.ink }}>
                Brand imagery
              </p>
              <ul className="mt-4 grid grid-cols-3 gap-3">
                {media.map((m) => (
                  <li key={m.src} className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white p-2">
                    <Image src={m.src} alt={m.alt} width={m.width} height={m.height} className="max-h-full w-auto object-contain" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto pt-12">
            {venture.url || venture.page ? (
              <div className="flex flex-wrap gap-3">
                {venture.page && (
                  <Link href={venture.page} className="inline-flex h-12 items-center rounded-full px-6 text-[15px] text-white" style={{ background: venture.colors.primary }}>
                    {venture.name} page
                  </Link>
                )}
                {venture.url && (
                  <a href={venture.url} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full border border-current/25 px-6 text-[15px]">
                    Visit website <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-[14px] leading-[1.5] opacity-60">{showcase.detailsUnavailable}</p>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
