import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";
import { deleteListing, updateListing } from "@/app/dashboard/actions";
import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { OfferFields } from "@/components/dashboard/offer-fields";
import { cardClass, Notice, outlineButton, PageHeader, pickMessage, primaryButton } from "@/components/dashboard/ui";
import { relationOne } from "@/lib/admin/types";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant/context";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, merchant } = await requireMerchant();
  const { t } = await getDictionary();
  const p = t.products;
  const { data } = await supabase
    .from("merchant_offers")
    .select("id,price,currency,condition,availability,merchant_sku,is_active,admin_hidden,canonical_products(name,brand,model,category)")
    .eq("id", id)
    .eq("merchant_id", merchant.id)
    .maybeSingle();
  if (!data) notFound();
  type ProductInfo = { name: string; brand: string; model: string | null; category: string };
  const product = relationOne(data.canonical_products as unknown as ProductInfo | ProductInfo[] | null);

  return <main>
    <PageHeader eyebrow={merchant.business_name} title={p.editTitle} />
    <div className="max-w-3xl p-5 sm:p-8">
      <Link href="/dashboard/products" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#56645B] hover:text-[#07834A]"><ArrowLeft className="size-4" />{p.title}</Link>
      <Notice error={pickMessage(query, "error", { invalid: p.invalid, duplicate: p.duplicate })} />
      {data.admin_hidden && <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><ShieldAlert className="mt-0.5 size-5 shrink-0" /><p><b>{p.hidden}.</b> {p.hiddenBody}</p></div>}
      <section className={`${cardClass} mb-5 p-5`}>
        <h2 className="font-bold">{product?.name}</h2>
        <p className="mt-1 text-sm text-[#6D7971]">{product?.brand}{product?.model ? ` · ${product.model}` : ""} · {product?.category}</p>
        <p className="mt-3 text-xs text-[#8A948E]">{p.editSub}</p>
      </section>
      <form action={updateListing} className="space-y-5">
        <input type="hidden" name="id" value={data.id} />
        <section className={`${cardClass} p-5`}>
          <h2 className="mb-4 font-bold">{p.offerDetails}</h2>
          <OfferFields t={t} defaults={{ price: Number(data.price), currency: data.currency, condition: data.condition, availability: data.availability, sku: data.merchant_sku, active: data.is_active }} />
        </section>
        <div className="flex flex-wrap gap-2"><button className={primaryButton}>{t.common.save}</button><Link href="/dashboard/products" className={outlineButton}>{t.common.cancel}</Link></div>
      </form>
      <form action={deleteListing} className="mt-8 border-t border-[#E3E9E5] pt-6"><input type="hidden" name="id" value={data.id} /><ConfirmButton message={p.confirmDelete} label={t.common.delete} className="inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:text-red-800"><Trash2 className="size-4" />{t.common.delete}</ConfirmButton></form>
    </div>
  </main>;
}
