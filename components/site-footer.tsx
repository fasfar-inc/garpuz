import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";

export async function SiteFooter() {
  const { t } = await getDictionary();
  return <footer className="border-t border-[#EDF0EE] bg-white px-5 py-5">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#68766D] sm:justify-between">
      <span>© {new Date().getFullYear()} Garpuz</span>
      <nav className="flex gap-5"><Link href="/about" className="hover:text-[#07834A]">{t.home.about}</Link><Link href="/business/register" className="hover:text-[#07834A]">{t.common.addYourShop}</Link><a href="mailto:hello@garpuz.com" className="hover:text-[#07834A]">{t.home.contact}</a></nav>
    </div>
  </footer>;
}
