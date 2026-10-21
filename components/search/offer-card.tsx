import Image from "next/image";
import { ExternalLink, MapPin, MessageCircle, Package } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SearchOffer } from "@/lib/types";
import { formatPrice, safeWebsiteUrl, whatsappUrl } from "@/lib/utils";
import { WhatsAppLink } from "./whatsapp-link";

export function OfferCard({ offer, t }: { offer: SearchOffer; t: Dictionary }) {
  const site = safeWebsiteUrl(offer.website);
  const chat = whatsappUrl(offer.whatsapp, t.search.whatsappMessage(offer.product_name));
  const price = formatPrice(Number(offer.price), offer.currency);
  return <article className="group grid grid-cols-[96px_1fr] gap-4 border-b border-[#E7ECE8] py-5 sm:grid-cols-[140px_1fr_auto] sm:gap-6 sm:rounded-2xl sm:border sm:p-5 sm:transition sm:hover:border-[#BFD6C8] sm:hover:shadow-[0_5px_24px_rgba(23,33,27,.06)]">
    <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F4F6F4]">
      {offer.image_url ? <Image src={offer.image_url} alt={offer.product_name} fill sizes="140px" className="object-contain p-2" unoptimized={!offer.image_url.includes(".supabase.co")} /> : <div className="grid h-full place-items-center text-[#A7B0AA]"><Package className="size-8" /></div>}
    </div>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#EDF7F1] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#07834A]">{t.values[offer.condition] ?? offer.condition}</span><span className={`text-[11px] font-medium ${offer.availability === "in_stock" ? "text-[#07834A]" : "text-[#8A5D18]"}`}>● {t.values[offer.availability] ?? offer.availability}</span></div>
      <h2 className="mt-2 line-clamp-2 text-[15px] font-bold leading-snug text-[#17211B] sm:text-lg">{offer.product_name}</h2>
      <p className="mt-1 text-xs text-[#6D7971] sm:text-sm">{offer.brand}{offer.model ? ` · ${offer.model}` : ""}</p>
      {offer.specifications && Object.keys(offer.specifications).length > 0 && <p className="mt-1 truncate text-xs text-[#7C8880]">{Object.entries(offer.specifications).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>}
      <div className="mt-3 flex items-center gap-1 text-xs text-[#5E6C63]"><MapPin className="size-3.5 text-[#07834A]" /><span className="font-semibold text-[#344138]">{offer.merchant_name}</span>{offer.city && <span>· {offer.city}</span>}</div>
      <div className="mt-3 sm:hidden"><p className="text-lg font-black text-[#07834A]">{price}</p><div className="mt-2 flex items-center gap-4"><WhatsAppLink offerId={offer.offer_id} href={chat} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07834A]"><MessageCircle className="size-4" /> WhatsApp</WhatsAppLink>{site && <a href={site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#56645B]">{t.search.visitWebsite} <ExternalLink className="size-3" /></a>}</div></div>
    </div>
    <div className="hidden min-w-40 flex-col items-end justify-between sm:flex">
      <div className="text-right"><p className="text-2xl font-black tracking-tight text-[#07834A]">{price}</p><p className="mt-1 text-[11px] text-[#849087]">{t.search.listedIn(offer.currency)}</p></div>
      <div className="flex w-full flex-col gap-2"><WhatsAppLink offerId={offer.offer_id} href={chat} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#07834A] px-4 text-sm font-bold text-white hover:bg-[#056B3D]"><MessageCircle className="size-4" /> WhatsApp</WhatsAppLink>{site && <a href={site} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#D9E1DC] text-sm font-semibold hover:border-[#07834A] hover:text-[#07834A]">{t.search.visitWebsite} <ExternalLink className="size-3.5" /></a>}</div>
    </div>
  </article>;
}
