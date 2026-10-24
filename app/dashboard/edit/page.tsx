import { updateShop } from "@/app/dashboard/actions";
import { PageHeading } from "@/components/dashboard/page-heading";
import { ShopForm } from "@/components/dashboard/shop-form";
import { cardClass } from "@/components/dashboard/styles";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";

export default async function EditShopPage() {
  const { merchant } = await requireMerchant();
  const { t } = await getDictionary();
  return <main>
    <PageHeading title={t.dashboard.editShop} back={t.dashboard.back} />
    <div className={`${cardClass} p-5 sm:p-6`}>
      {/* Stored digits are shown in international form so the number re-validates on save. */}
      <ShopForm action={updateShop} labels={t.setup} submitLabel={t.dashboard.save} pendingLabel={t.dashboard.saving}
        initial={{ businessName: merchant.business_name, city: merchant.city ?? "", whatsapp: merchant.whatsapp ? `+${merchant.whatsapp}` : "" }} />
    </div>
  </main>;
}
