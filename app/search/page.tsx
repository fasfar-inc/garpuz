import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Filters } from "@/components/search/filters";
import { OfferCard } from "@/components/search/offer-card";
import { searchOffers } from "@/lib/search";
import { searchSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Product search" };

type Params = Promise<Record<string, string | string[] | undefined>>;
export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const raw = await searchParams;
  const scalar = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = searchSchema.safeParse(scalar);
  const query = typeof scalar.q === "string" ? scalar.q : "";
  if (!parsed.success) return <><SiteHeader query={query} /><Empty query={query} invalid /></>;
  const p = parsed.data;
  const result = await searchOffers({ query: p.q, sort: p.sort, city: p.city, condition: p.condition, brand: p.brand, availability: p.availability, page: p.page });
  const pages = Math.ceil(result.total / 12);
  return <main className="min-h-screen bg-white"><SiteHeader query={p.q} /><div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
    <Filters filters={result.filters} values={{ ...p, page: String(p.page) }} />
    <div className="mt-5 flex items-baseline justify-between"><p className="text-sm text-[#657269]"><strong className="font-bold text-[#17211B]">{result.total}</strong> matching {result.total === 1 ? "offer" : "offers"}</p>{p.q && <p className="hidden text-xs text-[#7C8880] sm:block">Results for “{p.q}”</p>}</div>
    {result.offers.length ? <div className="mt-3 space-y-3 sm:mt-5">{result.offers.map((offer) => <OfferCard key={offer.offer_id} offer={offer} />)}</div> : <Empty query={p.q} />}
    {pages > 1 && <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">{Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((page) => <Link key={page} href={{ pathname: "/search", query: { ...scalar, page } }} className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${page === p.page ? "bg-[#07834A] text-white" : "border border-[#DDE4DF] bg-white"}`}>{page}</Link>)}</nav>}
  </div></main>;
}

function Empty({ query, invalid = false }: { query: string; invalid?: boolean }) { return <section className="mx-auto max-w-lg px-5 py-24 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-[#EDF7F1] text-[#07834A]"><SearchX className="size-6" /></div><h1 className="mt-5 text-xl font-bold">{invalid ? "Enter a product to search" : "No offers found"}</h1><p className="mt-2 text-sm leading-6 text-[#68766D]">{invalid ? "Try searching for a brand, model, or product name." : `There are no approved listings matching “${query}” yet. Try a broader search or check back soon.`}</p></section>; }
