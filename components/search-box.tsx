"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBox({ initialQuery = "", compact = false }: { initialQuery?: string; compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (clean) router.push(`/search?q=${encodeURIComponent(clean)}`);
  }
  return <form onSubmit={submit} role="search" className={`flex w-full items-center border border-[#D9DFDB] bg-white transition focus-within:border-[#07834A] focus-within:shadow-[0_0_0_4px_rgba(7,131,74,.07)] ${compact ? "h-11 rounded-full pl-4 pr-1" : "h-[58px] rounded-full pl-5 pr-1.5 shadow-[0_4px_18px_rgba(23,33,27,.08)] sm:h-16 sm:pl-6 sm:pr-2"}`}>
    <Search className={`shrink-0 text-[#77827B] ${compact ? "size-4" : "size-5"}`} />
    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search any product..." aria-label="Search products" className={`min-w-0 flex-1 bg-transparent px-3 text-[#17211B] outline-none placeholder:text-[#8A948E] ${compact ? "text-sm" : "text-base sm:text-lg"}`} />
    <button type="submit" aria-label="Search" className={`grid shrink-0 place-items-center rounded-full bg-[#07834A] text-white transition hover:bg-[#056B3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/30 ${compact ? "size-9" : "size-11 sm:size-12"}`}><Search className={compact ? "size-4" : "size-5"} /></button>
  </form>;
}
