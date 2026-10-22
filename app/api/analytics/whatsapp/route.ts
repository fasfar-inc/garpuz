import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ offerId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  // Rate-limited clicks are acknowledged but not recorded, so analytics cannot be inflated.
  if (!(await allowRequest("CONTACT_RATE_LIMITER", clientKey(request.headers)))) return new NextResponse(null, { status: 204 });
  const admin = createAdminClient(); if (!admin) return new NextResponse(null, { status: 204 });
  const { data: offer } = await admin.from("merchant_offers").select("id,merchant_id,product_id").eq("id", parsed.data.offerId).eq("is_active", true).maybeSingle();
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  await admin.from("whatsapp_contact_clicks").insert({ offer_id: offer.id, merchant_id: offer.merchant_id, product_id: offer.product_id });
  return new NextResponse(null, { status: 204 });
}
