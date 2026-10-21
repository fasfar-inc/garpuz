import { NextResponse } from "next/server";
import { searchOffers } from "@/lib/search";
import { searchSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search parameters." }, { status: 400 });
  const p = parsed.data;
  const result = await searchOffers({ query: p.q, sort: p.sort, city: p.city, condition: p.condition, brand: p.brand, availability: p.availability, page: p.page });
  if (result.unavailable) return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 503 });
  const { offers, total, filters } = result;
  return NextResponse.json({ offers, total, filters });
}
