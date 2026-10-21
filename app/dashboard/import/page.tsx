import type { Metadata } from "next";
import { Download } from "lucide-react";
import { ImportForm } from "@/components/dashboard/import-form";
import { cardClass, outlineButton, PageHeader } from "@/components/dashboard/ui";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant/context";

export const metadata: Metadata = { title: "Import catalog" };

export default async function ImportPage() {
  const { merchant } = await requireMerchant();
  const { t } = await getDictionary();
  const i = t.importer;
  return <main>
    <PageHeader eyebrow={merchant.business_name} title={i.title} />
    <div className="max-w-3xl space-y-5 p-5 sm:p-8">
      <p className="text-sm text-[#68766D]">{i.sub}</p>
      <section className={`${cardClass} p-5`}>
        <h2 className="font-bold">{i.stepsTitle}</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-[#3D4B42]"><li>{i.step1}</li><li>{i.step2}</li><li>{i.step3}</li></ol>
        <a href="/dashboard/import/template" download className={`${outlineButton} mt-4`}><Download className="size-4" />{i.download}</a>
      </section>
      <section className={`${cardClass} p-5`}>
        <ImportForm labels={{ file: i.file, upload: i.upload, uploading: i.uploading, resultTitle: i.resultTitle, created: i.created, updated: i.updated, failed: i.failed, row: i.row, failedRows: i.failedRows, errorFile: i.errorFile, errorEmpty: i.errorEmpty, errorHeaders: i.errorHeaders, errorTooMany: i.errorTooMany, errorServer: i.errorServer, viewProducts: t.products.title }} />
      </section>
    </div>
  </main>;
}
