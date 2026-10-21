import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cardClass, outlineButton, PageHeader } from "@/components/dashboard/ui";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant/context";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, merchant } = await requireMerchant();
  const { lang, t } = await getDictionary();
  const s = t.settings;
  return <main>
    <PageHeader eyebrow={merchant.business_name} title={s.title} />
    <div className="max-w-3xl space-y-5 p-5 sm:p-8">
      <section className={`${cardClass} p-5`}>
        <h2 className="font-bold">{s.account}</h2>
        <p className="mt-2 text-sm text-[#68766D]">{s.signedInAs}</p>
        <p className="mt-0.5 font-semibold">{user.email}</p>
      </section>
      <section className={`${cardClass} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div><h2 className="font-bold">{s.language}</h2><p className="mt-1 text-sm text-[#68766D]">{s.languageBody}</p></div>
        <LanguageSwitcher lang={lang} />
      </section>
      <section className={`${cardClass} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div><h2 className="font-bold">{t.common.signOut}</h2><p className="mt-1 text-sm text-[#68766D]">{s.signOutBody}</p></div>
        <form action="/auth/signout" method="post"><button className={outlineButton}><LogOut className="size-4" />{t.common.signOut}</button></form>
      </section>
    </div>
  </main>;
}
