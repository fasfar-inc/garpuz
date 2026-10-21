import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SearchFilters, SearchOffer } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const PAGE_SIZE = 12;

export async function searchOffers(params: {
  query: string;
  sort: string;
  city?: string;
  condition?: string;
  brand?: string;
  availability?: string;
  page: number;
  /** Whether this search may be recorded in analytics (false when the caller is rate limited). */
  record?: boolean;
}) {
  const supabase = await createClient();
  if (!supabase) return { offers: [] as SearchOffer[], total: 0, filters: emptyFilters };

  const [{ data, error }, facets] = await Promise.all([
    supabase.rpc("search_public_offers", {
      search_query: params.query,
      sort_mode: params.sort,
      city_filter: params.city || null,
      condition_filter: params.condition || null,
      brand_filter: params.brand || null,
      availability_filter: params.availability || null,
      page_number: params.page,
      page_size: PAGE_SIZE,
    }),
    supabase.rpc("search_public_offer_facets", { search_query: params.query }).maybeSingle<SearchFilters>(),
  ]);
  if (error) {
    console.error("Search failed", error.message);
    return { offers: [] as SearchOffer[], total: 0, filters: emptyFilters };
  }
  const offers = (data ?? []) as SearchOffer[];
  const total = Number(offers[0]?.total_count ?? 0);
  const unfiltered = !params.city && !params.condition && !params.brand && !params.availability;
  if (params.page === 1 && unfiltered && params.record !== false) {
    const admin = createAdminClient();
    if (admin) {
      const { error: logError } = await admin.from("search_events").insert({ query: params.query, result_count: total });
      if (logError) console.error("Search event logging failed", logError.message);
    }
  }
  return {
    offers,
    total,
    // Fall back to the visible page if the facets function is not deployed yet.
    filters: facets.data && !facets.error ? normalizeFilters(facets.data) : deriveFilters(offers),
  };
}

const emptyFilters: SearchFilters = { cities: [], brands: [], conditions: [], availabilities: [] };

function normalizeFilters(value: SearchFilters): SearchFilters {
  return { cities: value.cities ?? [], brands: value.brands ?? [], conditions: value.conditions ?? [], availabilities: value.availabilities ?? [] };
}

function deriveFilters(offers: SearchOffer[]): SearchFilters {
  const unique = (values: string[]) => [...new Set(values)].sort();
  return {
    cities: unique(offers.map((o) => o.city)),
    brands: unique(offers.map((o) => o.brand)),
    conditions: unique(offers.map((o) => o.condition)),
    availabilities: unique(offers.map((o) => o.availability)),
  };
}
