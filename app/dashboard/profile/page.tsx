import { FileCheck2, FileText } from "lucide-react";
import { updateProfile, uploadVerificationDocument } from "@/app/dashboard/actions";
import { cardClass, DashboardHeader, DashboardNotice, inputClass, labelClass, primaryButton } from "@/components/dashboard/ui";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";
import { CITIES } from "@/lib/validation";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function ProfilePage({ searchParams }: { searchParams: Params }) {
  const raw = await searchParams;
  const { merchant } = await requireMerchant();
  const { t } = await getDictionary();
  const p = t.dashboard.profile;
  const locked = merchant.status !== "pending";
  // Show stored digits in international form so the field re-validates on save.
  const whatsapp = merchant.whatsapp ? `+${merchant.whatsapp}` : "";
  return <main>
    <DashboardHeader title={p.heading} description={p.body} />
    <div className="max-w-4xl p-5 sm:p-8">
      <DashboardNotice params={raw} t={t} />
      <form action={updateProfile} className={`${cardClass} grid gap-4 p-6 sm:grid-cols-2`}>
        <label className={labelClass}>{p.businessName}<input name="businessName" required minLength={2} maxLength={120} defaultValue={merchant.business_name} className={`${inputClass} mt-1.5`} /></label>
        <label className={labelClass}>{p.representativeName}<input name="representativeName" maxLength={120} defaultValue={merchant.representative_name ?? ""} className={`${inputClass} mt-1.5`} /></label>
        <label className={labelClass}>{p.whatsapp}<input name="whatsapp" type="tel" required inputMode="tel" maxLength={20} placeholder="+90 533 123 45 67" defaultValue={whatsapp} className={`${inputClass} mt-1.5`} /><span className="mt-1 block font-normal text-[#7A857E]">{p.whatsappHelp}</span></label>
        <label className={labelClass}>{p.phone}<input name="phone" type="tel" inputMode="tel" maxLength={20} defaultValue={merchant.phone ?? ""} className={`${inputClass} mt-1.5`} /></label>
        <label className={labelClass}>{p.city}<select name="city" required defaultValue={merchant.city ?? ""} className={`${inputClass} mt-1.5`}><option value="" disabled>{p.selectCity}</option>{CITIES.map((city) => <option key={city}>{city}</option>)}</select></label>
        <label className={labelClass}>{p.website}<input name="website" type="url" maxLength={300} placeholder="https://" defaultValue={merchant.website ?? ""} className={`${inputClass} mt-1.5`} /></label>
        <label className={`${labelClass} sm:col-span-2`}>{p.address}<input name="address" maxLength={300} defaultValue={merchant.address ?? ""} className={`${inputClass} mt-1.5`} /></label>
        <label className={`${labelClass} sm:col-span-2`}>{p.registrationNumber}<input name="registrationNumber" maxLength={80} defaultValue={merchant.registration_number ?? ""} disabled={locked} className={`${inputClass} mt-1.5`} />{locked && <span className="mt-1 block font-normal text-[#7A857E]">{p.registrationLocked}</span>}</label>
        <div className="sm:col-span-2"><button className={primaryButton}>{p.save}</button></div>
      </form>

      <section id="document" className={`${cardClass} mt-6 p-6`}>
        <h2 className="font-black">{p.document}</h2>
        <p className="mt-1 text-sm leading-6 text-[#68766D]">{p.documentBody}</p>
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold">{merchant.verification_document_path ? <><FileCheck2 className="size-5 text-[#07834A]" /> {p.documentSubmitted}</> : <><FileText className="size-5 text-[#A7B0AA]" /> {p.documentNone}</>}</p>
        <form action={uploadVerificationDocument} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input name="document" type="file" required accept="application/pdf,image/jpeg,image/png" aria-label={p.document} className="block w-full flex-1 rounded-lg border border-[#D9E1DC] bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#EAF6F0] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#07834A]" />
          <button className={primaryButton}>{p.upload}</button>
        </form>
      </section>
    </div>
  </main>;
}
