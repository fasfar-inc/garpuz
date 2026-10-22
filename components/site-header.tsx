import Image from "next/image";
import Link from "next/link";
import { LanguageMenu } from "@/components/language-menu";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { SearchBox } from "@/components/search-box";
import { getDictionary } from "@/lib/i18n/server";
import { CONTACT_EMAIL } from "@/lib/site";

export async function SiteHeader({ query }: { query?: string }) {
  const { locale, t } = await getDictionary();
  const labels = t.searchBox;
  const home = query === undefined;
  const menuItems = [
    { href: "/about", label: t.nav.about },
    { href: "/privacy", label: t.nav.privacy },
    { href: "/terms", label: t.nav.terms },
    { href: `mailto:${CONTACT_EMAIL}`, label: t.nav.contact },
  ];
  return <header className={home ? "bg-white" : "border-b border-[#E7ECE8] bg-white"}>
    <div className={`mx-auto flex max-w-[1120px] items-center gap-4 px-5 sm:px-8 ${home ? "h-[72px] sm:h-[100px]" : "h-16"}`}>
      {home
        ? <Link href="/" aria-label={t.nav.home} className="relative block h-[50px] w-[74px] shrink-0 sm:h-[80px] sm:w-[118px]"><Image src="/watermelon-mark.png" alt="" fill priority sizes="118px" className="object-contain" /></Link>
        : <Logo />}
      {!home && <div className="hidden max-w-2xl flex-1 sm:block"><SearchBox initialQuery={query} labels={labels} compact /></div>}
      <div className="ml-auto flex items-center gap-1 sm:gap-5">
        <Link href="/business/register" className="whitespace-nowrap px-1 text-sm font-medium text-[#07834A] hover:text-[#056B3D] sm:text-[16px]">{t.nav.addShop}</Link>
        <div className="hidden sm:block"><LanguageMenu locale={locale} label={t.nav.language} names={t.languageNames} /></div>
        <div className="sm:hidden"><MobileMenu items={menuItems} locale={locale} labels={{ ...t.menu, language: t.nav.language }} /></div>
      </div>
    </div>
    {!home && <div className="px-4 pb-3 sm:hidden"><SearchBox initialQuery={query} labels={labels} compact /></div>}
  </header>;
}
