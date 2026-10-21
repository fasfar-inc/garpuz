import { Download } from "lucide-react";
import { ImportForm } from "@/components/dashboard/import-form";
import { cardClass, DashboardHeader } from "@/components/dashboard/ui";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";

export default async function ImportPage() {
  await requireMerchant();
  const { t } = await getDictionary();
  const i = t.dashboard.import;
  return <main>
    <DashboardHeader title={i.heading} description={i.body} />
    <div className="max-w-4xl p-5 sm:p-8">
      <section className={`${cardClass} p-6`}>
        <p className="text-sm leading-6 text-[#4D5C53]">{i.columns}</p>
        <a href="/garpuz-catalog-template.csv" download className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#07834A]"><Download className="size-4" /> {i.template}</a>
        <div className="mt-6"><ImportForm labels={i} /></div>
      </section>
    </div>
  </main>;
}
