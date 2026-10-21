import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Package, Search } from "lucide-react";
import { createListing } from "@/app/dashboard/actions";
import { OfferFields } from "@/components/dashboard/offer-fields";
import { cardClass, inputClass, labelClass, Notice, outlineButton, PageHeader, pickMessage, primaryButton } from "@/components/dashboard/ui";
import { SHOP_CATEGORIES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant/context";

export const metadata: Metadata = { title: "Add product" };

type CatalogProduct = { id: string; name: string; brand: string; model: string | null; category: string; image_url: string | null };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { supabase, merchant } = await requireMerchant();
  const { t } = await getDictionary();
  const p = t.products;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const productParam = typeof params.product === "string" && /^[0-9a-f-]{36}$/i.test(params.product) ? params.product : "";

  let selected: CatalogProduct | null = null;
  if (productParam) {
    const { data } = await supabase.from("canonical_products").select("id,name,brand,model,category,image_url").eq("id", productParam).maybeSingle();
    selected = data as CatalogProduct | null;
  }

  let matches: CatalogProduct[] = [];
  if (q && !selected) {
    const safe = q.replace(/[%_,()\\]/g, " ").trim();
    if (safe) {
      const { data } = await supabase.from("canonical_products").select("id,name,brand,model,category,image_url")
        .or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`).order("name").limit(8);
      matches = (data ?? []) as CatalogProduct[];
    }
  }

  return <main>
    <PageHeader eyebrow={merchant.business_name} title={p.addTitle} />
    <div className="max-w-3xl p-5 sm:p-8">
      <Link href="/dashboard/products" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#56645B] hover:text-[#07834A]"><ArrowLeft className="size-4" />{p.title}</Link>
      <Notice error={pickMessage(params, "error", { invalid: p.invalid })} />
      <p className="mb-5 text-sm text-[#68766D]">{p.addSub}</p>

      {!selected && <section className={`${cardClass} mb-5 p-5`}>
        <form className="flex gap-2" role="search">
          <label className="sr-only" htmlFor="catalog-q">{p.catalogSearch}</label>
          <div className="relative flex-1"><Search className="absolute left-3 top-[1.15rem] size-4 text-[#839087]" /><input id="catalog-q" name="q" defaultValue={q} placeholder={p.catalogSearchPlaceholder} className={`${inputClass} mt-1.5 pl-9`} /></div>
          <button className={`${outlineButton} mt-1.5 h-11`}>{p.catalogSearch}</button>
        </form>
        {q && (matches.length ? <ul className="mt-4 divide-y divide-[#EEF2EF]">{matches.map((m) => <li key={m.id} className="flex items-center gap-3 py-3">
          <Thumb url={m.image_url} name={m.name} />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{m.name}</p><p className="truncate text-xs text-[#6D7971]">{m.brand}{m.model ? ` · ${m.model}` : ""} · {m.category}</p></div>
          <Link href={`/dashboard/products/new?product=${m.id}`} className="shrink-0 text-sm font-bold text-[#07834A]">{p.use}</Link>
        </li>)}</ul> : <p className="mt-4 text-sm text-[#68766D]">{p.catalogNone}</p>)}
      </section>}

      <form action={createListing} className="space-y-5">
        <section className={`${cardClass} p-5`}>
          <h2 className="mb-4 font-bold">{p.productDetails}</h2>
          {selected ? <div className="flex items-center gap-3 rounded-xl bg-[#F3F8F5] p-3">
            <input type="hidden" name="productId" value={selected.id} />
            <Thumb url={selected.image_url} name={selected.name} />
            <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#07834A]">{p.selected}</p><p className="truncate font-bold">{selected.name}</p><p className="truncate text-xs text-[#6D7971]">{selected.brand}{selected.model ? ` · ${selected.model}` : ""}</p></div>
            <Link href="/dashboard/products/new" className="shrink-0 text-sm font-bold text-[#56645B] hover:text-[#07834A]">{p.change}</Link>
          </div> : <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>{p.name}<input name="name" required minLength={2} maxLength={160} defaultValue={q} className={inputClass} /></label>
            <label className={labelClass}>{p.brand}<input name="brand" required maxLength={100} className={inputClass} /></label>
            <label className={labelClass}>{p.model} <span className="font-normal text-[#8A948E]">({t.common.optional})</span><input name="model" maxLength={120} className={inputClass} /></label>
            <label className={labelClass}>{p.category}<input name="category" required minLength={2} maxLength={100} list="product-categories" defaultValue={t.categories[merchant.category] ? merchant.category : ""} className={inputClass} /><datalist id="product-categories">{SHOP_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></label>
            <label className={labelClass}>{p.imageUrl} <span className="font-normal text-[#8A948E]">({t.common.optional})</span><input name="imageUrl" type="url" maxLength={300} placeholder="https://" className={inputClass} /></label>
          </div>}
        </section>
        <section className={`${cardClass} p-5`}>
          <h2 className="mb-4 font-bold">{p.offerDetails}</h2>
          <OfferFields t={t} />
        </section>
        <div className="flex gap-2"><button className={primaryButton}>{p.create}</button><Link href="/dashboard/products" className={outlineButton}>{t.common.cancel}</Link></div>
      </form>
    </div>
  </main>;
}

function Thumb({ url, name }: { url: string | null; name: string }) {
  return <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white">{url ? <Image src={url} alt={name} fill sizes="48px" className="object-contain p-1" unoptimized={!url.includes(".supabase.co")} /> : <div className="grid h-full place-items-center text-[#A7B0AA]"><Package className="size-5" /></div>}</div>;
}
