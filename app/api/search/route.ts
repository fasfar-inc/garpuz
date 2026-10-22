import { NextResponse } from "next/server";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { searchOffers } from "@/lib/search";
import { searchSchema } from "@/lib/validation";

export async function GET(request: Request) {
  if (!(await allowRequest("SEARCH_RATE_LIMITER", clientKey(request.headers)))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "retry-after": "60" } });
  }
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search parameters." }, { status: 400 });
  const p = parsed.data;
  return NextResponse.json(await searchOffers({ query: p.q, sort: p.sort, city: p.city, condition: p.condition, brand: p.brand, availability: p.availability, page: p.page }));
}
