import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Store } from "lucide-react";
import { createShop } from "@/app/dashboard/actions";
import { GoogleShopSignIn } from "@/components/business/google-shop-signin";
import { ShopForm } from "@/components/dashboard/shop-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { format } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/server";
import { getSignedInShop } from "@/lib/merchant";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.register.title };
}

/**
 * "Add shop": Google sign-in, then the three-field shop form, then My shop. Google returns here after
 * sign-in, and anyone who already has a shop goes straight to it.
 */
export default async function AddShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { error } = await searchParams;
  const session = await getSignedInShop();
  if (session?.merchant) redirect("/dashboard");
  const { locale, t } = await getDictionary();
  const email = session?.user.email;

  return <main className="flex min-h-screen flex-col bg-white">
    <header className="border-b border-[#E7ECE8]"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5"><Logo /><div className="flex items-center gap-3"><Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#526057] hover:text-[#07834A]"><Search className="size-4" /><span className="hidden sm:inline">{t.nav.findProduct}</span></Link><LanguageSwitcher locale={locale} label={t.nav.language} /></div></div></header>
    <section className="flex flex-1 justify-center px-4 py-8 sm:items-center sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#EAF6F0] text-[#07834A]"><Store className="size-6" /></div>
          <h1 className="mt-5 text-[28px] font-black leading-tight tracking-tight sm:text-4xl">{email ? t.setup.heading : t.register.heading}</h1>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-6 text-[#66736B]">{email ? t.setup.body : t.register.body}</p>
        </div>
        {email ? <>
          <div className="mt-7 rounded-2xl border border-[#E1E7E3] bg-white p-5 shadow-[0_8px_35px_rgba(23,33,27,.06)] sm:p-6">
            <ShopForm action={createShop} labels={t.setup} submitLabel={t.setup.submit} pendingLabel={t.setup.submitting} />
          </div>
          <form action="/auth/signout" method="post" className="mt-4 text-center text-xs text-[#7A857E]">
            <input type="hidden" name="next" value="/business/register" />
            {format(t.setup.signedInAs, { email })} · <button className="text-xs! font-bold text-[#07834A] hover:underline">{t.setup.otherAccount}</button>
          </form>
        </> : <>
          {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">{t.register.errorSignin}</p>}
          <div className="mt-8"><GoogleShopSignIn next="/business/register" labels={t.google} /></div>
          <p className="mt-6 text-center text-xs leading-5 text-[#839087]">{t.register.justLooking}</p>
          <p className="text-center"><Link href="/" className="mt-1 inline-block text-sm font-bold text-[#07834A] hover:underline">{t.register.searchFreely}</Link></p>
        </>}
      </div>
    </section>
  </main>;
}
