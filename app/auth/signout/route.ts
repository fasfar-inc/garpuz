import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST only, so a link or image on another site cannot sign people out.
export async function POST(request: Request) {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
