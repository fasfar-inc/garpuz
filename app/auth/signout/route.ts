import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  // An optional same-site path to land on, e.g. back on "Add shop" to sign in with another account.
  const next = (await request.formData().catch(() => null))?.get("next");
  const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(new URL(target, request.url), { status: 303 });
}
