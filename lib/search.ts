import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SearchFilters, SearchOffer } from "@/lib/types";

export type SearchResult = {
  offers: SearchOffer[];
  total: number;
  filters: SearchFilters;
  /** True when the database could not be reached, as opposed to "no matches". */
  unavailable: boolean;
};

const emptyFilters: SearchFilters = { cities: [], brands: [], conditions: [], availabilities: [] };

export async function searchOffers(params: {
  query: string;
  sort: string;
  city?: string;
  condition?: string;
  brand?: string;
  availability?: string;
  page: number;
}): Promise<SearchResult> {
  const supabase = await createClient();
  if (!supabase) {
    console.error("Search failed: Supabase environment variables are missing");
    return { offers: [], total: 0, filters: emptyFilters, unavailable: true };
  }

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
    return { offers: [], total: 0, filters: emptyFilters, unavailable: true };
  }

  const offers = (data ?? []) as SearchOffer[];
  const total = Number(offers[0]?.total_count ?? 0);
  if (params.page === 1) {
    const admin = createAdminClient();
    if (admin) {
      // Analytics must never break search.
      const { error: logError } = await admin.from("search_events").insert({ query: params.query, result_count: total });
      if (logError) console.error("Search event logging failed", logError.message);
    }
  }
  return { offers, total, filters: deriveFilters(offers), unavailable: false };
}

function deriveFilters(offers: SearchOffer[]): SearchFilters {
  const unique = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
  return {
    cities: unique(offers.map((o) => o.city)),
    brands: unique(offers.map((o) => o.brand)),
    conditions: unique(offers.map((o) => o.condition)),
    availabilities: unique(offers.map((o) => o.availability)),
  };
}
