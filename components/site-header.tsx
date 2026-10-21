import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SearchBox } from "@/components/search-box";
import { getDictionary } from "@/lib/i18n/server";

export async function SiteHeader({ query }: { query?: string }) {
  const { lang, t } = await getDictionary();
  const labels = { placeholder: t.search.placeholder, ariaLabel: t.search.ariaLabel, submit: t.search.submit };
  return <header className="border-b border-[#E7ECE8] bg-white">
    <div className={`mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8 ${query === undefined ? "h-20 sm:h-24" : "h-16"}`}>
      {query === undefined
        ? <Link href="/" aria-label="Garpuz home" className="relative block h-16 w-24 shrink-0 sm:h-20 sm:w-28"><Image src="/watermelon-mark.png" alt="" fill priority sizes="112px" className="object-contain" /></Link>
        : <Logo />}
      {query !== undefined && <div className="hidden max-w-2xl flex-1 sm:block"><SearchBox initialQuery={query} compact labels={labels} /></div>}
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <Link href="/business/register" className="whitespace-nowrap text-sm font-semibold text-[#38473E] hover:text-[#07834A]">{t.common.addYourShop}</Link>
        <LanguageSwitcher lang={lang} />
      </div>
    </div>
    {query !== undefined && <div className="px-4 pb-3 sm:hidden"><SearchBox initialQuery={query} compact labels={labels} /></div>}
  </header>;
}
