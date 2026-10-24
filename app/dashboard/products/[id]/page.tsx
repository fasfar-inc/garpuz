import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeading } from "@/components/dashboard/page-heading";
import { ProductForm } from "@/components/dashboard/product-form";
import { cardClass } from "@/components/dashboard/styles";
import { relationOne } from "@/lib/admin/types";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";
import { productTitle } from "@/lib/product-text";
import { safeImageUrl } from "@/lib/utils";
import { PRODUCT_CATEGORIES, productCategory } from "@/lib/validation";

type Product = { name: string; brand: string; model: string | null; category: string; image_url: string | null };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { supabase, merchant } = await requireMerchant();
  const { data, error } = await supabase.from("merchant_offers").select("id,price,canonical_products(name,brand,model,category,image_url)").eq("id", id).eq("merchant_id", merchant.id).maybeSingle();
  if (error) throw new Error(error.message);
  const product = relationOne((data?.canonical_products ?? null) as Product | Product[] | null);
  if (!data || !product) notFound();
  const { t } = await getDictionary();
  return <main>
    <PageHeading title={t.dashboard.product.editHeading} back={t.dashboard.back} />
    <div className={`${cardClass} p-5 sm:p-6`}>
      <ProductForm labels={t.dashboard.product} categories={PRODUCT_CATEGORIES.map((value) => ({ value, label: t.productCategories[value] ?? value }))}
        initial={{ id: data.id, name: productTitle(product), category: productCategory(product.category), price: String(Number(data.price)), image: safeImageUrl(product.image_url) }} />
    </div>
  </main>;
}
