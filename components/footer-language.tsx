"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";

/** The minimal "EN | TR" switch in the footer. */
export function FooterLanguage({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(async () => { await setLocale(next); router.refresh(); });
  }
  return <div role="group" aria-label={label} className={`flex items-center text-[12.5px] sm:text-[14px] ${pending ? "opacity-60" : ""}`}>
    {LOCALES.map((item, i) => <span key={item} className="flex items-center">
      {i > 0 && <span aria-hidden="true" className="px-2 text-[#B5BDB8]">|</span>}
      <button type="button" onClick={() => choose(item)} aria-pressed={item === locale} className={`rounded px-0.5 uppercase hover:text-[#07834A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/40 ${item === locale ? "font-semibold text-[#17211B]" : "text-[#6B776F]"}`}>{item}</button>
    </span>)}
  </div>;
}
