import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { ShopSetupForm } from "@/components/business/shop-setup-form";
import { createClient } from "@/lib/supabase/server";
export default async function ShopSetupPage() {
  const supabase = await createClient(); if (!supabase) redirect("/business/register");
  const { data: { user } } = await supabase.auth.getUser(); if (!user?.email) redirect("/business/register");
  const { data: merchant } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle(); if (merchant) redirect("/dashboard");
  return <main className="grid min-h-screen place-items-center bg-[#F7F9F8] px-5 py-12"><div className="w-full max-w-md"><div className="text-center"><Logo /><h1 className="mt-8 text-3xl font-black tracking-tight">Tell us about your shop</h1><p className="mt-2 text-sm text-[#68766D]">That’s it—just two details and you’re ready.</p></div><div className="mt-7 rounded-2xl border border-[#E1E7E3] bg-white p-6 shadow-[0_8px_35px_rgba(23,33,27,.06)]"><ShopSetupForm email={user.email} /></div></div></main>;
}
