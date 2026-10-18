import { Sidebar } from "@/components/dashboard/sidebar";
export default function DashboardLayout({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#F7F9F8] lg:flex"><Sidebar /><div className="min-w-0 flex-1">{children}</div></div>; }
