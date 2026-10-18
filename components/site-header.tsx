import Link from "next/link";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SearchBox } from "@/components/search-box";

export function SiteHeader({ query }: { query?: string }) {
  return <header className="border-b border-[#E7ECE8] bg-white">
    <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
      <Logo />
      {query !== undefined && <div className="hidden max-w-2xl flex-1 sm:block"><SearchBox initialQuery={query} compact /></div>}
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <Link href="/business/register" className="whitespace-nowrap text-sm font-semibold text-[#38473E] hover:text-[#07834A]">Add your shop</Link>
        <LanguageSwitcher />
      </div>
    </div>
    {query !== undefined && <div className="px-4 pb-3 sm:hidden"><SearchBox initialQuery={query} compact /></div>}
  </header>;
}
