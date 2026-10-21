"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }
  return <div className={`flex items-center rounded-full bg-[#F1F5F2] p-1 text-xs font-bold ${pending ? "opacity-60" : ""}`} role="group" aria-label={label}>
    {LOCALES.map((item) => <button key={item} type="button" onClick={() => choose(item)} aria-pressed={locale === item} className={`rounded-full px-2.5 py-1.5 uppercase transition ${locale === item ? "bg-white text-[#07834A] shadow-sm" : "text-[#66736B]"}`}>{item}</button>)}
  </div>;
}
