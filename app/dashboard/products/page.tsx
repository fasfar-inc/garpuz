import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Clock3, Package, Search } from "lucide-react";
import { deleteOffer, setOfferVisibility, updateOffer } from "@/app/dashboard/actions";
import { AddProductForm } from "@/components/dashboard/add-product-form";
import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { cardClass, DashboardHeader, DashboardNotice, formatDate, inputClass } from "@/components/dashboard/ui";
import { valueLabel } from "@/components/search/filters";
import { relationOne } from "@/lib/admin/types";
import { format } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";
import { cn, safeImageUrl } from "@/lib/utils";
import { AVAILABILITIES, CONDITIONS, CURRENCIES, PRODUCT_CATEGORIES } from "@/lib/validation";

type Params = Promise<Record<string, string | string[] | undefined>>;
type ProductSummary = { name: string; brand: string; model: string | null; image_url: string | null };
type MerchantOffer = {
  id: string; price: number; currency: string; condition: string; availability: string; merchant_sku: string | null;
  is_active: boolean; updated_at: string; canonical_products: ProductSummary | ProductSummary[] | null;
};

export default async function ProductsPage({ searchParams }: { searchParams: Params }) {
  const raw = await searchParams;
  const filter = typeof raw.filter === "string" ? raw.filter.trim().slice(0, 100) : "";
  const { supabase, merchant } = await requireMerchant();
  const { locale, t } = await getDictionary();
  const p = t.dashboard.products;

  const { data, error } = await supabase.from("merchant_offers").select("id,price,currency,condition,availability,merchant_sku,is_active,updated_at,canonical_products(name,brand,model,image_url)").eq("merchant_id", merchant.id).order("updated_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  const allOffers = (data ?? []) as MerchantOffer[];
  const needle = filter.toLocaleLowerCase(locale);
  const offers = needle ? allOffers.filter((offer) => {
    const product = relationOne(offer.canonical_products);
    return [product?.name, product?.brand, product?.model, offer.merchant_sku].some((value) => value?.toLocaleLowerCase(locale).includes(needle));
  }) : allOffers;

  const categoryLabel = (name: string) => t.productCategories[name] ?? (t.categories as Record<string, string>)[name] ?? name;
  const notices = [
    merchant.status === "pending" && { tone: "border-amber-200 bg-amber-50 text-amber-900", Icon: Clock3, text: p.pendingNotice, link: false },
    (merchant.status === "rejected" || merchant.status === "suspended") && { tone: "border-red-200 bg-red-50 text-red-800", Icon: AlertTriangle, text: p.hiddenNotice, link: false },
    !merchant.whatsapp && { tone: "border-amber-200 bg-amber-50 text-amber-900", Icon: AlertTriangle, text: p.whatsappNotice, link: true },
  ].filter(Boolean) as { tone: string; Icon: typeof Clock3; text: string; link: boolean }[];
  const small = `${inputClass} h-9`;

  return <main>
    <DashboardHeader title={p.heading} description={p.body} />
    <div className="p-5 sm:p-8">
      <DashboardNotice params={raw} t={t} />
      {notices.map(({ tone, Icon, text, link }) => <div key={text} className={`mb-4 flex gap-3 rounded-xl border p-4 text-sm ${tone}`}><Icon className="mt-0.5 size-4 shrink-0" /><p className="leading-6">{text}{link && <> <Link href="/dashboard/profile" className="font-bold underline">{p.openProfile}</Link></>}</p></div>)}

      <section className={`${cardClass} p-5 sm:p-6`}>
        <h2 className="mb-4 text-lg font-black">{p.addHeading}</h2>
        <AddProductForm
          labels={p} notices={t.dashboard.notices} defaultCategory={merchant.category}
          conditions={CONDITIONS.map((value) => ({ value, label: valueLabel(t, value) }))}
          availabilities={AVAILABILITIES.map((value) => ({ value, label: valueLabel(t, value) }))}
          categories={PRODUCT_CATEGORIES.map((value) => ({ value, label: categoryLabel(value) }))}
        />
      </section>

      <section className="mt-7">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-black">{p.yourOffers} <span className="font-semibold text-[#7A857E]">({allOffers.length})</span></h2>
          {allOffers.length > 0 && <form className="flex gap-2">
            <span className="relative block flex-1 sm:w-64"><Search className="absolute left-3 top-2.5 size-4 text-[#839087]" /><input name="filter" defaultValue={filter} maxLength={100} aria-label={p.filterPlaceholder} placeholder={p.filterPlaceholder} className={`${small} pl-9`} /></span>
            <button className="h-9 rounded-full border border-[#D9E1DC] bg-white px-4 text-xs! font-bold hover:border-[#07834A] hover:text-[#07834A]">{p.filter}</button>
            {filter && <Link href="/dashboard/products" className="grid h-9 place-items-center px-2 text-xs font-bold text-[#5D6A62] hover:text-[#07834A]">{p.clearFilter}</Link>}
          </form>}
        </div>
        <div className={`${cardClass} overflow-hidden`}>
          {offers.length === 0 ? <p className="px-6 py-14 text-center text-sm text-[#78837C]">{filter ? format(p.noFilterMatches, { query: filter }) : p.noOffers}</p>
            : <ul className="divide-y divide-[#E9EDEA]">{offers.map((offer) => {
              const product = relationOne(offer.canonical_products);
              const image = safeImageUrl(product?.image_url);
              const formId = `offer-${offer.id}`;
              return <li key={offer.id} className={`grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6 ${offer.is_active ? "" : "bg-[#FAFBFA]"}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F6F4] text-[#A7B0AA]">{image ? <Image src={image} alt="" fill sizes="48px" unoptimized className="object-contain p-1" /> : <Package className="size-5" />}</span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{product?.name ?? "—"}</p>
                    <p className="truncate text-xs text-[#7A857E]">{product?.brand}{product?.model ? ` · ${product.model}` : ""} · {valueLabel(t, offer.condition)}{offer.merchant_sku ? ` · ${offer.merchant_sku}` : ""}</p>
                    <p className="mt-1 flex items-center gap-2 text-[11px] text-[#7A857E]"><span className={`rounded-full px-2 py-0.5 font-bold ${offer.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{offer.is_active ? p.visible : p.hidden}</span>{format(p.updated, { date: formatDate(offer.updated_at, locale) })}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form id={formId} action={updateOffer} className="contents"><input type="hidden" name="id" value={offer.id} /></form>
                  <input form={formId} name="price" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={Number(offer.price)} aria-label={p.price} className={cn(small, "w-28")} />
                  <select form={formId} name="currency" defaultValue={offer.currency} aria-label={p.currency} className={cn(small, "w-20")}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
                  <select form={formId} name="availability" defaultValue={offer.availability} aria-label={p.availability} className={cn(small, "w-36")}>{AVAILABILITIES.map((a) => <option key={a} value={a}>{valueLabel(t, a)}</option>)}</select>
                  <button form={formId} className="h-9 rounded-full bg-[#07834A] px-4 text-xs! font-bold text-white hover:bg-[#056B3D]">{p.save}</button>
                  <form action={setOfferVisibility}><input type="hidden" name="id" value={offer.id} /><input type="hidden" name="active" value={String(!offer.is_active)} /><button className="h-9 px-2 text-xs! font-bold text-[#38463D] hover:text-[#07834A]">{offer.is_active ? p.hide : p.show}</button></form>
                  <form action={deleteOffer}><input type="hidden" name="id" value={offer.id} /><ConfirmButton message={p.confirmRemove} className="h-9 px-2 text-xs! font-bold text-red-700 hover:text-red-800">{p.remove}</ConfirmButton></form>
                </div>
              </li>;
            })}</ul>}
        </div>
      </section>
    </div>
  </main>;
}
