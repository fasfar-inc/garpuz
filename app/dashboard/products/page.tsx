import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, FileUp, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { deleteListing, setListingActive } from "@/app/dashboard/actions";
import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { cardClass, Notice, outlineButton, PageHeader, pickMessage, primaryButton } from "@/components/dashboard/ui";
import { relationOne } from "@/lib/admin/types";
import { getDictionary } from "@/lib/i18n/server";
import { isSearchReady, requireMerchant } from "@/lib/merchant/context";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

type Listing = {
  id: string; price: number; currency: string; condition: string; availability: string; merchant_sku: string | null;
  is_active: boolean; admin_hidden: boolean; updated_at: string;
  canonical_products: { name: string; brand: string; model: string | null } | { name: string; brand: string; model: string | null }[] | null;
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { supabase, merchant } = await requireMerchant();
  const { t } = await getDictionary();
  const p = t.products;
  const { data, error } = await supabase
    .from("merchant_offers")
    .select("id,price,currency,condition,availability,merchant_sku,is_active,admin_hidden,updated_at,canonical_products(name,brand,model)")
    .eq("merchant_id", merchant.id)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  const listings = (data ?? []) as Listing[];
  const publishable = merchant.status === "approved" && isSearchReady(merchant);

  const statusOf = (l: Listing) =>
    l.admin_hidden ? { label: p.hidden, tone: "bg-red-50 text-red-700" }
    : !l.is_active ? { label: p.paused, tone: "bg-slate-100 text-slate-600" }
    : !publishable ? { label: p.waitingApproval, tone: "bg-amber-50 text-amber-700" }
    : { label: p.live, tone: "bg-emerald-50 text-emerald-700" };

  return <main>
    <PageHeader eyebrow={merchant.business_name} title={p.title} action={<Link href="/dashboard/products/new" className={primaryButton}><Plus className="size-4" /><span className="hidden sm:inline">{t.dash.addProduct}</span></Link>} />
    <div className="p-5 sm:p-8">
      <Notice notice={pickMessage(params, "notice", { saved: p.saved, deleted: p.deleted })} error={pickMessage(params, "error", { notFound: p.notFound })} />
      <p className="mb-5 text-sm text-[#68766D]">{p.sub}</p>
      {listings.length === 0 ? <div className={`${cardClass} px-6 py-14 text-center`}>
        <Boxes className="mx-auto size-8 text-[#07834A]" />
        <h2 className="mt-4 text-lg font-bold">{p.empty}</h2>
        <p className="mt-1 text-sm text-[#68766D]">{p.emptyBody}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2"><Link href="/dashboard/products/new" className={primaryButton}><Plus className="size-4" />{t.dash.addProduct}</Link><Link href="/dashboard/import" className={outlineButton}><FileUp className="size-4" />{t.dash.nav.import}</Link></div>
      </div> : <ul className={`${cardClass} divide-y divide-[#EEF2EF] overflow-hidden`}>
        {listings.map((listing) => {
          const product = relationOne(listing.canonical_products);
          const status = statusOf(listing);
          return <li key={listing.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
            <div className="min-w-0 flex-1">
              <Link href={`/dashboard/products/${listing.id}`} className="line-clamp-2 font-bold hover:text-[#07834A]">{product?.name ?? "—"}</Link>
              <p className="mt-0.5 text-xs text-[#6D7971]">{product?.brand}{product?.model ? ` · ${product.model}` : ""}{listing.merchant_sku ? ` · ${listing.merchant_sku}` : ""}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className={`rounded-full px-2 py-0.5 ${status.tone}`}>{status.label}</span>
                <span className="rounded-full bg-[#F1F5F2] px-2 py-0.5 text-[#4F5D54]">{t.values[listing.condition] ?? listing.condition}</span>
                <span className={listing.availability === "in_stock" ? "text-[#07834A]" : "text-[#8A5D18]"}>● {t.values[listing.availability] ?? listing.availability}</span>
              </div>
            </div>
            <p className="text-lg font-black text-[#07834A] sm:w-36 sm:text-right">{formatPrice(Number(listing.price), listing.currency)}</p>
            <div className="flex items-center gap-1">
              <Link href={`/dashboard/products/${listing.id}`} className="grid size-9 place-items-center rounded-lg text-[#56645B] hover:bg-[#F1F5F2] hover:text-[#07834A]" aria-label={t.common.edit} title={t.common.edit}><Pencil className="size-4" /></Link>
              {!listing.admin_hidden && <form action={setListingActive}><input type="hidden" name="id" value={listing.id} /><input type="hidden" name="active" value={String(!listing.is_active)} /><button className="grid size-9 place-items-center rounded-lg text-[#56645B] hover:bg-[#F1F5F2] hover:text-[#07834A]" aria-label={listing.is_active ? p.pause : p.resume} title={listing.is_active ? p.pause : p.resume}>{listing.is_active ? <Pause className="size-4" /> : <Play className="size-4" />}</button></form>}
              <form action={deleteListing}><input type="hidden" name="id" value={listing.id} /><ConfirmButton message={p.confirmDelete} className="grid size-9 place-items-center rounded-lg text-[#56645B] hover:bg-red-50 hover:text-red-700" label={t.common.delete}><Trash2 className="size-4" /></ConfirmButton></form>
            </div>
          </li>;
        })}
      </ul>}
    </div>
  </main>;
}
