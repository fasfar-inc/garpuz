"use client";
import { useState } from "react";

export function LanguageSwitcher() {
  const [language, setLanguage] = useState<"EN" | "TR">("EN");
  return <div className="flex items-center rounded-full bg-[#F1F5F2] p-1 text-xs font-bold" aria-label="Language switcher">
    {(["EN", "TR"] as const).map((item) => <button key={item} type="button" onClick={() => setLanguage(item)} className={`rounded-full px-2.5 py-1.5 transition ${language === item ? "bg-white text-[#07834A] shadow-sm" : "text-[#66736B]"}`}>{item}</button>)}
  </div>;
}
