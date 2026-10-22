import Link from "next/link";
import { AlertTriangle, Boxes, CircleCheck, Circle, Clock3, Eye, Plus } from "lucide-react";
import { cardClass, DashboardHeader, MerchantStatusBadge } from "@/components/dashboard/ui";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";

export default async function DashboardPage() {
  const { supabase, merchant } = await requireMerchant();
  const { t } = await getDictionary();
  const o = t.dashboard.overview;
  const [{ count: total }, { count: live }, { count: inStock }] = await Promise.all([
    supabase.from("merchant_offers").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id),
    supabase.from("merchant_offers").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).eq("is_active", true),
    supabase.from("merchant_offers").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).eq("is_active", true).eq("availability", "in_stock"),
  ]);
  const stats = [{ label: o.totalOffers, value: total ?? 0, icon: Boxes }, { label: o.live, value: live ?? 0, icon: Eye }, { label: o.inStock, value: inStock ?? 0, icon: CircleCheck }];
  const steps = [
    { done: Boolean(merchant.whatsapp && merchant.city), text: o.stepProfile, href: "/dashboard/profile" },
    { done: Boolean(merchant.verification_document_path), text: o.stepDocument, href: "/dashboard/profile#document" },
    { done: (total ?? 0) > 0, text: o.stepOffers, href: "/dashboard/products" },
  ];
  const banner = merchant.status === "pending" ? { title: o.pendingTitle, body: o.pendingBody, Icon: Clock3, tone: "border-amber-200 bg-amber-50 text-amber-900" }
    : merchant.status === "rejected" ? { title: o.rejectedTitle, body: o.rejectedBody, Icon: AlertTriangle, tone: "border-red-200 bg-red-50 text-red-800" }
    : merchant.status === "suspended" ? { title: o.suspendedTitle, body: o.suspendedBody, Icon: AlertTriangle, tone: "border-slate-200 bg-slate-50 text-slate-800" }
    : null;
  return <main>
    <DashboardHeader title={merchant.business_name} description={t.dashboard.title} action={<MerchantStatusBadge status={merchant.status} t={t} />} />
    <div className="p-5 sm:p-8">
      <div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black tracking-tight">{o.heading}</h2><p className="mt-1 text-sm text-[#68766D]">{o.body}</p></div><Link href="/dashboard/products" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#07834A] px-4 text-sm font-bold text-white hover:bg-[#056B3D]"><Plus className="size-4" /> {o.addProduct}</Link></div>
      {banner && <div className={`mt-6 flex gap-3 rounded-xl border p-4 text-sm ${banner.tone}`}><banner.Icon className="mt-0.5 size-5 shrink-0" /><div><b>{banner.title}</b><p className="mt-1 text-xs leading-5 opacity-90">{banner.body}</p></div></div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon }) => <div key={label} className={`${cardClass} p-5`}><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#647168]">{label}</p><Icon className="size-4 text-[#07834A]" /></div><p className="mt-4 text-3xl font-black">{value.toLocaleString()}</p></div>)}</div>
      <section className={`${cardClass} mt-6 p-6`}><h3 className="font-bold">{o.checklist}</h3><ul className="mt-4 space-y-3">{steps.map((step) => <li key={step.href}><Link href={step.href} className="flex gap-3 rounded-lg text-sm leading-6 hover:text-[#07834A]">{step.done ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-[#07834A]" aria-label={o.done} /> : <Circle className="mt-0.5 size-5 shrink-0 text-[#A7B0AA]" aria-label={o.todo} />}<span className={step.done ? "text-[#7A857E] line-through" : "text-[#26322B]"}>{step.text}</span></Link></li>)}</ul></section>
    </div>
  </main>;
}
