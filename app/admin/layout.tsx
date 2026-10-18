import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdminPage } from "@/lib/admin/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Garpuz Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage();
  return <div className="min-h-screen bg-[#F5F7F6] lg:flex"><AdminSidebar email={user.email ?? "Administrator"} /><div className="min-w-0 flex-1">{children}</div></div>;
}
