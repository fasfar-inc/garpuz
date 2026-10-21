import { AVAILABILITIES, CONDITIONS, CURRENCIES } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { inputClass, labelClass } from "./ui";

type Defaults = { price?: number; currency?: string; condition?: string; availability?: string; sku?: string | null; active?: boolean };

/** Price, stock and visibility fields shared by the add and edit forms. */
export function OfferFields({ t, defaults = {} }: { t: Dictionary; defaults?: Defaults }) {
  const p = t.products;
  return <div className="grid gap-4 sm:grid-cols-2">
    <label className={labelClass}>{p.price}<input name="price" type="number" inputMode="decimal" min="0" step="0.01" required defaultValue={defaults.price} className={inputClass} /></label>
    <label className={labelClass}>{p.currency}<select name="currency" defaultValue={defaults.currency ?? "TRY"} className={inputClass}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
    <label className={labelClass}>{p.condition}<select name="condition" defaultValue={defaults.condition ?? "new"} className={inputClass}>{CONDITIONS.map((c) => <option key={c} value={c}>{t.values[c]}</option>)}</select></label>
    <label className={labelClass}>{p.availability}<select name="availability" defaultValue={defaults.availability ?? "in_stock"} className={inputClass}>{AVAILABILITIES.map((c) => <option key={c} value={c}>{t.values[c]}</option>)}</select></label>
    <label className={`${labelClass} sm:col-span-2`}>{p.sku} <span className="font-normal text-[#8A948E]">({t.common.optional})</span><input name="sku" maxLength={80} defaultValue={defaults.sku ?? ""} className={inputClass} /></label>
    <label className="flex items-center gap-3 text-sm font-semibold text-[#2E3B33] sm:col-span-2"><input type="checkbox" name="active" defaultChecked={defaults.active ?? true} className="size-4 accent-[#07834A]" />{p.active}</label>
  </div>;
}
