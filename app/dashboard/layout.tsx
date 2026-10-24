import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.dashboard.title, robots: { index: false, follow: false } };
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  await requireMerchant();
  const { locale, t } = await getDictionary();
  return <div className="min-h-screen bg-[#F7F9F8]">
    <header className="border-b border-[#E3E9E5] bg-white">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} label={t.nav.language} />
          <form action="/auth/signout" method="post"><button aria-label={t.dashboard.signOut} className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm! font-semibold text-[#5D6A62] hover:text-red-700"><LogOut className="size-4" /><span className="hidden sm:inline">{t.dashboard.signOut}</span></button></form>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-5 sm:px-6 sm:pb-12 sm:pt-8">{children}</div>
  </div>;
}
