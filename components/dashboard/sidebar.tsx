"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FileUp, LayoutDashboard, LogOut, Settings, Store } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Sidebar({ labels, shopName, logo }: { labels: Dictionary["dashboard"]["nav"]; shopName: string; logo: React.ReactNode }) {
  const pathname = usePathname();
  const items = [
    { name: labels.overview, icon: LayoutDashboard, href: "/dashboard" },
    { name: labels.products, icon: Boxes, href: "/dashboard/products" },
    { name: labels.import, icon: FileUp, href: "/dashboard/import" },
    { name: labels.profile, icon: Store, href: "/dashboard/profile" },
    { name: labels.settings, icon: Settings, href: "/dashboard/settings" },
  ];
  return <aside className="border-b border-[#E3E9E5] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
    <div className="flex h-16 items-center px-5">{logo}</div>
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:py-4">{items.map(({ name, icon: Icon, href }) => {
      const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${active ? "bg-[#EAF6F0] text-[#07834A]" : "text-[#5D6A62] hover:bg-[#F3F6F4]"}`}><Icon className="size-4" />{name}</Link>;
    })}</nav>
    <div className="hidden border-t border-[#E3E9E5] p-4 lg:block"><p className="truncate px-1 text-xs font-semibold text-[#5D6A62]">{shopName}</p><SignOutButton label={labels.signOut} /></div>
  </aside>;
}

export function SignOutButton({ label, className }: { label: string; className?: string }) {
  return <form action="/auth/signout" method="post"><button className={className ?? "mt-2 flex h-9 w-full items-center gap-2 rounded-lg px-1 text-sm font-semibold text-[#5D6A62] hover:text-red-700"}><LogOut className="size-4" />{label}</button></form>;
}
