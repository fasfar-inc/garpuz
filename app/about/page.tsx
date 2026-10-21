import type { Metadata } from "next";
import { BadgeCheck, MessageCircle, Search, Store } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.about.title };
}

export default async function AboutPage() {
  const { t } = await getDictionary();
  const steps = [
    { icon: Search, text: t.about.how1 },
    { icon: BadgeCheck, text: t.about.how2 },
    { icon: MessageCircle, text: t.about.how3 },
  ];
  return <main className="flex min-h-screen flex-col bg-white">
    <SiteHeader />
    <article className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:py-16">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t.about.title}</h1>
      <p className="mt-4 text-[17px] leading-7 text-[#4D5B52]">{t.about.lead}</p>
      <h2 className="mt-10 text-lg font-black">{t.about.howTitle}</h2>
      <ol className="mt-4 space-y-3">{steps.map(({ icon: Icon, text }) => <li key={text} className="flex gap-3 rounded-xl border border-[#E4EAE6] p-4 text-sm leading-6 text-[#3D4B42]"><Icon className="mt-0.5 size-5 shrink-0 text-[#07834A]" />{text}</li>)}</ol>
      <section className="mt-10 rounded-2xl bg-[#F3F8F5] p-6">
        <div className="flex items-center gap-2"><Store className="size-5 text-[#07834A]" /><h2 className="text-lg font-black">{t.about.shopsTitle}</h2></div>
        <p className="mt-2 text-sm leading-6 text-[#4D5B52]">{t.about.shopsBody}</p>
        <Link href="/business/register" className="mt-4 inline-flex h-10 items-center rounded-full bg-[#07834A] px-5 text-sm font-bold text-white hover:bg-[#056B3D]">{t.common.addYourShop}</Link>
      </section>
      <h2 className="mt-10 text-lg font-black">{t.about.trustTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-[#4D5B52]">{t.about.trustBody}</p>
      <p className="mt-10 text-sm text-[#68766D]">{t.about.contact} <a href="mailto:hello@garpuz.com" className="font-bold text-[#07834A]">hello@garpuz.com</a></p>
    </article>
    <SiteFooter />
  </main>;
}
