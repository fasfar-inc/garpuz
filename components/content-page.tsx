import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export type Section = { heading: string; body: string[] };

export function ContentPage({ title, intro, sections, updated }: { title: string; intro: string; sections: Section[]; updated?: string }) {
  return <main className="flex min-h-screen flex-col bg-white">
    <SiteHeader />
    <article className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:py-16">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-xs text-[#7A857E]">{updated}</p>}
      <p className="mt-5 text-base leading-7 text-[#4D5C53]">{intro}</p>
      {sections.map((section) => <section key={section.heading} className="mt-9"><h2 className="text-lg font-black">{section.heading}</h2>{section.body.map((paragraph) => <p key={paragraph} className="mt-3 text-[15px] leading-7 text-[#4D5C53]">{paragraph}</p>)}</section>)}
    </article>
    <SiteFooter />
  </main>;
}
