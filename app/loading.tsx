import { WatermelonLoader } from "@/components/watermelon-loader";
import { getDictionary } from "@/lib/i18n/server";

export default async function Loading() {
  const { t } = await getDictionary();
  return <WatermelonLoader label={t.loading} />;
}
