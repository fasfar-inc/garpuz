import Link from "next/link";
import { BadgeCheck, Boxes, Clock3, ListChecks, Store } from "lucide-react";
import { EmptyState, formatDate, PageHeader, StatusBadge, tableWrap } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { assertQueries } from "@/lib/admin/diagnostics";
import type { MerchantRow } from "@/lib/admin/types";

export default async function AdminDashboardPage() {
  const { admin } = await requireAdminPage();
  const [totalMerchants, pending, approved, products, offers, recent] = await Promise.all([
    admin.from("merchants").select("id", { count: "exact", head: true }),
    admin.from("merchants").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("merchants").select("id", { count: "exact", head: true }).eq("status", "approved"),
    admin.from("canonical_products").select("id", { count: "exact", head: true }),
    admin.from("merchant_offers").select("id", { count: "exact", head: true }),
    admin.from("merchants").select("id,business_name,email,category,city,status,created_at").order("created_at", { ascending: false }).limit(6),
  ]);
  assertQueries("overview", { totalMerchants, pending, approved, products, offers, recent });
  const stats = [
    { label: "Registered merchants", value: totalMerchants.count ?? 0, icon: Store },
    { label: "Pending approvals", value: pending.count ?? 0, icon: Clock3 },
    { label: "Approved merchants", value: approved.count ?? 0, icon: BadgeCheck },
    { label: "Canonical products", value: products.count ?? 0, icon: Boxes },
    { label: "Merchant offers", value: offers.count ?? 0, icon: ListChecks },
  ];
  const merchants = (recent.data ?? []) as MerchantRow[];
  return <main><PageHeader eyebrow="Administration" title="Overview" description="A live operational view of the Garpuz marketplace." /><div className="p-5 sm:p-8"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-[#E2E7E4] bg-white p-5"><div className="flex items-start justify-between"><p className="text-sm font-semibold text-[#657168]">{label}</p><span className="grid size-9 place-items-center rounded-lg bg-[#EAF6F0] text-[#07834A]"><Icon className="size-4" /></span></div><p className="mt-6 text-3xl font-black tracking-tight">{value.toLocaleString()}</p></div>)}</div><section className="mt-7"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-black">Recent merchant registrations</h2><p className="text-xs text-[#78837C]">Newest applications across the platform</p></div><Link href="/admin/merchants" className="text-sm font-bold text-[#07834A]">View all</Link></div><div className={tableWrap}>{merchants.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#F8FAF9] text-xs text-[#67736B]"><tr><th className="px-5 py-3 font-bold">Shop</th><th className="px-5 py-3 font-bold">Category</th><th className="px-5 py-3 font-bold">Location</th><th className="px-5 py-3 font-bold">Registered</th><th className="px-5 py-3 font-bold">Status</th></tr></thead><tbody className="divide-y divide-[#E9EDEA]">{merchants.map((merchant) => <tr key={merchant.id}><td className="px-5 py-4"><Link href={`/admin/merchants/${merchant.id}`} className="font-bold hover:text-[#07834A]">{merchant.business_name}</Link><p className="mt-0.5 text-xs text-[#7A857E]">{merchant.email}</p></td><td className="px-5 py-4">{merchant.category}</td><td className="px-5 py-4">{merchant.city || "—"}</td><td className="px-5 py-4">{formatDate(merchant.created_at)}</td><td className="px-5 py-4"><StatusBadge status={merchant.status} /></td></tr>)}</tbody></table></div> : <EmptyState title="No merchants yet" description="New shop registrations will appear here." />}</div></section></div></main>;
}
