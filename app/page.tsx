import { Logo } from "@/components/logo";
import { SearchBox } from "@/components/search-box";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary } from "@/lib/i18n/server";

export default async function Home() {
  const { t } = await getDictionary();
  return <main className="flex min-h-screen flex-col bg-white">
    <SiteHeader />
    <section className="mx-auto flex w-full max-w-[620px] flex-1 flex-col items-center justify-center px-5 pb-24 pt-10 text-center sm:pb-28">
      <Logo large />
      <p className="mt-3 text-[15px] text-[#66736B] sm:text-base">{t.home.tagline}</p>
      <div className="mt-8 w-full"><SearchBox labels={{ placeholder: t.search.placeholder, ariaLabel: t.search.ariaLabel, submit: t.search.submit }} /></div>
    </section>
    <SiteFooter />
  </main>;
}
