import { createClient } from "@/lib/supabase/server";
import type { SearchFilters, SearchOffer } from "@/lib/types";

export async function searchOffers(params: {
  query: string;
  sort: string;
  city?: string;
  condition?: string;
  brand?: string;
  availability?: string;
  page: number;
}) {
  const supabase = await createClient();
  if (!supabase) return { offers: [] as SearchOffer[], total: 0, filters: emptyFilters };

  const { data, error } = await supabase.rpc("search_public_offers", {
    search_query: params.query,
    sort_mode: params.sort,
    city_filter: params.city || null,
    condition_filter: params.condition || null,
    brand_filter: params.brand || null,
    availability_filter: params.availability || null,
    page_number: params.page,
    page_size: 12,
  });
  if (error) {
    console.error("Search failed", error.message);
    return { offers: [] as SearchOffer[], total: 0, filters: emptyFilters };
  }
  const offers = (data ?? []) as SearchOffer[];
  return {
    offers,
    total: offers[0]?.total_count ?? 0,
    filters: deriveFilters(offers),
  };
}

const emptyFilters: SearchFilters = { cities: [], brands: [], conditions: [], availabilities: [] };

function deriveFilters(offers: SearchOffer[]): SearchFilters {
  const unique = (values: string[]) => [...new Set(values)].sort();
  return {
    cities: unique(offers.map((o) => o.city)),
    brands: unique(offers.map((o) => o.brand)),
    conditions: unique(offers.map((o) => o.condition)),
    availabilities: unique(offers.map((o) => o.availability)),
  };
}
