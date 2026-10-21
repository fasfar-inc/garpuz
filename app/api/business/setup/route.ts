import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { shopSetupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const { t } = await getDictionary();
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ message: t.setup.errorGeneric }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ message: t.setup.errorSignin }, { status: 401 });

  const parsed = shopSetupSchema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) return NextResponse.json({ message: t.setup.errorInvalid }, { status: 400 });

  const { error } = await supabase.from("merchants").insert({
    user_id: user.id,
    business_name: parsed.data.businessName,
    category: parsed.data.category,
    whatsapp: parsed.data.whatsapp,
    city: parsed.data.city,
    email: user.email.toLowerCase(),
    representative_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.slice(0, 120) : null,
  });
  if (error) {
    console.error("Shop setup failed", error.code, error.message);
    return NextResponse.json({ message: error.code === "23505" ? t.setup.errorExists : t.setup.errorGeneric }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
