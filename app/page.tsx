import { CategoryGrid } from "@/components/home/category-grid";
import { NorthCyprus } from "@/components/home/north-cyprus";
import { PopularSearches } from "@/components/home/popular-searches";
import { Logo } from "@/components/logo";
import { SearchBox } from "@/components/search-box";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary } from "@/lib/i18n/server";

export default async function Home() {
  const { t } = await getDictionary();
  const h = t.home;
  return <main className="flex min-h-screen flex-col bg-white">
    <SiteHeader />
    <div className="mx-auto w-full max-w-[1004px] px-5 sm:px-8">
      <section className="flex flex-col items-center pt-8 text-center sm:pt-[76px]">
        <h1 className="sr-only">Garpuz</h1>
        <Logo large />
        <p className="mt-1.5 text-[17px] text-[#4D5A52] sm:mt-1.5 sm:text-[24px] lg:text-[28px]">{h.tagline}</p>
        <div className="mt-6 w-full sm:mt-10 sm:max-w-[820px]"><SearchBox labels={t.searchBox} /></div>
        <PopularSearches heading={h.popularSearches} />
      </section>
      <CategoryGrid labels={{ heading: h.categoriesHeading, headingShort: h.categoriesHeadingShort, viewAll: h.viewAllCategories, viewAllShort: h.viewAll, names: t.productCategories }} />
    </div>
    <NorthCyprus title={h.northCyprus} tagline={h.northCyprusTagline} creditLabel={h.photoCredit} slideshow={h.slideshow} />
    <SiteFooter />
  </main>;
}
