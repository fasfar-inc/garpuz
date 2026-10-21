import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant/context";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | Garpuz" }, robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { merchant } = await requireMerchant();
  const { t } = await getDictionary();
  return <div className="min-h-screen bg-[#F7F9F8] lg:flex">
    <Sidebar shopName={merchant.business_name} labels={{ ...t.dash.nav, signOut: t.common.signOut }} />
    <div className="min-w-0 flex-1">{children}</div>
  </div>;
}
