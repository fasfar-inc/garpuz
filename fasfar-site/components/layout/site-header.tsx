"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { chapters, contactCta, navigation, type NavItem } from "@/content/site";
import { cn } from "@/lib/cn";
import { useStageValue } from "@/lib/stage/store";
import { ArrowUpRight } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/wordmark";

/**
 * Global header. Colours come from the `--ink` theme variables, so it
 * follows the stage from ivory to midnight. On the home page the active item
 * tracks the current chapter; elsewhere, pass `activeId`.
 */
export function SiteHeader({ activeId }: { activeId?: string }) {
  const chapter = useStageValue((s) => s.chapter, -1);
  const current = activeId ?? chapters[chapter]?.navId ?? "home";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header data-intro="header" className="fixed inset-x-0 top-0 z-50 text-(--ink)">
      <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-5 md:h-[94px] md:px-[4.2vw]">
        <Link href="#top" aria-label="FASFAR — home" className="relative z-10 text-[19px] font-medium tracking-[0.16em] md:text-[23px]">
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-[3.6vw] text-[14.5px] tracking-[-0.01em]">
            {navigation.map((item) => (
              <li key={item.id}>
                <NavEntry item={item} active={item.id === current} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <ContactButton className="hidden md:inline-flex" />
          <button
            type="button"
            className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-(--hairline-strong) lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-4">
              <span className={cn("absolute left-0 h-px w-4 bg-current transition-transform duration-300", open ? "top-1.5 rotate-45" : "top-0.5")} />
              <span className={cn("absolute left-0 h-px w-4 bg-current transition-transform duration-300", open ? "top-1.5 -rotate-45" : "top-2.5")} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 bg-(--paper)/95 backdrop-blur-xl transition-[opacity,visibility] duration-500 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="flex h-full flex-col justify-center px-6">
          <ul className="space-y-3">
            {navigation.map((item, i) => (
              <li
                key={item.id}
                className={cn("transition-[transform,opacity] duration-500", open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")}
                style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
              >
                <NavEntry item={item} active={item.id === current} large onNavigate={() => setOpen(false)} />
              </li>
            ))}
          </ul>
          <ContactButton className="mt-12 inline-flex self-start md:hidden" />
        </nav>
      </div>
    </header>
  );
}

function NavEntry({ item, active, large, onNavigate }: { item: NavItem; active: boolean; large?: boolean; onNavigate?: () => void }) {
  const base = cn("relative inline-flex flex-col items-center", large ? "text-4xl tracking-[-0.03em]" : "py-2");
  const dot = (
    <span
      aria-hidden="true"
      className={cn(
        "absolute h-[5px] w-[5px] rounded-full bg-current transition-[opacity,transform] duration-500",
        large ? "-left-4 top-1/2 -translate-y-1/2" : "-bottom-1.5",
        active ? "scale-100 opacity-100" : "scale-0 opacity-0",
      )}
    />
  );
  if (!item.href) {
    return (
      <span className={cn(base, "cursor-default text-(--ink-muted)")} aria-disabled="true" title="Coming soon">
        {item.label}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(base, "transition-opacity duration-300 hover:opacity-70", active ? "text-(--ink)" : "text-(--ink-muted)")}
    >
      {item.label}
      {dot}
    </Link>
  );
}

function ContactButton({ className }: { className?: string }) {
  const content = (
    <>
      {contactCta.label}
      <ArrowUpRight className="h-4 w-4" />
    </>
  );
  const classes = cn(
    "h-12 items-center gap-5 rounded-full border border-(--hairline-strong) px-7 text-[14.5px] tracking-[-0.01em] transition-colors duration-300",
    className,
  );
  if (!contactCta.href) {
    return (
      <span className={cn(classes, "cursor-default")} aria-disabled="true" title="Coming soon">
        {content}
      </span>
    );
  }
  return (
    <Link href={contactCta.href} className={cn(classes, "hover:bg-(--ink) hover:text-(--paper)")}>
      {content}
    </Link>
  );
}
