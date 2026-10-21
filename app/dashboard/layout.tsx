import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.dashboard.title, robots: { index: false, follow: false } };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { merchant } = await requireMerchant();
  const { t } = await getDictionary();
  return <div className="min-h-screen bg-[#F7F9F8] lg:flex"><Sidebar labels={t.dashboard.nav} shopName={merchant.business_name} logo={<Logo />} /><div className="min-w-0 flex-1">{children}</div></div>;
}
