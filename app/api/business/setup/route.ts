import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
const schema = z.object({ businessName: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(80) });
export async function POST(request: Request) {
  const supabase = await createClient(); if (!supabase) return NextResponse.json({ message: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser(); if (!user?.email) return NextResponse.json({ message: "Please continue with Google first." }, { status: 401 });
  const parsed = schema.safeParse(Object.fromEntries(await request.formData())); if (!parsed.success) return NextResponse.json({ message: "Enter a valid shop name and category." }, { status: 400 });
  const { error } = await supabase.from("merchants").insert({ user_id: user.id, business_name: parsed.data.businessName, category: parsed.data.category, email: user.email.toLowerCase() });
  if (error) return NextResponse.json({ message: error.code === "23505" ? "A shop already exists for this Google account." : "Could not create your shop." }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
