import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Boxes, CircleCheck, Clock3, Eye, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Merchant dashboard" };
export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) return <Setup />;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/business/register");
  const { data: merchant } = await supabase.from("merchants").select("id,business_name,status").eq("user_id", user.id).maybeSingle();
  if (!merchant) redirect("/business/register");
  const [{ count: products }, { count: live }, { count: offers }] = await Promise.all([
    supabase.from("merchant_offers").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id),
    supabase.from("merchant_offers").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).eq("is_active", true),
    supabase.from("merchant_offers").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).eq("availability", "in_stock"),
  ]);
  const stats = [{ label: "Total products", value: products ?? 0, icon: Boxes }, { label: "Live listings", value: live ?? 0, icon: Eye }, { label: "In stock", value: offers ?? 0, icon: CircleCheck }];
  return <main><header className="flex min-h-16 items-center justify-between border-b border-[#E3E9E5] bg-white px-5 sm:px-8"><div><p className="text-xs text-[#78847C]">Merchant dashboard</p><h1 className="font-bold">{merchant.business_name}</h1></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${merchant.status === "approved" ? "bg-[#EAF6F0] text-[#07834A]" : "bg-amber-50 text-amber-700"}`}>{merchant.status === "approved" ? "Approved" : "Pending verification"}</span></header><div className="p-5 sm:p-8"><div className="flex items-end justify-between"><div><h2 className="text-2xl font-black tracking-tight">Overview</h2><p className="mt-1 text-sm text-[#68766D]">Manage what local customers can discover.</p></div><button className="hidden h-10 items-center gap-2 rounded-full bg-[#07834A] px-4 text-sm font-bold text-white sm:flex"><Plus className="size-4" /> Add product</button></div>{merchant.status !== "approved" && <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><Clock3 className="mt-0.5 size-5 shrink-0" /><div><b>Your application is being reviewed.</b><p className="mt-1 text-xs leading-5 text-amber-800">You can prepare your shop profile, but products will stay hidden until an administrator approves your business.</p></div></div>}<div className="mt-6 grid gap-4 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-[#E1E7E3] bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#647168]">{label}</p><Icon className="size-4 text-[#07834A]" /></div><p className="mt-4 text-3xl font-black">{value}</p></div>)}</div><div className="mt-6 rounded-2xl border border-[#E1E7E3] bg-white p-6"><h3 className="font-bold">Get started</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[#68766D]">Add products one at a time or import a catalog. Your listings will become searchable automatically once your business is approved.</p></div></div></main>;
}
function Setup() { return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md rounded-2xl border border-[#E1E7E3] bg-white p-8 text-center"><h1 className="text-xl font-bold">Connect Supabase to continue</h1><p className="mt-2 text-sm leading-6 text-[#68766D]">Copy <code>.env.example</code> to <code>.env.local</code>, add your project keys, and run the included database migration.</p></div></main>; }
