import { SlidersHorizontal } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SearchFilters } from "@/lib/types";

export function Filters({ filters, values, t }: { filters: SearchFilters; values: Record<string, string | undefined>; t: Dictionary }) {
  const selectClass = "h-9 rounded-full border border-[#DDE4DF] bg-white px-3 text-xs font-medium text-[#3D4B42] outline-none hover:border-[#9EB8A8] focus:border-[#07834A]";
  // Keep a filter visible once it is applied, even if the page now only has one value.
  const show = (options: string[], current?: string) => options.length > 1 || Boolean(current);
  return <form action="/search" className="flex items-center gap-2 overflow-x-auto pb-1" aria-label={t.search.filters}>
    <input type="hidden" name="q" value={values.q ?? ""} />
    <SlidersHorizontal className="mr-1 size-4 shrink-0 text-[#69766E]" />
    <select className={selectClass} name="sort" defaultValue={values.sort ?? "relevance"} aria-label={t.search.sortLabel}><option value="relevance">{t.search.sortRelevance}</option><option value="price_asc">{t.search.sortPriceAsc}</option><option value="price_desc">{t.search.sortPriceDesc}</option></select>
    {show(filters.cities, values.city) && <select className={selectClass} name="city" defaultValue={values.city ?? ""} aria-label={t.search.allLocations}><option value="">{t.search.allLocations}</option>{withCurrent(filters.cities, values.city).map((v) => <option key={v}>{v}</option>)}</select>}
    {show(filters.conditions, values.condition) && <select className={selectClass} name="condition" defaultValue={values.condition ?? ""} aria-label={t.search.anyCondition}><option value="">{t.search.anyCondition}</option>{withCurrent(filters.conditions, values.condition).map((v) => <option key={v} value={v}>{t.values[v] ?? v}</option>)}</select>}
    {show(filters.brands, values.brand) && <select className={selectClass} name="brand" defaultValue={values.brand ?? ""} aria-label={t.search.allBrands}><option value="">{t.search.allBrands}</option>{withCurrent(filters.brands, values.brand).map((v) => <option key={v}>{v}</option>)}</select>}
    {show(filters.availabilities, values.availability) && <select className={selectClass} name="availability" defaultValue={values.availability ?? ""} aria-label={t.search.anyAvailability}><option value="">{t.search.anyAvailability}</option>{withCurrent(filters.availabilities, values.availability).map((v) => <option key={v} value={v}>{t.values[v] ?? v}</option>)}</select>}
    <button className="h-9 shrink-0 rounded-full bg-[#17211B] px-4 text-xs font-bold text-white">{t.search.apply}</button>
  </form>;
}

function withCurrent(options: string[], current?: string) {
  return current && !options.includes(current) ? [...options, current] : options;
}
