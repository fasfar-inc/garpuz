"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";

/** Globe + current language dropdown used in the public site header. */
export function LanguageMenu({ locale, label, names }: { locale: Locale; label: string; names: Record<Locale, string> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="true"]')?.focus();
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); button.current?.focus(); }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const items = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])];
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        items[(index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    button.current?.focus();
    if (next === locale) return;
    startTransition(async () => { await setLocale(next); router.refresh(); });
  }

  return <div ref={root} className="relative">
    <button ref={button} type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} aria-label={`${label}: ${names[locale]}`} className={`flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[16px] font-medium text-[#26322B] transition hover:bg-[#F1F5F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/40 ${pending ? "opacity-60" : ""}`}>
      <Globe className="size-[19px] text-[#4D5A52]" strokeWidth={1.75} />
      <span className="uppercase">{locale}</span>
      <ChevronDown className={`size-4 text-[#4D5A52] transition ${open ? "rotate-180" : ""}`} strokeWidth={2} />
    </button>
    {open && <div id={menuId} role="menu" aria-label={label} className="absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-xl border border-[#E3E8E5] bg-white p-1 shadow-[0_12px_32px_rgba(23,33,27,.12)]">
      {LOCALES.map((item) => <button key={item} type="button" role="menuitemradio" aria-checked={item === locale} onClick={() => choose(item)} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#26322B] hover:bg-[#F1F5F2] focus-visible:bg-[#F1F5F2] focus-visible:outline-none">
        {names[item]}{item === locale && <Check className="size-4 text-[#07834A]" />}
      </button>)}
    </div>}
  </div>;
}
