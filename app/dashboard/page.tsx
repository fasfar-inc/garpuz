import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Boxes, CircleCheck, CircleDashed, Clock3, Eye, FileUp, Plus } from "lucide-react";
import { cardClass, outlineButton, PageHeader, primaryButton } from "@/components/dashboard/ui";
import { getDictionary } from "@/lib/i18n/server";
import { isSearchReady, requireMerchant } from "@/lib/merchant/context";

export const metadata: Metadata = { title: "Merchant dashboard" };

export default async function DashboardPage() {
  const { supabase, merchant } = await requireMerchant();
  const { t } = await getDictionary();
  const d = t.dash;
  const [total, active, inStock] = await Promise.all([
    supabase.from("merchant_offers").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id),
    supabase.from("merchant_offers").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).eq("is_active", true).eq("admin_hidden", false),
    supabase.from("merchant_offers").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).eq("availability", "in_stock"),
  ]);
  const approved = merchant.status === "approved";
  const ready = isSearchReady(merchant);
  // "Live" means a customer can actually find it right now.
  const live = approved && ready ? active.count ?? 0 : 0;
  const stats = [
    { label: d.statTotal, value: total.count ?? 0, icon: Boxes },
    { label: d.statLive, value: live, icon: Eye },
    { label: d.statStock, value: inStock.count ?? 0, icon: CircleCheck },
  ];
  const steps = [
    { label: d.checkProfile, done: ready, href: "/dashboard/profile" },
    { label: d.checkDocument, done: Boolean(merchant.verification_document_path), href: "/dashboard/profile#verification" },
    { label: d.checkProduct, done: (total.count ?? 0) > 0, href: "/dashboard/products/new" },
    { label: d.checkApproved, done: approved, href: null },
  ];
  const banner = merchant.status === "pending" ? { icon: Clock3, title: d.pendingTitle, body: d.pendingBody, tone: "border-amber-200 bg-amber-50 text-amber-900" }
    : merchant.status === "rejected" ? { icon: Ban, title: d.rejectedTitle, body: d.rejectedBody, tone: "border-red-200 bg-red-50 text-red-900" }
    : merchant.status === "suspended" ? { icon: Ban, title: d.suspendedTitle, body: d.suspendedBody, tone: "border-red-200 bg-red-50 text-red-900" }
    : null;

  return <main>
    <PageHeader eyebrow={d.title} title={merchant.business_name} status={merchant.status} statusLabel={d.status[merchant.status]} />
    <div className="p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-black tracking-tight">{d.overview}</h2><p className="mt-1 text-sm text-[#68766D]">{d.overviewSub}</p></div>
        <div className="flex gap-2"><Link href="/dashboard/import" className={outlineButton}><FileUp className="size-4" />{d.nav.import}</Link><Link href="/dashboard/products/new" className={primaryButton}><Plus className="size-4" />{d.addProduct}</Link></div>
      </div>
      {banner && <div className={`mt-6 flex gap-3 rounded-xl border p-4 text-sm ${banner.tone}`}><banner.icon className="mt-0.5 size-5 shrink-0" /><div><b>{banner.title}</b><p className="mt-1 text-xs leading-5 opacity-90">{banner.body}</p></div></div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon }) => <div key={label} className={`${cardClass} p-5`}><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#647168]">{label}</p><Icon className="size-4 text-[#07834A]" /></div><p className="mt-4 text-3xl font-black">{value}</p></div>)}</div>
      {steps.some((s) => !s.done) && <section className={`${cardClass} mt-6 p-6`}>
        <h3 className="font-bold">{d.checklistTitle}</h3>
        <ol className="mt-4 divide-y divide-[#EEF2EF]">{steps.map((step) => {
          const content = <><span className="flex items-center gap-3">{step.done ? <CircleCheck className="size-5 text-[#07834A]" /> : <CircleDashed className="size-5 text-[#A5B0A9]" />}<span className={step.done ? "text-[#7A867E] line-through" : "font-semibold"}>{step.label}</span></span><span className={`text-xs font-bold ${step.done ? "text-[#07834A]" : step.href ? "text-[#07834A]" : "text-amber-700"}`}>{step.done ? d.done : step.href ? `${d.todo} →` : d.waiting}</span></>;
          return <li key={step.label}>{step.href && !step.done ? <Link href={step.href} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-[#07834A]">{content}</Link> : <div className="flex items-center justify-between gap-3 py-3 text-sm">{content}</div>}</li>;
        })}</ol>
      </section>}
    </div>
  </main>;
}
