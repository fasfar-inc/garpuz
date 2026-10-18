import { SlidersHorizontal } from "lucide-react";
import type { SearchFilters } from "@/lib/types";

export function Filters({ filters, values }: { filters: SearchFilters; values: Record<string, string | undefined> }) {
  const selectClass = "h-9 rounded-full border border-[#DDE4DF] bg-white px-3 text-xs font-medium text-[#3D4B42] outline-none hover:border-[#9EB8A8] focus:border-[#07834A]";
  return <form className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Search filters">
    <input type="hidden" name="q" value={values.q} />
    <SlidersHorizontal className="mr-1 size-4 shrink-0 text-[#69766E]" />
    <select className={selectClass} name="sort" defaultValue={values.sort ?? "relevance"} aria-label="Sort results"><option value="relevance">Most relevant</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option></select>
    {filters.cities.length > 1 && <select className={selectClass} name="city" defaultValue={values.city ?? ""} aria-label="Location"><option value="">All locations</option>{filters.cities.map((v) => <option key={v}>{v}</option>)}</select>}
    {filters.conditions.length > 1 && <select className={selectClass} name="condition" defaultValue={values.condition ?? ""} aria-label="Condition"><option value="">Any condition</option>{filters.conditions.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>}
    {filters.brands.length > 1 && <select className={selectClass} name="brand" defaultValue={values.brand ?? ""} aria-label="Brand"><option value="">All brands</option>{filters.brands.map((v) => <option key={v}>{v}</option>)}</select>}
    {filters.availabilities.length > 1 && <select className={selectClass} name="availability" defaultValue={values.availability ?? ""} aria-label="Availability"><option value="">Any availability</option>{filters.availabilities.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>}
    <button className="h-9 shrink-0 rounded-full bg-[#17211B] px-4 text-xs font-bold text-white">Apply</button>
  </form>;
}

export function label(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
