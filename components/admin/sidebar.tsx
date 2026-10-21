"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, LayoutDashboard, LogOut, Settings, ShoppingBasket, Store } from "lucide-react";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/merchants", label: "Merchants", icon: Store },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/offers", label: "Offers", icon: ShoppingBasket },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  return <aside className="bg-[#1B211E] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
    <div className="flex h-16 items-center justify-between border-b border-white/10 px-5 lg:h-20"><Link href="/admin" className="text-xl font-black tracking-tight">Garpuz<span className="text-[#32B776]">.</span></Link><span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-white/60">Admin</span></div>
    <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:px-4 lg:py-6">{items.map(({ href, label, icon: Icon }) => {
      const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} className={`flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${active ? "bg-[#07834A] text-white" : "text-white/65 hover:bg-white/7 hover:text-white"}`}><Icon className="size-[17px]" />{label}</Link>;
    })}</nav>
    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 lg:block lg:p-5"><p className="hidden truncate text-xs font-semibold text-white/75 lg:block">{email}</p><p className="mt-1 hidden text-[11px] text-white/40 lg:block">Administrator session</p><form action="/auth/signout" method="post" className="lg:mt-3"><button className="flex items-center gap-2 text-xs font-bold text-white/65 hover:text-white"><LogOut className="size-4" />Sign out</button></form></div>
  </aside>;
}
