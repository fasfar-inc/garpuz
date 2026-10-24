import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, MapPin, MessageCircle, Package, Pencil, Plus } from "lucide-react";
import { deleteProduct, setAvailability, showProduct } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/dashboard/ui";
import { cardClass, primaryButton } from "@/components/dashboard/styles";
import { relationOne } from "@/lib/admin/types";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";
import { productTitle } from "@/lib/product-text";
import { cn, formatPrice, safeImageUrl } from "@/lib/utils";

type Product = { name: string; brand: string; model: string | null; image_url: string | null };
type Offer = { id: string; price: number; currency: string; availability: string; is_active: boolean; canonical_products: Product | Product[] | null };

const NOTICES = ["shopSaved", "productDeleted"] as const;

export default async function MyShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { supabase, merchant } = await requireMerchant();
  const { t } = await getDictionary();
  const d = t.dashboard;
  const { data, error } = await supabase.from("merchant_offers").select("id,price,currency,availability,is_active,canonical_products(name,brand,model,image_url)").eq("merchant_id", merchant.id).order("updated_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  const offers = (data ?? []) as Offer[];
  const savedId = typeof params.saved === "string" ? params.saved : null;
  const notice = savedId ? d.notices.saved : NOTICES.find((key) => key === params.notice) ? d.notices[params.notice as (typeof NOTICES)[number]] : null;
  const status = merchant.status === "pending" ? { text: d.pending, Icon: Clock3 } : merchant.status === "rejected" ? { text: d.rejected, Icon: AlertTriangle } : merchant.status === "suspended" ? { text: d.suspended, Icon: AlertTriangle } : null;

  return <main className="space-y-5">
    {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="size-4 shrink-0" />{notice}</p>}

    <section className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black tracking-tight">{merchant.business_name}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#5D6A62]">
            {merchant.city && <span className="inline-flex items-center gap-1"><MapPin className="size-4 text-[#07834A]" />{merchant.city}</span>}
            {merchant.whatsapp && <span className="inline-flex items-center gap-1"><MessageCircle className="size-4 text-[#07834A]" />+{merchant.whatsapp}</span>}
          </p>
        </div>
        <Link href="/dashboard/edit" className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-[#07834A] hover:bg-[#EAF6F0]"><Pencil className="size-3.5" />{d.editShop}</Link>
      </div>
      {!merchant.whatsapp && <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{d.missingWhatsapp} <Link href="/dashboard/edit" className="font-bold underline">{d.addWhatsapp}</Link></span></p>}
      {status && <p className="mt-4 flex gap-2 rounded-xl bg-[#F4F7F5] px-3 py-2.5 text-sm text-[#4D5C53]"><status.Icon className="mt-0.5 size-4 shrink-0 text-[#07834A]" />{status.text}</p>}
    </section>

    {offers.length === 0 ? <section className={`${cardClass} px-5 py-10 text-center`}>
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#EAF6F0] text-[#07834A]"><Package className="size-7" /></span>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#5D6A62]">{d.addFirstBody}</p>
      <Link href="/dashboard/products/new" className={cn(primaryButton, "mt-6 h-14 w-full px-8 text-[17px]! sm:w-auto")}><Plus className="size-5" />{d.addFirst}</Link>
    </section> : <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-black">{d.products} <span className="font-semibold text-[#7A857E]">({offers.length})</span></h2>
        <Link href="/dashboard/products/new" className={cn(primaryButton, "hidden h-10 px-5 sm:inline-flex")}><Plus className="size-4" />{d.addProduct}</Link>
      </div>
      <ul className="space-y-3">{offers.map((offer) => {
        const product = relationOne(offer.canonical_products);
        const image = safeImageUrl(product?.image_url);
        const inStock = offer.availability !== "out_of_stock";
        return <li key={offer.id} className={cn(cardClass, "p-4", offer.id === savedId && "border-[#07834A] ring-3 ring-[#07834A]/15")}>
          <div className="flex gap-3">
            <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F4F6F4] text-[#A7B0AA]">{image ? <Image src={image} alt="" fill sizes="64px" unoptimized className="object-contain p-1" /> : <Package className="size-6" />}</span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-bold leading-snug">{product ? productTitle(product) : "—"}</p>
              <p className="mt-1 text-lg font-black text-[#07834A]">{formatPrice(Number(offer.price), offer.currency)}</p>
              <p className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className={cn("rounded-full px-2 py-0.5", inStock ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>{inStock ? d.inStock : d.outOfStock}</span>
                {!offer.is_active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{d.hidden}</span>}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#EDF1EE] pt-3">
            <form action={setAvailability}><input type="hidden" name="id" value={offer.id} /><input type="hidden" name="availability" value={inStock ? "out_of_stock" : "in_stock"} /><SubmitButton className="h-9 rounded-full border border-[#D9E1DC] bg-white px-3.5 text-xs! font-bold text-[#26342B] hover:border-[#07834A] hover:text-[#07834A]">{inStock ? d.markOut : d.markIn}</SubmitButton></form>
            {!offer.is_active && <form action={showProduct}><input type="hidden" name="id" value={offer.id} /><SubmitButton className="h-9 rounded-full border border-[#D9E1DC] bg-white px-3.5 text-xs! font-bold text-[#26342B] hover:border-[#07834A] hover:text-[#07834A]">{d.show}</SubmitButton></form>}
            <Link href={`/dashboard/products/${offer.id}`} className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-bold text-[#07834A] hover:bg-[#EAF6F0]"><Pencil className="size-3.5" />{d.edit}</Link>
            <form action={deleteProduct} className="ml-auto"><input type="hidden" name="id" value={offer.id} /><SubmitButton confirm={d.confirmRemove} className="h-9 rounded-full px-3 text-xs! font-bold text-red-700 hover:bg-red-50">{d.remove}</SubmitButton></form>
          </div>
        </li>;
      })}</ul>
      {/* On phones the add button stays within thumb reach at the bottom of the screen. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#E3E9E5] bg-white/95 p-3 backdrop-blur sm:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <Link href="/dashboard/products/new" className={cn(primaryButton, "w-full")}><Plus className="size-5" />{d.addProduct}</Link>
      </div>
    </section>}
  </main>;
}
