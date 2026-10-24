import type { Metadata } from "next";
import { CategoryCard } from "@/components/home/category-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FEATURED_CATEGORIES, findFeaturedCategory } from "@/lib/categories";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.categoriesPage.title, description: t.categoriesPage.body };
}

/** The featured categories, then any other category used in the catalog. */
async function catalogCategories() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("canonical_products").select("category").order("category").limit(1000);
  if (error) { console.error("Category list failed", { code: error.code, message: error.message }); return []; }
  const seen = new Set<string>();
  return (data ?? []).flatMap(({ category }) => {
    const name = String(category).trim();
    const key = name.toLocaleLowerCase("en");
    if (!name || seen.has(key) || findFeaturedCategory(name)) return [];
    seen.add(key);
    return [name];
  });
}

export default async function CategoriesPage() {
  const { t } = await getDictionary();
  const others = await catalogCategories();
  return <main className="flex min-h-screen flex-col bg-white">
    <SiteHeader />
    <div className="mx-auto w-full max-w-[1004px] flex-1 px-5 pb-16 pt-4 sm:px-8 sm:pt-8">
      <h1 className="text-[26px] font-black tracking-tight text-[#17211B] sm:text-[32px]">{t.categoriesPage.title}</h1>
      <p className="mt-1 text-[15px] text-[#6B776F]">{t.categoriesPage.body}</p>
      <ul className="mt-6 grid grid-cols-3 gap-2 sm:gap-2.5 lg:grid-cols-6">
        {FEATURED_CATEGORIES.map((category) => <li key={category.name}><CategoryCard name={category.name} label={t.productCategories[category.name] ?? category.name} image={category.image} /></li>)}
        {others.map((name) => <li key={name}><CategoryCard name={name} label={t.productCategories[name] ?? name} /></li>)}
      </ul>
    </div>
    <SiteFooter />
  </main>;
}
