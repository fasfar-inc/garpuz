"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";

type Item = { href: string; label: string };

/** Compact secondary navigation for small screens. */
export function MobileMenu({ items, locale, labels }: { items: Item[]; locale: Locale; labels: { open: string; close: string; title: string; language: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedOn, setOpenedOn] = useState(pathname);
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Close after navigating to another page.
  if (open && openedOn !== pathname) setOpen(false);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>("[data-menu-item]")?.focus();
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(async () => { await setLocale(next); router.refresh(); });
  }

  return <div ref={root} className="relative">
    <button ref={button} type="button" onClick={() => { setOpenedOn(pathname); setOpen((value) => !value); }} aria-expanded={open} aria-controls={panelId} aria-label={open ? labels.close : labels.open} className="grid size-10 place-items-center rounded-full text-[#26322B] transition hover:bg-[#F1F5F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/40">
      {open ? <X className="size-6" strokeWidth={1.75} /> : <Menu className="size-6" strokeWidth={1.75} />}
    </button>
    {open && <nav id={panelId} aria-label={labels.title} className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-[#E3E8E5] bg-white p-2 shadow-[0_16px_40px_rgba(23,33,27,.14)]">
      <ul>{items.map((item) => <li key={item.href}>
        {item.href.startsWith("mailto:")
          ? <a data-menu-item href={item.href} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#26322B] hover:bg-[#F1F5F2] focus-visible:bg-[#F1F5F2] focus-visible:outline-none">{item.label}</a>
          : <Link data-menu-item href={item.href} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#26322B] hover:bg-[#F1F5F2] focus-visible:bg-[#F1F5F2] focus-visible:outline-none">{item.label}</Link>}
      </li>)}</ul>
      <div className={`mt-1 flex items-center justify-between border-t border-[#EDF0EE] px-3 pt-3 pb-1 ${pending ? "opacity-60" : ""}`}>
        <span className="text-xs font-semibold text-[#6B776F]">{labels.language}</span>
        <div className="flex rounded-full bg-[#F1F5F2] p-1 text-xs font-bold" role="group" aria-label={labels.language}>
          {LOCALES.map((item) => <button key={item} type="button" onClick={() => choose(item)} aria-pressed={locale === item} className={`rounded-full px-2.5 py-1 uppercase ${locale === item ? "bg-white text-[#07834A] shadow-sm" : "text-[#66736B]"}`}>{item}</button>)}
        </div>
      </div>
    </nav>}
  </div>;
}
