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
  // Products shops add themselves have no brand; a blank brand is not a filter option.
  return { cities: value.cities ?? [], brands: (value.brands ?? []).filter(Boolean), conditions: value.conditions ?? [], availabilities: value.availabilities ?? [] };
}

function deriveFilters(offers: SearchOffer[]): SearchFilters {
  const unique = (values: string[]) => [...new Set(values)].sort();
  return {
    cities: unique(offers.map((o) => o.city)),
    brands: unique(offers.map((o) => o.brand).filter(Boolean)),
    conditions: unique(offers.map((o) => o.condition)),
    availabilities: unique(offers.map((o) => o.availability)),
  };
}

type CategoryRow = {
  id: string; price: number; currency: string; condition: SearchOffer["condition"]; availability: SearchOffer["availability"];
  merchants: { business_name: string; city: string | null; whatsapp: string; website: string | null } | null;
  canonical_products: { id: string; name: string; brand: string; model: string | null; specifications: Record<string, string> | null; image_url: string | null } | null;
};

/**
 * Lists public offers whose catalog product is in `category` (case-insensitive exact match).
 * The search RPC has no category filter, so this reads with the service role and applies the
 * same visibility rules as `search_public_offers`: active offers from approved merchants that
 * have a WhatsApp number. Only the columns public search already returns are selected.
 */
export async function browseCategory(params: {
  category: string;
  sort: string;
  city?: string;
  condition?: string;
  brand?: string;
  availability?: string;
  page: number;
}) {
  const admin = createAdminClient();
  if (!admin) return { offers: [] as SearchOffer[], total: 0, filters: emptyFilters };
  let query = admin.from("merchant_offers")
    .select("id,price,currency,condition,availability,merchants!inner(business_name,city,whatsapp,website),canonical_products!inner(id,name,brand,model,specifications,image_url)", { count: "exact" })
    .eq("is_active", true)
    .eq("merchants.status", "approved")
    .not("merchants.whatsapp", "is", null)
    .ilike("canonical_products.category", params.category);
  if (params.city) query = query.eq("merchants.city", params.city);
  if (params.brand) query = query.eq("canonical_products.brand", params.brand);
  if (params.condition) query = query.eq("condition", params.condition);
  if (params.availability) query = query.eq("availability", params.availability);
  query = params.sort === "price_asc" ? query.order("price", { ascending: true })
    : params.sort === "price_desc" ? query.order("price", { ascending: false })
    : query.order("updated_at", { ascending: false });
  const from = (params.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.order("id").range(from, from + PAGE_SIZE - 1);
  if (error) {
    console.error("Category browse failed", { code: error.code, message: error.message });
    return { offers: [] as SearchOffer[], total: 0, filters: emptyFilters };
  }
  const total = count ?? 0;
  const offers = ((data ?? []) as unknown as CategoryRow[]).flatMap((row) => row.merchants && row.canonical_products ? [{
    offer_id: row.id, product_id: row.canonical_products.id, product_name: row.canonical_products.name, brand: row.canonical_products.brand,
    model: row.canonical_products.model, specifications: row.canonical_products.specifications, image_url: row.canonical_products.image_url,
    merchant_name: row.merchants.business_name, city: row.merchants.city ?? "", price: Number(row.price), currency: row.currency,
    condition: row.condition, availability: row.availability, whatsapp: row.merchants.whatsapp, website: row.merchants.website, total_count: total,
  } satisfies SearchOffer] : []);
  return { offers, total, filters: deriveFilters(offers) };
}
