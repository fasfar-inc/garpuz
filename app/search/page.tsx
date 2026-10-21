import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Filters } from "@/components/search/filters";
import { OfferCard } from "@/components/search/offer-card";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/server";
import { pageWindow } from "@/lib/pagination";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { PAGE_SIZE, searchOffers } from "@/lib/search";
import { searchSchema } from "@/lib/validation";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.search.title, robots: { index: false, follow: true } };
}

type Params = Promise<Record<string, string | string[] | undefined>>;
export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const raw = await searchParams;
  const { t } = await getDictionary();
  const scalar = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = searchSchema.safeParse(scalar);
  const query = typeof scalar.q === "string" ? scalar.q : "";
  if (!parsed.success) return <main className="min-h-screen bg-white"><SiteHeader query={query} /><Empty t={t} query={query} invalid /></main>;
  const p = parsed.data;
  const record = await allowRequest("SEARCH_RATE_LIMITER", clientKey(await headers()));
  const result = await searchOffers({ query: p.q, sort: p.sort, city: p.city, condition: p.condition, brand: p.brand, availability: p.availability, page: p.page, record });
  const pages = Math.ceil(result.total / PAGE_SIZE);
  const href = (page: number) => ({ pathname: "/search", query: { ...scalar, page } });
  return <main className="min-h-screen bg-white"><SiteHeader query={p.q} /><div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
    <Filters filters={result.filters} values={{ ...p, page: String(p.page) }} t={t} />
    <div className="mt-5 flex items-baseline justify-between"><p className="text-sm text-[#657269]"><strong className="font-bold text-[#17211B]">{result.total}</strong> {t.search.matching} {result.total === 1 ? t.search.offer : t.search.offers}</p>{p.q && <p className="hidden text-xs text-[#7C8880] sm:block">{format(t.search.resultsFor, { query: p.q })}</p>}</div>
    {result.offers.length ? <div className="mt-3 space-y-3 sm:mt-5">{result.offers.map((offer) => <OfferCard key={offer.offer_id} offer={offer} t={t} />)}</div> : <Empty t={t} query={p.q} />}
    {pages > 1 && <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={t.search.pagination}>
      {p.page > 1 && <Link href={href(p.page - 1)} aria-label={t.search.previous} className="grid size-9 place-items-center rounded-full border border-[#DDE4DF] bg-white"><ChevronLeft className="size-4" /></Link>}
      {pageWindow(p.page, pages).map((page, i) => page === null
        ? <span key={`gap-${i}`} className="px-1 text-sm text-[#8A948E]">…</span>
        : <Link key={page} href={href(page)} aria-current={page === p.page ? "page" : undefined} className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${page === p.page ? "bg-[#07834A] text-white" : "border border-[#DDE4DF] bg-white"}`}>{page}</Link>)}
      {p.page < pages && <Link href={href(p.page + 1)} aria-label={t.search.next} className="grid size-9 place-items-center rounded-full border border-[#DDE4DF] bg-white"><ChevronRight className="size-4" /></Link>}
    </nav>}
  </div></main>;
}

function Empty({ t, query, invalid = false }: { t: Dictionary; query: string; invalid?: boolean }) { return <section className="mx-auto max-w-lg px-5 py-24 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-[#EDF7F1] text-[#07834A]"><SearchX className="size-6" /></div><h1 className="mt-5 text-xl font-bold">{invalid ? t.search.invalidTitle : t.search.emptyTitle}</h1><p className="mt-2 text-sm leading-6 text-[#68766D]">{invalid ? t.search.invalidBody : format(t.search.emptyBody, { query })}</p></section>; }
