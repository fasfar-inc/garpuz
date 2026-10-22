import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState, formatDate, getNotice, inputClass, Notice, PageHeader, StatusBadge, tableWrap } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { assertQueries } from "@/lib/admin/diagnostics";
import type { MerchantRow, MerchantStatus } from "@/lib/admin/types";

type Params = Promise<Record<string, string | string[] | undefined>>;
export default async function MerchantsPage({ searchParams }: { searchParams: Params }) {
  const raw = await searchParams; const q = typeof raw.q === "string" ? raw.q.trim().slice(0, 100) : ""; const status = typeof raw.status === "string" && ["pending", "approved", "rejected", "suspended"].includes(raw.status) ? raw.status as MerchantStatus : "";
  const { admin } = await requireAdminPage();
  let query = admin.from("merchants").select("id,business_name,email,phone,category,city,status,created_at,updated_at").order("created_at", { ascending: false }).limit(200);
  if (q) query = query.or(`business_name.ilike.%${q.replace(/[%_,()]/g, "")}%,email.ilike.%${q.replace(/[%_,()]/g, "")}%`);
  if (status) query = query.eq("status", status);
  const result = await query; assertQueries("merchants", { merchants: result }); const { data } = result; const merchants = (data ?? []) as MerchantRow[];
  return <main><PageHeader title="Merchants" description="Review registrations, verification details, and marketplace access." /><div className="p-5 sm:p-8"><Notice {...getNotice(raw)} /><form className="mb-5 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-[#839087]" /><input name="q" defaultValue={q} placeholder="Search shop or email" className={`${inputClass} w-full pl-9`} /></label><select name="status" defaultValue={status} className={inputClass}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select><button className="h-10 rounded-lg bg-[#202A24] px-5 text-sm font-bold text-white">Filter</button></form><div className={tableWrap}>{merchants.length ? <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-[#F8FAF9] text-xs text-[#67736B]"><tr>{["Shop", "Phone", "Category", "City", "Registered", "Status", "Actions"].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#E9EDEA]">{merchants.map((m) => <tr key={m.id}><td className="px-5 py-4"><p className="font-bold">{m.business_name}</p><p className="mt-0.5 text-xs text-[#7A857E]">{m.email}</p></td><td className="px-5 py-4">{m.phone || "—"}</td><td className="px-5 py-4">{m.category}</td><td className="px-5 py-4">{m.city || "—"}</td><td className="px-5 py-4">{formatDate(m.created_at)}</td><td className="px-5 py-4"><StatusBadge status={m.status} /></td><td className="px-5 py-4"><Link href={`/admin/merchants/${m.id}`} className="font-bold text-[#07834A]">Review</Link></td></tr>)}</tbody></table></div> : <EmptyState title="No merchants found" description="Adjust the search or status filter." />}</div></div></main>;
}
