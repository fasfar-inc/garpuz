import type { Metadata } from "next";
import Link from "next/link";
import { CloudOff, SearchX } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Filters } from "@/components/search/filters";
import { OfferCard } from "@/components/search/offer-card";
import { getDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { searchOffers } from "@/lib/search";
import { searchSchema } from "@/lib/validation";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.search.title };
}

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const { t } = await getDictionary();
  const raw = await searchParams;
  const scalar = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  // Empty filter selects submit "", which should mean "no filter".
  const cleaned = Object.fromEntries(Object.entries(scalar).filter(([, v]) => v !== "" && v !== undefined));
  const parsed = searchSchema.safeParse(cleaned);
  const query = typeof scalar.q === "string" ? scalar.q : "";
  if (!parsed.success) return <main className="min-h-screen bg-white"><SiteHeader query={query} /><Empty t={t} kind="invalid" query={query} /></main>;

  const p = parsed.data;
  const result = await searchOffers({ query: p.q, sort: p.sort, city: p.city, condition: p.condition, brand: p.brand, availability: p.availability, page: p.page });
  const pages = Math.ceil(result.total / 12);
  const windowStart = Math.max(1, Math.min(p.page - 3, pages - 6));
  const pageNumbers = Array.from({ length: Math.min(pages, 7) }, (_, i) => windowStart + i);

  return <main className="min-h-screen bg-white"><SiteHeader query={p.q} /><div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
    {result.unavailable ? <Empty t={t} kind="unavailable" query={p.q} /> : <>
      <Filters filters={result.filters} values={{ ...cleaned, q: p.q, sort: p.sort }} t={t} />
      <div className="mt-5 flex items-baseline justify-between"><p className="text-sm text-[#657269]"><strong className="font-bold text-[#17211B]">{t.search.matching(result.total)}</strong></p><p className="hidden text-xs text-[#7C8880] sm:block">{t.search.resultsFor(p.q)}</p></div>
      {result.offers.length ? <div className="mt-3 space-y-3 sm:mt-5">{result.offers.map((offer) => <OfferCard key={offer.offer_id} offer={offer} t={t} />)}</div> : <Empty t={t} kind="empty" query={p.q} />}
      {pages > 1 && <nav className="mt-8 flex justify-center gap-2" aria-label={t.search.pagination}>{pageNumbers.map((page) => <Link key={page} href={{ pathname: "/search", query: { ...cleaned, page } }} aria-current={page === p.page ? "page" : undefined} className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${page === p.page ? "bg-[#07834A] text-white" : "border border-[#DDE4DF] bg-white"}`}>{page}</Link>)}</nav>}
    </>}
  </div></main>;
}

function Empty({ t, kind, query }: { t: Dictionary; kind: "invalid" | "empty" | "unavailable"; query: string }) {
  const Icon = kind === "unavailable" ? CloudOff : SearchX;
  const title = kind === "invalid" ? t.search.invalidTitle : kind === "unavailable" ? t.search.unavailableTitle : t.search.emptyTitle;
  const body = kind === "invalid" ? t.search.invalidBody : kind === "unavailable" ? t.search.unavailableBody : t.search.emptyBody(query);
  return <section className="mx-auto max-w-lg px-5 py-24 text-center"><div className={`mx-auto grid size-14 place-items-center rounded-full ${kind === "unavailable" ? "bg-amber-50 text-amber-700" : "bg-[#EDF7F1] text-[#07834A]"}`}><Icon className="size-6" /></div><h1 className="mt-5 text-xl font-bold">{title}</h1><p className="mt-2 text-sm leading-6 text-[#68766D]">{body}</p></section>;
}
