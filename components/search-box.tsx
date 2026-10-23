"use client";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { WatermelonLoader } from "@/components/watermelon-loader";

type Labels = { placeholder: string; label: string; submit: string; searching: string };

export function SearchBox({ initialQuery = "", compact = false, labels }: { initialQuery?: string; compact?: boolean; labels: Labels }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  // Keeps the swinging watermelon on screen until the results page has rendered.
  const [searching, startSearch] = useTransition();
  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (clean) startSearch(() => router.push(`/search?q=${encodeURIComponent(clean)}`));
  }
  return <>{searching && <WatermelonLoader label={labels.searching} overlay />}<form onSubmit={submit} role="search" className={`flex w-full items-center border border-[#D9DFDB] bg-white transition focus-within:border-[#07834A] focus-within:shadow-[0_0_0_4px_rgba(7,131,74,.07)] ${compact ? "h-11 rounded-full pl-4 pr-1" : "h-[60px] rounded-full border-[#E1E6E3] pl-5 pr-1.5 shadow-[0_8px_28px_rgba(23,33,27,.09)] sm:h-[84px] sm:pl-7 sm:pr-2.5"}`}>
    <Search className={`shrink-0 text-[#5E6A63] ${compact ? "size-4" : "size-5 sm:size-[26px]"}`} strokeWidth={compact ? 2 : 1.75} />
    <input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={120} placeholder={labels.placeholder} aria-label={labels.label} className={`min-w-0 flex-1 bg-transparent px-3 text-[#17211B] outline-none placeholder:text-[#8A948E] ${compact ? "text-sm" : "text-[16px]! sm:px-4 sm:text-[21px]!"}`} />
    <button type="submit" aria-label={labels.submit} className={`grid shrink-0 place-items-center rounded-full bg-[#07834A] text-white transition hover:bg-[#056B3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/30 ${compact ? "size-9" : "size-[48px] sm:size-[66px]"}`}><Search className={compact ? "size-4" : "size-5 sm:size-[26px]"} strokeWidth={compact ? 2 : 2.25} /></button>
  </form></>;
}
