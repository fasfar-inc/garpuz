import { PageHeading } from "@/components/dashboard/page-heading";
import { ProductForm } from "@/components/dashboard/product-form";
import { cardClass } from "@/components/dashboard/styles";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";
import { PRODUCT_CATEGORIES } from "@/lib/validation";

export default async function NewProductPage() {
  await requireMerchant();
  const { t } = await getDictionary();
  return <main>
    <PageHeading title={t.dashboard.product.addHeading} back={t.dashboard.back} />
    <div className={`${cardClass} p-5 sm:p-6`}><ProductForm labels={t.dashboard.product} categories={PRODUCT_CATEGORIES.map((value) => ({ value, label: t.productCategories[value] ?? value }))} /></div>
  </main>;
}
