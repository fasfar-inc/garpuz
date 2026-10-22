import { SlidersHorizontal } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SearchFilters } from "@/lib/types";

export function Filters({ filters, values, t }: { filters: SearchFilters; values: Record<string, string | undefined>; t: Dictionary }) {
  const selectClass = "h-9 rounded-full border border-[#DDE4DF] bg-white px-3 text-xs font-medium text-[#3D4B42] outline-none hover:border-[#9EB8A8] focus:border-[#07834A]";
  const f = t.filters;
  // A filter stays visible while it is applied, even if only one option remains.
  const show = (options: string[], value?: string) => options.length > 1 || Boolean(value);
  return <form className="flex items-center gap-2 overflow-x-auto pb-1" aria-label={f.label}>
    {values.category ? <input type="hidden" name="category" value={values.category} /> : <input type="hidden" name="q" value={values.q} />}
    <SlidersHorizontal className="mr-1 size-4 shrink-0 text-[#69766E]" />
    <select className={selectClass} name="sort" defaultValue={values.sort ?? "relevance"} aria-label={f.sort}><option value="relevance">{f.relevance}</option><option value="price_asc">{f.priceAsc}</option><option value="price_desc">{f.priceDesc}</option></select>
    {show(filters.cities, values.city) && <select className={selectClass} name="city" defaultValue={values.city ?? ""} aria-label={f.location}><option value="">{f.allLocations}</option>{filters.cities.map((v) => <option key={v}>{v}</option>)}</select>}
    {show(filters.conditions, values.condition) && <select className={selectClass} name="condition" defaultValue={values.condition ?? ""} aria-label={f.condition}><option value="">{f.anyCondition}</option>{filters.conditions.map((v) => <option key={v} value={v}>{valueLabel(t, v)}</option>)}</select>}
    {show(filters.brands, values.brand) && <select className={selectClass} name="brand" defaultValue={values.brand ?? ""} aria-label={f.brand}><option value="">{f.allBrands}</option>{filters.brands.map((v) => <option key={v}>{v}</option>)}</select>}
    {show(filters.availabilities, values.availability) && <select className={selectClass} name="availability" defaultValue={values.availability ?? ""} aria-label={f.availability}><option value="">{f.anyAvailability}</option>{filters.availabilities.map((v) => <option key={v} value={v}>{valueLabel(t, v)}</option>)}</select>}
    <button className="h-9 shrink-0 rounded-full bg-[#17211B] px-4 text-xs font-bold text-white">{f.apply}</button>
  </form>;
}

export function valueLabel(t: Dictionary, value: string) {
  return t.values[value as keyof Dictionary["values"]] ?? value.replaceAll("_", " ");
}
