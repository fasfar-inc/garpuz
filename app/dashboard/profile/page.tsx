import type { Metadata } from "next";
import { FileCheck2, FileText, Upload } from "lucide-react";
import { updateProfile, uploadVerificationDocument } from "@/app/dashboard/actions";
import { cardClass, inputClass, labelClass, Notice, outlineButton, PageHeader, pickMessage, primaryButton } from "@/components/dashboard/ui";
import { CITIES, SHOP_CATEGORIES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant/context";

export const metadata: Metadata = { title: "Shop profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { merchant } = await requireMerchant();
  const { t } = await getDictionary();
  const p = t.profile;
  const optional = <span className="font-normal text-[#8A948E]">({t.common.optional})</span>;
  const whatsappDisplay = merchant.whatsapp ? `+${merchant.whatsapp}` : "";

  return <main>
    <PageHeader eyebrow={merchant.business_name} title={p.title} status={merchant.status} statusLabel={t.dash.status[merchant.status]} />
    <div className="max-w-3xl space-y-5 p-5 sm:p-8">
      <Notice
        notice={pickMessage(params, "notice", { saved: p.saved, docSaved: p.docSaved })}
        error={pickMessage(params, "error", { invalid: p.invalid, registrationTaken: p.registrationTaken, docInvalid: p.docInvalid, docFailed: p.docFailed })}
      />
      <p className="text-sm text-[#68766D]">{p.sub}</p>

      <form action={updateProfile} className={`${cardClass} grid gap-4 p-5 sm:grid-cols-2`}>
        <label className={labelClass}>{p.businessName}<input name="businessName" required minLength={2} maxLength={120} defaultValue={merchant.business_name} className={inputClass} /></label>
        <label className={labelClass}>{p.category}<select name="category" required defaultValue={merchant.category} className={inputClass}>{SHOP_CATEGORIES.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}{!(SHOP_CATEGORIES as readonly string[]).includes(merchant.category) && <option value={merchant.category}>{merchant.category}</option>}</select></label>
        <label className={labelClass}>{p.whatsapp}<input name="whatsapp" type="tel" inputMode="tel" required defaultValue={whatsappDisplay} placeholder="+90 533 123 45 67" className={inputClass} /><span className="mt-1 block text-xs font-normal text-[#7A867E]">{t.setup.whatsappHint}</span></label>
        <label className={labelClass}>{p.phone} {optional}<input name="phone" type="tel" inputMode="tel" defaultValue={merchant.phone ?? ""} className={inputClass} /></label>
        <label className={labelClass}>{p.city}<select name="city" required defaultValue={merchant.city ?? ""} className={inputClass}><option value="" disabled>{t.setup.selectCity}</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className={labelClass}>{p.representativeName} {optional}<input name="representativeName" maxLength={120} defaultValue={merchant.representative_name ?? ""} className={inputClass} /></label>
        <label className={`${labelClass} sm:col-span-2`}>{p.address} {optional}<input name="address" maxLength={300} defaultValue={merchant.address ?? ""} className={inputClass} /></label>
        <label className={labelClass}>{p.website} {optional}<input name="website" type="url" maxLength={300} placeholder="https://" defaultValue={merchant.website ?? ""} className={inputClass} /></label>
        <label className={labelClass}>{p.registrationNumber} {optional}<input name="registrationNumber" maxLength={80} defaultValue={merchant.registration_number ?? ""} className={inputClass} /></label>
        <label className={`${labelClass} sm:col-span-2`}>{p.email}<input value={merchant.email} readOnly className={`${inputClass} bg-[#F5F7F5] text-[#66736B]`} /><span className="mt-1 block text-xs font-normal text-[#7A867E]">{p.emailHint}</span></label>
        <div className="sm:col-span-2"><button className={primaryButton}>{t.common.save}</button></div>
      </form>

      <section id="verification" className={`${cardClass} scroll-mt-6 p-5`}>
        <h2 className="font-bold">{p.docTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-[#68766D]">{p.docBody}</p>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#F6F8F7] p-4 text-sm">
          {merchant.verification_document_path ? <><FileCheck2 className="size-5 shrink-0 text-[#07834A]" /><span className="font-semibold">{p.docCurrent}</span></> : <><FileText className="size-5 shrink-0 text-[#A5B0A9]" /><span className="text-[#68766D]">{p.docNone}</span></>}
        </div>
        <form action={uploadVerificationDocument} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-semibold text-[#2E3B33]"><span className="sr-only">{p.docTitle}</span>
            <input type="file" name="document" accept="application/pdf,image/jpeg,image/png" required className="block w-full rounded-xl border border-dashed border-[#C9D5CD] bg-[#FAFCFB] p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#EAF6F0] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#07834A]" />
            <span className="mt-1 block text-xs font-normal text-[#7A867E]">{p.docHint}</span>
          </label>
          <button className={`${outlineButton} sm:mb-5`}><Upload className="size-4" />{merchant.verification_document_path ? p.docReplace : p.docUpload}</button>
        </form>
      </section>
    </div>
  </main>;
}
