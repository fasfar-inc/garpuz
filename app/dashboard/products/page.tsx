import { Package, Search } from "lucide-react";
import { createOffer, deleteOffer, setOfferVisibility, updateOffer } from "@/app/dashboard/actions";
import { cardClass, DashboardHeader, DashboardNotice, formatDate, inputClass, labelClass, primaryButton } from "@/components/dashboard/ui";
import { valueLabel } from "@/components/search/filters";
import { relationOne } from "@/lib/admin/types";
import { format } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";
import { CONTACT_EMAIL } from "@/lib/site";
import { AVAILABILITIES, CONDITIONS, CURRENCIES } from "@/lib/validation";

type Params = Promise<Record<string, string | string[] | undefined>>;
type CatalogProduct = { id: string; name: string; brand: string; model: string | null; category: string };
type ProductSummary = { name: string; brand: string; model: string | null };
type MerchantOffer = {
  id: string; price: number; currency: string; condition: string; availability: string; merchant_sku: string | null;
  is_active: boolean; updated_at: string; canonical_products: ProductSummary | ProductSummary[] | null;
};

export default async function ProductsPage({ searchParams }: { searchParams: Params }) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.trim().slice(0, 100) : "";
  const { supabase, merchant } = await requireMerchant();
  const { locale, t } = await getDictionary();
  const p = t.dashboard.products;

  let catalog: CatalogProduct[] = [];
  // PostgREST filter syntax uses these characters, so they are stripped from the search term.
  const safe = q.replace(/[%_,()\\*."]/g, " ").trim();
  if (safe) {
    const { data, error } = await supabase.from("canonical_products").select("id,name,brand,model,category").or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`).order("name").limit(20);
    if (error) throw new Error(error.message);
    catalog = data ?? [];
  }
  const { data, error } = await supabase.from("merchant_offers").select("id,price,currency,condition,availability,merchant_sku,is_active,updated_at,canonical_products(name,brand,model)").eq("merchant_id", merchant.id).order("updated_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  const offers = (data ?? []) as MerchantOffer[];
  const small = `${inputClass} h-9`;

  return <main>
    <DashboardHeader title={p.heading} description={p.body} />
    <div className="p-5 sm:p-8">
      <DashboardNotice params={raw} t={t} />
      <section className={`${cardClass} p-5`}>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className={`${labelClass} flex-1`}>{p.findLabel}<span className="relative mt-1.5 block"><Search className="absolute left-3 top-3 size-4 text-[#839087]" /><input name="q" defaultValue={q} maxLength={100} placeholder={p.findPlaceholder} className={`${inputClass} pl-9`} /></span></label>
          <button className={primaryButton}>{p.find}</button>
        </form>
        {q && <div className="mt-5 space-y-3">
          {catalog.length === 0 && <p className="text-sm text-[#68766D]">{format(p.noMatches, { query: q })}</p>}
          {catalog.map((product) => <form key={product.id} action={createOffer} className="grid gap-3 rounded-xl border border-[#E6EBE8] p-4">
            <input type="hidden" name="productId" value={product.id} /><input type="hidden" name="q" value={q} />
            <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#F4F6F4] text-[#A7B0AA]"><Package className="size-5" /></span><div className="min-w-0"><p className="truncate font-bold">{product.name}</p><p className="truncate text-xs text-[#6D7971]">{product.brand}{product.model ? ` · ${product.model}` : ""} · {product.category}</p></div></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6 xl:items-end">
              <label className={labelClass}>{p.price}<input name="price" type="number" inputMode="decimal" step="0.01" min="0" required className={`${small} mt-1`} /></label>
              <label className={labelClass}>{p.currency}<select name="currency" defaultValue="TRY" className={`${small} mt-1`}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className={labelClass}>{p.condition}<select name="condition" defaultValue="new" className={`${small} mt-1`}>{CONDITIONS.map((c) => <option key={c} value={c}>{valueLabel(t, c)}</option>)}</select></label>
              <label className={labelClass}>{p.availability}<select name="availability" defaultValue="in_stock" className={`${small} mt-1`}>{AVAILABILITIES.map((a) => <option key={a} value={a}>{valueLabel(t, a)}</option>)}</select></label>
              <label className={labelClass}>{p.sku}<input name="sku" maxLength={80} className={`${small} mt-1`} /></label>
              <button className={`${primaryButton} h-9`}>{p.addOffer}</button>
            </div>
          </form>)}
          <p className="text-xs leading-5 text-[#7A857E]">{format(p.missing, { email: CONTACT_EMAIL })}</p>
        </div>}
      </section>

      <section className="mt-7">
        <h2 className="mb-3 font-black">{p.yourOffers}</h2>
        <div className={`${cardClass} overflow-hidden`}>{offers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-[#F8FAF9] text-xs text-[#67736B]"><tr>{[p.product, p.price, p.availability, p.visibility, p.updated, p.actions].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#E9EDEA]">{offers.map((offer) => {
            const product = relationOne(offer.canonical_products); const formId = `offer-${offer.id}`;
            return <tr key={offer.id}>
              <td className="px-4 py-3"><p className="font-bold">{product?.name ?? "—"}</p><p className="text-xs text-[#7A857E]">{product?.brand}{product?.model ? ` · ${product.model}` : ""} · {valueLabel(t, offer.condition)}{offer.merchant_sku ? ` · ${offer.merchant_sku}` : ""}</p></td>
              <td className="px-4 py-3"><div className="flex items-center gap-1.5"><input form={formId} name="price" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={Number(offer.price)} aria-label={p.price} className={`${small} w-28`} /><span className="text-xs text-[#7A857E]">{offer.currency}</span></div></td>
              <td className="px-4 py-3"><select form={formId} name="availability" defaultValue={offer.availability} aria-label={p.availability} className={`${small} w-36`}>{AVAILABILITIES.map((a) => <option key={a} value={a}>{valueLabel(t, a)}</option>)}</select></td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${offer.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{offer.is_active ? p.visible : p.hidden}</span></td>
              <td className="px-4 py-3 text-xs text-[#6B776F]">{formatDate(offer.updated_at, locale)}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-3">
                <form id={formId} action={updateOffer}><input type="hidden" name="id" value={offer.id} /><button className="text-xs font-bold text-[#07834A]">{p.save}</button></form>
                <form action={setOfferVisibility}><input type="hidden" name="id" value={offer.id} /><input type="hidden" name="active" value={String(!offer.is_active)} /><button className="text-xs font-bold text-[#38463D]">{offer.is_active ? p.hide : p.show}</button></form>
                <form action={deleteOffer}><input type="hidden" name="id" value={offer.id} /><button className="text-xs font-bold text-red-700">{p.remove}</button></form>
              </div></td>
            </tr>;
          })}</tbody>
        </table></div> : <p className="px-6 py-14 text-center text-sm text-[#78837C]">{p.noOffers}</p>}</div>
      </section>
    </div>
  </main>;
}
