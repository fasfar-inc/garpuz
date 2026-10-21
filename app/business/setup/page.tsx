import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { ShopSetupForm } from "@/components/business/shop-setup-form";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { SHOP_CATEGORIES } from "@/lib/validation";

export default async function ShopSetupPage() {
  const supabase = await createClient(); if (!supabase) redirect("/business/register");
  const { data: { user } } = await supabase.auth.getUser(); if (!user?.email) redirect("/business/register");
  const { data: merchant } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle(); if (merchant) redirect("/dashboard");
  const { t } = await getDictionary();
  const categories = SHOP_CATEGORIES.map((value) => ({ value, label: t.categories[value] ?? value }));
  return <main className="grid min-h-screen place-items-center bg-[#F7F9F8] px-5 py-12"><div className="w-full max-w-md"><div className="text-center"><Logo /><h1 className="mt-8 text-3xl font-black tracking-tight">{t.setup.heading}</h1><p className="mt-2 text-sm text-[#68766D]">{t.setup.body}</p></div><div className="mt-7 rounded-2xl border border-[#E1E7E3] bg-white p-6 shadow-[0_8px_35px_rgba(23,33,27,.06)]"><ShopSetupForm email={user.email} categories={categories} labels={t.setup} /></div></div></main>;
}
