import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ShopSetupForm } from "@/components/business/shop-setup-form";
import { CITIES, SHOP_CATEGORIES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.setup.title, robots: { index: false } };
}

export default async function ShopSetupPage() {
  const { lang, t } = await getDictionary();
  const supabase = await createClient(); if (!supabase) redirect("/business/register");
  const { data: { user } } = await supabase.auth.getUser(); if (!user?.email) redirect("/business/register");
  const { data: merchant } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle(); if (merchant) redirect("/dashboard");
  const s = t.setup;
  return <main className="grid min-h-screen place-items-center bg-[#F7F9F8] px-5 py-12"><div className="w-full max-w-md">
    <div className="flex justify-end"><LanguageSwitcher lang={lang} /></div>
    <div className="mt-4 text-center"><Logo /><h1 className="mt-8 text-3xl font-black tracking-tight">{s.title}</h1><p className="mt-2 text-sm leading-6 text-[#68766D]">{s.subtitle}</p></div>
    <div className="mt-7 rounded-2xl border border-[#E1E7E3] bg-white p-6 shadow-[0_8px_35px_rgba(23,33,27,.06)]">
      <ShopSetupForm email={user.email} categories={SHOP_CATEGORIES.map((value) => ({ value, label: t.categories[value] ?? value }))} cities={[...CITIES]} labels={{ shopName: s.shopName, shopNamePlaceholder: s.shopNamePlaceholder, category: s.category, selectCategory: s.selectCategory, whatsapp: s.whatsapp, whatsappHint: s.whatsappHint, city: s.city, selectCity: s.selectCity, googleEmail: s.googleEmail, create: s.create, creating: s.creating, errorGeneric: s.errorGeneric }} />
    </div>
  </div></main>;
}
