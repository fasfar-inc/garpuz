"use client";

import { useTransition } from "react";
import { setLanguage } from "@/app/language-action";
import type { Lang } from "@/lib/i18n/dictionaries";

export function LanguageSwitcher({ lang }: { lang: Lang }) {
  const [pending, startTransition] = useTransition();
  function choose(next: Lang) {
    if (next === lang) return;
    // Setting a cookie in a Server Action re-renders the current page in the new language.
    startTransition(() => setLanguage(next));
  }
  return <div className={`flex items-center rounded-full bg-[#F1F5F2] p-1 text-xs font-bold transition ${pending ? "opacity-60" : ""}`} role="group" aria-label="Language / Dil">
    {(["en", "tr"] as const).map((item) => <button key={item} type="button" onClick={() => choose(item)} aria-pressed={lang === item} className={`rounded-full px-2.5 py-1.5 uppercase transition ${lang === item ? "bg-white text-[#07834A] shadow-sm" : "text-[#66736B]"}`}>{item}</button>)}
  </div>;
}
