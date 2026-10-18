import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ offerId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const admin = createAdminClient(); if (!admin) return new NextResponse(null, { status: 204 });
  const { data: offer } = await admin.from("merchant_offers").select("id,merchant_id,product_id").eq("id", parsed.data.offerId).eq("is_active", true).maybeSingle();
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  await admin.from("whatsapp_contact_clicks").insert({ offer_id: offer.id, merchant_id: offer.merchant_id, product_id: offer.product_id });
  return new NextResponse(null, { status: 204 });
}
