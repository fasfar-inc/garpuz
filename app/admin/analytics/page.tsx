import { Activity, MessageCircle, Search, SearchX } from "lucide-react";
import { EmptyState, PageHeader, tableWrap } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { assertQueries } from "@/lib/admin/diagnostics";

export default async function AnalyticsPage() {
  const { admin } = await requireAdminPage(); const since = daysAgo(30);
  const [searches, noResults, clicks, activeMerchants, topQueries] = await Promise.all([
    admin.from("search_events").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("search_events").select("id", { count: "exact", head: true }).eq("result_count", 0).gte("created_at", since),
    admin.from("whatsapp_contact_clicks").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("merchant_offers").select("merchant_id").gte("updated_at", since),
    admin.from("search_events").select("query,result_count,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
  ]);
  assertQueries("analytics", { searches, noResults, clicks, activeMerchants, topQueries });
  const counts = new Map<string, { count: number; noResults: number }>(); for (const event of topQueries.data ?? []) { const key = String(event.query).trim().toLowerCase(); const current = counts.get(key) ?? { count: 0, noResults: 0 }; current.count += 1; if (event.result_count === 0) current.noResults += 1; counts.set(key, current); }
  const popular = [...counts.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 10); const activeCount = new Set((activeMerchants.data ?? []).map((o) => o.merchant_id)).size;
  const metrics = [{ label: "Product searches", value: searches.count ?? 0, icon: Search }, { label: "Searches without results", value: noResults.count ?? 0, icon: SearchX }, { label: "WhatsApp contact clicks", value: clicks.count ?? 0, icon: MessageCircle }, { label: "Active merchants", value: activeCount, icon: Activity }];
  return <main><PageHeader title="Analytics" description="Real platform activity from the last 30 days. No estimated or fabricated metrics." /><div className="p-5 sm:p-8"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-[#E2E7E4] bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#657168]">{label}</p><Icon className="size-4 text-[#07834A]" /></div><p className="mt-5 text-3xl font-black">{value.toLocaleString()}</p></div>)}</div><section className="mt-7"><h2 className="mb-3 font-black">Popular searches</h2><div className={tableWrap}>{popular.length ? <table className="w-full text-left text-sm"><thead className="bg-[#F8FAF9] text-xs text-[#67736B]"><tr><th className="px-5 py-3">Query</th><th className="px-5 py-3">Searches</th><th className="px-5 py-3">No results</th></tr></thead><tbody className="divide-y divide-[#E9EDEA]">{popular.map(([query, values]) => <tr key={query}><td className="px-5 py-4 font-bold">{query}</td><td className="px-5 py-4">{values.count}</td><td className="px-5 py-4">{values.noResults}</td></tr>)}</tbody></table> : <EmptyState title="No analytics yet" description="Metrics will appear after real searches and contact clicks occur." />}</div></section></div></main>;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}
