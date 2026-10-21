import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Store } from "lucide-react";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GoogleShopSignIn } from "@/components/business/google-shop-signin";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.common.addYourShop };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { lang, t } = await getDictionary();
  const params = await searchParams;

  // Shop owners who are already signed in go straight to their shop.
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/business/setup");
  }

  const error = params.error === "google_signin" ? t.register.errorSignin : params.error === "invalid_link" ? t.register.errorLink : "";
  return <main className="flex min-h-screen flex-col bg-white">
    <header className="border-b border-[#E7ECE8]"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5"><Logo /><div className="flex items-center gap-3"><Link href="/" className="hidden items-center gap-2 text-sm font-semibold text-[#526057] hover:text-[#07834A] sm:inline-flex"><Search className="size-4" /> {t.common.findProduct}</Link><LanguageSwitcher lang={lang} /></div></div></header>
    <section className="grid flex-1 place-items-center px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#EAF6F0] text-[#07834A]"><Store className="size-6" /></div>
        <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">{t.register.title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-6 text-[#66736B]">{t.register.body}</p>
        {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-8"><GoogleShopSignIn labels={{ button: t.register.continueGoogle, connecting: t.register.connecting, notConfigured: t.register.notConfigured }} /></div>
        <p className="mt-5 text-xs leading-5 text-[#839087]">{t.register.justLooking}</p>
        <Link href="/" className="mt-2 inline-block text-sm font-bold text-[#07834A] hover:underline">{t.register.searchFreely}</Link>
      </div>
    </section>
  </main>;
}
