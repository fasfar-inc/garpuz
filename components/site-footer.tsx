import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { CONTACT_EMAIL } from "@/lib/site";

export async function SiteFooter() {
  const { t } = await getDictionary();
  return <footer className="border-t border-[#EDF0EE] bg-white px-5 py-5">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#68766D] sm:justify-between">
      <span>© {new Date().getFullYear()} Garpuz</span>
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2"><Link href="/about">{t.nav.about}</Link><Link href="/business/register">{t.nav.addShop}</Link><Link href="/privacy">{t.nav.privacy}</Link><Link href="/terms">{t.nav.terms}</Link><a href={`mailto:${CONTACT_EMAIL}`}>{t.nav.contact}</a></nav>
    </div>
  </footer>;
}
