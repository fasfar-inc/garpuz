import { LanguageSwitcher } from "@/components/language-switcher";
import { SignOutButton } from "@/components/dashboard/sidebar";
import { cardClass, DashboardHeader, MerchantStatusBadge } from "@/components/dashboard/ui";
import { format } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/server";
import { requireMerchant } from "@/lib/merchant";
import { CONTACT_EMAIL } from "@/lib/site";

export default async function SettingsPage() {
  const { user, merchant } = await requireMerchant();
  const { locale, t } = await getDictionary();
  const s = t.dashboard.settings;
  return <main>
    <DashboardHeader title={s.heading} />
    <div className="max-w-3xl space-y-5 p-5 sm:p-8">
      <section className={`${cardClass} p-6`}>
        <h2 className="font-black">{s.account}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs font-bold uppercase tracking-wide text-[#8A948E]">{s.email}</dt><dd className="mt-1 truncate text-sm font-semibold">{user.email}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-[#8A948E]">{s.status}</dt><dd className="mt-1"><MerchantStatusBadge status={merchant.status} t={t} /></dd></div>
        </dl>
      </section>
      <section className={`${cardClass} flex items-center justify-between gap-4 p-6`}><h2 className="font-black">{s.language}</h2><LanguageSwitcher locale={locale} label={s.language} /></section>
      <section className={`${cardClass} flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between`}><p className="text-sm text-[#68766D]">{s.signOutBody}</p><SignOutButton label={t.dashboard.nav.signOut} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#D9E1DC] bg-white px-4 text-sm font-bold text-[#26342B] hover:border-red-300 hover:text-red-700" /></section>
      <section className={`${cardClass} p-6`}><h2 className="font-black">{s.deleteTitle}</h2><p className="mt-1 text-sm leading-6 text-[#68766D]">{format(s.deleteBody, { email: CONTACT_EMAIL })}</p></section>
    </div>
  </main>;
}
