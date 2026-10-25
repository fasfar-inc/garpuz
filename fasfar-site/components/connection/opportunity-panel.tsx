"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { conversationCta, type OpportunityCategory } from "@/content/connection";
import { ArrowRight, ArrowUpRight } from "@/components/ui/icons";

const CLOSE_MS = 380;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The information panel for one way of connecting. A native modal dialog
 * (focus trap, Esc, inert page) that wipes open from the edge on desktop
 * and rises as a sheet on mobile, and plays its exit before closing.
 */
export function OpportunityPanel({
  category,
  index,
  onClose,
}: {
  category: OpportunityCategory | null;
  index: number;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [shown, setShown] = useState<OpportunityCategory | null>(null);
  const [shownIndex, setShownIndex] = useState(0);

  // Keep the last category on screen while the exit animation plays.
  if (category && category !== shown) {
    setShown(category);
    setShownIndex(index);
    setClosing(false);
  }

  useEffect(() => {
    const el = dialog.current;
    if (!el || !category) return;
    if (!el.open) el.showModal();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [category]);

  const close = () => {
    if (closing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setClosing(true);
    window.setTimeout(
      () => {
        dialog.current?.close();
        setClosing(false);
        setShown(null);
        onClose();
      },
      reduced ? 0 : CLOSE_MS,
    );
  };

  const c = shown;
  return (
    <dialog
      ref={dialog}
      data-closing={closing || undefined}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === dialog.current && close()}
      aria-labelledby="opportunity-title"
      className="connection-panel m-0 ml-auto mt-auto h-[90svh] max-h-none w-full max-w-none overflow-y-auto rounded-t-[1.75rem] bg-[#f4f1eb] p-0 text-[#141312] backdrop:bg-[#141312]/35 backdrop:backdrop-blur-sm md:mt-0 md:h-svh md:w-[min(46rem,92vw)] md:rounded-none"
    >
      {c && (
        <div className="relative flex min-h-full flex-col px-6 pb-10 pt-6 md:px-14 md:pb-14 md:pt-12">
          {/* A thin luminous thread down the panel's edge: the connection you followed. */}
          <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 hidden w-px bg-[linear-gradient(180deg,transparent,#e9b77f_30%,#141312_70%,transparent)] md:block" />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={close}
              className="group inline-flex min-h-11 items-center gap-3 text-[13px] uppercase tracking-[0.18em] text-[#141312]/70 transition-colors hover:text-[#141312] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141312]"
            >
              <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to the network
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#141312]/20 transition-colors hover:bg-[#141312] hover:text-[#f4f1eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141312]"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p data-panel-item style={{ ["--i" as string]: 0 }} className="eyebrow mt-12 tabular-nums md:mt-16">
            {pad(shownIndex + 1)} — {c.title}
          </p>
          <h2 id="opportunity-title" data-panel-item style={{ ["--i" as string]: 1 }} className="mt-5 text-[clamp(2.4rem,9vw,4.4rem)] font-light leading-[0.98] tracking-[-0.05em]">
            {c.panel.heading}
          </h2>
          <p data-panel-item style={{ ["--i" as string]: 2 }} className="mt-6 max-w-[48ch] text-[17px] leading-[1.6] text-[#141312]/75">
            {c.panel.intro}
          </p>

          <div data-panel-item style={{ ["--i" as string]: 3 }} className="mt-12 grid gap-10 border-t border-[#141312]/15 pt-10 md:grid-cols-2">
            <PanelList label="Who it's for" items={c.panel.audience} />
            <PanelList label="A first conversation could cover" items={c.panel.topics} />
          </div>

          <div data-panel-item style={{ ["--i" as string]: 4 }} className="mt-auto pt-14">
            {conversationCta.href ? (
              <Link
                href={conversationCta.href}
                onClick={close}
                className="group inline-flex h-14 items-center gap-5 rounded-full bg-[#141312] pl-7 pr-2 text-[14px] tracking-[0.08em] text-[#f4f1eb]"
              >
                {conversationCta.label}
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f1eb] text-[#141312] transition-transform duration-500 group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            ) : (
              <p className="max-w-[44ch] text-[14px] leading-[1.55] text-[#141312]/60">
                Contact details will be available here soon. Until then, there is no form to submit and nothing will be sent.
              </p>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

function PanelList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[15px] leading-[1.5] text-[#141312]/80">
            <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#9a9ca2_55%,#3a3b40)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
